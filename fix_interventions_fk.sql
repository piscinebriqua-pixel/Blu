-- =============================================
-- FIX: Suppression de la FK dupliquée
-- La colonne technician_assigned_id est inutilisée
-- et crée une 2ème FK vers technicians → erreur PGRST201
-- =============================================
-- Note: technician_id → technicians(id) est déjà correct
-- (corrigé par import_technicians.sql ligne 34-35)

ALTER TABLE interventions
    DROP COLUMN IF EXISTS technician_assigned_id;
