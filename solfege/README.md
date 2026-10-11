# Solfège — Sistema Gestionale per Scuole di Musica (v1.8)

Solfège è la piattaforma definitiva per la gestione completa delle scuole di musica, disponibile sia come SaaS Web (Next.js + Supabase) sia come applicativo desktop offline-first (Tauri + SQLite). Dalla pianificazione delle lezioni alla fatturazione, Solfège automatizza i flussi di lavoro di segreteria, docenti e allievi in un'unica interfaccia moderna ed elegante.

## ✨ Novità Versione 1.8 — Calendario Didattico & Gestione Accademica

### 📅 Anno Accademico Configurabile
- Date di inizio e fine anno accademico personalizzabili per scuola (default: metà settembre – metà giugno).
- Gestione da Impostazioni Scuola (sia su SQLite desktop che Supabase web).
- Generazione ricorrente delle lezioni estesa all'intero anno accademico (anziché 12 settimane fisse).

### 🏖️ Festività Nazionali e Chiusure Scuola
- Precaricamento automatico di 11 festività nazionali italiane (incluso il calcolo dinamico del Lunedì dell'Angelo / Pasquetta).
- Scheda dedicata in Impostazioni per inserire chiusure personalizzate (vacanze di Natale, Pasqua, ponti) e patrono locale.
- La generazione ricorrente delle lezioni salta automaticamente festività e chiusure.
- Rilevamento lezioni impattate all'inserimento di nuove chiusure e avviso opzionale per l'operatore.
- Visualizzazione distintiva nel calendario (`⛔ Nome Chiusura`) con colore rosso dedicato.

### 👥 Lezioni Condivise nei Corsi Collettivi
- Singola istanza di lezione per ogni data del corso collettivo/ensemble con più allievi collegati tramite registro presenze (`attendances` / `attendance`).
- Aggancio automatico dei nuovi iscritti alle lezioni condivise future già generate.
- Registro presenze nel drawer lezione con marcatura individuale (presente, assente, ritardo, giustificato).

### ⚠️ Controllo Sovrapposizioni nella Didattica
- Controllo in tempo reale dei conflitti su Docente, Aula e Allievo (lezioni individuali) e sale prova.
- Avviso dettagliato in fase di iscrizione e spostamento lezione con opzione "Genera solo date libere" o override esplicito dell'amministratore ("Salva comunque").
- Servizio unificato `lib/services/conflict-service.ts` condiviso tra didattica e sale prove.

### 🔄 Spostamento Lezioni & Crediti di Recupero
- Flusso guidato "Sposta Lezione" nel drawer con verifica disponibilità di aula e docente.
- Storico della data e orario originale conservato sui record (`original_date`, `original_ora_inizio`, `original_ora_fine`, `is_spostata`).
- Maturazione automatica dei crediti di recupero quando un'assenza è segnata come giustificata.
- Registro crediti per allievo e associazione guidata a una lezione di recupero.

---

## ✨ Funzionalità Precedenti (v1.5)

### 🎓 Portale Allievi & Genitori
- **Dashboard Personale**: Visualizzazione immediata delle prossime lezioni e situazione pagamenti.
- **Registro Didattico**: Consultazione degli argomenti trattati e dei compiti assegnati.
- **Branding Personalizzato**: Interfaccia dinamica che riflette l'identità visiva della scuola.

### 📝 Registro Argomenti Lezione
- **Workflow Didattico**: I docenti possono registrare argomenti e compiti con un solo click tramite il tasto "Segna come Svolta".
- **Note Interne**: Area riservata per annotazioni docenti non visibili agli allievi.

### 📩 Automazione & Marketing
- **Iscrizioni Online**: Pagina pubblica `/[school-slug]/iscriviti` per la generazione automatica di lead.
- **Email di Benvenuto**: Invio automatico al primo inserimento in anagrafica.
- **Solleciti Multi-Canale**: Invio di promemoria pagamenti via WhatsApp ed Email in un click.

---

## 🛠 Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS.
- **Desktop**: Tauri v2, SQLite (`@tauri-apps/plugin-sql`).
- **Backend/Database Cloud**: Supabase (PostgreSQL, Auth, Storage, RLS).
- **Comunicazioni**: Nodemailer (SMTP), WhatsApp Business API (URL scheme).
- **Design**: Radix UI, Lucide React, Sonner (Toasts).

---

## 🚀 Getting Started

1. **Installazione**:
   ```bash
   npm install
   ```

2. **Variabili d'Ambiente**:
   Crea un file `.env.local` con:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   GMAIL_USER=...
   GMAIL_APP_PASSWORD=...
   ```

3. **Sviluppo Locale**:
   ```bash
   npm run dev
   ```

4. **Test Didattici**:
   ```bash
   npx tsx scripts/test-didactic-calendar.ts
   ```

---

## 📄 Documentazione Interna
- [Analisi Solfège Scuola di Musica](../ANALISI_SOLFEGE_SCUOLA_MUSICA.md)
- [Walkthrough Stabilizzazione](./walkthrough.md)
- [Audit Produzione](./SOLFEGE_DEBUG_AUDIT.md)

---

Developed with ❤️ by the Solfège Team.

