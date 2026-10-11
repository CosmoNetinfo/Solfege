# 🎵 Solfège — Guida Completa al Primo Accesso, Licenze e Demo

> **Documento di Riferimento Tecnico e Operativo**  
> Ultimo aggiornamento: Ottobre 2026  
> Stack: Next.js 16 + React 19 + Supabase (PostgreSQL / Auth) + Tauri v2 (Rust + SQLite)

---

## 📌 Indice dei Contenuti
1. [Architettura: Differenza tra Web e Desktop](#1-architettura-differenza-tra-web-e-desktop)
2. [Licenza e Attivazione](#2-licenza-e-attivazione)
3. [Login, Utenti e Password](#3-login-utenti-e-password)
4. [Configurazione Demo per "La Casa delle Note"](#4-configurazione-demo-per-la-casa-delle-note)
5. [Riepilogo dei Flussi (Step-by-Step)](#5-riepilogo-dei-flussi-step-by-step)
6. [Modello Email Pronto per il Cliente](#6-modello-email-pronto-per-il-cliente)
7. [Punti Deboli e Criticità Riscontrate nel Codice](#7-punti-deboli-e-criticità-riscontrate-nel-codice)

---

## 1. Architettura: Differenza tra Web e Desktop

Solfège ha un'architettura **ibrida**:

| Aspetto | Piattaforma Web (`solfege-five.vercel.app`) | Piattaforma Desktop (Tauri v2) |
|---|---|---|
| **Database Primario** | Supabase (PostgreSQL nel Cloud) | SQLite locale (`solfege.db` sul PC del cliente) |
| **Punto di Ingresso** | `/login` | `/login-desktop` (reindirizza a `/setup` se primo avvio) |
| **Uso della License Key** | **Mai richiesta** | **Obbligatoria al primo avvio** |
| **Creazione Account** | Tramite Supabase Auth (`/register` o invito manuale) | Locale su SQLite + registrazione speculare su Supabase |
| **Connettività** | Richiede sempre connessione Internet attiva | Funziona offline (con sync opzionale verso il cloud) |

---

## 2. Licenza e Attivazione

### 2.1 Dove e come si inserisce la chiave di licenza?
* **Formato**: `SOLFEGE-XXXX-XXXX-XXXX` (alfanumerico a 3 blocchi da 4 caratteri, escluso caratteri ambigui come 0/O, 1/I).
* **Riferimento Codice**: [`solfege/app/setup/page.tsx`](file:///d:/Solfege/solfege/app/setup/page.tsx#L269-L307)
* La chiave si inserisce **esclusivamente nell'app desktop**:
  1. Al primo avvio dell'app desktop, l'app controlla se `setup_completed` esiste nel database SQLite locale.
  2. Se non è completato, reindirizza automaticamente alla pagina `/setup`.
  3. Al **Passo 2** del setup guidato appare il campo *"Attiva la tua licenza"* con formattazione e maiuscolo automatici.
  4. Cliccando *"Attiva licenza"*, l'app invoca il comando Rust `activate_license`.

### 2.2 Cosa accade durante l'attivazione?
* **Riferimenti Codice**:
  * Comando Rust: [`solfege/src-tauri/src/commands/license.rs`](file:///d:/Solfege/solfege/src-tauri/src/commands/license.rs#L79-L115)
  * Endpoint API Cloud: [`solfege/app/api/activate-license/route.ts`](file:///d:/Solfege/solfege/app/api/activate-license/route.ts)
* **Sequenza tecnica**:
  1. Il comando Rust invia una chiamata HTTP `POST` a `https://solfege-five.vercel.app/api/activate-license` passando:
     * `license_key`
     * `machine_id`
     * `app_version`
     * `os_info`
  2. L'API verifica nella tabella Supabase `licenses`:
     * Che la licenza esista e non sia `revoked`.
     * Se è `inactive`, ne aggiorna lo stato a **`active`** e registra `activated_at = NOW()`.
  3. Registra una riga nella tabella **`license_activations`**:
     * Inserisce la chiave, l'identificativo macchina e data/ora di attivazione.
  4. L'app desktop salva nei parametri locali SQLite:
     * `license_key = "SOLFEGE-..."`
     * `license_status = "active"`
  5. Il contatore slot passa da `0/3` a `1/3`.

### 2.3 Come funzionano gli slot e come si liberano?
* **Limite massimo**: 3 dispositivi per licenza (`MAX_DEVICES = 3`).
* Se un cliente tenta di attivare un 4° computer, riceve errore HTTP 403:  
  *"Hai raggiunto il limite di 3 dispositivi per questa licenza. Contattaci per assistenza."*
* **Come liberare uno slot**:
  * Solo tu (Superadmin) puoi liberarlo dal pannello web: **`/superadmin/licenze`** ([`solfege/app/(superadmin)/superadmin/licenze/page.tsx`](file:///d:/Solfege/solfege/app/(superadmin)/superadmin/licenze/page.tsx#L164-L192)).
  * Apri la licenza cliccando su **"Dettagli"**.
  * Nella sezione *"Dispositivi Attivi"*, trovi l'elenco dei computer registrati.
  * Clicca su **"Disattiva"** (icona cestino rossa): la riga viene cancellata da `license_activations` e lo slot torna immediatamente disponibile per una nuova attivazione.
  * Se vengono disattivati tutti i dispositivi collegati, lo stato della licenza torna in automatico a `inactive`.

---

## 3. Login, Utenti e Password

### 3.1 Cosa serve per entrare su `/login`?
* **Solo Email e Password** dell'utente registrato su Supabase Auth.
* La license key **non serve** su `/login`.

### 3.2 Come viene creato il primo utente della scuola?
Ci sono tre modalità supportate nel codice:

1. **Setup automatico Desktop (consigliato per clienti con app desktop)**:
   * Al **Passo 3** del setup desktop ([`solfege/app/setup/page.tsx#L121`](file:///d:/Solfege/solfege/app/setup/page.tsx#L121)), il cliente compila Nome, Cognome, Email e Password.
   * L'app crea l'utente amministratore su SQLite (`create_first_user`) e simultaneamente chiama l'endpoint [`/api/register-desktop-user`](file:///d:/Solfege/solfege/app/api/register-desktop-user/route.ts).
   * L'endpoint crea l'utente su Supabase Auth con `email_confirm: true` (nessuna email di verifica richiesta) e registra la riga in `profiles` con ruolo `admin`.
2. **Registrazione autonoma Web (`/register`)**:
   * Riferimento: [`solfege/app/(auth)/register/page.tsx`](file:///d:/Solfege/solfege/app/(auth)/register/page.tsx).
   * Procedura in 3 step: Dati Utente -> Dati Scuola -> Creazione immediata scuola e admin su Supabase.
3. **Creazione manuale da parte tua (Superadmin)**:
   * Puoi creare l'utente direttamente da Supabase Dashboard (Auth -> Users -> Add user) e associarlo manualmente alla scuola desiderata modificando la tabella `profiles`.

### 3.3 Gestione Password
* **Visualizzazione**: Nessuna password è visibile in chiaro (sono hashate con bcrypt/argon2).
* **Reset Password (Implementato)**:
  * Su `/login` è presente il pulsante **"Password dimenticata?"** accanto al campo password.
  * Cliccandolo, si apre un popup modale che richiede l'indirizzo email dell'account.
  * L'utente riceve un'email con un link protetto che lo porta a **`/reset-password`**, dove può impostare e confermare la nuova password in totale autonomia.

---

## 4. Configurazione Demo per "La Casa delle Note"

Per permettere a **La Casa delle Note** (`casadellenotemilano@gmail.com`) di accedere e testare il gestionale con dati già pronti, senza condividere il tuo account personale:

### 4.1 La Scuola Demo esistente (Accademia Verdi)
Nel database Supabase è presente la scuola demo popolata tramite [`supabase/seed.sql`](file:///d:/Solfege/supabase/seed.sql):
* **ID Scuola**: `d4e7a8b0-1234-4a5b-8c9d-0e1f2a3b4c5d`
* **Nome**: Accademia Verdi
* **Dati precaricati**: 4 strumenti, 3 aule, 3 docenti con orari, 10 allievi, 5 corsi, pagamenti ed iscrizioni.

### 4.2 Procedura da eseguire in Supabase prima di inviare l'accesso:
1. Accedi a [Supabase Dashboard](https://supabase.com/dashboard/project/tqpcoeahucwvtpkihgqi).
2. Seleziona **Authentication** -> **Users** -> clicca **"Add user"** -> **"Create user"**.
3. Compila con:
   * **Email**: `casadellenotemilano@gmail.com`
   * **Password**: scegli una password temporanea (es. `NoteMilano2026!`)
   * Spunta **"Auto Confirm User"** (evita l'invio dell'email di conferma bloccante).
4. Vai su **Table Editor** -> seleziona la tabella **`profiles`**.
5. Trova la riga corrispondente all'utente appena creato e imposta:
   * `school_id`: `d4e7a8b0-1234-4a5b-8c9d-0e1f2a3b4c5d`
   * `role`: `admin`
   * `full_name`: `La Casa delle Note`
6. Salva le modifiche.

---

## 5. Riepilogo dei Flussi (Step-by-Step)

### Scenario A: Demo Web immediata (es. La Casa delle Note)
1. **Tu**: Crei l'account su Supabase Auth e associ `school_id = d4e7a8b0-1234-4a5b-8c9d-0e1f2a3b4c5d` in `profiles`.
2. **Tu**: Invii via email il link `https://solfege-five.vercel.app/login` con le credenziali.
3. **Cliente**: Va sul link, inserisce email e password, e accede direttamente alla dashboard con dati di esempio già visibili.

### Scenario B: Cliente che acquista la Licenza Desktop
1. **Tu**: Vai su `https://solfege-five.vercel.app/superadmin/licenze`, clicchi *"Genera Licenza"* e inserisci nome ed email del cliente.
2. **Tu**: Ottieni la chiave (es. `SOLFEGE-7K9A-M3P2-8DF4`) e la invii al cliente insieme al link per scaricare l'installer `.exe` o `.dmg`.
3. **Cliente**: Installa e avvia l'app Solfège per la prima volta.
4. **Cliente**: L'app si apre su `/setup`:
   * **Passo 1**: Schermata di benvenuto.
   * **Passo 2**: Inserisce la chiave di licenza -> la licenza passa da `inactive` ad `active` e occupa 1 slot.
   * **Passo 3**: Inserisce nome, cognome, email e password per il proprio account admin.
   * **Passo 4**: Inserisce i dati della propria scuola di musica.
5. **Cliente**: Entra nella dashboard della propria scuola.

---

## 6. Modello Email Pronto per il Cliente

Puoi copiare e incollare questo testo nella mail:

```text
Oggetto: Accesso alla demo di Solfège — La Casa delle Note

Gentile staff de La Casa delle Note,
abbiamo predisposto per voi un ambiente demo per testare tutte le funzionalità di Solfège:

• Link di accesso: https://solfege-five.vercel.app/login
• Email: casadellenotemilano@gmail.com
• Password provvisoria: [INSERISCI_LA_PASSWORD_SCELTA]

All'interno troverete il gestionale già configurato con allievi, docenti, corsi e pagamenti di esempio per sperimentare subito la gestione quotidiana.

Restiamo a completa disposizione per qualsiasi chiarimento.
```

---

## 7. Punti Deboli e Criticità Riscontrate nel Codice

Nel corso dell'analisi sono emerse alcune anomalie tecniche da tenere a mente:

1. **`machine_id` hardcodato nel Setup Desktop**:
   * In [`solfege/app/setup/page.tsx#L98`](file:///d:/Solfege/solfege/app/setup/page.tsx#L98) è presente `const machineId = 'desktop-local'`.
   * Poiché la stringa inviata è identica per ogni PC, l'endpoint di attivazione interpreta ogni installazione come la medesima macchina già nota, aggiornando solo `last_seen_at`. Di fatto, **il conteggio degli slot dispositivi non incrementa oltre 1/3** a meno che non venga generato un identificativo hardware univoco.
2. **Recupero password (Risolto)**:
   * Aggiunto pulsante "Password dimenticata?" su `/login` con modale per l'invio dell'email e pagina `/reset-password` per l'impostazione autonoma della nuova credenziale.
3. **Pulsante "Prova la Demo Online"**:
   * Su `/login` il pulsante reindirizza a Google OAuth e poi a `/setup-trial`, creando una scuola vuota anziché mostrare una demo pre-popolata.
4. **Servizio email Resend disattivato**:
   * In [`solfege/app/api/invite/route.ts#L11`](file:///d:/Solfege/solfege/app/api/invite/route.ts#L11) l'API key è `re_123456789`, quindi le email di invito/notifica non vengono recapitate realmente (vengono solo simulate).
