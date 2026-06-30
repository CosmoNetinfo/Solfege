# Solfège — Gestionale per Scuole di Musica

**Solfège** è un'applicazione gestionale premium per l'amministrazione di scuole di musica. Disponibile come **app desktop nativa** (Windows/Mac) con database locale, e come **demo web** per provare l'interfaccia prima dell'acquisto.

🔗 **Demo web:** [solfege-five.vercel.app](https://solfege-five.vercel.app)

---

## 🎯 Modello

| | |
|---|---|
| **Prezzo** | €249 una tantum — licenza e aggiornamenti a vita |
| **Distribuzione** | App desktop nativa (Tauri v2) — Windows `.exe`, Mac `.dmg`, Linux `.AppImage` |
| **Dati** | 100% locali (SQLite) — nessun cloud, nessun abbonamento, funziona offline |
| **Demo** | Web app gratuita e illimitata per provare l'interfaccia (Supabase) |
| **Trial desktop** | 15 giorni completi prima dell'attivazione licenza |

---

## 🚀 Funzionalità

### Amministrazione
- **Gestione Allievi** — anagrafica completa, scheda a 5 tab, gestione minorenni con dati genitore
- **Gestione Insegnanti** — disponibilità settimanale, tariffe orarie, compensi automatici
- **Corsi e Iscrizioni** — codifica a colori, generazione automatica lezioni
- **Calendario Lezioni** — vista giornaliera/settimanale/mensile (`react-big-calendar`)
- **Sale & Prove** — timeline prenotazione sale con controllo conflitti in tempo reale, integrata nel calendario generale
- **Finanze e Pagamenti** — scadenzario, ricevute PDF, solleciti
- **Statistiche** — incassi, presenze, compensi (Recharts)

### Super Admin Panel (riservato)
- **Generatore Licenze** — crea e gestisce le chiavi `SOLFEGE-XXXX-XXXX-XXXX`
- **Error Monitoring** — riceve automaticamente i report di errore sia dalla web app (test) che dalle installazioni desktop dei clienti
- **Release Management** — pubblica nuove versioni con note di rilascio, link download multi-piattaforma

---

## 🛠️ Stack Tecnologico

**Web app (demo):**
- Next.js (App Router, TypeScript)
- Supabase (PostgreSQL, RLS, Auth)
- Tailwind CSS + shadcn/ui
- nodemailer + Gmail SMTP

**App desktop:**
- Tauri v2 (Rust)
- SQLite locale (`tauri-plugin-sql`)
- Stesso frontend Next.js, build statica
- Auto-update via `tauri-plugin-updater`

**Comuni:**
- TypeScript strict
- lucide-react (icone)
- Recharts (grafici)
- @react-pdf/renderer (ricevute PDF)

---

## 🎨 Design System

- **Arancio Solfège** `#E8621A` — accenti, CTA
- **Pietra** `#FAFAF9` — sfondi
- **Ebano** `#1A1714` — sidebar, testi scuri
- **Cormorant Garamond** — titoli
- **DM Sans** — corpo testo
- Icone: esclusivamente `lucide-react`, zero emoji

---

## 📦 Sviluppo

### Web app

```bash
git clone https://github.com/CosmoNetinfo/Solfege.git
cd Solfege/solfege
npm install
```

Crea `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=tua_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tua_anon_key
SUPABASE_SERVICE_ROLE_KEY=tua_service_key
GMAIL_USER=tua_email
GMAIL_APP_PASSWORD=tua_app_password
```

```bash
npm run dev
```

### App desktop

```bash
npm run tauri:dev    # sviluppo
npm run tauri:build  # build di produzione (.exe / .dmg / .AppImage)
```

Le build di produzione vengono compilate automaticamente da GitHub Actions a ogni push di un tag versione (`git tag v1.0.0 && git push origin v1.0.0`).

---

## 📂 Struttura

```
solfege/
├── app/
│   ├── (admin)/          ← gestionale (web + desktop)
│   ├── (superadmin)/     ← pannello licenze/errori/release (solo web)
│   ├── setup/            ← wizard primo avvio (solo desktop)
│   └── api/              ← endpoint licenze, errori, versioni
├── lib/
│   ├── desktop-db.ts     ← layer SQLite per l'app desktop
│   └── is-desktop.ts     ← rilevamento ambiente web/desktop
├── src-tauri/            ← backend Rust, schema SQLite, configurazione Tauri
└── .github/workflows/    ← CI/CD build multi-piattaforma
```

---

## 🔐 Licenze

Le licenze vengono generate manualmente dal Super Admin Panel dopo l'acquisto e inviate al cliente via WhatsApp o email. L'attivazione avviene una sola volta al primo avvio dell'app desktop; da quel momento l'app funziona offline.

Contatti: [wa.me/393517064080](https://wa.me/393517064080) · admindany@gmail.com

---

Sviluppato da **Daniele Spalletti** — [CosmoNet.info](https://www.cosmonet.info)
