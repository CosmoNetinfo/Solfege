-- ==============================================================================
-- MIGRAZIONE: Sicurezza RLS su public.online_registrations
-- File: supabase/migrations/20261011_fix_online_registrations_rls.sql
-- ==============================================================================

-- 1. Assicura che RLS sia abilitata
ALTER TABLE public.online_registrations ENABLE ROW LEVEL SECURITY;

-- 2. Eliminazione policy aperte, permissive, duplicate o obsolete
DROP POLICY IF EXISTS "Accesso pubblico iscrizioni" ON public.online_registrations;
DROP POLICY IF EXISTS "anon_insert_registrations" ON public.online_registrations;
DROP POLICY IF EXISTS "online_registrations_public_insert" ON public.online_registrations;
DROP POLICY IF EXISTS "school_admin_manage_registrations" ON public.online_registrations;
DROP POLICY IF EXISTS "online_registrations_school_select" ON public.online_registrations;
DROP POLICY IF EXISTS "online_registrations_school_update" ON public.online_registrations;
DROP POLICY IF EXISTS "online_registrations_school_delete" ON public.online_registrations;
DROP POLICY IF EXISTS "superadmin_all_registrations" ON public.online_registrations;

-- 3. NUOVE POLICY PULITE E SENZA SOVRAPPOSIZIONI:

-- Policy A: Inserimento per chiunque (anonimo o autenticato)
-- Limiti di sicurezza:
-- - status DEVE essere 'pending' (nessuno può auto-approvarsi dall'esterno)
-- - school_id DEVE corrispondere a una scuola valida esistente
CREATE POLICY "online_reg_insert_public" ON public.online_registrations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    status = 'pending'
    AND school_id IN (SELECT id FROM public.schools)
  );

-- Policy B: Lettura, Modifica e Cancellazione per utenti della stessa scuola
-- Riservato a utenti autenticati con ruolo 'admin' o 'segreteria'
CREATE POLICY "online_reg_school_manage" ON public.online_registrations
  FOR ALL
  TO authenticated
  USING (
    school_id IN (
      SELECT school_id FROM public.profiles 
      WHERE id = auth.uid() 
        AND role IN ('admin', 'segreteria')
    )
  )
  WITH CHECK (
    school_id IN (
      SELECT school_id FROM public.profiles 
      WHERE id = auth.uid() 
        AND role IN ('admin', 'segreteria')
    )
  );

-- Policy C: Controllo completo per il Superadmin
CREATE POLICY "online_reg_superadmin_all" ON public.online_registrations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );
