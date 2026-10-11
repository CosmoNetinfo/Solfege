-- Migration: Didactic Calendar, Holidays & Closures, Shared Lessons, Rescheduling & Recovery Credits

-- 1. Configurable academic year on schools
ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS academic_year_start DATE DEFAULT '2026-09-15',
ADD COLUMN IF NOT EXISTS academic_year_end DATE DEFAULT '2027-06-15';

-- 2. Holidays and school closure periods
CREATE TABLE IF NOT EXISTS school_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  data_inizio DATE NOT NULL,
  data_fine DATE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('festivita', 'chiusura', 'patrono')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_school_holidays_dates ON school_holidays(school_id, data_inizio, data_fine);

-- 3. Lesson rescheduling tracking
ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS original_date DATE,
ADD COLUMN IF NOT EXISTS original_ora_inizio TIME,
ADD COLUMN IF NOT EXISTS original_ora_fine TIME,
ADD COLUMN IF NOT EXISTS is_spostata BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS spostata_il TIMESTAMPTZ;

-- 4. Recovery credits
CREATE TABLE IF NOT EXISTS recovery_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  recovery_lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  stato TEXT NOT NULL DEFAULT 'disponibile' CHECK (stato IN ('disponibile', 'utilizzato', 'scaduto', 'annullato')),
  data_maturazione DATE NOT NULL DEFAULT CURRENT_DATE,
  data_scadenza DATE,
  data_utilizzo DATE,
  motivo TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recovery_credits_student ON recovery_credits(student_id, stato);

-- RLS policies
ALTER TABLE school_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_credits ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'school_holidays' AND policyname = 'school_holidays_manage'
  ) THEN
    CREATE POLICY "school_holidays_manage" ON school_holidays
      FOR ALL USING (
        school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid())
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'recovery_credits' AND policyname = 'recovery_credits_manage'
  ) THEN
    CREATE POLICY "recovery_credits_manage" ON recovery_credits
      FOR ALL USING (
        school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid())
      );
  END IF;
END $$;
