-- ==============================================================================
-- SICUREZZA RLS: online_registrations (SOLFÈGE)
-- File di proposta regole di accesso (NON ancora applicato)
-- ==============================================================================

-- 1. Abilita la sicurezza per righe (RLS)
ALTER TABLE online_registrations ENABLE ROW LEVEL SECURITY;

-- 2. Scrittura pubblica (anon e authenticated):
-- Permette a chiunque compili il modulo pubblico su /[school_slug]/iscriviti
-- di inserire una nuova registrazione. Nota: poiché app/actions/public-actions.ts 
-- e app/api/online-registrations/route.ts usano createAdminClient() (Service Role Key),
-- il backend supera comunque RLS. Questa policy consente l'insert anche se venisse
-- usato il client pubblico (anon key).
DROP POLICY IF EXISTS "online_registrations_public_insert" ON online_registrations;
CREATE POLICY "online_registrations_public_insert" ON online_registrations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 3. Lettura e gestione isolata per scuola:
-- Gli utenti autenticati della scuola (admin, segreteria) possono leggere, 
-- modificare (approvare/rifiutare) ed eliminare SOLO le registrazioni della PROPRIA scuola.
DROP POLICY IF EXISTS "online_registrations_school_select" ON online_registrations;
CREATE POLICY "online_registrations_school_select" ON online_registrations
  FOR SELECT
  TO authenticated
  USING (
    school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "online_registrations_school_update" ON online_registrations;
CREATE POLICY "online_registrations_school_update" ON online_registrations
  FOR UPDATE
  TO authenticated
  USING (
    school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "online_registrations_school_delete" ON online_registrations;
CREATE POLICY "online_registrations_school_delete" ON online_registrations
  FOR DELETE
  TO authenticated
  USING (
    school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid())
  );
