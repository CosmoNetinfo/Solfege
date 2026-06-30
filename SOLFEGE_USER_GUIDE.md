# 📖 Manuale Utente - Solfège

Benvenuto in **Solfège**, il gestionale completo per la tua scuola di musica. 
Questa guida ti accompagnerà passo-passo nell'utilizzo della piattaforma, divisa nei due ruoli principali: **Admin** (Segreteria/Direzione) e **Insegnante**.

---

## 1. 🔑 Accesso alla Piattaforma

- L'**Admin** accede tramite email e password configurate alla nascita dell'ambiente (vedi file Credenziali).
- L'**Insegnante** non può registrarsi da solo. L'Admin deve prima creare la sua scheda e poi cliccare su **"Invita al portale"**. L'insegnante riceverà un'email con un link per impostare la password. Qualora si scordasse la password, l'Admin può inviargli un "Magic Link" di accesso rapido.

---

## 2. 👑 Pannello Admin (Segreteria)

Il pannello laterale scuro è il centro di controllo della scuola.

### 📊 Dashboard
Una panoramica in tempo reale sullo stato della scuola: lezioni di oggi, incassi del mese, numero di allievi attivi.

### 🎓 Allievi
Qui gestisci l'anagrafica degli studenti.
1. Clicca **"Nuovo Allievo"**. Inserisci i dati base. Se l'allievo è **minorenne**, compariranno automaticamente i campi per i dati del genitore/tutore.
2. Cliccando su un allievo apri la sua **Scheda Dettaglio** divisa in tab:
   - **Anagrafica**: per modificare i dati.
   - **Iscrizioni**: per vedere a quali corsi partecipa.
   - **Presenze**: per vedere il calendario mensile delle sue presenze.
   - **Pagamenti**: per tenere traccia delle rette saldate.

### 👨‍🏫 Insegnanti
Gestione del corpo docenti.
1. **Creazione**: Clicca "Nuovo Insegnante". Oltre all'anagrafica, è fondamentale inserire la **Tariffa Oraria Individuale/Collettiva** e le sue **Disponibilità** (giorni e fasce orarie in cui lavora).
2. **Invito**: Una volta creato l'insegnante, apri la sua scheda. In alto a destra clicca su **"Invita al portale"**. L'icona diventerà verde ("Accesso attivo") non appena l'insegnante configurerà il suo account.

### 🎵 Corsi
Il cuore didattico della scuola. Puoi creare corsi **Individuali** (1 a 1) o **Collettivi**.
- **Creare un Corso**: Definisci il nome, l'insegnante, il tipo e la durata standard della lezione (es. 60 min).
- **Iscrizioni**: Clicca sul corso e poi su "Iscrivi Allievo".
- **Genera Calendario**: Una volta definiti gli allievi, usa questa funzione per *creare materialmente* le lezioni sul calendario per tutto il mese o l'anno. Il sistema eviterà in automatico accavallamenti verificando la disponibilità dell'insegnante e dell'aula.

### 📅 Calendario
Un calendario generale a visualizzazione mensile/settimanale/giornaliera. 
- Da qui l'Admin vede **tutte** le lezioni della scuola. 
- È possibile cliccare su una lezione per spostarla, cancellarla o registrare le presenze se l'insegnante si dimentica di farlo.

### 💳 Compensi
La sezione amministrativa di fine mese.
- Mostra in automatico quanto deve essere pagato ogni insegnante, calcolando le ore delle lezioni **svolte** (status: *completata*) moltiplicate per la tariffa.
- Una volta fatto il bonifico all'insegnante, clicca su "Segna come pagato".

### ⚙️ Impostazioni
Qui configuri i dati fondamentali dell'istituto:
- **Scuola**: Nome, logo, contatti.
- **Anno Accademico**: Imposta le date di inizio e fine corsi.
- **Strumenti & Aule**: Crea la lista degli strumenti insegnati e le aule fisiche (es. "Aula Batteria - Insonorizzata").

---

## 3. 📱 Pannello Insegnante

Gli insegnanti hanno un'interfaccia dedicata e ottimizzata per l'uso da smartphone, navigabile tramite i pulsanti in basso (Bottom Navigation). **Nota bene:** Un insegnante può vedere e gestire *solo* i propri allievi e le proprie lezioni.

### 🏠 Home
Al primo accesso l'insegnante vede un riepilogo rapido: il totale degli allievi, le ore di lezione del mese in corso, e una lista pratica delle **Lezioni di Oggi**.

### 📝 Appello
La funzione più importante.
1. Seleziona una lezione in programma.
2. Apparirà la lista degli allievi iscritti a quella lezione.
3. Per ogni allievo, l'insegnante può toccare l'icona dello stato per registrarne la presenza:
   - 🟢 **Presente**
   - 🔴 **Assente Ingiustificato** (verrà conteggiato/fatturato)
   - 🟡 **Giustificato** (può essere recuperato)
4. Una volta fatto l'appello, clicca "Salva Appello". La lezione diventerà "Completata" e genererà compenso.

### 👥 Allievi
Una rubrica veloce con i contatti degli allievi assegnati all'insegnante (utile per chiamarli o mandare email in caso di ritardi).

### 👤 Profilo
Riepilogo dei propri dati personali, le materie insegnate, e un riassunto dei compensi maturati da poter confrontare con la segreteria.

---

## 🚀 Flussi di lavoro comuni

### 1️⃣ "È appena arrivato un nuovo iscritto!"
1. Vai su **Allievi** e crea la sua scheda.
2. Vai su **Corsi** e scegli il corso a cui iscriverlo.
3. Clicca la scheda del corso e aggiungilo tramite "Iscrivi Allievo".
4. Usa "Genera Calendario" per fissare le sue lezioni nel mese.

### 2️⃣ "Devo pagare gli insegnanti a fine mese"
1. Assicurati che gli insegnanti abbiano compilato tutti gli Appelli (le lezioni devono essere in stato "Completata", non "Pianificata").
2. Vai su **Compensi**.
3. Seleziona il mese appena trascorso in alto a destra.
4. Troverai la riga con il totale esatto per ogni insegnante. Clicca "Paga" e stampa/salva la ricevuta.

---

> **💡 Suggerimento per l'uso quotidiano:** 
> L'ideale è formare gli insegnanti affinché tengano l'appello direttamente dal loro smartphone *durante* le lezioni. Questo automatizzerà completamente sia i pagamenti delle rette (i genitori pagano per le lezioni fatte) sia i compensi dei docenti.
