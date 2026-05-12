# Solfège — Gestionale SaaS per Scuole di Musica

**Solfège** è un'applicazione gestionale premium progettata per modernizzare l'amministrazione delle scuole di musica. Offre una suite completa di strumenti per la gestione di allievi, insegnanti, corsi, presenze e contabilità, il tutto con un'interfaccia elegante e intuitiva.

## 🚀 Funzionalità Principali

### 🏫 Amministrazione (Dashboard Admin)
- **Gestione Studenti**: Database completo con monitoraggio iscrizioni e status (Minorenne/Adulto).
- **Gestione Insegnanti**: Profili docenti con griglia di disponibilità settimanale e calcolo compensi.
- **Corsi e Iscrizioni**: Creazione corsi con codifica a colori e gestione iscrizioni basata sulla disponibilità reale dei docenti.
- **Calendario Lezioni**: Visualizzazione dinamica (giornaliera/settimanale/mensile) integrata con `react-big-calendar`.
- **Finanze e Pagamenti**: Monitoraggio morosità, registrazione incassi e generazione automatica di **ricevute PDF** professionali.

### 📱 Portale Docenti (Mobile-First)
- **Dashboard Oggi**: Visione immediata delle lezioni della giornata.
- **Registro Presenze**: Appello rapido con 3 stati (Presente, Assente, Recupero) e note sulla lezione.
- **Anagrafica Allievi**: Accesso rapido ai contatti degli studenti (chiamata rapida e WhatsApp).
- **Compensi**: Monitoraggio in tempo reale delle ore lavorate e dei guadagni maturati.

## 🛠️ Tech Stack

- **Framework**: [Next.js 14+](https://nextjs.org/) (App Router, Server Actions)
- **Linguaggio**: TypeScript
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL, RLS, Auth)
- **Styling**: Tailwind CSS (Design System personalizzato)
- **Componenti UI**: Radix UI / Shadcn UI
- **Grafica**: Recharts (Statistiche) e Lucide React (Icone)
- **PDF**: @react-pdf/renderer

## 🎨 Design System

Solfège utilizza un design ispirato all'eleganza classica della musica unita alla modernità del software SaaS:
- **Colori**: Arancio Solfège (`#E8621A`) come accento, Pietra (`#FAFAF9`) per gli sfondi, Ebano (`#1A1714`) per i testi.
- **Tipografia**: 
  - *Cormorant Garamond*: Per titoli e intestazioni (eleganza classica).
  - *DM Sans*: Per il corpo del testo (leggibilità moderna).
  - *JetBrains Mono*: Per codici e ID (precisione tecnica).

## 📦 Installazione e Setup

1. **Clona il repository**:
   ```bash
   git clone https://github.com/CosmoNetinfo/Solfege.git
   cd Solfege/solfege
   ```

2. **Installa le dipendenze**:
   ```bash
   npm install
   ```

3. **Configura l'ambiente**:
   Crea un file `.env.local` nella cartella `solfege/` con le tue chiavi Supabase:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=tua_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tua_anon_key
   ```

4. **Avvia il server di sviluppo**:
   ```bash
   npm run dev
   ```

## 📂 Struttura del Progetto

- `/solfege`: Codice sorgente dell'applicazione Next.js.
- `/supabase`: Migrazioni SQL e file di seed per il database.
- `/screenshots`: Documentazione visuale delle funzionalità implementate.

---

Sviluppato con ❤️ da **CosmoNetinfo**.
