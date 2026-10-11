-- ==============================================================================
-- ROLLBACK MIGRAZIONE CALENDARIO DIDATTICO SOLFÈGE (v1.8.0)
-- Da incollare ed eseguire nell'SQL Editor di Supabase solo per ripristinare
-- lo stato precedente alla v1.8.0
-- ==============================================================================

-- 1. Eliminazione policy RLS
DROP POLICY IF EXISTS "school_holidays_manage" ON school_holidays;
DROP POLICY IF EXISTS "recovery_credits_manage" ON recovery_credits;

-- 2. Eliminazione tabelle create
DROP TABLE IF EXISTS recovery_credits CASCADE;
DROP TABLE IF EXISTS school_holidays CASCADE;

-- 3. Rimozione colonne aggiunte a lessons
ALTER TABLE lessons 
DROP COLUMN IF EXISTS original_date,
DROP COLUMN IF EXISTS original_ora_inizio,
DROP COLUMN IF EXISTS original_ora_fine,
DROP COLUMN IF EXISTS is_spostata,
DROP COLUMN IF EXISTS spostata_il;

-- 4. Rimozione colonne aggiunte a schools
ALTER TABLE schools 
DROP COLUMN IF EXISTS academic_year_start,
DROP COLUMN IF EXISTS academic_year_end;
