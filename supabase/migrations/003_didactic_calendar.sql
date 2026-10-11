-- Migration: Didactic Calendar, Holidays & Closures, Shared Lessons, Rescheduling & Recovery Credits

ALTER TABLE schools 
ADD COLUMN IF NOT EXISTS academic_year_start DATE DEFAULT '2026-09-15',
ADD COLUMN IF NOT EXISTS academic_year_end DATE DEFAULT '2027-06-15';

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

ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS original_date DATE,
ADD COLUMN IF NOT EXISTS original_ora_inizio TIME,
ADD COLUMN IF NOT EXISTS original_ora_fine TIME,
ADD COLUMN IF NOT EXISTS is_spostata BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS spostata_il TIMESTAMPTZ;

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
