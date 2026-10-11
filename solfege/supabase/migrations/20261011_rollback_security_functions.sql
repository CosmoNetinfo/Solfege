-- ==============================================================================
-- ROLLBACK: Ripristino permessi originali funzioni interne
-- File: supabase/migrations/20261011_rollback_security_functions.sql
-- ==============================================================================

-- Ripristina i permessi di default (PUBLIC include sia anon che authenticated)
GRANT EXECUTE ON FUNCTION public.get_my_role() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_school_id() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_updated_at() TO PUBLIC;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'public' AND p.proname = 'rls_auto_enable'
  ) THEN
    GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO PUBLIC;
  END IF;
END $$;
