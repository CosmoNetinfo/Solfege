# Solfège — Note di Produzione

Questo file contiene le informazioni critiche per la gestione e il collaudo della piattaforma Solfège in ambiente di produzione.

## Accesso alla Piattaforma
- **URL Produzione**: [https://solfege-five.vercel.app](https://solfege-five.vercel.app)
- **Credenziali Admin Test**: `admindany@gmail.com` / `Password123!`
- **Credenziali Docente Test**: `marco.bianchi@test.com` / `Password123!`

## Dettagli Tecnici
- **School ID (Accademia Verdi)**: `d4e7a8b0-1234-4a5b-8c9d-0e1f2a3b4c5d`
- **School ID (Accademia Test)**: `8ac806c3-2a41-4f65-9db8-5ff525f5be59`
- **Bucket Supabase Storage**: `logos` (utilizzato per i loghi delle scuole)
- **Framework**: Next.js 16.2 (Turbopack), Supabase SSR, Radix UI.

## Roadmap v1 (Steps da completare)
Nonostante la stabilità raggiunta, i seguenti moduli sono pronti per l'espansione e il completamento funzionale:
1. **Calendario Presenze Completo**: Implementazione di report avanzati per le assenze degli allievi.
2. **PDF Ricevuta**: Generazione lato server e invio automatico via email (Resend).
3. **Statistiche Grafici**: Espansione del modulo `/admin/statistiche` con filtri per anno accademico.
4. **Debug Panel**: Visualizzazione log di query DB direttamente nell'interfaccia.
5. **Export CSV**: Funzionalità di download dati per contabilità esterna.

---
*Ultimo aggiornamento: 13 Maggio 2026*
