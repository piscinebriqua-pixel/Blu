-- Phase: Gestion des Entretiens (Phase 2)
-- Amélioration du schéma pour la planification et la récurrence

-- 1. Extension de la table Interventions
-- On ajoute la date planifiée pour séparer le planning de la réalisation effective
ALTER TABLE interventions 
ADD COLUMN IF NOT EXISTS scheduled_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS technician_assigned_id UUID REFERENCES technicians(id);

-- Mise à jour des statuts autorisés (conceptuel)
-- Nouveau cycle : pending -> scheduled -> in_progress -> completed | cancelled
COMMENT ON COLUMN interventions.status IS 'Cycle: pending, scheduled, in_progress, completed, cancelled';

-- 2. Extension de la table Pools (Bassins)
-- On ajoute la fréquence d'entretien et le suivi de la dernière visite
ALTER TABLE pools
ADD COLUMN IF NOT EXISTS maintenance_frequency TEXT DEFAULT 'hebdomadaire',
ADD COLUMN IF NOT EXISTS last_maintenance_date TIMESTAMP WITH TIME ZONE;

-- 3. Automatisation : Mise à jour de la dernière visite sur le bassin
CREATE OR REPLACE FUNCTION update_pool_last_maintenance_date()
RETURNS TRIGGER AS $$
BEGIN
    -- Si l'intervention passe à 'completed', on met à jour la date sur le bassin
    IF (NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed')) THEN
        UPDATE pools 
        SET last_maintenance_date = COALESCE(NEW.visit_date, NEW.created_at)
        WHERE id = NEW.pool_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_pool_last_maintenance ON interventions;

CREATE TRIGGER tr_update_pool_last_maintenance
AFTER INSERT OR UPDATE OF status ON interventions
FOR EACH ROW
EXECUTE FUNCTION update_pool_last_maintenance_date();
