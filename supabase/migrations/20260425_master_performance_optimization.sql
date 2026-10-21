-- ==============================================================================
-- Migration : Optimisation Globale Haute Performance (Master Performance Script)
-- Date : 2026-04-25
-- Projet : Blu (Pool Management System)
-- Objectif : Optimiser le temps de réponse de toutes les requêtes SQL clés :
--            1. Dashboard RPC (calcul instantané des KPI & Chiffre d'Affaires)
--            2. Planning & Entretiens (indexation dates, statuts, techniciens)
--            3. Devis & Facturation (indexation numéros, statuts, dates, soldes)
--            4. Clients & Bassins (indexation noms, soldes, clés étrangères)
-- ==============================================================================

-- ==============================================================================
-- 1. MODULE PAIEMENTS & REVENUS (DASHBOARD & FINANCES)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_payments_analytics 
    ON public.payments(payment_date DESC, method) 
    INCLUDE (amount);

CREATE INDEX IF NOT EXISTS idx_payments_client_id 
    ON public.payments(client_id);

-- ==============================================================================
-- 2. MODULE DEVIS
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_devis_pending_stats 
    ON public.devis(status, is_template) 
    WHERE (status = 'pending' OR status IS NULL);

CREATE INDEX IF NOT EXISTS idx_devis_created_at_desc 
    ON public.devis(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_devis_client_id 
    ON public.devis(client_id);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'devis_items') THEN
        CREATE INDEX IF NOT EXISTS idx_devis_items_devis_id 
            ON public.devis_items(devis_id);
    END IF;
END $$;

-- ==============================================================================
-- 3. MODULE FACTURES (INVOICES) - VÉRIFICATION CONDITIONNELLE
-- ==============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') THEN
        CREATE INDEX IF NOT EXISTS idx_invoices_pending_stats 
            ON public.invoices(status) 
            WHERE status IN ('issued', 'partially_paid');

        CREATE INDEX IF NOT EXISTS idx_invoices_date_desc 
            ON public.invoices(invoice_date DESC, created_at DESC);

        CREATE INDEX IF NOT EXISTS idx_invoices_client_id 
            ON public.invoices(client_id);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoice_items') THEN
        CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id 
            ON public.invoice_items(invoice_id);
    END IF;
END $$;

-- ==============================================================================
-- 4. MODULE PLANNING & ENTRETIENS (INTERVENTIONS)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_interventions_planning 
    ON public.interventions(scheduled_date, status, technician_id)
    WHERE scheduled_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_interventions_completed_date 
    ON public.interventions(completed_date DESC)
    WHERE status = 'completed';

CREATE INDEX IF NOT EXISTS idx_interventions_pending_scheduled 
    ON public.interventions(status, scheduled_date ASC)
    WHERE status IN ('pending', 'scheduled', 'in_progress');

CREATE INDEX IF NOT EXISTS idx_interventions_pool_id 
    ON public.interventions(pool_id);

CREATE INDEX IF NOT EXISTS idx_interventions_technician_id 
    ON public.interventions(technician_id);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'intervention_services') THEN
        CREATE INDEX IF NOT EXISTS idx_intervention_services_intervention_id 
            ON public.intervention_services(intervention_id);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'intervention_products') THEN
        CREATE INDEX IF NOT EXISTS idx_intervention_products_intervention_id 
            ON public.intervention_products(intervention_id);
    END IF;
END $$;

-- ==============================================================================
-- 5. MODULE CLIENTS & PISCINES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_clients_last_name_first_name 
    ON public.clients(last_name ASC, first_name ASC);

CREATE INDEX IF NOT EXISTS idx_clients_phone 
    ON public.clients(phone);

CREATE INDEX IF NOT EXISTS idx_clients_balance_nonzero 
    ON public.clients(balance) 
    WHERE balance <> 0;

CREATE INDEX IF NOT EXISTS idx_pools_client_id 
    ON public.pools(client_id);

-- ==============================================================================
-- 6. RPC HAUTE PERFORMANCE : DASHBOARD ANALYTICS (EXÉCUTION DYNAMIQUE ET SÉCURISÉE)
-- ==============================================================================
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
      
    -- 3. Factures et montant restant dû (exécution dynamique pour éviter les erreurs si la table est absente)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') THEN
        EXECUTE 'SELECT COUNT(*), COALESCE(SUM(GREATEST(0, total_ttc - paid_amount)), 0) FROM invoices WHERE status IN (''issued'', ''partially_paid'')'
        INTO v_invoices_count, v_invoices_pending_amt;
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

GRANT EXECUTE ON FUNCTION public.get_dashboard_analytics(INT) TO authenticated, anon;
