# ANTIGRAVITY — BRIEF TAURI v2: App Desktop Solfège

> Da eseguire dopo la landing page aggiornata.
> Repository: github.com/CosmoNetinfo/Solfege (branch: master)

---

## CONTESTO

Stiamo aggiungendo Tauri v2 al repo Next.js esistente per creare l'app desktop.
- Il frontend Next.js esistente viene riutilizzato come webview di Tauri
- Supabase viene sostituito da SQLite locale (solo nell'app desktop)
- La web app rimane invariata e continua a usare Supabase

---

## PARTE 1 — INSTALLAZIONE TAURI V2

### 1.1 Installare le dipendenze

```bash
npm install --save-dev @tauri-apps/cli@2
npm install @tauri-apps/api@2
npm install @tauri-apps/plugin-sql
npm install @tauri-apps/plugin-updater
npm install @tauri-apps/plugin-process
npm install @tauri-apps/plugin-fs
npm install @tauri-apps/plugin-shell
```

### 1.2 Inizializzare Tauri

```bash
npx tauri init
```

Risposte durante l'init:
- App name: `Solfège`
- Window title: `Solfège — Gestionale Scuola di Musica`
- Web assets location: `out`
- Dev server URL: `http://localhost:3000`
- Dev command: `npm run dev`
- Build command: `npm run build`

### 1.3 Aggiornare next.config.ts

```typescript
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // mantenere tutto il resto della config esistente
}
export default nextConfig
```

### 1.4 Aggiungere script in package.json

```json
{
  "scripts": {
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build"
  }
}
```

---

## PARTE 2 — CONFIGURAZIONE TAURI

### 2.1 File src-tauri/tauri.conf.json

Sovrascrivere completamente con:

```json
{
  "productName": "Solfège",
  "version": "1.0.0",
  "identifier": "info.cosmonet.solfege",
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build",
    "devUrl": "http://localhost:3000",
    "frontendDist": "../out"
  },
  "app": {
    "windows": [
      {
        "title": "Solfège — Gestionale Scuola di Musica",
        "width": 1280,
        "height": 800,
        "minWidth": 1024,
        "minHeight": 680,
        "resizable": true,
        "fullscreen": false,
        "center": true
      }
    ],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ],
    "resources": []
  },
  "plugins": {
    "sql": {
      "preloadConnections": ["sqlite:solfege.db"]
    },
    "updater": {
      "endpoints": [
        "https://solfege-five.vercel.app/api/latest-version"
      ],
      "pubkey": ""
    }
  }
}
```

### 2.2 File src-tauri/Cargo.toml

```toml
[package]
name = "solfege"
version = "1.0.0"
description = "Solfège — Gestionale Scuola di Musica"
authors = ["Daniele Spalletti <admindany@gmail.com>"]
edition = "2021"

[lib]
name = "solfege_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-sql = { version = "2", features = ["sqlite"] }
tauri-plugin-updater = { version = "2" }
tauri-plugin-process = { version = "2" }
tauri-plugin-fs = { version = "2" }
tauri-plugin-shell = { version = "2" }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
bcrypt = "0.15"
rusqlite = { version = "0.31", features = ["bundled"] }
tokio = { version = "1", features = ["full"] }
reqwest = { version = "0.12", features = ["json"] }
uuid = { version = "1", features = ["v4"] }
chrono = { version = "0.4", features = ["serde"] }
```

---

## PARTE 3 — BACKEND RUST

### 3.1 File src-tauri/src/lib.rs

```rust
use tauri::Manager;

mod commands;
mod database;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_updater::Builder::default().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Inizializza database al primo avvio
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                database::initialize(&app_handle).await.unwrap_or_else(|e| {
                    eprintln!("Errore inizializzazione DB: {}", e);
                });
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::auth::login,
            commands::auth::logout,
            commands::auth::get_current_user,
            commands::auth::create_first_user,
            commands::license::check_license,
            commands::license::activate_license,
            commands::license::get_trial_status,
            commands::updates::check_for_updates,
            commands::errors::report_error,
            commands::config::get_config,
            commands::config::set_config,
        ])
        .run(tauri::generate_context!())
        .expect("Errore avvio applicazione Solfège");
}
```

### 3.2 File src-tauri/src/main.rs

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    solfege_lib::run();
}
```

### 3.3 File src-tauri/src/database.rs

```rust
use tauri::AppHandle;
use tauri_plugin_sql::{Migration, MigrationKind};

pub async fn initialize(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    // Le migrazioni vengono gestite da tauri-plugin-sql
    // Il file solfege.db viene creato automaticamente in AppData/Application Support
    Ok(())
}

pub fn get_migrations() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            description: "create_initial_schema",
            sql: include_str!("../migrations/001_initial.sql"),
            kind: MigrationKind::Up,
        }
    ]
}
```

### 3.4 File src-tauri/migrations/001_initial.sql

```sql
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

-- Inserisce configurazione iniziale
INSERT OR IGNORE INTO app_config (key, value) VALUES
  ('app_version', '1.0.0'),
  ('setup_completed', 'false'),
  ('license_status', 'inactive');
```

### 3.5 File src-tauri/src/commands/mod.rs

```rust
pub mod auth;
pub mod license;
pub mod updates;
pub mod errors;
pub mod config;
```

### 3.6 File src-tauri/src/commands/config.rs

```rust
use tauri::AppHandle;
use tauri_plugin_sql::DbPool;

#[tauri::command]
pub async fn get_config(app: AppHandle, key: String) -> Result<Option<String>, String> {
    let db = app.state::<DbPool>();
    // Legge valore da app_config
    // Implementa con query SQLite
    Ok(None)
}

#[tauri::command]
pub async fn set_config(app: AppHandle, key: String, value: String) -> Result<(), String> {
    let db = app.state::<DbPool>();
    // Salva valore in app_config
    Ok(())
}
```

### 3.7 File src-tauri/src/commands/auth.rs

```rust
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct LocalUser {
    pub id: String,
    pub username: String,
    pub role: String,
    pub nome: String,
    pub cognome: String,
}

#[tauri::command]
pub async fn login(username: String, password: String) -> Result<LocalUser, String> {
    // 1. Cerca utente in SQLite per username
    // 2. Verifica password con bcrypt::verify
    // 3. Se ok → restituisce LocalUser
    // 4. Se no → Err("Credenziali non valide")
    Err("Non implementato".to_string())
}

#[tauri::command]
pub async fn logout() -> Result<(), String> {
    Ok(())
}

#[tauri::command]
pub async fn get_current_user() -> Result<Option<LocalUser>, String> {
    // Legge sessione corrente (salvata in stato Tauri)
    Ok(None)
}

#[tauri::command]
pub async fn create_first_user(
    username: String,
    password: String,
    nome: String,
    cognome: String,
) -> Result<(), String> {
    // 1. Hash password con bcrypt
    // 2. INSERT in tabella users con role='admin'
    Ok(())
}
```

### 3.8 File src-tauri/src/commands/license.rs

```rust
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct TrialStatus {
    pub is_trial: bool,
    pub days_remaining: i32,
    pub is_expired: bool,
    pub license_key: Option<String>,
}

#[tauri::command]
pub async fn get_trial_status() -> Result<TrialStatus, String> {
    // Legge trial_started_at da app_config
    // Calcola giorni passati
    // Restituisce TrialStatus
    Ok(TrialStatus {
        is_trial: true,
        days_remaining: 15,
        is_expired: false,
        license_key: None,
    })
}

#[tauri::command]
pub async fn check_license() -> Result<bool, String> {
    // Legge license_status da app_config
    // Restituisce true se 'active'
    Ok(false)
}

#[tauri::command]
pub async fn activate_license(license_key: String, machine_id: String) -> Result<bool, String> {
    // 1. POST a https://solfege-five.vercel.app/api/activate-license
    // Body: { license_key, machine_id, app_version, os_info }
    // 2. Se risposta OK → salva license_key e license_status='active' in app_config
    // 3. Restituisce true
    // 4. Se errore → Err con messaggio dal server
    Err("Non implementato".to_string())
}
```

### 3.9 File src-tauri/src/commands/errors.rs

```rust
#[tauri::command]
pub async fn report_error(
    license_key: Option<String>,
    error_type: String,
    message: String,
    stack: Option<String>,
    screen: Option<String>,
    action: Option<String>,
    app_version: String,
    os_info: String,
) -> Result<(), String> {
    // POST a https://solfege-five.vercel.app/api/error-report in background
    // Non bloccare l'app se fallisce
    // Usa reqwest in tokio::spawn
    Ok(())
}
```

### 3.10 File src-tauri/src/commands/updates.rs

```rust
#[tauri::command]
pub async fn check_for_updates() -> Result<bool, String> {
    // Usa tauri-plugin-updater per controllare aggiornamenti
    // Restituisce true se c'è un aggiornamento disponibile
    Ok(false)
}
```

---

## PARTE 4 — FRONTEND DESKTOP

### 4.1 Libreria database locale

**File da creare:** `lib/desktop-db.ts`

```typescript
// Wrapper SQLite per l'app desktop
// Usa @tauri-apps/plugin-sql

import Database from '@tauri-apps/plugin-sql'

let db: Database | null = null

async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load('sqlite:solfege.db')
  }
  return db
}

// STUDENTI
export const studentsDb = {
  getAll: async () => {
    const db = await getDb()
    return db.select<Student[]>(
      'SELECT * FROM students ORDER BY cognome, nome'
    )
  },
  getById: async (id: string) => {
    const db = await getDb()
    const results = await db.select<Student[]>(
      'SELECT * FROM students WHERE id = ?', [id]
    )
    return results[0] || null
  },
  create: async (data: StudentInsert) => {
    const db = await getDb()
    const id = crypto.randomUUID()
    await db.execute(
      `INSERT INTO students (id, nome, cognome, data_nascita, codice_fiscale, email, 
       telefono, indirizzo, citta, is_minorenne, genitore_nome, genitore_cognome, 
       genitore_email, genitore_telefono, note) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, data.nome, data.cognome, data.data_nascita, data.codice_fiscale,
       data.email, data.telefono, data.indirizzo, data.citta, data.is_minorenne,
       data.genitore_nome, data.genitore_cognome, data.genitore_email,
       data.genitore_telefono, data.note]
    )
    return id
  },
  update: async (id: string, data: Partial<Student>) => {
    const db = await getDb()
    const fields = Object.keys(data).map(k => `${k} = ?`).join(', ')
    await db.execute(
      `UPDATE students SET ${fields} WHERE id = ?`,
      [...Object.values(data), id]
    )
  },
  delete: async (id: string) => {
    const db = await getDb()
    await db.execute('DELETE FROM students WHERE id = ?', [id])
  },
}

// INSEGNANTI
export const teachersDb = {
  getAll: async () => {
    const db = await getDb()
    return db.select<Teacher[]>(
      'SELECT * FROM teachers ORDER BY cognome, nome'
    )
  },
  getById: async (id: string) => {
    const db = await getDb()
    const results = await db.select<Teacher[]>(
      'SELECT * FROM teachers WHERE id = ?', [id]
    )
    return results[0] || null
  },
  create: async (data: TeacherInsert) => {
    const db = await getDb()
    const id = crypto.randomUUID()
    await db.execute(
      `INSERT INTO teachers (id, nome, cognome, email, telefono, whatsapp, 
       strumento_principale, codice_fiscale, iban, tariffa_oraria_individuale, 
       tariffa_oraria_collettivo, note) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, data.nome, data.cognome, data.email, data.telefono, data.whatsapp,
       data.strumento_principale, data.codice_fiscale, data.iban,
       data.tariffa_oraria_individuale, data.tariffa_oraria_collettivo, data.note]
    )
    return id
  },
  update: async (id: string, data: Partial<Teacher>) => {
    const db = await getDb()
    const fields = Object.keys(data).map(k => `${k} = ?`).join(', ')
    await db.execute(
      `UPDATE teachers SET ${fields} WHERE id = ?`,
      [...Object.values(data), id]
    )
  },
  delete: async (id: string) => {
    const db = await getDb()
    await db.execute('DELETE FROM teachers WHERE id = ?', [id])
  },
}

// CORSI
export const coursesDb = {
  getAll: async () => {
    const db = await getDb()
    return db.select<Course[]>(`
      SELECT c.*, t.nome as teacher_nome, t.cognome as teacher_cognome,
             i.nome as instrument_nome, r.nome as room_nome
      FROM courses c
      LEFT JOIN teachers t ON c.teacher_id = t.id
      LEFT JOIN instruments i ON c.instrument_id = i.id
      LEFT JOIN rooms r ON c.room_id = r.id
      ORDER BY c.nome
    `)
  },
  create: async (data: CourseInsert) => {
    const db = await getDb()
    const id = crypto.randomUUID()
    await db.execute(
      `INSERT INTO courses (id, nome, descrizione, instrument_id, teacher_id, room_id,
       tipo, livello, durata_minuti, max_allievi, colore_calendario, prezzo,
       giorno_settimana, ora_inizio, ora_fine, anno_accademico)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, data.nome, data.descrizione, data.instrument_id, data.teacher_id,
       data.room_id, data.tipo, data.livello, data.durata_minuti, data.max_allievi,
       data.colore_calendario, data.prezzo, data.giorno_settimana,
       data.ora_inizio, data.ora_fine, data.anno_accademico]
    )
    return id
  },
  update: async (id: string, data: Partial<Course>) => {
    const db = await getDb()
    const fields = Object.keys(data).map(k => `${k} = ?`).join(', ')
    await db.execute(`UPDATE courses SET ${fields} WHERE id = ?`, [...Object.values(data), id])
  },
  delete: async (id: string) => {
    const db = await getDb()
    await db.execute('DELETE FROM courses WHERE id = ?', [id])
  },
}

// PAGAMENTI
export const paymentsDb = {
  getAll: async () => {
    const db = await getDb()
    return db.select<Payment[]>(`
      SELECT p.*, s.nome as student_nome, s.cognome as student_cognome,
             c.nome as course_nome
      FROM payments p
      LEFT JOIN students s ON p.student_id = s.id
      LEFT JOIN courses c ON p.course_id = c.id
      ORDER BY p.data_scadenza DESC
    `)
  },
  create: async (data: PaymentInsert) => {
    const db = await getDb()
    const id = crypto.randomUUID()
    // Genera numero ricevuta progressivo
    const result = await db.select<{count: number}[]>(
      'SELECT COUNT(*) as count FROM payments WHERE stato = ?', ['pagato']
    )
    const numeroRicevuta = `RIC-${new Date().getFullYear()}-${String((result[0]?.count || 0) + 1).padStart(4, '0')}`
    await db.execute(
      `INSERT INTO payments (id, student_id, course_id, importo, data_scadenza,
       metodo, stato, numero_ricevuta, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, data.student_id, data.course_id, data.importo, data.data_scadenza,
       data.metodo, data.stato, numeroRicevuta, data.note]
    )
    return id
  },
  update: async (id: string, data: Partial<Payment>) => {
    const db = await getDb()
    const fields = Object.keys(data).map(k => `${k} = ?`).join(', ')
    await db.execute(`UPDATE payments SET ${fields} WHERE id = ?`, [...Object.values(data), id])
  },
}

// LEZIONI
export const lessonsDb = {
  getAll: async () => {
    const db = await getDb()
    return db.select<Lesson[]>(`
      SELECT l.*, c.nome as course_nome, c.colore_calendario,
             t.nome as teacher_nome, t.cognome as teacher_cognome,
             r.nome as room_nome
      FROM lessons l
      LEFT JOIN courses c ON l.course_id = c.id
      LEFT JOIN teachers t ON c.teacher_id = t.id
      LEFT JOIN rooms r ON c.room_id = r.id
      ORDER BY l.data DESC, l.ora_inizio
    `)
  },
  getByDate: async (date: string) => {
    const db = await getDb()
    return db.select<Lesson[]>(
      `SELECT l.*, c.nome as course_nome, c.colore_calendario
       FROM lessons l
       LEFT JOIN courses c ON l.course_id = c.id
       WHERE l.data = ? ORDER BY l.ora_inizio`, [date]
    )
  },
  create: async (data: LessonInsert) => {
    const db = await getDb()
    const id = crypto.randomUUID()
    await db.execute(
      `INSERT INTO lessons (id, course_id, data, ora_inizio, ora_fine, stato)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, data.course_id, data.data, data.ora_inizio, data.ora_fine, 'programmata']
    )
    return id
  },
  update: async (id: string, data: Partial<Lesson>) => {
    const db = await getDb()
    const fields = Object.keys(data).map(k => `${k} = ?`).join(', ')
    await db.execute(`UPDATE lessons SET ${fields} WHERE id = ?`, [...Object.values(data), id])
  },
}

// PRESENZE
export const attendanceDb = {
  getByLesson: async (lessonId: string) => {
    const db = await getDb()
    return db.select<Attendance[]>(`
      SELECT a.*, s.nome, s.cognome
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      WHERE a.lesson_id = ?`, [lessonId]
    )
  },
  upsert: async (lessonId: string, studentId: string, stato: string) => {
    const db = await getDb()
    const id = crypto.randomUUID()
    await db.execute(
      `INSERT INTO attendance (id, lesson_id, student_id, stato)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(lesson_id, student_id) DO UPDATE SET stato = excluded.stato`,
      [id, lessonId, studentId, stato]
    )
  },
}

// COMPENSI
export const compensiDb = {
  getAll: async () => {
    const db = await getDb()
    return db.select<TeacherCompensation[]>(`
      SELECT tc.*, t.nome, t.cognome
      FROM teacher_compensations tc
      JOIN teachers t ON tc.teacher_id = t.id
      ORDER BY tc.anno DESC, tc.mese DESC
    `)
  },
  calcola: async (teacherId: string, mese: string, anno: number) => {
    const db = await getDb()
    // Calcola ore da presenze del mese
    const presenze = await db.select<{ore: number}[]>(`
      SELECT COUNT(*) * (c.durata_minuti / 60.0) as ore
      FROM attendance a
      JOIN lessons l ON a.lesson_id = l.id
      JOIN courses c ON l.course_id = c.id
      WHERE c.teacher_id = ?
        AND a.stato = 'presente'
        AND strftime('%Y', l.data) = ?
        AND strftime('%m', l.data) = ?
    `, [teacherId, String(anno), mese])
    return presenze[0]?.ore || 0
  },
}

// STRUMENTI
export const instrumentsDb = {
  getAll: async () => {
    const db = await getDb()
    return db.select<Instrument[]>('SELECT * FROM instruments ORDER BY nome')
  },
  create: async (nome: string, categoria?: string) => {
    const db = await getDb()
    const id = crypto.randomUUID()
    await db.execute('INSERT INTO instruments (id, nome, categoria) VALUES (?, ?, ?)', [id, nome, categoria])
    return id
  },
  delete: async (id: string) => {
    const db = await getDb()
    await db.execute('DELETE FROM instruments WHERE id = ?', [id])
  },
}

// AULE
export const roomsDb = {
  getAll: async () => {
    const db = await getDb()
    return db.select<Room[]>('SELECT * FROM rooms ORDER BY nome')
  },
  create: async (data: RoomInsert) => {
    const db = await getDb()
    const id = crypto.randomUUID()
    await db.execute('INSERT INTO rooms (id, nome, capacita, note) VALUES (?, ?, ?, ?)',
      [id, data.nome, data.capacita, data.note])
    return id
  },
  delete: async (id: string) => {
    const db = await getDb()
    await db.execute('DELETE FROM rooms WHERE id = ?', [id])
  },
}
```

### 4.2 Wizard primo avvio

**File da creare:** `app/setup/page.tsx`

Pagina a 4 step mostrata solo se `setup_completed !== 'true'` in app_config.
Controllare all'avvio con il comando Tauri `get_config('setup_completed')`.

**Step 1 — Benvenuto:**
- Logo Solfège centrato (grande, font Cormorant Garamond)
- Titolo: "Benvenuto in Solfège"
- Sottotitolo: "Configuriamo la tua scuola di musica in pochi passaggi"
- Pulsante arancio "Inizia →"

**Step 2 — Attiva licenza:**
- Titolo: "Attiva la tua licenza"
- Input grande per license key (placeholder: `SOLFEGE-XXXX-XXXX-XXXX`)
- Formattazione automatica mentre digita (aggiunge trattini)
- Pulsante "Attiva" → chiama comando Tauri `activate_license`
- Loading spinner durante verifica
- Errore in rosso se key non valida
- Successo in verde + "Licenza attivata!" → avanza a Step 3

**Step 3 — Crea account:**
- Titolo: "Crea il tuo account admin"
- Campo Nome *
- Campo Cognome *
- Campo Username *
- Campo Password * (con show/hide)
- Campo Conferma Password *
- Validazione: password >= 8 caratteri, le due password coincidono
- Pulsante "Crea account" → chiama `create_first_user`

**Step 4 — Dati scuola:**
- Titolo: "Configura la tua scuola"
- Campo Nome scuola *
- Campo Indirizzo
- Campo Città
- Campo Telefono
- Campo Email
- Pulsante "Salva e inizia" → salva in SQLite tabella schools + setta `setup_completed = true` in app_config → redirect `/login`

**Layout wizard:**
- Sfondo: `#FAFAF9`
- Card centrata max-width 480px con shadow
- Progress dots in cima (4 pallini, quello attivo arancio)
- Font Cormorant Garamond per titoli, DM Sans per tutto il resto

### 4.3 Login locale

**File da creare:** `app/login-desktop/page.tsx`

Pagina di login per l'app desktop (diversa dal login web che usa Supabase).

- Logo Solfège
- Campo Username
- Campo Password (con show/hide)
- Pulsante "Accedi" → chiama comando Tauri `login`
- Errore: "Credenziali non valide" in rosso
- Successo → redirect `/admin/dashboard`

### 4.4 Rilevamento ambiente

**File da creare:** `lib/is-desktop.ts`

```typescript
// Rileva se l'app gira in Tauri (desktop) o browser (web)
export const isDesktop = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI__' in window
}
```

Usare questa funzione ovunque serve distinguere web da desktop.

### 4.5 Banner trial desktop

**File da creare:** `components/desktop/TrialBanner.tsx`

Componente da aggiungere SOLO nel layout desktop (non nella web app).

```typescript
'use client'
import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { AlertTriangle } from 'lucide-react'
import { isDesktop } from '@/lib/is-desktop'

// Chiama invoke('get_trial_status') all'avvio
// Se days_remaining <= 10 e is_trial = true:
//   giorni 10-6: banner giallo con "X giorni rimanenti al trial"
//   giorni 5-1: banner arancio con "Solo X giorni rimanenti!"
//   giorno 0 / scaduto: redirect a /setup per attivare licenza
// Se license attiva: non mostra nulla
```

### 4.6 Error Boundary globale

**File da creare:** `components/desktop/ErrorBoundary.tsx`

```typescript
// React Error Boundary che cattura tutti gli errori
// Quando cattura un errore:
//   1. Se isDesktop() → chiama invoke('report_error', {...}) in background
//   2. Mostra pagina errore user-friendly
//   3. Pulsante "Riprova" + pulsante "Torna alla Dashboard"
// Layout pagina errore:
//   - Icona AlertTriangle rossa grande
//   - Titolo: "Si è verificato un errore"
//   - Messaggio: "L'errore è stato segnalato automaticamente."
//   - Dettaglio tecnico (collassabile, per debug)
```

### 4.7 Aggiornare layout admin per desktop

**File da modificare:** `app/(admin)/layout.tsx`

Aggiungere in cima al layout, solo se `isDesktop()`:
1. Import e render di `TrialBanner`
2. Import e wrap con `ErrorBoundary`
3. Controllo sessione: usa `invoke('get_current_user')` invece di Supabase se desktop

---

## PARTE 5 — AUTO-UPDATE

### 5.1 Componente UpdateChecker

**File da creare:** `components/desktop/UpdateChecker.tsx`

```typescript
'use client'
import { useEffect } from 'react'
import { check } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'
import { isDesktop } from '@/lib/is-desktop'

// All'avvio (useEffect una volta):
//   1. Se non isDesktop() → non fare nulla
//   2. Chiama check() di tauri-plugin-updater
//   3. Se c'è aggiornamento → mostra Dialog shadcn/ui:
//      Titolo: "Aggiornamento disponibile — Solfège vX.X.X"
//      Corpo: note di rilascio dalla release
//      Progress bar durante download
//      Pulsanti: "Aggiorna ora" | "Più tardi"
//   4. "Aggiorna ora" → update.downloadAndInstall() → relaunch()
//   5. Non bloccare l'UI se offline o errore
```

---

## PARTE 6 — SCRIPT BUILD E ICONE

### 6.1 Icone app

Creare le icone Tauri in `src-tauri/icons/`:
- Usare come base l'immagine della chiave di violino arancio già usata come favicon
- Generare con: `npx tauri icon path/to/icon.png`
- Questo crea automaticamente tutte le dimensioni necessarie

### 6.2 Aggiornare .gitignore

Aggiungere a `.gitignore`:
```
# Tauri
src-tauri/target/
src-tauri/WixTools/
*.exe
*.dmg
*.AppImage
*.deb
*.msi
```

---

## CHECKLIST FINALE

### Setup Tauri
- [ ] `npx tauri dev` avvia l'app in finestra desktop senza errori
- [ ] Finestra si apre con titolo "Solfège — Gestionale Scuola di Musica"
- [ ] Database SQLite creato automaticamente in AppData

### Wizard primo avvio
- [ ] Al primo avvio appare il wizard (4 step)
- [ ] Step 1: pulsante "Inizia" funziona
- [ ] Step 2: input licenza con formattazione automatica
- [ ] Step 2: attivazione chiama l'API su Vercel
- [ ] Step 3: creazione account con validazione password
- [ ] Step 4: salvataggio dati scuola → redirect login
- [ ] Dopo setup completato il wizard non appare più

### Auth locale
- [ ] Login con username/password funziona
- [ ] Credenziali errate mostrano errore
- [ ] Dopo login redirect a dashboard

### Trial
- [ ] Banner giallo appare dal giorno 10
- [ ] Banner arancio appare dal giorno 5
- [ ] Scaduto → redirect a setup attivazione licenza

### Build
- [ ] `npx tauri build` completa senza errori
- [ ] File .exe generato per Windows
- [ ] File .dmg generato per Mac

### Deploy
- [ ] `git add .`
- [ ] `git commit -m "feat: integrate Tauri v2 desktop app with SQLite"`
- [ ] `git push`

---

## NOTE IMPORTANTI

1. **Non modificare** le pagine admin esistenti — funzionano sia web che desktop
2. **`isDesktop()`** va usato per tutte le differenze web/desktop
3. **Il DB SQLite** viene creato in automatico da tauri-plugin-sql al primo avvio
4. **L'auth locale** sostituisce Supabase Auth SOLO nell'app desktop
5. **La web app** continua a usare Supabase Auth normalmente
6. **Rust non compilato**: le funzioni nei comandi Rust hanno implementazioni placeholder — vanno completate con la logica SQLite reale

---

*Solfège v2.0 Desktop — CosmoNet.info — Giugno 2026*
