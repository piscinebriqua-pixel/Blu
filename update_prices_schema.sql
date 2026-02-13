-- Mise à jour pour la gestion des tarifs

-- 1. Ajouter une colonne prix à la table services
ALTER TABLE services ADD COLUMN IF NOT EXISTS price DECIMAL(10,3) DEFAULT 0;

-- 2. Ajouter une colonne pour stocker le prix "à l'instant T" dans la liaison intervention_services
-- (Indispensable si vous changez vos tarifs plus tard)
ALTER TABLE intervention_services ADD COLUMN IF NOT EXISTS price_at_time DECIMAL(10,3) DEFAULT 0;

-- 3. Mise à jour de quelques prix par défaut pour les services (Exemples à adapter)
UPDATE services SET price = 45.000 WHERE name = 'NETTOYAGE PISCINE';
UPDATE services SET price = 35.000 WHERE name = 'Visite';
UPDATE services SET price = 60.000 WHERE name = 'Mise en marche';
UPDATE services SET price = 80.000 WHERE name = 'Vidange';
UPDATE services SET price = 25.000 WHERE name = 'Verification';

-- 4. Fonction pour mettre à jour automatiquement le solde du client
-- (On peut aussi le faire côté code, mais c'est plus sûr ici)
-- Note: Pour l'instant, on va gérer la logique de balance via le code React pour plus de flexibilité
