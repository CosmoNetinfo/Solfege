# ANTIGRAVITY — BRIEF COMPLETO SOLFÈGE DESKTOP
> Versione: 2.0 Desktop | Data: Giugno 2026
> Repository: github.com/CosmoNetinfo/Solfege (branch: master)
> App produzione web: https://solfege-five.vercel.app

---

## CONTESTO GENERALE

Solfège è un gestionale per scuole di musica italiane.
Stiamo trasformando l'app da SaaS web multi-tenant a **applicazione desktop nativa** (Tauri v2 + SQLite locale) mantenendo la web app come demo/dev.

**Stack attuale web:**
- Next.js 16.2.6 (App Router + TypeScript)
- Supabase (PostgreSQL + Auth + RLS)
- Vercel (deploy)
- Tailwind CSS + shadcn/ui
- lucide-react (icone — UNICA libreria icone permessa)
- nodemailer + Gmail SMTP

**Design system — REGOLE ASSOLUTE (non derogabili):**
- Icone: SOLO `lucide-react` — zero emoji, zero Font Awesome
- Sidebar admin: SEMPRE bg `#1A1714` (scuro)
- Font display: Cormorant Garamond | Font corpo: DM Sans
- Colore primario: `#E8621A` | Hover: `#C94E0E`
- Testo su sfondo chiaro: `text-foreground` / `text-muted-foreground`
- Testo su sfondo scuro: `text-sidebar-foreground`
- Zero emoji nel codice

**Bug noti da NON ripetere:**
- Usare sempre `zod@3.23.8` (v4 incompatibile con hookform)
- Usare sempre `maybeSingle()` mai `single()`
- Mai `text-white` su sfondo chiaro

---

## PARTE 1 — SUPER ADMIN PANEL (WEB APP)

### Obiettivo
Creare un pannello superadmin accessibile solo all'account `admindany@gmail.com` direttamente sulla web app esistente. Questo pannello permette di gestire licenze, monitorare errori dell'app desktop dei clienti e gestire le release.

### 1.1 — Ruolo superadmin nel database

Eseguire nel SQL Editor di Supabase (progetto: tqpcoeahucwvtpkihgqi):

```sql
-- Aggiunge superadmin al tipo enum dei ruoli
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'superadmin';

-- Crea tabella licenze
CREATE TABLE IF NOT EXISTS licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_whatsapp TEXT,
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('inactive', 'active', 'revoked')),
  activated_at TIMESTAMPTZ,
  machine_id TEXT,
  app_version TEXT,
  os_info TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crea tabella error reports (inviati dall'app desktop)
CREATE TABLE IF NOT EXISTS error_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key TEXT REFERENCES licenses(license_key),
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  screen_name TEXT,
  action_performed TEXT,
  app_version TEXT,
  os_info TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crea tabella releases (versioni pubblicate)
CREATE TABLE IF NOT EXISTS app_releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT UNIQUE NOT NULL,
  release_notes TEXT NOT NULL,
  windows_url TEXT,
  mac_url TEXT,
  linux_url TEXT,
  is_current BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assegna ruolo superadmin all'account principale
UPDATE profiles SET role = 'superadmin' WHERE id = (
  SELECT id FROM auth.users WHERE email = 'admindany@gmail.com'
);
```

### 1.2 — Middleware protezione /superadmin

**File da modificare:** `middleware.ts` (root del progetto)

Aggiungere alla logica di routing esistente:

```typescript
// Protezione rotta superadmin
if (pathname.startsWith('/superadmin')) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .maybeSingle()
  
  if (profile?.role !== 'superadmin') {
    return NextResponse.redirect(new URL('/admin/dashboard', req.url))
  }
}

// Redirect superadmin al suo pannello dopo login
if (profile?.role === 'superadmin') {
  return NextResponse.redirect(new URL('/superadmin', req.url))
}
```

### 1.3 — Struttura cartelle superadmin

**Creare la seguente struttura in `app/`:**

```
app/
└── (superadmin)/
    ├── layout.tsx          ← sidebar scura dedicata
    ├── superadmin/
    │   └── page.tsx        ← dashboard overview
    ├── superadmin/licenze/
    │   └── page.tsx        ← gestione licenze
    ├── superadmin/errori/
    │   └── page.tsx        ← error monitoring
    └── superadmin/release/
        └── page.tsx        ← gestione versioni
```

### 1.4 — Layout superadmin

**File da creare:** `app/(superadmin)/layout.tsx`

Layout con sidebar scura dedicata. Voci sidebar:
- Dashboard (icona: `LayoutDashboard`)
- Licenze (icona: `Key`)
- Errori (icona: `AlertTriangle`)
- Release (icona: `Package`)
- Logout (icona: `LogOut`)

Stile sidebar identico all'admin: bg `#1A1714`, testo `#C8C1BA`, voce attiva `#E8621A`.
In alto nella sidebar: logo "Solfège" + badge "Super Admin" in arancio.

### 1.5 — Dashboard superadmin

**File da creare:** `app/(superadmin)/superadmin/page.tsx`

KPI cards in cima:
- Licenze totali generate
- Licenze attive
- Errori non risolti (badge rosso se > 0)
- Versione app corrente

Sotto: tabella ultimi 5 errori + tabella ultime 5 attivazioni licenza.

### 1.6 — Pagina Licenze

**File da creare:** `app/(superadmin)/superadmin/licenze/page.tsx`

**Funzionalità:**

**Generatore licenze** (dialog/sheet laterale):
- Campo: Nome cliente
- Campo: Email cliente
- Campo: WhatsApp cliente (opzionale)
- Campo: Note (opzionale)
- Pulsante "Genera Licenza" → chiama API che genera la key
- La key generata viene mostrata in grande con pulsante copia

**Formato license key:** `SOLFEGE-XXXX-XXXX-XXXX`
Dove XXXX = 4 caratteri alfanumerici maiuscoli random (es. `SOLFEGE-K3M9-P2QR-7XWT`)

**Tabella licenze** con colonne:
- License Key (monospace, copiabile)
- Cliente (nome + email)
- Stato (badge: verde=attiva, grigio=inattiva, rosso=revocata)
- Attivata il
- Versione app
- OS
- Azioni: Dettaglio / Revoca

**API da creare:** `app/api/superadmin/generate-license/route.ts`

```typescript
// POST — genera nuova licenza
// Body: { customer_name, customer_email, customer_whatsapp?, notes? }
// Genera key formato SOLFEGE-XXXX-XXXX-XXXX
// Salva in tabella licenses con status 'inactive'
// Risponde con { license_key }
// Protetto: solo superadmin può chiamarlo (verifica sessione)

function generateLicenseKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no ambigui: 0/O, 1/I
  const segment = () => Array.from({length: 4}, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `SOLFEGE-${segment()}-${segment()}-${segment()}`
}
```

### 1.7 — Pagina Errori

**File da creare:** `app/(superadmin)/superadmin/errori/page.tsx`

Tabella con colonne:
- Data/ora
- Licenza (key abbreviata)
- Schermata (es. "Calendario")
- Azione (es. "Creazione lezione")
- Errore (messaggio breve, espandibile)
- Versione + OS
- Stato (badge: rosso=aperto, verde=risolto)
- Azioni: "Segna risolto" + note risoluzione

Filtri in cima: Tutti / Solo aperti / Solo risolti

**API da creare:** `app/api/error-report/route.ts`

```typescript
// POST — riceve errori dall'app desktop (NO autenticazione richiesta)
// Body: { license_key, error_type, error_message, error_stack?, screen_name?, action_performed?, app_version, os_info }
// Verifica che license_key esista in tabella licenses
// Salva in error_reports
// Risponde 200 OK sempre (non bloccare l'app desktop per errori di logging)
```

### 1.8 — Pagina Release

**File da creare:** `app/(superadmin)/superadmin/release/page.tsx`

Form per pubblicare nuova release:
- Versione (es. `1.0.0`)
- Note di rilascio (textarea — markdown supportato)
- URL download Windows (.exe)
- URL download Mac (.dmg)
- URL download Linux (.AppImage)
- Checkbox "Imposta come versione corrente"
- Pulsante "Pubblica Release"

Tabella storico release sotto.

**API da creare:** `app/api/latest-version/route.ts`

```typescript
// GET — pubblica endpoint (NO autenticazione)
// Usato dall'app desktop per controllare aggiornamenti
// Risponde con:
{
  "version": "1.0.1",
  "release_notes": "- Fixato il tasto calendario\n- Migliorata la stampa",
  "windows_url": "https://github.com/CosmoNetinfo/Solfege/releases/download/v1.0.1/Solfege_1.0.1_x64.exe",
  "mac_url": "https://github.com/CosmoNetinfo/Solfege/releases/download/v1.0.1/Solfege_1.0.1.dmg",
  "linux_url": "https://github.com/CosmoNetinfo/Solfege/releases/download/v1.0.1/Solfege_1.0.1.AppImage"
}
```

**API da creare:** `app/api/superadmin/publish-release/route.ts`

```typescript
// POST — pubblica nuova release (solo superadmin)
// Body: { version, release_notes, windows_url, mac_url, linux_url, is_current }
// Se is_current=true → aggiorna tutte le altre release a is_current=false
// Salva in app_releases
```

**API da creare:** `app/api/activate-license/route.ts`

```typescript
// POST — attivazione licenza dall'app desktop
// Body: { license_key, machine_id, app_version, os_info }
// Verifica che license_key esista e non sia revocata
// Se status='inactive' → aggiorna a 'active', salva machine_id, app_version, os_info, activated_at
// Se status='active' e machine_id corrisponde → OK (re-attivazione stessa macchina)
// Se status='active' e machine_id diverso → errore 403 "Licenza già attiva su un altro dispositivo"
// Se status='revoked' → errore 403 "Licenza revocata"
// Risponde con { success: true, customer_name, release_notes_latest }
```

---

## PARTE 2 — PULIZIA WEB APP

### Obiettivo
Rimuovere dalla web app tutto ciò che non ha senso nel contesto desktop: portal genitori/allievi, iscrizioni online pubbliche, pagina abbonamento SaaS. La web app diventa solo demo/dev + super admin.

### 2.1 — Pagine da eliminare completamente

Eliminare le seguenti cartelle e tutti i file contenuti:

```
app/(portal)/                    ← ELIMINA TUTTO
app/(public)/[schoolSlug]/       ← ELIMINA TUTTO
app/(teacher)/                   ← ELIMINA TUTTO
```

### 2.2 — Voci sidebar admin da rimuovere

**File da modificare:** `app/(admin)/layout.tsx`

Rimuovere dalla sidebar admin queste voci di navigazione:
- Link al portal genitori
- Link alle iscrizioni online
- Qualsiasi riferimento a abbonamenti/piani

### 2.3 — Pagina impostazioni — Tab da modificare

**File da modificare:** `app/(admin)/impostazioni/page.tsx`

- Rimuovere il tab "Abbonamento" (non ha più senso con modello one-time)
- Rimuovere il tab con link iscrizioni online
- Mantenere: Scuola, Anno Accademico, Strumenti, Aule, Utenti

### 2.4 — Middleware cleanup

**File da modificare:** `middleware.ts`

Rimuovere i redirect per i ruoli:
- `insegnante` → `/teacher/home`
- `genitore` → `/portal/home`
- `allievo` → `/portal/home`

Mantenere solo:
- `admin` → `/admin/dashboard`
- `segreteria` → `/admin/dashboard`
- `superadmin` → `/superadmin`

### 2.5 — API da rimuovere

Eliminare i file:
- `app/api/whatsapp/route.ts` (non più necessario nella web app — rimane nel desktop)

Mantenere:
- `app/api/auth/callback/route.ts`
- `app/api/send-email/route.ts`
- Tutte le nuove API create nella Parte 1

---

## PARTE 3 — INTEGRAZIONE TAURI V2

### Obiettivo
Aggiungere Tauri v2 al repository Next.js esistente per creare l'app desktop. Il frontend Next.js viene usato come webview di Tauri. Il database Supabase viene sostituito da SQLite locale.

### 3.1 — Installazione Tauri v2

Eseguire nella root del progetto:

```bash
npm install --save-dev @tauri-apps/cli@next
npm install @tauri-apps/api@next
npm install @tauri-apps/plugin-sql
npm install @tauri-apps/plugin-updater
npm install @tauri-apps/plugin-fs
npm install @tauri-apps/plugin-shell
npm install @tauri-apps/plugin-notification
```

Inizializzare Tauri:
```bash
npx tauri init
```

Configurazione durante init:
- App name: `Solfège`
- Window title: `Solfège — Gestionale Scuola di Musica`
- Web assets location: `out` (Next.js export)
- Dev server URL: `http://localhost:3000`
- Dev command: `npm run dev`
- Build command: `npm run build && npm run export`

### 3.2 — Configurazione Next.js per Tauri

**File da modificare:** `next.config.ts`

```typescript
const nextConfig = {
  output: 'export',           // ← AGGIUNGERE: static export per Tauri
  images: {
    unoptimized: true,        // ← AGGIUNGERE: richiesto per static export
  },
  // ... resto della config esistente
}
```

**File da modificare:** `package.json`

Aggiungere script:
```json
{
  "scripts": {
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build",
    "export": "next export"
  }
}
```

### 3.3 — Configurazione tauri.conf.json

**File:** `src-tauri/tauri.conf.json`

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
        "fullscreen": false
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
    ]
  },
  "plugins": {
    "updater": {
      "pubkey": "",
      "endpoints": [
        "https://solfege-five.vercel.app/api/latest-version"
      ]
    },
    "sql": {
      "preloadConnections": ["sqlite:solfege.db"]
    }
  }
}
```

### 3.4 — Schema SQLite

**File da creare:** `src-tauri/src/database.rs`

Schema SQLite equivalente al PostgreSQL Supabase, adattato per single-tenant (una scuola per installazione):

```sql
-- Eseguito automaticamente al primo avvio (migrazione v1)

CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
-- Valori iniziali: version, school_id, trial_started_at, license_key, license_status

CREATE TABLE IF NOT EXISTS schools (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  nome TEXT NOT NULL,
  indirizzo TEXT,
  citta TEXT,
  cap TEXT,
  telefono TEXT,
  email TEXT,
  sito_web TEXT,
  logo_url TEXT,
  anno_accademico_corrente TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'segreteria')),
  nome TEXT NOT NULL,
  cognome TEXT NOT NULL,
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
  capacita INTEGER,
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
  note TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS disponibilita_insegnanti (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  teacher_id TEXT REFERENCES teachers(id) ON DELETE CASCADE,
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
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
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
  tipo TEXT CHECK (tipo IN ('individuale', 'collettivo', 'ensemble')),
  livello TEXT CHECK (livello IN ('principiante', 'intermedio', 'avanzato')),
  durata_minuti INTEGER DEFAULT 60,
  max_allievi INTEGER DEFAULT 1,
  colore_calendario TEXT DEFAULT '#E8621A',
  price_model TEXT DEFAULT 'mensile',
  prezzo REAL,
  giorno_settimana INTEGER,
  ora_inizio TEXT,
  anno_accademico TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS enrollments (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
  data_iscrizione TEXT DEFAULT (date('now')),
  stato TEXT DEFAULT 'attivo' CHECK (stato IN ('attivo', 'sospeso', 'ritirato')),
  UNIQUE(student_id, course_id)
);

CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
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
  lesson_id TEXT REFERENCES lessons(id) ON DELETE CASCADE,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  stato TEXT DEFAULT 'presente' CHECK (stato IN ('presente', 'assente', 'recuperato', 'festivo')),
  note TEXT,
  UNIQUE(lesson_id, student_id)
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  course_id TEXT REFERENCES courses(id),
  importo REAL NOT NULL,
  data_pagamento TEXT,
  data_scadenza TEXT NOT NULL,
  metodo TEXT CHECK (metodo IN ('contanti', 'bonifico', 'pos', 'altro')),
  stato TEXT DEFAULT 'in_attesa' CHECK (stato IN ('in_attesa', 'pagato', 'scaduto', 'annullato')),
  numero_ricevuta TEXT,
  note TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS teacher_compensations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  teacher_id TEXT REFERENCES teachers(id) ON DELETE CASCADE,
  mese TEXT NOT NULL,
  anno INTEGER NOT NULL,
  ore_totali REAL DEFAULT 0,
  tariffa_oraria REAL,
  importo_totale REAL,
  stato TEXT DEFAULT 'da_pagare' CHECK (stato IN ('da_pagare', 'pagato')),
  note TEXT,
  UNIQUE(teacher_id, mese, anno)
);
```

### 3.5 — Comandi Tauri (Rust backend)

**File da modificare:** `src-tauri/src/main.rs`

Esporre i seguenti comandi Tauri che il frontend può chiamare:

```rust
// Comandi da registrare con tauri::generate_handler![]

// Database
db_query(sql: String, params: Vec<Value>) -> Result<Vec<Map>, String>
db_execute(sql: String, params: Vec<Value>) -> Result<u64, String>

// App config
get_config(key: String) -> Result<Option<String>, String>
set_config(key: String, value: String) -> Result<(), String>

// License
check_trial_status() -> Result<TrialStatus, String>
// TrialStatus: { is_trial: bool, days_remaining: i32, is_expired: bool, license_key: Option<String> }

activate_license(license_key: String) -> Result<bool, String>
// Chiama POST https://solfege-five.vercel.app/api/activate-license
// Salva license_key e status in app_config se successo

// Error reporting
report_error(error_type: String, message: String, stack: Option<String>, screen: Option<String>, action: Option<String>) -> Result<(), String>
// Chiama POST https://solfege-five.vercel.app/api/error-report in background

// Auth locale
login(username: String, password: String) -> Result<LocalUser, String>
// Verifica bcrypt hash, risponde con user info
// Salva sessione in stato Tauri (in-memory)

logout() -> Result<(), String>

create_first_user(username: String, password: String, nome: String, cognome: String) -> Result<(), String>
// Usato nel wizard primo avvio
// Crea utente admin iniziale con bcrypt hash
```

### 3.6 — Wizard primo avvio

**File da creare:** `app/setup/page.tsx`

Pagina mostrata SOLO se `app_config` non contiene `setup_completed = true`.

**Step 1 — Benvenuto:**
- Logo Solfège grande
- Titolo: "Benvenuto in Solfège"
- Testo: "Configuriamo la tua scuola di musica in pochi passaggi"
- Pulsante "Inizia"

**Step 2 — Attiva licenza:**
- Campo license key (formato `SOLFEGE-XXXX-XXXX-XXXX`)
- Pulsante "Attiva" → chiama comando Tauri `activate_license`
- Se successo → step 3
- Se errore → messaggio rosso con motivo

**Step 3 — Crea account admin:**
- Campo Nome
- Campo Cognome
- Campo Username
- Campo Password (con conferma)
- Pulsante "Crea account"

**Step 4 — Dati scuola:**
- Campo Nome scuola
- Campo Indirizzo
- Campo Città
- Campo Telefono
- Campo Email scuola
- Pulsante "Salva e inizia"
- → Salva in tabella `schools`, setta `setup_completed = true` in `app_config`
- → Redirect a `/admin/dashboard`

### 3.7 — Sistema Trial

**Logica trial:**
- Al primo avvio (senza licenza) → setta `trial_started_at` in `app_config`
- Trial dura 15 giorni
- Dal giorno 11 → banner giallo in cima a ogni pagina admin:
  `"Trial: X giorni rimanenti. Attiva la tua licenza per continuare."`
- Al giorno 15 → blocco totale, redirect a `/setup` step 2 (solo attivazione licenza)

**File da creare:** `components/TrialBanner.tsx`

Banner condizionale da inserire nel layout admin:
```typescript
// Controlla trial status via comando Tauri check_trial_status()
// Se days_remaining <= 5 → banner rosso
// Se days_remaining <= 10 → banner arancio
// Se > 10 → nessun banner
// Banner: icona AlertTriangle + testo + pulsante "Attiva licenza"
```

### 3.8 — Auth locale (sostituisce Supabase Auth)

**File da creare:** `lib/local-auth.ts`

```typescript
// Sostituisce completamente @supabase/auth-helpers
// Usa comandi Tauri per login/logout/check sessione
// Sessione tenuta in memoria durante la sessione Tauri (si resetta alla chiusura app)
// Al riavvio app → redirect a /login se no sessione

export async function localLogin(username: string, password: string): Promise<LocalUser>
export async function localLogout(): Promise<void>
export async function getCurrentUser(): Promise<LocalUser | null>
```

**File da modificare:** `app/(admin)/layout.tsx`

Sostituire il check sessione Supabase con `getCurrentUser()` da `local-auth.ts`.

---

## PARTE 4 — SISTEMA AUTO-UPDATE

### 4.1 — Controllo aggiornamenti all'avvio

**File da creare:** `components/UpdateChecker.tsx`

Componente da montare nel layout admin principale:

```typescript
'use client'
import { useEffect, useState } from 'react'
import { check } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'

// All'avvio: chiama check() di tauri-plugin-updater
// Se c'è aggiornamento → mostra dialog:
//   Titolo: "Aggiornamento disponibile — Solfège vX.X.X"
//   Corpo: note di rilascio (dalla release GitHub)
//   Pulsanti: "Aggiorna ora" | "Più tardi"
// "Aggiorna ora" → download + install + relaunch automatico
// Mostrare progress bar durante download
```

### 4.2 — Error boundary globale con reporting automatico

**File da creare:** `components/ErrorBoundary.tsx`

```typescript
// React Error Boundary che cattura tutti gli errori non gestiti
// Quando cattura errore:
//   1. Chiama comando Tauri report_error() con dettagli
//   2. Mostra pagina di errore user-friendly (non il crash brutale)
//   3. Pulsante "Riprova" che ricarica il componente
//   4. Pulsante "Torna alla Dashboard"
// Wrappare tutta l'app in questo boundary
```

---

## PARTE 5 — GITHUB ACTIONS CI/CD

### 5.1 — Workflow build automatico

**File da creare:** `.github/workflows/tauri-release.yml`

```yaml
name: Tauri Release

on:
  push:
    tags:
      - 'v*'  # Trigger su push di tag tipo v1.0.0, v1.0.1, ecc.

jobs:
  create-release:
    runs-on: ubuntu-latest
    outputs:
      release_id: ${{ steps.create-release.outputs.result }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Create Release
        id: create-release
        uses: actions/github-script@v7
        with:
          script: |
            const { data } = await github.rest.repos.createRelease({
              owner: context.repo.owner,
              repo: context.repo.repo,
              tag_name: context.ref.replace('refs/tags/', ''),
              name: `Solfège ${context.ref.replace('refs/tags/', '')}`,
              draft: true,
              prerelease: false
            })
            return data.id

  build-tauri:
    needs: create-release
    strategy:
      matrix:
        include:
          - os: windows-latest
            target: x86_64-pc-windows-msvc
          - os: macos-latest
            target: x86_64-apple-darwin
          - os: macos-latest
            target: aarch64-apple-darwin  # Apple Silicon
          - os: ubuntu-22.04
            target: x86_64-unknown-linux-gnu

    runs-on: ${{ matrix.os }}

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable
        with:
          targets: ${{ matrix.target }}

      - name: Install Linux dependencies
        if: matrix.os == 'ubuntu-22.04'
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf

      - name: Install frontend dependencies
        run: npm ci

      - name: Build Tauri app
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
          TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}
        with:
          releaseId: ${{ needs.create-release.outputs.release_id }}
          target: ${{ matrix.target }}

  publish-release:
    needs: [create-release, build-tauri]
    runs-on: ubuntu-latest
    steps:
      - name: Publish Release
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.repos.updateRelease({
              owner: context.repo.owner,
              repo: context.repo.repo,
              release_id: ${{ needs.create-release.outputs.release_id }},
              draft: false
            })
```

### 5.2 — Come pubblicare una nuova versione

Il developer (Daniele) esegue:

```bash
# 1. Aggiorna versione in src-tauri/tauri.conf.json
#    "version": "1.0.1"

# 2. Commit + push
git add .
git commit -m "chore: bump version to 1.0.1"
git push

# 3. Crea tag e pusha
git tag v1.0.1
git push origin v1.0.1

# → GitHub Actions si attiva automaticamente
# → Compila per Windows, Mac (Intel + Apple Silicon), Linux
# → Pubblica release con tutti i file
# → L'app desktop dei clienti riceve notifica aggiornamento
```

### 5.3 — Secrets GitHub da configurare

Nella pagina Settings → Secrets → Actions del repository aggiungere:

```
TAURI_SIGNING_PRIVATE_KEY      ← chiave privata per firma app (genera con tauri signer)
TAURI_SIGNING_PRIVATE_KEY_PASSWORD  ← password della chiave
```

Per generare la chiave di firma:
```bash
npx tauri signer generate -w ~/.tauri/solfege.key
```

---

## PARTE 6 — ADATTAMENTO FRONTEND PER DESKTOP

### 6.1 — Sostituzione chiamate Supabase

In tutta l'app, le chiamate tipo:
```typescript
const supabase = createClient()
const { data } = await supabase.from('students').select('*')
```

Devono essere sostituite con:
```typescript
import Database from '@tauri-apps/plugin-sql'

const db = await Database.load('sqlite:solfege.db')
const students = await db.select('SELECT * FROM students ORDER BY cognome, nome')
```

**Creare un layer di astrazione:** `lib/db.ts`

```typescript
// Wrapper che espone le stesse funzioni dell'app web
// ma usa SQLite via Tauri internamente

export const db = {
  students: {
    getAll: () => db.select('SELECT * FROM students ORDER BY cognome, nome'),
    getById: (id: string) => db.select('SELECT * FROM students WHERE id = ?', [id]),
    create: (data: StudentInsert) => db.execute('INSERT INTO students ...', [...]),
    update: (id: string, data: Partial<Student>) => db.execute('UPDATE students ...', [...]),
    delete: (id: string) => db.execute('DELETE FROM students WHERE id = ?', [id]),
  },
  // ... stesso pattern per tutte le entità
}
```

### 6.2 — Rimozione dipendenze Supabase

**File da modificare:** `package.json`

Rimuovere:
```json
"@supabase/supabase-js": "...",
"@supabase/auth-helpers-nextjs": "...",
"@supabase/ssr": "..."
```

Eliminare i file:
```
lib/supabase/
utils/supabase/
middleware riferimenti Supabase Auth
```

### 6.3 — Variabili ambiente

Le variabili `NEXT_PUBLIC_SUPABASE_*` non sono più necessarie nel desktop.
Rimangono solo sulla web app (Vercel) per il pannello superadmin.

---

## CHECKLIST FINALE — Verifica completamento

Prima di considerare ogni parte completata, verificare:

### Parte 1 — Super Admin Panel
- [ ] SQL eseguito su Supabase senza errori
- [ ] Account `admindany@gmail.com` ha ruolo `superadmin`
- [ ] `/superadmin` non accessibile da altri account
- [ ] Generatore licenze crea key nel formato `SOLFEGE-XXXX-XXXX-XXXX`
- [ ] API `/api/latest-version` risponde con JSON corretto (testare con curl)
- [ ] API `/api/error-report` accetta POST senza auth
- [ ] API `/api/activate-license` verifica e attiva correttamente
- [ ] `npm run build` passa senza errori TypeScript

### Parte 2 — Pulizia web app
- [ ] Cartelle `(portal)`, `(public)`, `(teacher)` eliminate
- [ ] Sidebar admin non ha più voci portal/iscrizioni/abbonamento
- [ ] Middleware gestisce solo admin/segreteria/superadmin
- [ ] `npm run build` passa senza errori

### Parte 3 — Tauri v2
- [ ] `npx tauri dev` avvia l'app in finestra desktop
- [ ] SQLite si crea in AppData/Application Support
- [ ] Schema crea tutte le tabelle al primo avvio
- [ ] Wizard primo avvio funziona (tutti e 4 gli step)
- [ ] Login locale funziona
- [ ] Trial countdown corretto
- [ ] Banner trial appare dal giorno 11

### Parte 4 — Auto-update
- [ ] UpdateChecker non crasha se offline
- [ ] Dialog aggiornamento appare correttamente
- [ ] ErrorBoundary cattura errori e invia report

### Parte 5 — GitHub Actions
- [ ] Workflow file presente in `.github/workflows/`
- [ ] Secrets configurati nel repo GitHub
- [ ] Test con push di tag `v1.0.0-test`
- [ ] Release pubblicata con `.exe`, `.dmg`, `.AppImage`

### Parte 6 — Frontend desktop
- [ ] Zero import da `@supabase/*` nel codice desktop
- [ ] Tutte le pagine admin caricano dati da SQLite
- [ ] CRUD allievi funziona completo
- [ ] CRUD insegnanti funziona completo
- [ ] Calendario carica lezioni da SQLite
- [ ] Pagamenti funzionano con numero ricevuta progressivo
- [ ] PDF ricevute genera correttamente

---

## NOTE IMPORTANTI PER ANTIGRAVITY

1. **Non toccare la logica Supabase nella web app** per le tabelle `licenses`, `error_reports`, `app_releases` — quelle rimangono su Supabase per il super admin panel.

2. **Il desktop NON si connette mai a Supabase** — solo al server Vercel per: attivare licenza, controllare aggiornamenti, inviare error report.

3. **Mantenere il design system**: sidebar sempre `#1A1714`, arancio `#E8621A`, zero emoji, solo lucide-react.

4. **TypeScript strict**: nessun `any`, tutti i tipi definiti.

5. **Iniziare dalla Parte 1** (super admin panel) che è indipendente e deployabile subito su Vercel, poi procedere con le parti successive in ordine.

6. **Deploy Parte 1**: dopo aver completato la Parte 1, fare `git add . && git commit -m "feat: superadmin panel + license system" && git push` per deployare su Vercel.

---

*Brief generato per Solfège v2.0 Desktop*
*Daniele Spalletti — CosmoNet.info — Giugno 2026*
