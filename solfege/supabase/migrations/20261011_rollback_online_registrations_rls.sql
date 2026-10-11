-- ==============================================================================
-- ROLLBACK: Ripristino policy su public.online_registrations
-- File: supabase/migrations/20261011_rollback_online_registrations_rls.sql
-- ==============================================================================

-- 1. Elimina le nuove policy
DROP POLICY IF EXISTS "online_reg_insert_public" ON public.online_registrations;
DROP POLICY IF EXISTS "online_reg_school_manage" ON public.online_registrations;
DROP POLICY IF EXISTS "online_reg_superadmin_all" ON public.online_registrations;

-- 2. Ripristina le policy precedenti da 20260701_online_registrations.sql
CREATE POLICY anon_insert_registrations ON public.online_registrations
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY superadmin_all_registrations ON public.online_registrations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

CREATE POLICY school_admin_manage_registrations ON public.online_registrations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (role = 'admin' OR role = 'segreteria') AND school_id = online_registrations.school_id
    )
  );
