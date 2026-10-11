# Analisi Tecnica e Valutazione di Solfège per Scuola di Musica (200 Famiglie)

> **Data:** Ottobre 2026  
> **Oggetto:** Analisi del codebase di Solfège a fronte dei requisiti gestionali e operativi per una scuola di musica di medie dimensioni (~200 famiglie).

---

## Sintesi Esecutiva dello Stato di Conformità

| # | Ambito Funzionale | Stato | File di Riferimento Principali |
|---|---|:---:|---|
| **1** | Corsi (ind./coll.), lezioni ricorrenti, docenti, aule, controllo sovrapposizioni | **PARZIALE** | `app/admin/courses/page.tsx`<br>`components/admin/course-form.tsx`<br>`lib/services/enrollment-service.ts`<br>`app/admin/sale/components/ConflictChecker.tsx` |
| **2** | Presenze, assenze, spostamenti, recuperi; calendario festività e chiusure | **PARZIALE** | `components/admin/lesson-drawer.tsx`<br>`app/admin/calendar/page.tsx`<br>`lib/desktop-db.ts` |
| **3** | Multi-utente contemporaneo con ruoli (segreteria, direzione, docente, famiglia) | **PARZIALE** | `components/admin/settings/UsersTab.tsx`<br>`proxy.ts`<br>`app/portal/layout.tsx`<br>`src-tauri/migrations/001_initial.sql` |
| **4** | Anagrafiche allievi minorenni con tutori legali | **GIÀ PRESENTE** | `components/admin/student-form.tsx`<br>`src-tauri/migrations/001_initial.sql`<br>`lib/desktop-db.ts` |
| **5** | Moduli di iscrizione online | **GIÀ PRESENTE** | `app/[school_slug]/iscriviti/page.tsx`<br>`app/actions/public-actions.ts`<br>`app/api/online-registrations/route.ts`<br>`app/admin/iscrizioni/page.tsx` |
| **6** | Quote associative, rette, pagamenti a rate, sconti fratelli, solleciti, ricevute | **PARZIALE** | `app/admin/finances/page.tsx`<br>`lib/pdf/receipt.tsx`<br>`lib/services/enrollment-service.ts`<br>`components/admin/enrollment-form.tsx` |
| **7** | Import anagrafiche da CSV / Excel | **ASSENTE** | `app/admin/students/page.tsx`<br>`package.json` |
| **8** | API REST documentate, webhook, autenticazione per integrazioni esterne | **ASSENTE** | `app/api/` |
| **9** | Multi-utente su database condiviso (Web vs Desktop) | **SOLO WEB** | `src-tauri/src/database.rs`<br>`lib/supabase/client.ts` |

---

## Analisi Dettagliata per Punto

### 1. Corsi individuali e collettivi con lezioni ricorrenti; docenti, aule, strumenti; controllo sovrapposizioni
* **Valutazione:** **PARZIALE**
* **Cosa è presente:**
  * Modello dati e interfaccia grafica completi per corsi (`individuale`, `collettivo`, `ensemble`), strumenti musicali e aule didattiche (`app/admin/courses/page.tsx`, `components/admin/course-form.tsx`, `app/admin/aule/page.tsx`).
  * Tabella SQLite e Supabase con attributi specifici (durata, livello, colore calendario, tariffa oraria docente).
* **Carenze riscontrate:**
  * **Generazione ricorrente limitata:** Il servizio `enrollStudent` (`lib/services/enrollment-service.ts`) genera le lezioni solo per le 12 settimane successive all'iscrizione, non coprendo l'intero anno accademico (9-10 mesi).
  * **Duplicazione nei corsi collettivi:** Iscrivendo più allievi allo stesso corso collettivo, il sistema genera 12 lezioni indipendenti per ciascun allievo, invece di agganciare gli allievi alla medesima istanza di lezione condivisa.
  * **Controllo sovrapposizioni assente per la didattica:** Il controllo dei conflitti (`ConflictChecker.tsx`) è implementato solo per le sale prove a noleggio. In fase di creazione/modifica corso o assegnazione lezioni non viene effettuato alcun controllo su aule o docenti già impegnati.

---

### 2. Presenze, assenze, spostamenti, recuperi; calendario con festività e chiusure
* **Valutazione:** **PARZIALE**
* **Cosa è presente:**
  * Registro elettronico nel cassetto lezione (`components/admin/lesson-drawer.tsx`) con tracciamento degli stati `presente`, `assente`, `recupero`.
  * Visualizzazione calendario settimanale/mensile (`app/admin/calendar/page.tsx`).
* **Carenze riscontrate:**
  * **Spostamenti e recuperi:** Non esiste un flusso guidato di riprogrammazione (modifica data/ora con picker e controllo disponibilità docente/aula). Manca un registro dei "crediti di recupero" maturati dagli allievi a seguito di assenze giustificate.
  * **Festività e chiusure (ASSENTE):** Non esiste la gestione delle festività (nazionali, patronali) o dei periodi di chiusura (vacanze natalizie, pasquali, estive). La generazione delle lezioni inserisce date anche nei giorni festivi e il calendario non espone fasce di indisponibilità della scuola.

---

### 3. Multi-utente contemporaneo con ruoli (segreteria, direzione, docente, famiglia)
* **Valutazione:** **PARZIALE**
* **Cosa è presente:**
  * Ruoli `admin` e `segreteria` gestiti sia su Web (`profiles.role`) che su Desktop (`users.role`).
  * Configurazione permessi e inviti utenti staff (`components/admin/settings/UsersTab.tsx`).
* **Carenze riscontrate:**
  * **Ruolo Docente:** Nonostante esista l'anagrafica docente e l'enum nel database, l'interfaccia dedicata (`/teacher`) è stata rimossa dall'alberatura delle rotte. I docenti non possono accedere autonomamente dal proprio smartphone per firmare il registro.
  * **Ruolo Famiglia/Allievo:** L'area riservata (`/portal`) esiste solo nella versione Web, ma non è collegata né utilizzabile dall'app Desktop locale.
  * **Concorrenza:** La contemporaneità reale di accesso è supportata unicamente dalla versione Web (Supabase).

---

### 4. Anagrafiche allievi minorenni con tutori
* **Valutazione:** **GIÀ PRESENTE**
* **Riferimenti:** `components/admin/student-form.tsx`, `solfege/src-tauri/migrations/001_initial.sql`, `lib/desktop-db.ts`
* **Dettagli:**
  * Calcolo automatico della maggiore/minore età in base alla data di nascita (`dob`).
  * Apertura dinamica della sezione tutore legale: Nome, Cognome, Telefono, Email, Codice Fiscale.
  * Persistenza completa garantita sia in SQLite locale sia nel database cloud PostgreSQL.

---

### 5. Moduli di iscrizione online
* **Valutazione:** **GIÀ PRESENTE**
* **Riferimenti:** `app/[school_slug]/iscriviti/page.tsx`, `app/actions/public-actions.ts`, `app/api/online-registrations/route.ts`, `app/admin/iscrizioni/page.tsx`, `lib/services/registration-sync.ts`
* **Dettagli:**
  * Wizard pubblico completo a step (`[school_slug]/iscriviti`) accessibile da web senza autenticazione.
  * Raccolta dati anagrafici, tutore, strumento, preferenze orarie e note.
  * Approvazione da parte della segreteria con sincronizzazione automatica e deduplicazione su codice fiscale/email verso l'applicazione gestionale.

---

### 6. Quote associative, rette, pagamenti a rate, sconti fratelli, solleciti, ricevute
* **Valutazione:** **PARZIALE**
* **Cosa è presente:**
  * Gestione rette e scadenze in `app/admin/finances/page.tsx`.
  * Generazione ricevute con numerazione progressiva annuale (es. `2026-001`) e generazione PDF con layout conforme (`lib/pdf/receipt.tsx`, `PDFButton.tsx`).
  * Sollecito WhatsApp con link `wa.me` precompilato.
* **Carenze riscontrate:**
  * **Quote associative:** Tabella `tessere` presente nel database, ma priva di modulo contabile per il rinnovo e incasso separato della quota sociale rispetto al corso.
  * **Piani rateali:** Viene creata solo la prima rata/mensilità (`enrollment-service.ts`); non esiste un generatore di piano di ammortamento a rate (es. 4 rate o 10 rate mensili).
  * **Sconti fratelli:** Sconto inseribile solo come percentuale manuale generica; manca il rilevamento automatico del nucleo familiare e l'applicazione automatica della tariffa ridotta.
  * **Solleciti massivi:** Assenti promemoria automatici programmati o invii batch a tutti i debitori con un click.

---

### 7. Import da CSV/Excel
* **Valutazione:** **ASSENTE**
* **Riferimenti:** `app/admin/students/page.tsx`, `package.json`
* **Dettagli:**
  * È presente unicamente l'esportazione in formato CSV dei movimenti finanziari (`app/admin/finances/page.tsx:337`).
  * Manca qualsiasi procedura di importazione guidata con validazione dati da file `.csv` o `.xlsx` per allievi, famiglie e docenti.

---

### 8. API REST documentate, webhook, autenticazione per applicazioni esterne
* **Valutazione:** **ASSENTE**
* **Riferimenti:** `app/api/`
* **Dettagli:**
  * Gli endpoint API attuali sono esclusivamente interni (licenze superadmin, report errori crash, sync iscrizioni).
  * Assenti specifiche OpenAPI/Swagger, chiavi API per terze parti e webhook per collegare gestionali esterni, CRM, piattaforme di newsletter o fatturazione elettronica.

---

### 9. Differenze tra versione Web e Desktop: supporto Multi-Utente

| Aspetto Tecnico | Versione Web (Next.js + Supabase) | Versione Desktop (Tauri v2 + SQLite) |
|---|---|---|
| **Database** | PostgreSQL su cloud (Supabase) | SQLite locale (`solfege.db`) su filesystem |
| **Multi-utente contemporaneo** | **SÌ (Nativo)** | **NO** |
| **Accesso da più postazioni** | Accessibile contemporaneamente da qualsiasi browser | Ristretto alla singola macchina con l'eseguibile |
| **Rischio conflitti dati** | Gestito da RLS e transazioni PostgreSQL | Alto in caso di condivisione file `.db` su rete LAN/SMB |
| **Portale famiglie/docenti** | Integrabile direttamente | Impossibile da desktop locale |

> **Conclusioni sul Punto 9:**  
> Per una scuola di musica di 200 famiglie, dove solitamente operano contemporaneamente almeno 2 addetti di segreteria, la direzione e potenzialmente i docenti per le presenze, **la versione Desktop basata su SQLite locale non supporta il multi-utente su database condiviso**. Condividere il file SQLite su cartella di rete (SMB) causa lock frequenti e rischio di corruzione. L'architettura corretta per supportare la scuola è la **versione Web centralizzata su PostgreSQL/Supabase**.

---

## Piano di Lavoro e Stima Economica (Giorni/Uomo)

| Punto | Stato | Attività di Sviluppo Richiesta | Stima (gg) |
|---|:---:|---|:---:|
| **1. Corsi, ricorrenze, sovrapposizioni** | `PARZIALE` | Generatore lezioni per intero anno accademico; gestione classi collettive multi-allievo; validazione conflitti docenti/aule in tempo reale. | **4 - 5** |
| **2. Presenze, recuperi, calendario festività** | `PARZIALE` | Anagrafica festività e chiusure scuola; esclusione automatica festivi dal calendario; registro crediti/recuperi e ripianificazione guidata. | **4 - 5** |
| **3. Multi-utente e ruoli (docenti/famiglie)** | `PARZIALE` | Registro mobile per firma docente; riattivazione portale famiglie per consultazione pagamenti e lezioni. | **6 - 8** |
| **6. Rateizzazioni, quote, sconti fratelli** | `PARZIALE` | Generatore scadenze a rate; rilevamento nucleo familiare e sconto fratelli automatico; gestione contabile quota associativa. | **4 - 5** |
| **7. Import da CSV/Excel** | `ASSENTE` | Modulo di import guidato con parser Excel/CSV, mappatura campi, validazione e inserimento massivo deduplicato. | **2 - 3** |
| **8. API REST e Webhook** | `ASSENTE` | Endpoint REST documentati (OpenAPI), gestione API Key e webhook in uscita per integrazioni esterne. | **3 - 4** |
| **Consolidamento Architettura Cloud (Punto 9)** | N/A | Allineamento dell'app sulla versione Web multi-tenant per garantire l'accesso contemporaneo di segreteria e direzione. | **2 - 3** |
| **TOTALE STIMATO** | | | **25 - 33 gg** |
