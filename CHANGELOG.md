# Changelog

## v1.0.5
- Rimosso il box "Link Iscrizioni Pubblico" e il campo "Slug URL" (con relativa anteprima) dalle impostazioni della scuola, poiché le iscrizioni online autonome non sono attualmente supportate

## v1.0.4
- Abilitati i DevTools anche nelle build di produzione Tauri attivando la feature `devtools` nel file Cargo.toml
- Aumentato a 5 secondi il tempo di visualizzazione dei dettagli degli errori di autenticazione a schermo per consentire la diagnosi visiva del "flash" al login
- Aggiunti dettagli informativi aggiuntivi nella schermata di errore in caso di sessione vuota (get_current_user nullo)

## v1.0.3
- Implementata sessione utente persistente su tabella SQLite dedicata (`sessions`) per risolvere la disconnessione automatica al refresh/cambio pagina nel webview desktop
- Aggiunta schermata di errore di autenticazione visibile nel layout admin per facilitare la diagnosi di eventuali futuri bug di sessione
- Abilitati DevTools (F12) nelle finestre Tauri per agevolare il debugging
- Corretto il recupero automatico della versione dell'app nel comando Rust `activate_license` da Cargo.toml

## v1.0.2
- Rimosso banner di debug giallo dalla schermata di login
- Risolto bug login: username normalizzato (minuscolo, senza spazi) sia al salvataggio che alla verifica
- La landing page commerciale non viene più mostrata all'interno dell'app desktop
- Messaggio di errore login più chiaro in caso di credenziali errate

## v1.0.1
- Risolto errore `Command plugin:sql|load not allowed by ACL` durante il wizard di configurazione iniziale
- Risolto bug critico: tabelle SQLite non venivano create al primo avvio (`no such table: users`)
- Eliminata race condition tra inizializzazione database e apertura UI
- Aggiunto redirect automatico al wizard se il database non è configurato

## v1.0.0
- Prima release pubblica di Solfège Desktop
- Wizard di configurazione iniziale (scuola, licenza, primo utente admin)
- Gestione studenti, insegnanti, corsi, lezioni e presenze
- Calendar Sale & Prove con timeline oraria fino alle 23:00
- Sistema di pagamenti e ricevute
- Login desktop offline con SQLite locale
- Auto-updater integrato
- Supporto Windows, macOS (Intel + Apple Silicon) e Linux
