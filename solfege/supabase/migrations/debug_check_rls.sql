-- Verifica e fix RLS su licenses
-- Incollare nel SQL Editor di Supabase

-- 1. Controlla se RLS è abilitata
SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'licenses';

-- 2. Lista le policy esistenti
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'licenses';

-- 3. Se mancano le policy SELECT, esegui:
-- ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
-- 
-- DROP POLICY IF EXISTS superadmin_all_licenses ON licenses;
-- CREATE POLICY superadmin_all_licenses ON licenses
--   FOR ALL
--   USING (
--     auth.uid() IN (SELECT id FROM profiles WHERE role = 'superadmin')
--   )
--   WITH CHECK (
--     auth.uid() IN (SELECT id FROM profiles WHERE role = 'superadmin')
--   );
