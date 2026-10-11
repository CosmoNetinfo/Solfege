-- Migrazione 003: Calendario Didattico, Festivita, Chiusure, Spostamenti e Crediti Recupero

-- 1. Anno accademico configurabile su schools
ALTER TABLE schools ADD COLUMN academic_year_start TEXT DEFAULT '2026-09-15';
ALTER TABLE schools ADD COLUMN academic_year_end TEXT DEFAULT '2027-06-15';

-- 2. Festivita e periodi di chiusura per scuola
CREATE TABLE IF NOT EXISTS school_holidays (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  data_inizio TEXT NOT NULL,
  data_fine TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('festivita', 'chiusura', 'patrono')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_school_holidays_dates ON school_holidays(school_id, data_inizio, data_fine);

-- 3. Spostamenti e tracciamento lezione originale su lessons
ALTER TABLE lessons ADD COLUMN original_date TEXT;
ALTER TABLE lessons ADD COLUMN original_ora_inizio TEXT;
ALTER TABLE lessons ADD COLUMN original_ora_fine TEXT;
ALTER TABLE lessons ADD COLUMN is_spostata INTEGER DEFAULT 0;
ALTER TABLE lessons ADD COLUMN spostata_il TEXT;

-- 4. Registro crediti di recupero
CREATE TABLE IF NOT EXISTS recovery_credits (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id TEXT REFERENCES courses(id) ON DELETE SET NULL,
  lesson_id TEXT REFERENCES lessons(id) ON DELETE SET NULL,
  recovery_lesson_id TEXT REFERENCES lessons(id) ON DELETE SET NULL,
  stato TEXT NOT NULL DEFAULT 'disponibile' CHECK (stato IN ('disponibile', 'utilizzato', 'scaduto', 'annullato')),
  data_maturazione TEXT NOT NULL DEFAULT (date('now')),
  data_scadenza TEXT,
  data_utilizzo TEXT,
  motivo TEXT,
  note TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_recovery_credits_student ON recovery_credits(student_id, stato);

-- Assicuriamoci che la tabella attendances/attendance esista uniformemente
CREATE TABLE IF NOT EXISTS attendances (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  stato TEXT DEFAULT 'presente' CHECK (stato IN ('presente', 'assente', 'giustificato', 'recuperato', 'festivo')),
  note TEXT,
  UNIQUE(lesson_id, student_id)
);
