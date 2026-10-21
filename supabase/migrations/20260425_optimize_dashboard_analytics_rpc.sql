-- ==============================================================================
-- Migration : Optimisation Haute Performance du Dashboard (RPC Analytics)
-- Date : 2026-04-25
-- Projet : Blu (Pool Management System)
-- Objectif : Réduire le temps de chargement du Dashboard de 1,5s à 5ms en calculant
--            tous les KPI et le chiffre d'affaires directement sur le moteur PostgreSQL.
-- ==============================================================================

-- 1. INDEX COMPOSITES SPÉCIFIQUES POUR L'ANALYTIQUE INSTANTANÉE
CREATE INDEX IF NOT EXISTS idx_payments_analytics 
    ON public.payments(payment_date DESC, method) 
    INCLUDE (amount);

CREATE INDEX IF NOT EXISTS idx_devis_pending_stats 
    ON public.devis(status, is_template) 
    WHERE (status = 'pending' OR status IS NULL);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') THEN
        CREATE INDEX IF NOT EXISTS idx_invoices_pending_stats 
            ON public.invoices(status) 
            WHERE status IN ('issued', 'partially_paid');
    END IF;
END $$;

-- 2. FONCTION RPC DE CALCUL DES MÉTRIQUES DU DASHBOARD
CREATE OR REPLACE FUNCTION public.get_dashboard_analytics(target_year INT DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
    v_clients_count BIGINT := 0;
    v_techs_count BIGINT := 0;
    v_interventions_count BIGINT := 0;
    v_scheduled_count BIGINT := 0;
    
    v_devis_count BIGINT := 0;
    v_devis_pending_amt NUMERIC := 0;
    
    v_invoices_count BIGINT := 0;
    v_invoices_pending_amt NUMERIC := 0;
    
    v_current_month_rev NUMERIC := 0;
    v_last_month_rev NUMERIC := 0;
    v_rolling_30d_rev NUMERIC := 0;
    v_annual_rev NUMERIC := 0;
    
    v_monthly_breakdown NUMERIC[] := ARRAY[0,0,0,0,0,0,0,0,0,0,0,0]::NUMERIC[];
    m_record RECORD;
    
    v_now TIMESTAMPTZ := clock_timestamp();
    v_start_of_month TIMESTAMPTZ := date_trunc('month', v_now);
    v_start_of_last_month TIMESTAMPTZ := date_trunc('month', v_now - INTERVAL '1 month');
    v_end_of_last_month TIMESTAMPTZ := v_start_of_month - INTERVAL '1 microsecond';
    v_start_of_year TIMESTAMPTZ := make_date(target_year, 1, 1);
    v_end_of_year TIMESTAMPTZ := make_date(target_year + 1, 1, 1) - INTERVAL '1 microsecond';
    v_rolling_30d TIMESTAMPTZ := v_now - INTERVAL '30 days';
BEGIN
    -- 1. Compteurs généraux d'activité
    SELECT COUNT(*) INTO v_clients_count FROM clients;
    SELECT COUNT(*) INTO v_techs_count FROM technicians WHERE active = true;
    SELECT COUNT(*) INTO v_interventions_count FROM interventions;
    SELECT COUNT(*) INTO v_scheduled_count FROM interventions WHERE status = 'scheduled';
    
    -- 2. Devis en attente et montant estimé
    SELECT 
        COUNT(*),
        COALESCE(SUM(total_amount), 0)
    INTO v_devis_count, v_devis_pending_amt
    FROM devis
    WHERE (status = 'pending' OR status IS NULL)
      AND (is_template IS NULL OR is_template = false);
      
    -- 3. Factures et montant restant dû
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') THEN
        SELECT 
            COUNT(*),
            COALESCE(SUM(GREATEST(0, total_ttc - paid_amount)), 0)
        INTO v_invoices_count, v_invoices_pending_amt
        FROM invoices
        WHERE status IN ('issued', 'partially_paid');
    END IF;
    
    -- 4. Chiffre d'Affaires & Revenus réels
    -- A. Mois en cours
    SELECT COALESCE(SUM(amount), 0) INTO v_current_month_rev
    FROM payments
    WHERE method <> 'remise'
      AND payment_date >= v_start_of_month;
      
    -- B. Mois précédent
    SELECT COALESCE(SUM(amount), 0) INTO v_last_month_rev
    FROM payments
    WHERE method <> 'remise'
      AND payment_date >= v_start_of_last_month
      AND payment_date <= v_end_of_last_month;
      
    -- C. Glissant sur 30 jours
    SELECT COALESCE(SUM(amount), 0) INTO v_rolling_30d_rev
    FROM payments
    WHERE method <> 'remise'
      AND payment_date >= v_rolling_30d;
      
    -- D. Année en cours
    SELECT COALESCE(SUM(amount), 0) INTO v_annual_rev
    FROM payments
    WHERE method <> 'remise'
      AND payment_date >= v_start_of_year
      AND payment_date <= v_end_of_year;
      
    -- E. Ventilation mensuelle (12 mois de l'année cible)
    FOR m_record IN 
        SELECT 
            EXTRACT(MONTH FROM payment_date)::INT AS month_idx,
            SUM(amount) AS month_sum
        FROM payments
        WHERE method <> 'remise'
          AND payment_date >= v_start_of_year
          AND payment_date <= v_end_of_year
        GROUP BY EXTRACT(MONTH FROM payment_date)
    LOOP
        IF m_record.month_idx BETWEEN 1 AND 12 THEN
            v_monthly_breakdown[m_record.month_idx] := m_record.month_sum;
        END IF;
    END LOOP;

    -- Assemblage de l'objet JSON retourné
    result := jsonb_build_object(
        'clients', v_clients_count,
        'technicians', v_techs_count,
        'interventions', v_interventions_count,
        'scheduled', v_scheduled_count,
        'devis', v_devis_count,
        'devisPendingAmount', v_devis_pending_amt,
        'invoicesCount', v_invoices_count,
        'invoicesPendingAmount', v_invoices_pending_amt,
        'revenue', v_current_month_rev,
        'lastMonthRevenue', v_last_month_rev,
        'rollingRevenue', v_rolling_30d_rev,
        'annualRevenue', v_annual_rev,
        'monthlyBreakdown', to_jsonb(v_monthly_breakdown)
    );
    
    RETURN result;
END;
$$;

-- Accorder les droits d'exécution
GRANT EXECUTE ON FUNCTION public.get_dashboard_analytics(INT) TO authenticated, anon;
