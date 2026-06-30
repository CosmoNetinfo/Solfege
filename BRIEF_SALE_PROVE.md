# ANTIGRAVITY — BRIEF: Gestione Sale & Prove

> Da implementare sulla web app esistente (Supabase).
> Questa funzionalità serve sia nella web app demo che nell'app desktop (SQLite).

---

## OBIETTIVO

Aggiungere una sezione dedicata "Sale & Prove" che permette di:
- Prenotare una sala per lezioni, prove band, eventi
- Vedere a colpo d'occhio quali sale sono libere in un certo orario
- Far apparire le prenotazioni anche nel calendario generale esistente

---

## PARTE 1 — DATABASE (Supabase SQL Editor)

### 1.1 Nuova tabella room_bookings

```sql
CREATE TABLE IF NOT EXISTS room_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'sala_prove' 
    CHECK (tipo IN ('lezione', 'sala_prove', 'evento', 'altro')),
  titolo TEXT NOT NULL,
  nome_gruppo TEXT,
  contatto_nome TEXT,
  contatto_telefono TEXT,
  contatto_email TEXT,
  data DATE NOT NULL,
  ora_inizio TIME NOT NULL,
  ora_fine TIME NOT NULL,
  note TEXT,
  colore TEXT DEFAULT '#7C3AED',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT no_overlap EXCLUDE USING gist (
    room_id WITH =,
    tsrange(
      (data + ora_inizio)::timestamp,
      (data + ora_fine)::timestamp
    ) WITH &&
  )
);

-- RLS
ALTER TABLE room_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "school_room_bookings" ON room_bookings
  FOR ALL USING (school_id = get_my_school_id());
```

**NOTA:** Se l'estensione btree_gist non è disponibile, rimuovere il CONSTRAINT no_overlap e gestire il controllo conflitti lato applicazione.

### 1.2 Aggiungere colonna tipo alla tabella rooms

```sql
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'aula' 
  CHECK (tipo IN ('aula', 'sala_prove', 'sala_comune', 'altro'));
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS colore TEXT DEFAULT '#E8621A';
```

---

## PARTE 2 — NUOVA SEZIONE "Sale & Prove"

### 2.1 Struttura file

```
app/(admin)/sale/
├── page.tsx          ← pagina principale
└── components/
    ├── RoomTimeline.tsx     ← vista timeline per sala
    ├── BookingDialog.tsx    ← form prenotazione
    ├── BookingCard.tsx      ← card singola prenotazione
    └── ConflictChecker.tsx  ← verifica sovrapposizioni
```

### 2.2 Aggiungere voce in sidebar admin

**File da modificare:** `app/(admin)/layout.tsx`

Aggiungere voce dopo "Calendario":
```
[DoorOpen]  Sale & Prove   → /admin/sale
```
Icona: `DoorOpen` da lucide-react.

### 2.3 Pagina principale — `app/(admin)/sale/page.tsx`

**Layout pagina:**

```
┌─────────────────────────────────────────────────────┐
│  Sale & Prove                    [+ Nuova Prenotazione] │
│  Gestisci le prenotazioni di tutte le sale           │
├─────────────────────────────────────────────────────┤
│                                                      │
│  [← ]  Martedì 1 Luglio 2026  [ →]   [Oggi]        │
│                                                      │
│  SALA A          SALA B          SALA PROVE          │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐        │
│  │ 09:00    │   │ 09:00    │   │ 09:00    │        │
│  │ LIBERA   │   │ Lezione  │   │ LIBERA   │        │
│  │          │   │ Chitarra │   │          │        │
│  │ 10:00    │   │ (Rossi)  │   │ 10:00    │        │
│  │ Lezione  │   │──────────│   │ I Dannati│        │
│  │ Piano    │   │ 11:00    │   │ (Sala    │        │
│  │ (Bianchi)│   │ LIBERA   │   │  Prove)  │        │
│  └──────────┘   └──────────┘   └──────────┘        │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Dati da mostrare nella timeline:**
- Query `lessons` per la data selezionata (con room_id)
- Query `room_bookings` per la data selezionata
- Unire i due risultati per sala, ordine cronologico
- Fasce orarie dalle 08:00 alle 22:00 (ogni 30 minuti)
- Blocchi colorati per le occupazioni, sfondo verde chiaro per le fasce libere

**Colori per tipo:**
- Lezione: `#E8621A` (arancio — colore del corso)
- Sala prove: `#7C3AED` (viola)
- Evento: `#1A7A4A` (verde)
- Altro: `#D97706` (ambra)

**Navigazione date:**
- Frecce ← → per giorno precedente/successivo
- Pulsante "Oggi" per tornare alla data corrente
- Data selezionata in grande al centro

### 2.4 Dialog Nuova Prenotazione — `BookingDialog.tsx`

```
Form campi:
  Tipo *              [Sala Prove ▼]  (lezione/sala_prove/evento/altro)
  Sala *              [Seleziona sala ▼]
  Titolo *            es. "Prove band", "Saggio di fine anno"
  Nome gruppo/band    es. "I Dannati"
  Data *              [date picker]
  Ora inizio *        [time picker]
  Ora fine *          [time picker]
  Contatto nome       
  Contatto telefono   
  Note                [textarea]

Sotto i campi orario → controllo conflitti in tempo reale:
  Se sala occupata in quell'orario → banner rosso:
  "⚠ Sala occupata: [titolo occupazione] dalle 10:00 alle 11:30"
  
  Se libera → banner verde:
  "✓ Sala disponibile in questo orario"

Pulsanti: [Annulla] [Salva Prenotazione]
```

**Logica controllo conflitti (lato client):**
```typescript
// Quando l'utente seleziona sala + data + orario:
// 1. Query lessons WHERE room_id = X AND data = Y
// 2. Query room_bookings WHERE room_id = X AND data = Y
// 3. Controlla se c'è sovrapposizione con l'orario scelto
// 4. Mostra feedback visivo immediato
```

### 2.5 Card prenotazione — `BookingCard.tsx`

Blocco colorato nella timeline con:
- Titolo prenotazione (es. "I Dannati — Sala Prove")
- Orario (es. "10:00 – 12:30")
- Icona tipo (Music2 per sala prove, Calendar per evento)
- Al click: popover con dettagli completi + pulsanti Modifica / Elimina

---

## PARTE 3 — INTEGRAZIONE CON CALENDARIO ESISTENTE

**File da modificare:** `app/(admin)/calendario/page.tsx`

Le prenotazioni `room_bookings` devono apparire nel calendario react-big-calendar esistente come eventi aggiuntivi.

**Da aggiungere alla query che carica gli eventi:**
```typescript
// Aggiungere alla fetch eventi esistente:
const { data: bookings } = await supabase
  .from('room_bookings')
  .select('*, rooms(nome)')
  .eq('school_id', schoolId)

// Convertire in formato react-big-calendar:
const bookingEvents = bookings?.map(b => ({
  id: `booking-${b.id}`,
  title: `${b.titolo}${b.nome_gruppo ? ` — ${b.nome_gruppo}` : ''} (${b.rooms?.nome})`,
  start: new Date(`${b.data}T${b.ora_inizio}`),
  end: new Date(`${b.data}T${b.ora_fine}`),
  resource: { type: 'booking', color: b.colore || '#7C3AED', data: b }
}))

// Unire con gli eventi lezione esistenti
const allEvents = [...lessonEvents, ...bookingEvents]
```

**Stile evento nel calendario:**
- Bordo sinistro 4px viola `#7C3AED` per le prenotazioni sala
- Sfondo viola chiaro `rgba(124,58,237,0.15)`
- Testo `#7C3AED`
- Tooltip al hover con dettagli

---

## PARTE 4 — SCHEMA SQLite (per app desktop)

Aggiungere alla migrazione `001_initial.sql` in `src-tauri/migrations/`:

```sql
CREATE TABLE IF NOT EXISTS room_bookings (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  room_id TEXT REFERENCES rooms(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'sala_prove' 
    CHECK (tipo IN ('lezione', 'sala_prove', 'evento', 'altro')),
  titolo TEXT NOT NULL,
  nome_gruppo TEXT,
  contatto_nome TEXT,
  contatto_telefono TEXT,
  contatto_email TEXT,
  data TEXT NOT NULL,
  ora_inizio TEXT NOT NULL,
  ora_fine TEXT NOT NULL,
  note TEXT,
  colore TEXT DEFAULT '#7C3AED',
  created_at TEXT DEFAULT (datetime('now'))
);
```

E aggiungere in `lib/desktop-db.ts`:

```typescript
export const roomBookingsDb = {
  getByDate: async (date: string) => {
    const db = await getDb()
    return db.select(`
      SELECT rb.*, r.nome as room_nome
      FROM room_bookings rb
      JOIN rooms r ON rb.room_id = r.id
      WHERE rb.data = ?
      ORDER BY rb.ora_inizio
    `, [date])
  },
  checkConflict: async (roomId: string, date: string, oraInizio: string, oraFine: string, excludeId?: string) => {
    const db = await getDb()
    const results = await db.select(`
      SELECT id FROM room_bookings
      WHERE room_id = ? AND data = ?
        AND ora_inizio < ? AND ora_fine > ?
        ${excludeId ? 'AND id != ?' : ''}
    `, excludeId ? [roomId, date, oraFine, oraInizio, excludeId] : [roomId, date, oraFine, oraInizio])
    return results.length > 0
  },
  create: async (data: RoomBookingInsert) => {
    const db = await getDb()
    const id = crypto.randomUUID()
    await db.execute(`
      INSERT INTO room_bookings 
        (id, room_id, tipo, titolo, nome_gruppo, contatto_nome, 
         contatto_telefono, contatto_email, data, ora_inizio, ora_fine, note, colore)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, data.room_id, data.tipo, data.titolo, data.nome_gruppo,
        data.contatto_nome, data.contatto_telefono, data.contatto_email,
        data.data, data.ora_inizio, data.ora_fine, data.note, data.colore])
    return id
  },
  update: async (id: string, data: Partial<RoomBooking>) => {
    const db = await getDb()
    const fields = Object.keys(data).map(k => `${k} = ?`).join(', ')
    await db.execute(`UPDATE room_bookings SET ${fields} WHERE id = ?`, [...Object.values(data), id])
  },
  delete: async (id: string) => {
    const db = await getDb()
    await db.execute('DELETE FROM room_bookings WHERE id = ?', [id])
  },
}
```

---

## CHECKLIST VERIFICA

- [ ] SQL eseguito su Supabase senza errori
- [ ] Voce "Sale & Prove" appare nella sidebar admin con icona DoorOpen
- [ ] Pagina `/admin/sale` carica la timeline per data
- [ ] Timeline mostra tutte le sale in colonne affiancate
- [ ] Navigazione date (← →) funziona
- [ ] Dialog "Nuova Prenotazione" si apre con pulsante arancio
- [ ] Controllo conflitti funziona in tempo reale
- [ ] Salvataggio prenotazione funziona
- [ ] La prenotazione appare nella timeline
- [ ] La prenotazione appare nel calendario generale in viola
- [ ] Modifica e cancellazione prenotazione funzionano
- [ ] Schema SQLite aggiornato in `001_initial.sql`
- [ ] `npm run build` passa senza errori TypeScript
- [ ] `git add . && git commit -m "feat: sale e prove con timeline e calendario integrato" && git push`

---

*Solfège v2.0 — CosmoNet.info*
