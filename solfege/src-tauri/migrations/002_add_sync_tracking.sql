-- Sync tracking per iscrizioni online
-- Traccia quali registrazioni online sono state sincronizzate nel DB locale

CREATE TABLE IF NOT EXISTS sync_log (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  registration_id TEXT NOT NULL UNIQUE,
  student_id TEXT REFERENCES students(id) ON DELETE SET NULL,
  action TEXT NOT NULL DEFAULT 'created' CHECK (action IN ('created', 'updated', 'skipped')),
  synced_at TEXT DEFAULT (datetime('now')),
  raw_data TEXT
);

-- Aggiunge la colonna per tracciare la provenienza dello studente
ALTER TABLE students ADD COLUMN source TEXT DEFAULT 'manual';
ALTER TABLE students ADD COLUMN online_registration_id TEXT;
