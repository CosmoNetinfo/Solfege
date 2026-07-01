# Note di Rilascio (Changelog) - Solfège

In questo documento sono raccolti i dettagli degli aggiornamenti, dei bugfix e delle nuove funzionalità introdotte nelle ultime versioni di Solfège.

## 🚀 Versione 1.1.3 - Risoluzione Loop di Login Desktop

Questa release risolve definitivamente il problema di reindirizzamento (loop) che rispediva l'utente alla pagina di login subito dopo aver effettuato l'accesso sulla versione desktop.

### 🛠️ Correzioni e Ottimizzazioni (Bugfix)
* **Allineamento Sessione Cloud (Supabase Auth)**: Modificato il login desktop (`LoginDesktopPage`) per eseguire contestualmente l'autenticazione sia sul database SQLite locale sia su Supabase via client JS.
  - *Problema risolto*: Le pagine dell'area amministrativa (Dashboard, Studenti, ecc.) necessitano del token Supabase per leggere/scrivere dati. Mancando questo token sul desktop (poiché l'utente accedeva solo localmente), le chiamate fallivano o forzavano un reindirizzamento.
* **Rimozione Redirect Compile-Time (Client Components)**: Convertite le pagine `dashboard`, `compensi` e `impostazioni` in *Client Components* (`"use client"`).
  - *Problema risolto*: Essendo definiti come Server Components, Next.js eseguiva il controllo di sessione ed il redirect a `/login` a compile-time (durante la compilazione del pacchetto statico). Questo produceva file HTML pre-compilati contenenti un reindirizzamento automatico permanente che bloccava l'accesso degli utenti all'apertura dell'app.
  - *Comportamento attuale*: I controlli di sessione e i caricamenti avvengono dinamicamente a runtime lato client nel webview locale dell'applicazione, interfacciandosi con la protezione globale del layout.

---

## 🚀 Versione 1.1.2 - Risoluzione Definitiva Blocco Database (WAL Mode)

Questa release introduce la modalità WAL su SQLite per eliminare in modo definitivo gli errori di concorrenza.

### 🛠️ Correzioni e Ottimizzazioni (Bugfix)
* **SQLite Journal Mode = WAL (Write-Ahead Logging)**: Configurato il database locale per operare in modalità WAL.
  - *Problema risolto*: In alcune installazioni di Windows, anche configurando il `busy_timeout` di 5 secondi (introdotto nella 1.1.1), SQLite continuava a lanciare l'errore `database is locked` in fase di login perché il driver del frontend (`tauri-plugin-sql`) manteneva un blocco di lettura attivo prolungato. 
  - *Comportamento attuale*: La modalità WAL consente a più connessioni di leggere e scrivere contemporaneamente sul database senza bloccarsi a vicenda. I lettori non bloccano i scrittori e i scrittori non bloccano i lettori, garantendo stabilità assoluta.

---

## 🚀 Versione 1.1.1 - Bugfix Blocco Database

Questa release corregge l'errore di blocco concorrente del database SQLite locale durante il login.

### 🛠️ Correzioni e Ottimizzazioni (Bugfix)
* **SQLite Busy Timeout**: Configurato un tempo di attesa di **5 secondi** (`busy_timeout(5000)`) su tutte le connessioni aperte dal backend in Rust (`database.rs`).
  - *Problema risolto*: Durante il login, l'app provava a salvare la sessione nel DB mentre il frontend (tramite `tauri-plugin-sql`) manteneva un blocco di lettura/scrittura attivo sul database locale. Questo causava il fallimento immediato dell'operazione restituendo l'errore `database is locked`.
  - *Comportamento attuale*: In caso di lock concorrente, il backend attende fino a 5 secondi che la risorsa si liberi prima di ritornare l'errore, consentendo un accesso concorrente fluido e privo di crash.

---

## 🚀 Versione 1.1.0 - Bacheca Pubblica e Portale Mobile

Questa release introduce importanti novità sul fronte dell'accessibilità mobile per gli allievi, il sistema di sincronizzazione dati desktop-cloud e la gestione delle iscrizioni web.

### 📢 Nuove Funzionalità (Feature)

#### 1. Portale Allievi Mobile-First
* **Interfaccia Responsive**: Il portale allievi `/portal/dashboard` è stato completamente ridisegnato per l'uso da smartphone. Ora presenta un'elegante **Bottom Navigation Bar** fissa per muoversi fluidamente tra le sezioni.
* **Le tue Lezioni**: Sezione dedicata per consultare lo storico delle presenze e le future lezioni in programma. Consente di espandere ciascuna lezione passata per leggere gli **argomenti trattati** e i **compiti assegnati** dal docente.
* **Pagamenti**: Tracciamento trasparente delle quote scolastiche con badge colorati per stato (`Pagato`, `Scaduto`, `In attesa`), metodo di pagamento e numero di ricevuta.
* **Mio Profilo**: Visualizzazione dei dati anagrafici personali e del genitore referente associato (se l'allievo è minorenne).

#### 2. Sincronizzazione Dati Cloud & Bacheca
* **Sincronizzazione in 1-Click**: Aggiunto un pulsante **"Sincronizza Cloud"** nella barra laterale dell'applicazione desktop.
* **Payload Unificato**: Il motore esegue l'estrazione locale e l'upsert protetto sul cloud di: *scuola, allievi, insegnanti, corsi, iscrizioni, lezioni, presenze, pagamenti e avvisi*.
* **Sicurezza Multi-Tenant**: Ogni sincronizzazione è autenticata tramite chiave di licenza. I dati vengono isolati tramite policy RLS (Row Level Security) associate allo `school_id` univoco, impedendo a scuole diverse di sovrascrivere o visualizzare record altrui.

#### 3. Bacheca Avvisi Pubblica (Senza Login)
* **Atterraggio Scuola (`/[school-slug]`)**: Creata una landing page pubblica per ciascuna scuola che mostra:
  - Nome, logo e contatti della scuola.
  - Bacheca degli avvisi generali con evidenza grafica per quelli contrassegnati come *Importanti*.
  - **Variazioni d'orario**: Elenco in tempo reale delle lezioni annullate o dei recuperi programmati nell'ultima settimana e futuri.
* **Accesso Rapido**: Link diretti per accedere al portale privato o per inviare una candidatura online.

#### 4. Iscrizioni Online & Gestione Desktop
* **Iscriviti Online (`/[school-slug]/iscriviti`)**: Form multi-step pubblico per l'inserimento autonomo dei candidati allievi (con gestione minorenni).
* **Pannello Desktop**: Aggiunta la sezione **"Iscrizioni Web"** nell'app desktop per visionare le richieste pendenti, approvarle (importando l'allievo direttamente nel DB locale SQLite) o rifiutarle.
* **Link in Impostazioni**: Mostrati e resi copiabili in *Impostazioni ➔ Scuola* sia il *Link Bacheca Pubblica* che il *Link Iscrizioni Pubblico*.

### 🛠️ Correzioni e Ottimizzazioni (Bugfix)
* **Tauri IPC Guards (isDesktop)**: Aggiunto il controllo `isDesktop()` nelle nuove pagine di amministrazione (`iscrizioni` e `bacheca`) per prevenire crash ed errori Javascript in console (`Cannot read properties of undefined (reading 'invoke')`) quando le pagine vengono compilate o caricate via browser.
* **Tracciamento Errori di Login**: Modificato il comando Rust `login` per non procedere a memoria se la scrittura su SQLite in `sessions` fallisce. Qualsiasi blocco del database o errore di scrittura viene ora mostrato chiaramente in rosso sulla schermata di login per facilitare la diagnostica.
* **Rust Trait Imports**: Risolto l'errore di build Rust dovuto all'assenza del trait `tauri::Manager` nel file `lib.rs` inserendo l'importazione corretta.
* **DevTools in Release**: Abilitata la console DevTools (F12) anche per le build di produzione release nel file `tauri.conf.json` per facilitare il debug dell'eseguibile installato.

---

## 💾 Aggiornamenti Schema Database (Supabase SQL)

Se non ancora eseguito, per supportare la bacheca avvisi e le iscrizioni online, eseguire la seguente query SQL nel Query Editor di Supabase:

```sql
-- Tabella per le registrazioni online temporanee
CREATE TABLE IF NOT EXISTS online_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cognome TEXT NOT NULL,
  data_nascita DATE,
  codice_fiscale TEXT,
  email TEXT,
  telefono TEXT,
  is_minorenne BOOLEAN DEFAULT false,
  genitore_nome TEXT,
  genitore_cognome TEXT,
  genitore_email TEXT,
  genitore_telefono TEXT,
  genitore_codice_fiscale TEXT,
  corso_interesse TEXT,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE online_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY anon_insert_registrations ON online_registrations
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY superadmin_all_registrations ON online_registrations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

CREATE POLICY school_admin_manage_registrations ON online_registrations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND (role = 'admin' OR role = 'segreteria') AND school_id = online_registrations.school_id
    )
  );

-- Associa la licenza ad una scuola specifica su Supabase
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE SET NULL;

-- Tabella per gli avvisi/comunicazioni della scuola in bacheca
CREATE TABLE IF NOT EXISTS school_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_important BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE school_notices ENABLE ROW LEVEL SECURITY;

CREATE POLICY public_read_notices ON school_notices
  FOR SELECT TO anon USING (true);

CREATE POLICY school_admin_manage_notices ON school_notices
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND (role = 'admin' OR role = 'segreteria') AND school_id = school_notices.school_id
    )
  );
```
