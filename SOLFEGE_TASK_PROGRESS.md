# SOLFÈGE — Task Progress Tracker
> Aggiorna questo file dopo ogni step completato. Flagga ogni voce con ✅ quando verificata.
> Ultimo aggiornamento: 13 Maggio 2026

---

## 📊 STATO GENERALE

| Step | Modulo | Stato |
|------|--------|-------|
| 1 | Database Supabase | ✅ Completato |
| 2 | Setup Next.js & Dipendenze | ✅ Completato |
| 3 | Supabase Client & Middleware | ✅ Completato |
| 4 | Autenticazione & Onboarding | ✅ Completato |
| 5 | Layout Admin & Dashboard | ✅ Completato |
| 6 | Modulo Allievi | ✅ Completato |
| 7 | Modulo Insegnanti | ✅ Completato |
| 8 | Modulo Corsi & Iscrizioni | ✅ Completato |
| 9 | Calendario Lezioni | ✅ Completato |
| 10 | Pagamenti & PDF Ricevuta | ✅ Completato |
| 11 | Interfaccia Docente Mobile | ✅ Completato |
| 12 | Statistiche | ✅ Completato |
| 13 | Impostazioni Scuola | ✅ Completato |
| 14 | Compensi Docenti | ✅ Completato |
| 15 | Debug Panel | ✅ Completato |
| 16 | Logo & Branding | ✅ Completato |
| 17 | Polish & Deploy Vercel | ✅ Completato |

---

## ✅ STEP 1 — Database Supabase

### Schema SQL
- [x] 15 tabelle create correttamente
- [x] 8 ENUM types definiti (`user_role`, `tipo_corso`, `livello_corso`, `stato_lezione`, `stato_pagamento`, `metodo_pagamento`, `price_model`, `giorno_settimana`)
- [x] Trigger `updated_at` su 8 tabelle
- [x] Trigger `handle_new_user` per auto-create profile
- [x] Funzione `get_my_school_id()` presente
- [x] Funzione `get_my_role()` presente
- [x] RLS abilitato su tutte le 15 tabelle
- [x] Policy `school_isolation` presente
- [x] Policy `teacher_own_data` presente
- [x] Indici di performance creati (8 indici)
- [x] Esecuzione schema.sql → 0 errori

### Seed Data
- [x] 1 scuola "Accademia Verdi" presente
- [x] 3 insegnanti con specializzazioni e disponibilità
- [x] 3 aule (Mozart, Vivaldi, Rossini)
- [x] 4 strumenti (Pianoforte, Chitarra, Canto, Violino)
- [x] 5 corsi (mix individuale/collettivo)
- [x] 10 allievi (3 minorenni con dati genitori)
- [x] Iscrizioni, lezioni, presenze e pagamenti realistici

---

## ✅ STEP 2 — Setup Next.js & Dipendenze

### Progetto
- [x] Next.js 14+ con App Router + TypeScript
- [x] `npm run dev` avvia senza errori su localhost:3000
- [x] `npm run build` passa senza errori
- [x] `npx tsc --noEmit` → 0 errori TypeScript

### Dipendenze installate
- [x] `@supabase/supabase-js` + `@supabase/ssr`
- [x] `lucide-react`
- [x] `framer-motion`
- [x] `react-hook-form` + `zod@3.23.8` + `@hookform/resolvers@3.9.0`
- [x] `react-big-calendar` + `date-fns` + `@types/react-big-calendar`
- [x] `@tanstack/react-table`
- [x] `recharts`
- [x] `zustand`
- [x] `sonner`
- [x] `@react-pdf/renderer`
- [x] `resend`
- [x] shadcn/ui inizializzato (17 componenti)

---

## ✅ STEP 3 — Supabase Client & Middleware

### File creati
- [x] `lib/supabase/client.ts` (createBrowserClient)
- [x] `lib/supabase/server.ts` (createServerClient + cookies SSR)
- [x] `middleware.ts` nella root

### Middleware
- [x] Non autenticato → redirect `/login`
- [x] Admin/Segreteria → redirect `/admin/dashboard`
- [x] Insegnante → redirect `/teacher/home` (separato)
- [x] Refresh automatico token

---

## ✅ STEP 4 — Autenticazione & Onboarding

### Pagina Login
- [x] Layout split 50/50 (sinistra scura, destra chiara)
- [x] Logo "Solfège" Cormorant Garamond arancio lato sinistro
- [x] Tagline "Il gestionale per la tua scuola di musica"
- [x] Input email con icona `Mail` (lucide-react)
- [x] Input password con icona `Lock` (lucide-react)
- [x] Pulsante "Accedi" arancio full-width
- [x] Validazione Zod funzionante

### Wizard Register (3 step)
- [x] Progress bar con 3 step numerati
- [x] Step 1: Nome, Cognome, Email, Password
- [x] Step 2: Nome scuola (slug auto), Telefono, Email scuola, Indirizzo
- [x] Step 3: Riepilogo + pulsante "Crea il mio account"

---

## ✅ STEP 5 — Layout Admin & Dashboard

### Sidebar
- [x] Bg `#1A1714` (scuro)
- [x] Logo Solfège in cima
- [x] 9 voci navigazione con icone lucide-react SOLO
- [x] Voce attiva: bordo sx arancio 3px + testo arancio + bg arancio/10
- [x] Animazione apertura/chiusura framer-motion

---

## ✅ STEP 6 — Modulo Allievi

### Lista Allievi (`/admin/students`)
- [x] Tabella `@tanstack/react-table`
- [x] Colonne: Nome, Telefono, Età, Stato, Data Iscrizione, Azioni
- [x] Badge "Minore" sui 3 allievi under 18
- [x] Ricerca in real-time per nome/email

---

## ✅ STEP 7 — Modulo Insegnanti

### Lista Insegnanti (`/admin/insegnanti`)
- [x] Card layout (non tabella)
- [x] Avatar con iniziali colorato
- [x] Badge specializzazioni (arancio outlined)
- [x] Disponibilità settimanale visibile in card

---

## ✅ STEP 8 — Modulo Corsi & Iscrizioni

### Lista Corsi (`/admin/corsi`)
- [x] Card grid layout
- [x] Banda colorata in cima con `colore_calendario`
- [x] Nome corso, strumento, tipo/livello badge
- [x] N° iscritti / max studenti
- [x] Prezzo mensile visibile
- [x] Filtri: tipo, livello, strumento
- [x] Pulsante "+ Nuovo Corso" arancio

### Form Nuovo Corso
- [x] Nome, Tipo (individuale/collettivo/online)
- [x] Livello, Strumento, Docente, Aula
- [x] Giorno settimana, Orario inizio, Durata
- [x] Max studenti
- [x] Modello prezzo (mensile/pacchetto/annuale) + importo
- [x] Color picker per `colore_calendario`
- [x] Anno scolastico

### Dettaglio Corso (`/admin/corsi/[id]`)
- [x] Info complete corso
- [x] Lista iscritti con stato pagamento
- [x] `IscrizioneModal` funzionante
  - [x] Autocomplete selezione allievo
  - [x] Insegnanti filtrati per disponibilità giorno/ora
  - [x] Data inizio, sconto, prezzo override
  - [x] INSERT in `enrollments`
  - [x] Generazione lezioni automatica 4 settimane
  - [x] Generazione scadenze pagamento automatica
- [x] Badge lista attesa se corso pieno
- [x] INSERT in `lista_attesa`

---

## ✅ STEP 9 — Calendario Lezioni

### Calendario (`/admin/calendario`)
- [x] `react-big-calendar` integrato
- [x] Vista default: settimana
- [x] Toggle viste: Mese | Settimana | Giorno | Agenda
- [x] Ogni evento colorato con `colore_calendario` del corso
- [x] Tooltip hover con dettagli lezione
- [x] Filtri laterali: insegnante, corso, aula, stato

### Drawer Dettaglio Lezione
- [x] Si apre al click sull'evento
- [x] Dettagli completi visibili
- [x] Dropdown cambio stato (programmata/completata/cancellata/recupero)
- [x] Toggle presenze allievi (3 stati: presente/assente/recupero)
- [x] Note docente modificabili
- [x] "Pianifica Recupero" → crea nuova lezione con FK `lezione_recupero_di`

### Nuova Lezione (Modal)
- [x] Select corso, insegnante, aula
- [x] Data + ora inizio/fine
- [x] Validazione anti-sovrapposizione insegnante
- [x] Validazione anti-sovrapposizione aula

---

## ✅ STEP 10 — Pagamenti & PDF Ricevuta

### Lista Pagamenti (`/admin/pagamenti`)
- [x] Tabella `@tanstack/react-table`
- [x] Colonne: N° Ricevuta, Allievo, Corso, Importo, Scadenza, Pagato il, Metodo, Stato
- [x] KPI: Incassato mese · In attesa · In ritardo
- [x] Badge colorati corretti

### Azioni Pagamento
- [x] "Segna come Pagato": dialog → select metodo + data → aggiorna DB
- [x] Numero ricevuta progressivo generato
- [x] "Scarica Ricevuta PDF" funzionante
- [x] "Condividi" (Web Share API)
- [x] "Invia Sollecito" (placeholder)

### PDF Ricevuta (`lib/pdf/receipt.tsx`)
- [x] Logo scuola in header
- [x] Nome scuola + indirizzo
- [x] Dati allievo + corso + periodo
- [x] Importo + metodo + data pagamento
- [x] Download funzionante nel browser

---

## ✅ STEP 11 — Interfaccia Docente Mobile

### Layout Docente (`app/(teacher)/layout.tsx`)
- [x] Bottom Navigation Bar con 4 voci
- [x] Header con logo Solfège centrato
- [x] Layout corretto su 375px (iPhone SE)

### Home Docente
- [x] "Oggi — [data]" con lezioni del giorno
- [x] Link "Segna presenze →" per ogni lezione
- [x] Mostra SOLO lezioni del docente loggato (RLS)

### Registro Presenze Docente
- [x] Header: nome corso + data
- [x] Lista allievi con toggle a 3 stati
- [x] Pulsante "Salva presenze" arancio in fondo
- [x] Salvataggio in blocco in `attendance`

---

## ✅ STEP 12 — Statistiche

### Dashboard Statistiche (`/admin/statistiche`)
- [x] Filtro globale anno scolastico in cima

### Sezione Finanziaria
- [x] BarChart incassi mensili ultimi 12 mesi
- [x] PieChart distribuzione metodi pagamento
- [x] KPI: Totale anno · Media mensile · Tasso morosità %

### Sezione Allievi
- [x] LineChart nuove iscrizioni per mese
- [x] BarChart allievi per strumento

### Sezione Insegnanti
- [x] Tabella: Docente · Ore · Compenso calcolato

### Export
- [x] Pulsante "Esporta CSV" scaricabile

---

## ✅ STEP 13 — Impostazioni Scuola

### Pagina Impostazioni (`/admin/impostazioni`)
- [x] Tab **Scuola**: nome, logo upload, indirizzo, telefono, email, sito
- [x] Upload logo → Supabase Storage bucket `logos`
- [x] Tab **Anno Accademico**: anno corrente, date inizio/fine
- [x] Tab **Strumenti**: add/remove/rename funzionante
- [x] Tab **Aule**: add/remove, nome + capienza + insonorizzata
- [x] Tab **Utenti**: lista profili con ruolo + invita segreteria

---

## ✅ STEP 14 — Compensi Docenti

### Pagina Compensi (`/admin/compensi`)
- [x] Selettore mese/anno funzionante
- [x] Tabella: Docente · Ore · Totale · Stato
- [x] Badge "Da pagare" amber / "Pagato" verde
- [x] Calcolo ore da `attendance` JOIN `lessons` JOIN `courses`
- [x] "Segna come Pagato" → `teacher_compensations.paid = true`

---

## ✅ STEP 15 — Debug Panel

### Componenti & Attivazione
- [x] `components/debug/DebugPanel.tsx` creato
- [x] Shortcut `Ctrl+Shift+D` funzionante
- [x] Pulsante fisso bottom-right (icona `Bug` arancio)
- [x] Drawer 400px da destra con animazione

### Tab e Funzioni
- [x] Tab Sessione: User ID, Email, Ruolo, School Info
- [x] Tab Log: Lista eventi real-time con badge colorati
- [x] Tab Database: Connessione, Ultima query, Contatori
- [x] Tab Performance: Memoria JS, Caricamento pagina, Route
- [x] Integrazione: Log automatico su tutte le query in `queries.ts`

---

## ✅ STEP 16 — Logo & Branding

- [x] File `solfege-logo.png` creato in `public/`
- [x] Logo in Sidebar admin (40px)
- [x] Logo in pagina Login (120px)
- [x] Logo in pagina Register (80px)
- [x] Logo in Header Docente (32px)
- [x] Sostituito testo "Solfège" con immagine ovunque richiesto

---

## ✅ STEP 17 — Polish & Deploy Vercel

- [x] Loading States (Skeleton loaders)
- [x] Error Handling (app/error.tsx)
- [x] Empty States riutilizzabili
- [x] Responsive check (375px - 1440px)
- [x] `vercel --prod`
- [x] README.md completo

---

## 📝 NOTE & BUG RISOLTI

| Data | Problema | Soluzione |
|------|----------|-----------|
| Step 2 | Incompatibilità zod v4 + @hookform/resolvers | Downgrade a zod@3.23.8 + resolvers@3.9.0 |
| Step 4 | Testo bianco invisibile su sfondo chiaro | Bug globale: `text-white` → `text-foreground` |
| Step 12 | Errore Recharts in dashboard | Avvolto grafico in `ResponsiveContainer` con dimensioni fisse |
| Step 16 | Logo testo non rimosso | Rimosso h1 e sostituito con componente Image |
| Step 14 | Turbopack build failure (@react-pdf) | Isolato componente PDF con `dynamic({ssr: false})` |
| Step 17 | TypeScript error (AcademicYearTab) | Aggiunta colonna `current_academic_year` a schema e tipi |

---
*Solfège v1.0 — Progress Tracker*
