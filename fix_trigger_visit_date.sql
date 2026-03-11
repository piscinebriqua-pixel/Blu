CREATE OR REPLACE FUNCTION update_pool_last_maintenance_date()
RETURNS TRIGGER AS $$
BEGIN
    -- Si l'intervention passe à 'completed', on met à jour la date sur le bassin
    -- On effectue cette mise à jour uniquement si le statut vient de passer à completed
    IF (NEW.status = 'completed') THEN
        IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE' AND (OLD.status IS NULL OR OLD.status != 'completed')) THEN
            UPDATE pools 
            SET last_maintenance_date = COALESCE(NEW.completed_date, NEW.scheduled_date, NEW.created_at)
            WHERE id = NEW.pool_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
