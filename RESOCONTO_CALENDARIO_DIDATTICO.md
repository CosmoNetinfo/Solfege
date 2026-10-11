# Resoconto Lavoro: Calendario Didattico e Gestione Accademica (v1.8.0)

**Data**: 11 Ottobre 2026  
**Branch Git**: `feature/calendario-didattico` e `master`  
**Release Tag**: `v1.8.0`  
**Progetto**: Solfège (Next.js + Supabase / Desktop Tauri + SQLite)

---

## 1. Obiettivo dell'Intervento
Adeguare la piattaforma Solfège alle necessità di gestione di una scuola di musica di circa 200 famiglie, risolvendo le criticità emerse nell'analisi iniziale del calendario:
1. Generazione delle lezioni limitata a sole 12 settimane invece che per l'intero anno accademico.
2. Corsi collettivi che duplicavano le lezioni per ogni allievo anziché agganciarli a una lezione comune.
3. Assenza del controllo sovrapposizioni e conflitti per docenti, aule e allievi nella didattica.
4. Assenza di festività e chiusure scolastiche (con generazione automatica anche nei giorni di festa).
5. Assenza di un flusso guidato per lo spostamento delle lezioni e della gestione dei crediti di recupero.

---

## 2. Modifiche allo Schema Dati (Dual Database)
Per preservare la parità funzionale tra Desktop (SQLite) e Cloud (Supabase), le migrazioni sono state applicate in parallelo su entrambi i motori senza cancellare o alterare i dati storici:

- **SQLite**: `solfege/src-tauri/migrations/003_didactic_calendar.sql`
- **Supabase**: `solfege/supabase/migrations/20261011_didactic_calendar.sql` e `supabase/migrations/003_didactic_calendar.sql`

### Nuove Tabelle e Campi:
- **`schools`**:
  - `academic_year_start` (DATE, default: `2026-09-15`)
  - `academic_year_end` (DATE, default: `2027-06-15`)
- **`school_holidays`**:
  - `id`, `school_id`, `nome`, `data_inizio`, `data_fine`, `tipo` (`'festivita' | 'chiusura' | 'patrono'`), `created_at`
- **`lessons`**:
  - `original_date`, `original_ora_inizio`, `original_ora_fine` (tracciamento storico)
  - `is_spostata` (BOOLEAN), `spostata_il` (TIMESTAMP)
- **`recovery_credits`**:
  - `id`, `school_id`, `student_id`, `course_id`, `lesson_id`, `recovery_lesson_id`
  - `stato` (`'disponibile' | 'utilizzato' | 'scaduto' | 'annullato'`)
  - `data_maturazione`, `data_scadenza`, `data_utilizzo`, `motivo`, `note`

---

## 3. Riepilogo Funzionale per Compito

### COMPITO 1 - Anno Accademico Configurabile
- **Interfaccia Admin**: In `Impostazioni -> Anno Accademico` è possibile visualizzare e personalizzare la data di inizio e di fine dell'anno didattico della scuola.
- **Generazione Annuale**: Il servizio `lib/services/enrollment-service.ts` genera ora tutte le date ricorrenti dall'iscrizione/inizio corso fino alla data di fine anno accademico configurata (es. 36 lezioni su base annua rispetto alle precedenti 12 fisse).

### COMPITO 2 - Festività e Chiusure
- **Motore di Calcolo (`lib/holidays.ts`)**:
  - Calcolo algoritmico della Pasqua e del Lunedì dell'Angelo (Pasquetta) per qualsiasi anno solare.
  - Precaricamento automatico delle 11 festività nazionali italiane.
- **Gestione Chiusure (`components/admin/settings/HolidaysTab.tsx`)**:
  - Nuova scheda in Impostazioni per inserire chiusure personalizzate (vacanze di Natale, Pasqua, ponti) e patrono locale.
  - Scansione in tempo reale delle lezioni impattate all'inserimento di un periodo di chiusura, con avviso per la segreteria.
- **Salto Festivi Automatico**: La generazione delle lezioni esclude automaticamente i giorni di chiusura o festa.
- **Calendario Visivo (`app/admin/calendar/page.tsx`)**: Le giornate festive e di chiusura sono visibili come eventi rossi (`⛔ Nome Chiusura`) con colore dedicato `#DC2626` / `#FEE2E2`.

### COMPITO 3 - Lezioni Condivise nei Corsi Collettivi
- **Istanza Singola**: Per corsi di tipo `collettivo` ed `ensemble`, viene creata una sola lezione nel database per data/orario.
- **Registro Presenze Multi-Studente**:
  - Gli allievi sono associati alla lezione tramite `attendances` (SQLite) / `attendance` (Supabase).
  - All'iscrizione successiva di un allievo, questo viene agganciato in automatico a tutte le lezioni future già pianificate per il gruppo.
  - Nel cassetto lezione (`components/admin/lesson-drawer.tsx`) il docente/segreteria visualizza la lista degli allievi e può segnare per ciascuno: *Presente*, *Assente*, *Ritardo*, *Giustificato*.

### COMPITO 4 - Controllo Sovrapposizioni nella Didattica
- **Servizio Conflitti Centralizzato (`lib/services/conflict-service.ts`)**:
  - Verifica overlap orari per Aula, Docente e Allievo (lezioni individuali), includendo sia lezioni didattiche sia prenotazioni sale prova.
- **Controllo in Iscrizione (`components/admin/enrollment-form.tsx`)**:
  - Scansione preliminare delle date generate.
  - Dialog con dettaglio dei conflitti rilevati e duplice scelta: **"Genera Solo Date Libere"** oppure **"Salva Comunque"** (override esplicito dell'amministratore).
- **Retrocompatibilità**: Il componente `ConflictChecker.tsx` per le sale prova è stato esteso riusando il motore comune senza rompere il flusso esistente.

### COMPITO 5 - Spostamento Lezioni e Crediti di Recupero
- **Spostamento Guidato**: Azione *"Sposta Lezione"* nel cassetto lezione con selezione di nuova data, orario, aula e verifica conflitti in tempo reale. Mantiene traccia della data e orario originari.
- **Maturazione Crediti (`lib/services/recovery-service.ts`)**: Quando un'assenza viene segnata come *Giustificato*, matura automaticamente un credito di recupero intestato all'allievo.
- **Associazione Recupero**: Nel drawer della lezione è disponibile la modale per visualizzare i crediti aperti dell'allievo e associarli alla lezione come recupero programmato, aggiornando lo stato del credito a *utilizzato*.

---

## 4. Test e Validazione Tecnica
- **Suite di Test (`scripts/test-didactic-calendar.ts`)**: 27 asserzioni eseguite con esito positivo:
  - Calcolo Pasqua e Lunedì dell'Angelo 2024–2027.
  - Copertura 11 festività nazionali e chiusure custom.
  - Generazione su anno accademico intero (36 lezioni generate, 3 saltate per Natale/Capodanno/Patrono).
  - Logica sovrapposizione orari (inclusi casi limite adiacenti).
  - Corsi collettivi (3 date x 4 studenti = 3 lezioni condivise e 12 record di presenza).
- **TypeScript Check**: `npx tsc --noEmit` completato con 0 errori.
- **Next.js Production Build**: `npm run build` completato con successo (tutte le 41 route generate).

---

## 5. Elenco File Modificati e Creati
1. `ANALISI_SOLFEGE_SCUOLA_MUSICA.md` *(creato)*
2. `RESOCONTO_CALENDARIO_DIDATTICO.md` *(creato)*
3. `CHANGELOG.md` *(aggiornato con v1.8.0)*
4. `solfege/README.md` *(aggiornato con v1.8)*
5. `solfege/package.json` *(bump a 1.8.0)*
6. `solfege/src-tauri/tauri.conf.json` *(bump a 1.8.0)*
7. `solfege/src-tauri/migrations/003_didactic_calendar.sql` *(creato)*
8. `solfege/supabase/migrations/20261011_didactic_calendar.sql` *(creato)*
9. `supabase/migrations/003_didactic_calendar.sql` *(creato)*
10. `solfege/lib/holidays.ts` *(creato)*
11. `solfege/lib/services/conflict-service.ts` *(creato)*
12. `solfege/lib/services/recovery-service.ts` *(creato)*
13. `solfege/scripts/test-didactic-calendar.ts` *(creato)*
14. `solfege/components/admin/settings/HolidaysTab.tsx` *(creato)*
15. `solfege/lib/services/enrollment-service.ts` *(riscritto)*
16. `solfege/components/admin/settings/AcademicYearTab.tsx` *(modificato)*
17. `solfege/app/admin/impostazioni/page.tsx` *(modificato)*
18. `solfege/app/admin/calendar/page.tsx` *(modificato)*
19. `solfege/app/admin/sale/components/ConflictChecker.tsx` *(modificato)*
20. `solfege/components/admin/lesson-drawer.tsx` *(riscritto)*
21. `solfege/components/admin/enrollment-form.tsx` *(riscritto)*
22. `solfege/types/database.types.ts` *(modificato)*
23. `solfege/eslint.config.mjs` *(modificato)*
