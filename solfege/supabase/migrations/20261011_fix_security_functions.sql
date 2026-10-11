-- ==============================================================================
-- MIGRAZIONE: Hardening di sicurezza funzioni interne (search_path & EXECUTE)
-- File: supabase/migrations/20261011_fix_security_functions.sql
-- ==============================================================================

-- 1. Impostazione search_path fisso a 'public' su tutte le funzioni indicate
--    Questo neutralizza l'attacco di schema/search_path injection (SECURITY DEFINER).

-- Funzione di trigger per updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN 
  NEW.updated_at = NOW(); 
  RETURN NEW; 
END;
$$;

-- Funzione di trigger su auth.users per creazione automatica profilo
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, 'admin');
  RETURN NEW;
END;
$$;

-- Helper RLS per recuperare il ruolo dell'utente loggato
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.user_role 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Helper RLS per recuperare la scuola dell'utente loggato
CREATE OR REPLACE FUNCTION public.get_my_school_id()
RETURNS UUID 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT school_id FROM public.profiles WHERE id = auth.uid();
$$;

-- Funzione eventuale rls_auto_enable (se presente nel database)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'public' AND p.proname = 'rls_auto_enable'
  ) THEN
    ALTER FUNCTION public.rls_auto_enable() SET search_path = public;
  END IF;
END $$;


-- 2. RESTRIZIONE PERMESSI DI ESECUZIONE (REVOKE EXECUTE)

-- A) handle_new_user e rls_auto_enable sono funzioni destinate ESCLUSIVAMENTE a TRIGGER.
--    Non devono mai essere invocate direttamente via PostgREST RPC da client esterni.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'public' AND p.proname = 'rls_auto_enable'
  ) THEN
    REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
  END IF;
END $$;

-- B) get_my_role e get_my_school_id:
--    - Vengono usate dalle policy RLS per le query degli utenti collegati.
--    - Di default PostgreSQL assegna EXECUTE a PUBLIC. 
--    - Togliamo EXECUTE a PUBLIC e ad anon (impedisce chiamate RPC anonime non autenticate).
--    - Manteniamo esplicitamente EXECUTE a authenticated (necessario per RLS e query applicative).
REVOKE EXECUTE ON FUNCTION public.get_my_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_my_school_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_school_id() TO authenticated;
