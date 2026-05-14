# Solfège — Sistema Gestionale per Scuole di Musica (v1.5)

Solfège è la piattaforma SaaS definitiva per la gestione completa delle scuole di musica. Dalla pianificazione delle lezioni alla fatturazione, Solfège automatizza i flussi di lavoro di segreteria, docenti e allievi in un'unica interfaccia moderna ed elegante.

## ✨ Novità Versione 1.5

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
- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS.
- **Backend/Database**: Supabase (PostgreSQL, Auth, Storage).
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

---

## 📄 Documentazione Interna
- [Walkthrough Stabilizzazione](./walkthrough.md)
- [Audit Produzione](./SOLFEGE_DEBUG_AUDIT.md)

---

Developed with ❤️ by the Solfège Team.
