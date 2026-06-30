-- Migration: RLS policies for superadmin tables (licenses, error_reports, app_releases)
-- Run this in Supabase SQL Editor if not already done

-- ============================================================
-- LICENSES TABLE
-- ============================================================
-- RLS già abilitata dal pannello. Aggiungiamo le policy mancanti.

ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;

-- Superadmin can do everything on licenses
DROP POLICY IF EXISTS superadmin_all_licenses ON licenses;
CREATE POLICY superadmin_all_licenses ON licenses
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'superadmin'
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'superadmin'
    )
  );

-- Desktop app can read its own license (for activation check) - using service role via API route
-- No direct SELECT from anon key for desktop app (goes through /api/activate-license)

-- ============================================================
-- ERROR_REPORTS TABLE  
-- ============================================================
ALTER TABLE error_reports ENABLE ROW LEVEL SECURITY;

-- Superadmin can read all error reports
DROP POLICY IF EXISTS superadmin_all_error_reports ON error_reports;
CREATE POLICY superadmin_all_error_reports ON error_reports
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'superadmin'
    )
  );

-- Allow anonymous INSERT (desktop app sends errors without auth)
DROP POLICY IF EXISTS anon_insert_error_reports ON error_reports;
CREATE POLICY anon_insert_error_reports ON error_reports
  FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- APP_RELEASES TABLE
-- ============================================================
ALTER TABLE app_releases ENABLE ROW LEVEL SECURITY;

-- Superadmin can do everything
DROP POLICY IF EXISTS superadmin_all_releases ON app_releases;
CREATE POLICY superadmin_all_releases ON app_releases
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'superadmin'
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'superadmin'
    )
  );

-- Anyone can read current release (for update check endpoint)
DROP POLICY IF EXISTS public_read_current_release ON app_releases;
CREATE POLICY public_read_current_release ON app_releases
  FOR SELECT
  USING (is_current = true);
