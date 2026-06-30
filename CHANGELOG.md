# Changelog

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
