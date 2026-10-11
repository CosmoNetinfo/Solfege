## v1.8.0
- Calendario didattico con anno accademico configurabile per scuola (default metà settembre - metà giugno)
- Generazione ricorrente delle lezioni estesa all'intero anno accademico
- Motore festività nazionali italiane (11 festività) con calcolo dinamico di Pasqua e Lunedì dell'Angelo
- Gestione chiusure e patrono locale da Impostazioni con avviso lezioni impattate
- Corsi collettivi ed ensemble con lezioni condivise e registro presenze multi-studente
- Controllo sovrapposizioni e conflitti in tempo reale su docente, aula e allievi con override amministrativo
- Flusso guidato "Sposta Lezione" con verifica disponibilità e tracciamento data originale
- Registro e gestione crediti di recupero automatici su assenze giustificate

## v1.7.3
- Fix sistema aggiornamenti automatici: abilitata generazione artefatti updater (file .sig) nella build desktop
- Fix build Vercel: forzato webpack per risolvere errore Turbopack con next/font/google
- Corretti nomi file negli URL dell'endpoint /api/latest-version

## v1.7.2
- Aggiunto pulsante "Registrati" su /login collegato alla registrazione della scuola (/register)
- Introdotta funzionalità completa di recupero password con finestra modale e nuova schermata /reset-password
- Rinnovata la pagina "Iscrizioni Online Pendenti" con nuovo layout grafico, card tratteggiata e iconografia
- Allineamento e correzione padding dell'interfaccia

## v1.7.1
- Correzione padding pagina Iscrizioni Online
- Allineamento automatico versione sidebar da package.json
- Gestione graceful degli errori 404/403 sull'API degli aggiornamenti

## v1.7.0
- Nuovo sistema di iscrizioni online pubbliche con sincronizzazione automatica al login desktop
