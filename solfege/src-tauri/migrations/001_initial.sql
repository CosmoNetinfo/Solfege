-- Schema SQLite Solfège Desktop v1.0.0

CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'segreteria')),
  nome TEXT NOT NULL,
  cognome TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS schools (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  nome TEXT NOT NULL,
  indirizzo TEXT,
  citta TEXT,
  cap TEXT,
  provincia TEXT,
  telefono TEXT,
  email TEXT,
  sito_web TEXT,
  logo_path TEXT,
  anno_accademico_corrente TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS instruments (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  nome TEXT NOT NULL,
  categoria TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  nome TEXT NOT NULL,
  capacita INTEGER DEFAULT 1,
  tipo TEXT DEFAULT 'aula' CHECK (tipo IN ('aula', 'sala_prove', 'sala_comune', 'altro')),
  colore TEXT DEFAULT '#E8621A',
  note TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS teachers (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  nome TEXT NOT NULL,
  cognome TEXT NOT NULL,
  email TEXT,
  telefono TEXT,
  whatsapp TEXT,
  strumento_principale TEXT,
  codice_fiscale TEXT,
  iban TEXT,
  tariffa_oraria_individuale REAL,
  tariffa_oraria_collettivo REAL,
  note TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS disponibilita_insegnanti (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  teacher_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  giorno_settimana INTEGER NOT NULL CHECK (giorno_settimana BETWEEN 0 AND 6),
  ora_inizio TEXT NOT NULL,
  ora_fine TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  nome TEXT NOT NULL,
  cognome TEXT NOT NULL,
  data_nascita TEXT,
  codice_fiscale TEXT,
  email TEXT,
  telefono TEXT,
  indirizzo TEXT,
  citta TEXT,
  cap TEXT,
  is_minorenne INTEGER DEFAULT 0,
  genitore_nome TEXT,
  genitore_cognome TEXT,
  genitore_email TEXT,
  genitore_telefono TEXT,
  genitore_codice_fiscale TEXT,
  note TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tessere (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  anno_accademico TEXT NOT NULL,
  numero_tessera TEXT,
  data_emissione TEXT,
  data_scadenza TEXT,
  stato TEXT DEFAULT 'attiva' CHECK (stato IN ('attiva', 'scaduta', 'sospesa'))
);

CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  nome TEXT NOT NULL,
  descrizione TEXT,
  instrument_id TEXT REFERENCES instruments(id),
  teacher_id TEXT REFERENCES teachers(id),
  room_id TEXT REFERENCES rooms(id),
  tipo TEXT DEFAULT 'individuale' CHECK (tipo IN ('individuale', 'collettivo', 'ensemble')),
  livello TEXT CHECK (livello IN ('principiante', 'intermedio', 'avanzato')),
  durata_minuti INTEGER DEFAULT 60,
  max_allievi INTEGER DEFAULT 1,
  colore_calendario TEXT DEFAULT '#E8621A',
  prezzo REAL,
  giorno_settimana INTEGER,
  ora_inizio TEXT,
  ora_fine TEXT,
  anno_accademico TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS enrollments (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  data_iscrizione TEXT DEFAULT (date('now')),
  stato TEXT DEFAULT 'attivo' CHECK (stato IN ('attivo', 'sospeso', 'ritirato')),
  UNIQUE(student_id, course_id)
);

CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  data TEXT NOT NULL,
  ora_inizio TEXT NOT NULL,
  ora_fine TEXT NOT NULL,
  argomenti TEXT,
  compiti TEXT,
  stato TEXT DEFAULT 'programmata' CHECK (stato IN ('programmata', 'svolta', 'annullata', 'recupero')),
  note TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  stato TEXT DEFAULT 'presente' CHECK (stato IN ('presente', 'assente', 'recuperato', 'festivo')),
  note TEXT,
  UNIQUE(lesson_id, student_id)
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id TEXT REFERENCES courses(id),
  importo REAL NOT NULL,
  data_pagamento TEXT,
  data_scadenza TEXT NOT NULL,
  metodo TEXT DEFAULT 'contanti' CHECK (metodo IN ('contanti', 'bonifico', 'pos', 'altro')),
  stato TEXT DEFAULT 'in_attesa' CHECK (stato IN ('in_attesa', 'pagato', 'scaduto', 'annullato')),
  numero_ricevuta TEXT,
  note TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS teacher_compensations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  teacher_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  mese TEXT NOT NULL,
  anno INTEGER NOT NULL,
  ore_totali REAL DEFAULT 0,
  tariffa_oraria REAL,
  importo_totale REAL,
  stato TEXT DEFAULT 'da_pagare' CHECK (stato IN ('da_pagare', 'pagato')),
  note TEXT,
  UNIQUE(teacher_id, mese, anno)
);

CREATE TABLE IF NOT EXISTS room_bookings (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  room_id TEXT REFERENCES rooms(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'sala_prove' 
    CHECK (tipo IN ('lezione', 'sala_prove', 'evento', 'altro')),
  titolo TEXT NOT NULL,
  nome_gruppo TEXT,
  contatto_nome TEXT,
  contatto_telefono TEXT,
  contatto_email TEXT,
  data TEXT NOT NULL,
  ora_inizio TEXT NOT NULL,
  ora_fine TEXT NOT NULL,
  note TEXT,
  colore TEXT DEFAULT '#7C3AED',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  role TEXT NOT NULL,
  nome TEXT NOT NULL,
  cognome TEXT NOT NULL,
  logged_in_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_activity_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Inserisce configurazione iniziale
INSERT OR IGNORE INTO app_config (key, value) VALUES
  ('app_version', '1.0.0'),
  ('setup_completed', 'false'),
  ('license_status', 'inactive');
