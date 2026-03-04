-- Autorise la consultation (SELECT) sur les clients pour tous les utilisateurs authentifiés (admin et techniciens)
DROP POLICY IF EXISTS "Clients - Lecture pour tous" ON clients;
CREATE POLICY "Clients - Lecture pour tous" ON clients
    FOR SELECT
    TO authenticated
    USING (true);

-- Autorise la consultation (SELECT) sur les bassins pour tous les utilisateurs authentifiés
DROP POLICY IF EXISTS "Bassins - Lecture pour tous" ON pools;
CREATE POLICY "Bassins - Lecture pour tous" ON pools
    FOR SELECT
    TO authenticated
    USING (true);
