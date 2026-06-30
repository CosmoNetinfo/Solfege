# ANTIGRAVITY — BRIEF PRIORITÀ IMMEDIATA
## Super Admin Panel + Landing Page
> Push su master → deploy automatico Vercel
> Repository: github.com/CosmoNetinfo/Solfege (branch: master)
> Database Supabase già aggiornato (tabelle licenses, error_reports, app_releases già create)

---

## CONTESTO

Il database Supabase è già pronto:
- Tabelle `licenses`, `error_reports`, `app_releases` già create con RLS corrette
- Account `admindany@gmail.com` ha già ruolo `superadmin` nel DB
- Non eseguire nessun SQL — il DB è già a posto

---

## PARTE A — SUPER ADMIN PANEL

### A1 — Aggiornare il tipo user_role nel codice TypeScript

**File da trovare e modificare:** `types/supabase.ts` o `lib/supabase/types.ts` o dove sono definiti i tipi Supabase generati.

Trovare la definizione dell'enum `user_role` e aggiungere `'superadmin'`:

```typescript
// Prima
type user_role = 'admin' | 'segreteria' | 'insegnante' | 'genitore' | 'allievo'

// Dopo
type user_role = 'admin' | 'segreteria' | 'insegnante' | 'genitore' | 'allievo' | 'superadmin'
```

### A2 — Aggiornare middleware.ts

**File da modificare:** `middleware.ts` (root del progetto)

Aggiungere alla logica di routing esistente PRIMA dei redirect degli altri ruoli:

```typescript
// Protezione rotta /superadmin
if (pathname.startsWith('/superadmin')) {
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .maybeSingle()
  if (profile?.role !== 'superadmin') {
    return NextResponse.redirect(new URL('/admin/dashboard', req.url))
  }
  return NextResponse.next()
}

// Nel blocco switch/if dei redirect per ruolo, aggiungere:
case 'superadmin':
  if (!pathname.startsWith('/superadmin')) {
    return NextResponse.redirect(new URL('/superadmin', req.url))
  }
  break
```

### A3 — Layout superadmin

**File da creare:** `app/(superadmin)/layout.tsx`

```typescript
'use client'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client' // adatta al path corretto
import { LayoutDashboard, Key, AlertTriangle, Package, LogOut } from 'lucide-react'
import Link from 'next/link'

// Sidebar scura identica all'admin (bg #1A1714)
// In cima: logo "Solfège" in font Cormorant Garamond + badge "Super Admin" arancio (#E8621A)
// Voci navigazione:
//   - Dashboard        → /superadmin          (icona: LayoutDashboard)
//   - Licenze          → /superadmin/licenze   (icona: Key)
//   - Errori App       → /superadmin/errori    (icona: AlertTriangle)
//   - Release          → /superadmin/release   (icona: Package)
//   - Logout           → chiama supabase.auth.signOut() poi redirect /login (icona: LogOut)
// Voce attiva: testo #E8621A + bg rgba(232,98,26,0.1)
// Testo normale: #C8C1BA
// Footer sidebar: "Solfège v2.0 — Super Admin"
// Main content: bg #FAFAF9, padding 32px
```

### A4 — Dashboard superadmin

**File da creare:** `app/(superadmin)/superadmin/page.tsx`

Questa è una pagina `async` Server Component che legge da Supabase con service role.

**KPI in cima (4 card in griglia 2x2 o 4 colonne):**
- "Licenze generate" → `SELECT COUNT(*) FROM licenses`
- "Licenze attive" → `SELECT COUNT(*) FROM licenses WHERE status = 'active'`
- "Errori aperti" → `SELECT COUNT(*) FROM error_reports WHERE resolved = false` (badge rosso se > 0)
- "Versione corrente" → `SELECT version FROM app_releases WHERE is_current = true LIMIT 1`

**Tabella "Ultime attivazioni" (sotto le card, metà schermo sx):**
Colonne: Key | Cliente | Attivata il | OS | Versione
Query: `SELECT * FROM licenses WHERE status = 'active' ORDER BY activated_at DESC LIMIT 5`

**Tabella "Ultimi errori" (metà schermo dx):**
Colonne: Data | Schermata | Errore | Stato
Query: `SELECT * FROM error_reports ORDER BY created_at DESC LIMIT 5`
Badge stato: rosso=aperto, verde=risolto

### A5 — Pagina Licenze

**File da creare:** `app/(superadmin)/superadmin/licenze/page.tsx`

**Struttura pagina:**
- Header con titolo "Gestione Licenze" + pulsante "Genera Licenza" (arancio, icona Plus)
- Tabella licenze (full width)
- Dialog per generazione + Dialog per dettaglio

**Tabella licenze — colonne:**
| License Key | Cliente | Email | WhatsApp | Status | Attivata il | OS | Versione | Azioni |
- License Key: font monospace, pulsante copia icona `Copy`
- Status badge: verde="Attiva" / grigio="Non attivata" / rosso="Revocata"
- Azioni: pulsante "Dettaglio" (icona Eye) + pulsante "Revoca" (icona XCircle, solo se status != 'revoked')

**Dialog "Genera Licenza" (si apre con pulsante in header):**
```
Form campi:
  - Nome cliente *      (input text)
  - Email cliente *     (input email)
  - WhatsApp            (input text, placeholder: +39...)
  - Note                (textarea)

Pulsante "Genera Licenza" → chiama POST /api/superadmin/generate-license

Dopo successo: mostra la key generata in grande:
  ┌─────────────────────────────────────┐
  │  SOLFEGE-K3M9-P2QR-7XWT            │ [Copia]
  └─────────────────────────────────────┘
  "Licenza generata con successo. Inviala al cliente."
  
  Pulsante "Chiudi" + Pulsante "Genera un'altra"
```

**Dialog "Dettaglio Licenza":**
Mostra tutti i campi della licenza inclusi machine_id, os_info, app_version, created_at, activated_at.

**Azione "Revoca":**
Confirmation dialog: "Sei sicuro di voler revocare questa licenza? Il cliente non potrà più usare l'app."
Pulsanti: "Annulla" | "Revoca" (rosso)
→ chiama PATCH /api/superadmin/revoke-license con { id }

### A6 — Pagina Errori

**File da creare:** `app/(superadmin)/superadmin/errori/page.tsx`

**Filtri in cima (3 tab o segmented control):**
- Tutti | Solo aperti | Solo risolti

**Tabella errori — colonne:**
| Data/ora | Licenza | Schermata | Azione | Errore | Versione | OS | Stato | Azioni |
- Errore: testo troncato a 60 char, hover/click espande
- Stato: badge rosso="Aperto" / verde="Risolto"
- Azioni: pulsante "Segna risolto" (icona CheckCircle) → apre mini-dialog con textarea nota risoluzione

**Dialog "Segna risolto":**
```
Textarea: "Note risoluzione (opzionale)"
Pulsante "Conferma" → chiama PATCH /api/superadmin/resolve-error con { id, note }
```

### A7 — Pagina Release

**File da creare:** `app/(superadmin)/superadmin/release/page.tsx`

**Form in cima "Pubblica nuova release":**
```
- Versione *           (input text, placeholder: 1.0.0)
- Note di rilascio *   (textarea, placeholder: "- Fixato tasto calendario\n- ...")
- URL Windows (.exe) * (input url)
- URL Mac (.dmg) *     (input url)
- URL Linux (.AppImage)(input url, opzionale)
- [ ] Imposta come versione corrente (checkbox, default: true)

Pulsante "Pubblica Release" → chiama POST /api/superadmin/publish-release
```

**Tabella storico release sotto:**
Colonne: Versione | Note | Windows | Mac | Linux | Corrente | Pubblicata il
- Versione corrente: badge arancio "CORRENTE"
- Link download: icona Download linkato

---

## PARTE B — API ROUTES

### B1 — Genera licenza

**File da creare:** `app/api/superadmin/generate-license/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server' // adatta al path

export async function POST(req: Request) {
  // 1. Verifica sessione e ruolo superadmin
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
  
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle()
  if (profile?.role !== 'superadmin') return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })

  // 2. Leggi body
  const { customer_name, customer_email, customer_whatsapp, notes } = await req.json()
  if (!customer_name || !customer_email) {
    return NextResponse.json({ error: 'Nome e email obbligatori' }, { status: 400 })
  }

  // 3. Genera key
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const segment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  const license_key = `SOLFEGE-${segment()}-${segment()}-${segment()}`

  // 4. Salva in DB
  const { data, error } = await supabase.from('licenses').insert({
    license_key,
    customer_name,
    customer_email,
    customer_whatsapp: customer_whatsapp || null,
    notes: notes || null,
    status: 'inactive'
  }).select().maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ license_key: data.license_key })
}
```

### B2 — Revoca licenza

**File da creare:** `app/api/superadmin/revoke-license/route.ts`

```typescript
// PATCH — body: { id: string }
// Verifica superadmin, aggiorna status = 'revoked' + updated_at = NOW()
// Risponde con { success: true }
```

### B3 — Segna errore risolto

**File da creare:** `app/api/superadmin/resolve-error/route.ts`

```typescript
// PATCH — body: { id: string, note?: string }
// Verifica superadmin, aggiorna resolved = true, resolved_at = NOW(), resolved_note = note
// Risponde con { success: true }
```

### B4 — Pubblica release

**File da creare:** `app/api/superadmin/publish-release/route.ts`

```typescript
// POST — body: { version, release_notes, windows_url, mac_url, linux_url?, is_current }
// Verifica superadmin
// Se is_current = true → prima UPDATE app_releases SET is_current = false WHERE is_current = true
// INSERT in app_releases
// Risponde con { success: true }
```

### B5 — Latest version (pubblica, no auth)

**File da creare:** `app/api/latest-version/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data } = await supabase
    .from('app_releases')
    .select('*')
    .eq('is_current', true)
    .maybeSingle()

  if (!data) {
    return NextResponse.json({ version: '1.0.0', release_notes: '', windows_url: null, mac_url: null, linux_url: null })
  }

  return NextResponse.json({
    version: data.version,
    release_notes: data.release_notes,
    windows_url: data.windows_url,
    mac_url: data.mac_url,
    linux_url: data.linux_url
  })
}
```

### B6 — Error report (pubblica, no auth)

**File da creare:** `app/api/error-report/route.ts`

```typescript
// POST — body: { license_key, error_type, error_message, error_stack?, screen_name?, action_performed?, app_version, os_info }
// NON richiede autenticazione
// Verifica solo che license_key esista in licenses (se non esiste, accetta comunque e salva senza FK)
// INSERT in error_reports
// Risponde SEMPRE 200 OK — mai bloccare l'app desktop per errori di logging
```

### B7 — Attivazione licenza (pubblica, no auth)

**File da creare:** `app/api/activate-license/route.ts`

```typescript
// POST — body: { license_key, machine_id, app_version, os_info }
// NON richiede autenticazione (chiamata dall'app desktop)
// Logica:
//   - Se license_key non esiste → 404 "Licenza non trovata"
//   - Se status = 'revoked' → 403 "Licenza revocata"
//   - Se status = 'active' E machine_id corrisponde → 200 OK (stessa macchina)
//   - Se status = 'active' E machine_id diverso → 403 "Licenza già attiva su un altro dispositivo"
//   - Se status = 'inactive' → UPDATE status='active', activated_at=NOW(), machine_id, app_version, os_info → 200 OK
// Risposta successo: { success: true, customer_name: string }
```

---

## PARTE C — LANDING PAGE AGGIORNATA

### Contesto importante
La landing page attuale (`app/page.tsx` o simile) parla ancora di:
- Abbonamenti mensili/annuali (Free €0, Starter €14, Pro €29, WhiteLabel €79)
- "Inizia gratis" / "30 giorni di prova"
- App docente mobile (eliminata)
- Portal genitori (eliminato)
- Iscrizioni online (eliminate)

**Tutto questo va rimosso e sostituito** con il nuovo posizionamento: app desktop nativa, acquisto one-time €249, trial 15 giorni.

### C1 — Nuova struttura landing page

**File da modificare:** `app/page.tsx` (o dove si trova la landing attuale)

Mantenere lo stesso design system (Cormorant Garamond + DM Sans, arancio #E8621A, sfondo #FAFAF9). Mantenere il layout generale (navbar + hero + sezioni + footer).

#### SEZIONE 1 — Navbar

```
Logo Solfège | [Funzioni] [Prezzi] [Contatti] | [Accedi] [Acquista — €249]
```
- Rimuovere "Inizia gratis" e "Registrati"
- Aggiungere pulsante "Acquista — €249" (arancio, link a #pricing)

#### SEZIONE 2 — Hero

**Titolo:** "Il gestionale per la tua scuola di musica"
**Sottotitolo:** "Allievi, docenti, pagamenti, presenze e calendario in un'unica app desktop. Nessun abbonamento. Nessun cloud. I tuoi dati restano nel tuo PC."

**Badge in cima:** "Nuovo — App desktop nativa per Windows e Mac"

**CTA principale:**
```
[Acquista ora — €249 una tantum]   [Prova gratis 15 giorni]
```
Sotto i CTA: "Licenza a vita · Aggiornamenti inclusi · Supporto WhatsApp diretto"

**Rimuovere:** "Nessuna carta di credito richiesta · 30 giorni di prova completa · Setup in 2 minuti"

#### SEZIONE 3 — Vantaggi app desktop (sostituisce la vecchia galleria)

**Titolo:** "Perché un'app desktop?"

4 card in griglia 2x2:

```
[HardDrive]  I tuoi dati restano nel tuo PC
             Nessun cloud, nessun server esterno.
             Privacy totale, zero abbonamenti.

[Wifi]       Funziona anche offline
             Nessuna connessione internet richiesta
             per la gestione quotidiana.

[RefreshCw]  Aggiornamenti automatici
             Nuove funzioni scaricate in automatico.
             Nessun intervento manuale.

[Shield]     Un solo pagamento, per sempre
             €249 una tantum. Nessun rinnovo,
             nessuna sorpresa in bolletta.
```

#### SEZIONE 4 — Funzionalità (aggiornata)

**Titolo:** "Tutto quello che serve. Niente di superfluo."

Mantenere le card funzionalità ma aggiornare:
- RIMUOVERE: "App Docente Mobile", "Portale Genitori", "Sicurezza Multi-Tenant", "Iscrizioni online"
- MANTENERE: Gestione Allievi, Gestione Docenti, Calendario Interattivo, Pagamenti e Ricevute, Registro Presenze, Statistiche Avanzate
- AGGIUNGERE:

```
[Download]   Installazione semplice
             Scarica, installa, inserisci la licenza
             e sei operativo in 5 minuti.
             Disponibile per Windows e Mac.

[Database]   Database locale SQLite
             I dati della tua scuola salvati
             in locale. Export e backup con un click.
```

#### SEZIONE 5 — Prezzi (completamente riscritta)

**ID sezione:** `id="pricing"`
**Titolo:** "Un prezzo. Tutto incluso."
**Sottotitolo:** "Nessun abbonamento. Nessun rinnovo. Paghi una volta, usi per sempre."

**Card prezzo unica (centrata, grande):**
```
┌──────────────────────────────────────────┐
│           Solfège Desktop                │
│                                          │
│              €249                        │
│          una tantum                      │
│                                          │
│  ✓ Licenza a vita                        │
│  ✓ Aggiornamenti inclusi per sempre      │
│  ✓ Supporto WhatsApp diretto             │
│  ✓ Allievi illimitati                    │
│  ✓ Docenti illimitati                    │
│  ✓ Database locale (privacy totale)      │
│  ✓ Funziona offline                      │
│  ✓ Windows + Mac                         │
│  ✓ Trial 15 giorni completo              │
│                                          │
│  [Acquista via WhatsApp]                 │
│  link: https://wa.me/393517064080        │
│                                          │
│  oppure scrivi a admindany@gmail.com     │
└──────────────────────────────────────────┘
```

**Sotto la card:**
"Come funziona: ci scrivi su WhatsApp → ti mandiamo il link di pagamento → ricevi la licenza → scarichi e installi."

**RIMUOVERE completamente:** tutti i piani Free/Starter/Pro/WhiteLabel, toggle mensile/annuale/lifetime, tabella confronto piani.

#### SEZIONE 6 — Come funziona (nuova sezione)

**Titolo:** "Operativo in 5 minuti"

3 step orizzontali:
```
[1] Acquista           [2] Installa            [3] Inizia
Contattaci su          Scarica il file         Inserisci la
WhatsApp o email.      .exe o .dmg e           licenza, crea
Ricevi la licenza      installalo sul          il tuo account
in pochi minuti.       tuo PC in un click.     e parti subito.
```

#### SEZIONE 7 — Confronto competitor (aggiornare)

**Titolo:** "Perché Solfège?"

Aggiornare la tabella rimuovendo confronti su abbonamenti e aggiungendo confronto su modello desktop vs cloud:

| Funzione | Solfège Desktop | Mooking | Asso360 | Academy Mgr |
|---|---|---|---|---|
| Prezzi pubblici | ✓ Sì | ✗ "Contattaci" | ✗ "Contattaci" | ✗ "Contattaci" |
| App desktop nativa | ✓ Windows + Mac | ✗ Solo web | ✗ Solo web | ✓ Parziale |
| Dati in locale | ✓ Privacy totale | ✗ Cloud obbligatorio | ✗ Cloud obbligatorio | ✓ Sì |
| Funziona offline | ✓ Sì | ✗ No | ✗ No | ✓ Parziale |
| Acquisto una tantum | ✓ €249 vita | ✗ ~€60-80/mese | ✗ ~€25-40/mese | ✗ ~€50+/mese |
| Aggiornamenti inclusi | ✓ A vita | ✓ Inclusi | ✓ Inclusi | ✓ Inclusi |
| Supporto italiano | ✓ WhatsApp diretto | ✓ Sì | ✓ Sì | ✓ Sì |
| Trial senza carta | ✓ 15 giorni | ✗ Demo obbligatoria | ✓ 14 giorni | ✗ No |

#### SEZIONE 8 — Recensioni

Mantenere le 3 recensioni esistenti ma aggiornare i testi per rimuovere riferimenti al SaaS/cloud:

```
Marco R. — Direttore Accademia Musicale, Milano
"Finalmente un gestionale che capisce come funziona una scuola di musica.
Setup in 5 minuti e i miei dati restano nel mio PC. Zero pensieri."

Elena B. — Segreteria Scuola di Musica, Roma  
"Prima usavamo Excel per tutto. Con Solfège i pagamenti scaduti li vedo
subito e le ricevute PDF le mando su WhatsApp in un secondo."

Luca V. — Insegnante e co-fondatore, Napoli
"Paghi una volta e non ci pensi più. Nessun abbonamento da ricordare,
nessuna sorpresa. E quando ho avuto un problema il supporto
ha risposto in meno di un'ora."
```

#### SEZIONE 9 — CTA finale

**Titolo:** "Pronto a portare ordine nella tua scuola?"
**Sottotitolo:** "15 giorni di prova completa. Poi €249 una tantum, per sempre."

```
[Acquista ora — €249]    [Scrivici su WhatsApp]
```

#### SEZIONE 10 — Footer

Aggiornare rimuovendo link "Registrati" e aggiungendo:
```
[Acquista] · [Supporto WhatsApp] · [Email]
© 2026 Solfège — App Desktop per Scuole di Musica · Made in Italy · Sviluppato da CosmoNet.info
```

---

## CHECKLIST VERIFICA FINALE

Prima del push verificare:

### Super Admin Panel
- [ ] `npm run build` passa senza errori TypeScript
- [ ] Login con `admindany@gmail.com` → redirect a `/superadmin` (non a `/admin/dashboard`)
- [ ] Login con altro account → `/superadmin` non accessibile (redirect a `/admin/dashboard`)
- [ ] Accesso diretto a `/superadmin` senza login → redirect a `/login`
- [ ] Pagina Licenze carica senza errori
- [ ] Dialog "Genera Licenza" funziona e mostra la key generata
- [ ] Tabella licenze mostra le licenze (anche vuota è ok)
- [ ] API GET `/api/latest-version` risponde con JSON (nessun auth richiesta)
- [ ] API POST `/api/error-report` risponde 200 senza auth

### Landing Page
- [ ] Nessun riferimento a piani Free/Starter/Pro/WhiteLabel
- [ ] Nessun "Inizia gratis" o "30 giorni di prova" (ora è "15 giorni")
- [ ] Prezzo €249 visibile chiaramente
- [ ] Pulsante WhatsApp funzionante (link: https://wa.me/393517064080)
- [ ] Sezione "Come funziona" presente con 3 step
- [ ] Tabella confronto competitor aggiornata
- [ ] Mobile responsive (verificare su viewport 375px)

### Deploy
- [ ] `git add .`
- [ ] `git commit -m "feat: superadmin panel + license manager + landing page v2"`
- [ ] `git push` → Vercel fa deploy automatico

---

## NOTE IMPORTANTI

1. **Non toccare** le pagine `(admin)/*` — quelle rimangono intatte
2. **Non toccare** `app/api/auth/*` — il flusso auth Supabase rimane uguale per la web app
3. **Il ruolo superadmin nel middleware** va gestito come PRIMO caso, prima degli altri ruoli
4. **Le API `/api/superadmin/*`** devono verificare SEMPRE il ruolo superadmin prima di eseguire qualsiasi operazione
5. **Le API pubbliche** (`/api/latest-version`, `/api/error-report`, `/api/activate-license`) non richiedono auth — sono chiamate dall'app desktop
6. **Design system**: sidebar superadmin identica all'admin (stessi colori, stesso font, stesso stile) — solo il badge "Super Admin" la distingue

---

*Brief generato per Solfège v2.0*
*Daniele Spalletti — CosmoNet.info — Giugno 2026*
