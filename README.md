# Solfège — Gestionale per Scuole di Musica

**Solfège** è un gestionale SaaS + desktop ibrido per scuole di musica. Disponibile come **app web** (Vercel/Supabase) e come **applicazione desktop nativa Windows** (Tauri + SQLite), con database offline-first e sincronizzazione opzionale.

---

## ✨ Funzionalità

### 🏫 Area Admin
- **Studenti** — Anagrafica completa, stato (minorenne/adulto), storico iscrizioni
- **Insegnanti** — Profili, disponibilità settimanale, calcolo compensi automatico
- **Corsi & Iscrizioni** — Codifica a colori, gestione iscrizioni sulla disponibilità reale
- **Calendario Lezioni** — Viste giornaliera/settimanale/mensile (`react-big-calendar`)
- **Sale & Prove** — Timeline visuale delle sale, prenotazioni con rilevamento conflitti in tempo reale
- **Finanze** — Morosità, incassi, generazione ricevute PDF professionali
- **Compensi Docenti** — Calcolo automatico da presenze effettive, distinzione individuale/collettivo
- **Statistiche** — Grafici andamento iscrizioni, presenze, ricavi (Recharts)

### 📱 Portale Docenti (Mobile-First)
- Dashboard giornaliera con le proprie lezioni
- Registro presenze rapido (Presente / Assente / Recupero) con note
- Anagrafica allievi con contatti rapidi (chiamata + WhatsApp)
- Riepilogo compensi maturati in tempo reale

### 🖥️ App Desktop (Windows)
- Installer `.msi` / `.exe` generato con **Tauri v2**
- Database **SQLite locale** offline-first — funziona senza internet
- Wizard di primo avvio: inserimento license key → creazione account admin → dati scuola
- Login locale con credenziali cifrate (bcrypt)
- Auto-updater integrato (check versione all'avvio)
- Segnalazione errori automatica all'endpoint cloud

### 🔐 Super Admin Panel
- Generazione e revoca licenze desktop (formato `SOLFEGE-XXXX-XXXX-XXXX`)
- Monitoraggio attivazioni (machine ID, OS, versione app)
- Lettura segnalazioni di errore
- Pubblicazione nuove release

---

## 🛠️ Stack Tecnologico

| Layer | Web | Desktop |
|-------|-----|---------|
| Frontend | Next.js 16 (App Router) | Next.js → static export |
| UI | Tailwind CSS + Shadcn UI | identico |
| Database | Supabase (PostgreSQL + RLS) | SQLite (tauri-plugin-sql) |
| Auth | Supabase Auth | locale (bcrypt) |
| Runtime | Vercel | Tauri v2 (Rust + WebView2) |
| PDF | @react-pdf/renderer | identico |

**Linguaggi**: TypeScript · Rust · SQL

---

## 🎨 Design System

- **Arancio Solfège** `#E8621A` — accento principale
- **Pietra** `#FAFAF9` — sfondi chiari  
- **Ebano** `#1A1714` — testi e superfici scure
- **Tipografia**: Cormorant Garamond (titoli) · DM Sans (testo) · JetBrains Mono (codici)

---

## 📦 Setup Web

```bash
git clone https://github.com/CosmoNetinfo/Solfege.git
cd Solfege/solfege
npm install
```

Crea `solfege/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

```bash
npm run dev       # sviluppo web
```

## 🖥️ Build Desktop

Prerequisiti: [Rust](https://rustup.rs/) + Visual Studio C++ Build Tools (Windows)

```bash
npm run tauri:build
```

Output in `src-tauri/target/release/bundle/`:
- `msi/Solfège_x.x.x_x64_en-US.msi` — installer Windows
- `nsis/Solfège_x.x.x_x64-setup.exe` — installer NSIS

```bash
npm run tauri:dev  # sviluppo desktop con hot-reload
```

---

## 📂 Struttura

```
Solfege/
├── solfege/                  # App Next.js
│   ├── app/
│   │   ├── (superadmin)/     # Pannello superadmin (web only)
│   │   ├── admin/            # Area gestionale
│   │   ├── setup/            # Wizard primo avvio desktop
│   │   └── login-desktop/    # Login offline desktop
│   ├── api_temp/             # API routes (spostate durante build Tauri)
│   ├── superadmin_temp/      # Pagine superadmin (spostate durante build Tauri)
│   ├── lib/
│   │   ├── desktop-db.ts     # Interfaccia SQLite (Tauri)
│   │   └── supabase/         # Client Supabase (web)
│   ├── scripts/
│   │   └── build-tauri.js    # Build orchestrator per static export
│   └── src-tauri/            # Codice Rust + config Tauri
│       ├── src/              # Comandi Rust (license, auth, updates…)
│       └── migrations/       # Schema SQLite
└── supabase/
    └── migrations/           # Migration PostgreSQL
```

---

## 🔑 Note per Sviluppatori

- **Build Tauri**: lo script `build-tauri.js` sposta temporaneamente `app/(superadmin)` e `app/api` fuori dalla cartella `app/` per evitare errori di esportazione statica (le Server Actions non sono compatibili con `output: 'export'`). Il cleanup avviene automaticamente al termine — se la build viene interrotta, il prossimo avvio dello script ripristina tutto.
- **RLS Supabase**: ogni tabella usa `auth.uid()` + join su `profiles.role`. Il superadmin usa la policy `superadmin_all_*`. Le API desktop che non richiedono auth usano il `service_role_key` server-side.
- **isDesktop()**: helper che restituisce `true` quando l'app gira in Tauri. Usato in tutti i componenti per switchare tra query Supabase e query SQLite.

---

Sviluppato da **CosmoNetinfo** · [cosmonet.info](https://cosmonet.info)
