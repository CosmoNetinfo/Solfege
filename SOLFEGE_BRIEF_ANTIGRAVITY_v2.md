# SOLFÈGE — Brief Tecnico v2.0 per Antigravity
> Gestionale SaaS Multi-Tenant per Scuole di Musica
> Stack: Next.js 14 · Supabase · Vercel · Tailwind · shadcn/ui
> **Segui gli step in ordine. Non passare al successivo finché la checklist non è completa.**

---

## 🤖 COME USARE ANTIGRAVITY

- Imposta Terminal Command su "Request Review" inizialmente
- Dai un solo step alla volta, aspetta gli Artifact, verifica la checklist
- Se ci sono errori TypeScript o runtime, incollali nel prompt e chiedi fix prima di procedere
- Antigravity può pianificare, scrivere codice, avviare il dev server e testare nel browser autonomamente — sfruttalo per le verifiche

---

## 🎨 DESIGN SYSTEM — PRIORITÀ ASSOLUTA
> Leggilo e applicalo in ogni componente. Nessuna eccezione.

### Palette

```css
:root {
  --bg:              #FAFAF9;   /* sfondo principale, mai bianco puro */
  --surface:         #FFFFFF;   /* card, dialog */
  --border:          #E8E4E0;
  --text:            #1A1714;   /* testo principale */
  --muted:           #7A736C;   /* testi secondari */

  --orange:          #E8621A;   /* pulsanti primari, CTA, voce sidebar attiva */
  --orange-light:    #FDF0E8;   /* badge, highlight */
  --orange-dark:     #C94E0E;   /* hover pulsante primario */

  --green:           #1A7A4A;   /* pagato, presente, successo */
  --green-light:     #E8F5EE;
  --red:             #C0392B;   /* errore, scaduto, assente */
  --red-light:       #FDECEA;
  --amber:           #D97706;   /* avviso, in attesa, recupero */
  --amber-light:     #FEF3C7;

  --sidebar-bg:      #1A1714;   /* sidebar admin: quasi nero caldo */
  --sidebar-text:    #C8C1BA;
  --sidebar-active:  #E8621A;
}
```

### Tipografia

```
Display / Logo / Titoli H1-H2:  "Cormorant Garamond" (Google Fonts) — serif elegante
Corpo / UI / Label / Input:     "DM Sans" (Google Fonts) — moderno e leggibile
Codici / ID / Numeri ricevuta:  "JetBrains Mono" (Google Fonts)
```

```html
<!-- In app/layout.tsx -->
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono&display=swap" rel="stylesheet" />
```

### Icone — REGOLA ASSOLUTA
- **Usa ESCLUSIVAMENTE `lucide-react`**
- **ZERO emoji** (no 🎵 🏠 💰 — mai)
- **ZERO Font Awesome, ZERO clipart**
- Icone consigliate: `LayoutDashboard`, `Users`, `GraduationCap`, `Music`, `Calendar`, `CreditCard`, `Wallet`, `BarChart3`, `Settings2`, `ClipboardCheck`, `CheckCircle2`, `Building2`, `UserRound`, `Receipt`, `Download`, `Printer`, `Share2`

### Regole UI
- Border-radius: `0.5rem` card · `0.375rem` input · `9999px` badge
- Shadow card: `shadow-sm` a riposo · `shadow-md` su hover
- Pulsante primario: bg `--orange`, testo bianco, hover `--orange-dark`
- Pulsante secondario: bordo `--border`, bg trasparente, hover bg stone-50
- Input focus: ring 2px `--orange`
- Tabelle: header bg stone-50, righe alternate bianco/stone-50/30
- Sidebar: **sempre scura** (`--sidebar-bg`), testo `--sidebar-text`, voce attiva `--sidebar-active`
- Interfaccia docente: layout mobile-first, bottom navigation, card grandi con touch target ≥ 48px

---

## 📦 STACK COMPLETO

```
Next.js 14+           App Router + TypeScript
Supabase              PostgreSQL + Auth + RLS + Storage
Tailwind CSS          + shadcn/ui
Vercel                Deploy
lucide-react          Icone (unica libreria icone ammessa)
framer-motion         Animazioni sidebar e transizioni
react-big-calendar    Calendario lezioni
@tanstack/react-table Tabelle con sort/filter/pagination
recharts              Grafici statistiche
react-hook-form       Form management
zod                   Validazione schema
@hookform/resolvers   Integrazione RHF + Zod
zustand               Stato globale leggero
sonner                Toast notifications
@react-pdf/renderer   Generazione PDF ricevute
date-fns              Gestione date
resend                Email transazionali (struttura pronta, invio opzionale v1)
```

---

## 📁 STRUTTURA CARTELLE

```
solfege/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx          ← wizard onboarding nuova scuola
│   ├── (admin)/
│   │   ├── layout.tsx                 ← sidebar desktop fissa
│   │   ├── dashboard/page.tsx
│   │   ├── allievi/
│   │   │   ├── page.tsx
│   │   │   ├── nuovo/page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       └── edit/page.tsx
│   │   ├── insegnanti/
│   │   │   ├── page.tsx
│   │   │   ├── nuovo/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── corsi/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── calendario/page.tsx
│   │   ├── pagamenti/page.tsx
│   │   ├── compensi/page.tsx
│   │   ├── statistiche/page.tsx
│   │   └── impostazioni/page.tsx
│   ├── (teacher)/
│   │   ├── layout.tsx                 ← bottom nav mobile-first
│   │   ├── home/page.tsx
│   │   ├── presenze/[corsoId]/page.tsx
│   │   ├── allievi/page.tsx
│   │   └── profilo/page.tsx
│   ├── api/
│   │   └── send-email/route.ts        ← Resend (opzionale v1)
│   └── layout.tsx
├── components/
│   ├── ui/                            ← shadcn components
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── BottomNav.tsx              ← docente mobile
│   ├── admin/
│   ├── teacher/
│   └── shared/
│       ├── EmptyState.tsx
│       ├── SkeletonTable.tsx
│       └── StatusBadge.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── queries.ts
│   ├── pdf/
│   │   └── receipt.tsx
│   ├── email/
│   │   └── templates.ts
│   └── utils.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useLezioni.ts
│   └── useStatistiche.ts
├── store/
│   └── useAuthStore.ts
├── types/
│   └── database.types.ts
├── middleware.ts
└── supabase/
    ├── migrations/
    │   └── 001_schema.sql
    └── seed.sql
```

---

## 🗄️ STEP 1 — Database Supabase: Schema SQL Completo

### Prompt per Antigravity:

Crea `/supabase/migrations/001_schema.sql` con lo schema PostgreSQL completo.

### Schema SQL

```sql
-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUM TYPES
-- ============================================================
CREATE TYPE user_role AS ENUM ('admin', 'segreteria', 'insegnante');
CREATE TYPE tipo_corso AS ENUM ('individuale', 'collettivo', 'online');
CREATE TYPE livello_corso AS ENUM ('principiante', 'intermedio', 'avanzato', 'professionale');
CREATE TYPE stato_lezione AS ENUM ('programmata', 'completata', 'cancellata', 'recupero');
CREATE TYPE stato_pagamento AS ENUM ('in_attesa', 'pagato', 'in_ritardo', 'rimborsato', 'annullato');
CREATE TYPE metodo_pagamento AS ENUM ('contanti', 'carta', 'bonifico', 'altro');
CREATE TYPE price_model AS ENUM ('mensile', 'pacchetto', 'annuale');
CREATE TYPE giorno_settimana AS ENUM ('lunedi','martedi','mercoledi','giovedi','venerdi','sabato','domenica');

-- ============================================================
-- SCHOOLS (tenant root — ogni scuola è isolata)
-- ============================================================
CREATE TABLE schools (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  logo_url        TEXT,
  address         TEXT,
  phone           TEXT,
  email           TEXT,
  website         TEXT,
  timezone        TEXT DEFAULT 'Europe/Rome',
  currency        TEXT DEFAULT 'EUR',
  plan            TEXT DEFAULT 'trial',
  trial_ends_at   TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROFILES (estende auth.users)
-- ============================================================
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id   UUID REFERENCES schools(id) ON DELETE CASCADE,
  role        user_role NOT NULL DEFAULT 'segreteria',
  first_name  TEXT,
  last_name   TEXT,
  phone       TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INSTRUMENTS / MATERIE
-- ============================================================
CREATE TABLE instruments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROOMS / AULE
-- ============================================================
CREATE TABLE rooms (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id     UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  capacity      INT DEFAULT 1,
  insonorizzata BOOLEAN DEFAULT FALSE,
  attrezzature  TEXT[],
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TEACHERS
-- ============================================================
CREATE TABLE teachers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id         UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  profile_id        UUID REFERENCES profiles(id) ON DELETE SET NULL,
  first_name        TEXT NOT NULL,
  last_name         TEXT NOT NULL,
  email             TEXT,
  phone             TEXT,
  fiscal_code       TEXT,
  specializzazioni  TEXT[],
  rate_individual   NUMERIC(10,2) DEFAULT 0,
  rate_group        NUMERIC(10,2) DEFAULT 0,
  iban              TEXT,
  note_contratto    TEXT,
  data_assunzione   DATE,
  active            BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TEACHER AVAILABILITY
-- ============================================================
CREATE TABLE disponibilita_insegnanti (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id     UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  teacher_id    UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  giorno        giorno_settimana NOT NULL,
  ora_inizio    TIME NOT NULL,
  ora_fine      TIME NOT NULL,
  CONSTRAINT ora_fine_dopo_inizio CHECK (ora_fine > ora_inizio)
);

-- ============================================================
-- STUDENTS
-- ============================================================
CREATE TABLE students (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id       UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  first_name      TEXT NOT NULL,
  last_name       TEXT NOT NULL,
  dob             DATE,
  email           TEXT,
  phone           TEXT,
  address         TEXT,
  city            TEXT,
  cap             TEXT,
  fiscal_code     TEXT,
  parent_name     TEXT,
  parent_surname  TEXT,
  parent_phone    TEXT,
  parent_email    TEXT,
  note_mediche    TEXT,
  notes           TEXT,
  active          BOOLEAN DEFAULT TRUE,
  enrolled_at     DATE DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TESSERE (membership card per anno scolastico)
-- ============================================================
CREATE TABLE tessere (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id       UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  numero_tessera  TEXT,
  anno_scolastico TEXT NOT NULL,
  tipo            TEXT DEFAULT 'standard',
  importo         NUMERIC(10,2) DEFAULT 0,
  pagata          BOOLEAN DEFAULT FALSE,
  data_pagamento  DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, anno_scolastico)
);

-- ============================================================
-- COURSES
-- ============================================================
CREATE TABLE courses (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id         UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  type              tipo_corso NOT NULL,
  level             livello_corso DEFAULT 'principiante',
  instrument_id     UUID REFERENCES instruments(id) ON DELETE SET NULL,
  room_id           UUID REFERENCES rooms(id) ON DELETE SET NULL,
  day_of_week       INT CHECK (day_of_week BETWEEN 0 AND 6),
  start_time        TIME,
  duration_min      INT DEFAULT 60,
  max_students      INT DEFAULT 1,
  price_model       price_model NOT NULL DEFAULT 'mensile',
  price             NUMERIC(10,2) DEFAULT 0,
  colore_calendario TEXT DEFAULT '#E8621A',
  anno_scolastico   TEXT DEFAULT '2024-2025',
  active            BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ENROLLMENTS
-- ============================================================
CREATE TABLE enrollments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id       UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id       UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  teacher_id      UUID REFERENCES teachers(id) ON DELETE SET NULL,
  start_date      DATE NOT NULL,
  end_date        DATE,
  discount_pct    NUMERIC(5,2) DEFAULT 0,
  price_override  NUMERIC(10,2),
  status          TEXT DEFAULT 'active' CHECK (status IN ('active','suspended','ended')),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LISTA ATTESA
-- ============================================================
CREATE TABLE lista_attesa (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id  UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id   UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, course_id)
);

-- ============================================================
-- LESSONS
-- ============================================================
CREATE TABLE lessons (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id           UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  course_id           UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  teacher_id          UUID REFERENCES teachers(id) ON DELETE SET NULL,
  room_id             UUID REFERENCES rooms(id) ON DELETE SET NULL,
  data_ora_inizio     TIMESTAMPTZ NOT NULL,
  data_ora_fine       TIMESTAMPTZ NOT NULL,
  status              stato_lezione DEFAULT 'programmata',
  note_docente        TEXT,
  lezione_recupero_di UUID REFERENCES lessons(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fine_dopo_inizio CHECK (data_ora_fine > data_ora_inizio)
);

-- ============================================================
-- ATTENDANCE
-- ============================================================
CREATE TABLE attendance (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  lesson_id   UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  student_id  UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status      TEXT NOT NULL CHECK (status IN ('present','absent','recovered','holiday')),
  voto        INT CHECK (voto BETWEEN 1 AND 10),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (lesson_id, student_id)
);

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE TABLE payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id       UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  enrollment_id   UUID REFERENCES enrollments(id) ON DELETE SET NULL,
  numero_ricevuta TEXT,
  description     TEXT,
  amount          NUMERIC(10,2) NOT NULL,
  due_date        DATE NOT NULL,
  paid_date       DATE,
  method          metodo_pagamento,
  status          stato_pagamento DEFAULT 'in_attesa',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TEACHER COMPENSATIONS
-- ============================================================
CREATE TABLE teacher_compensations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id         UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  teacher_id        UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  month             INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year              INT NOT NULL,
  hours_individual  NUMERIC(6,2) DEFAULT 0,
  hours_group       NUMERIC(6,2) DEFAULT 0,
  total_amount      NUMERIC(10,2) DEFAULT 0,
  paid              BOOLEAN DEFAULT FALSE,
  paid_date         DATE,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (teacher_id, month, year)
);

-- ============================================================
-- PERFORMANCE INDEXES
-- ============================================================
CREATE INDEX idx_lessons_data ON lessons(data_ora_inizio);
CREATE INDEX idx_lessons_teacher ON lessons(teacher_id);
CREATE INDEX idx_lessons_course ON lessons(course_id);
CREATE INDEX idx_payments_student ON payments(student_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_attendance_lesson ON attendance(lesson_id);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);

-- ============================================================
-- TRIGGERS: updated_at automatico
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_schools_updated_at      BEFORE UPDATE ON schools      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_profiles_updated_at     BEFORE UPDATE ON profiles     FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_teachers_updated_at     BEFORE UPDATE ON teachers     FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_students_updated_at     BEFORE UPDATE ON students     FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_courses_updated_at      BEFORE UPDATE ON courses      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_enrollments_updated_at  BEFORE UPDATE ON enrollments  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_lessons_updated_at      BEFORE UPDATE ON lessons      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_payments_updated_at     BEFORE UPDATE ON payments     FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TRIGGER: auto-crea profile dopo signup Auth
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, role)
  VALUES (NEW.id, 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- HELPER FUNCTION per RLS
-- ============================================================
CREATE OR REPLACE FUNCTION get_my_school_id()
RETURNS UUID AS $$
  SELECT school_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE schools                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE instruments              ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE disponibilita_insegnanti ENABLE ROW LEVEL SECURITY;
ALTER TABLE students                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE tessere                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments              ENABLE ROW LEVEL SECURITY;
ALTER TABLE lista_attesa             ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance               ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_compensations    ENABLE ROW LEVEL SECURITY;

-- Policy: admin e segreteria vedono tutto della propria scuola
CREATE POLICY "school_isolation" ON students
  USING (school_id = get_my_school_id());
-- (Replica questa policy su: instruments, rooms, teachers, courses,
--  enrollments, lista_attesa, lessons, attendance, payments,
--  teacher_compensations, tessere, disponibilita_insegnanti)

-- Policy: insegnante vede solo i propri corsi e allievi
CREATE POLICY "teacher_own_data" ON lessons
  USING (
    school_id = get_my_school_id()
    AND (
      teacher_id IN (SELECT id FROM teachers WHERE profile_id = auth.uid())
      OR get_my_role() IN ('admin', 'segreteria')
    )
  );
```

Crea anche `/supabase/seed.sql` con:
- 1 scuola "Accademia Verdi" + 1 admin
- 3 insegnanti con specializzazioni e disponibilità
- 3 aule
- 4 strumenti (chitarra, pianoforte, canto, violino)
- 5 corsi (mix individuale/collettivo)
- 10 allievi (3 minorenni con genitore)
- iscrizioni, lezioni, presenze, pagamenti realistici

### ✅ CHECKPOINT STEP 1

- [ ] schema.sql esiste con tutte e 15 le tabelle
- [ ] Tutti gli ENUM sono definiti (8 tipi)
- [ ] Tutti i trigger `updated_at` presenti (8 trigger)
- [ ] Trigger `on_auth_user_created` presente
- [ ] Funzioni `get_my_school_id()` e `get_my_role()` presenti
- [ ] RLS abilitato su tutte le 15 tabelle
- [ ] Esegui schema.sql nel SQL Editor Supabase → 0 errori
- [ ] Esegui seed.sql → dati presenti nelle tabelle
- [ ] Verifica in Supabase Table Editor: 15 tabelle visibili

---

## ⚙️ STEP 2 — Setup Next.js & Dipendenze

### Prompt per Antigravity:

Crea un nuovo progetto Next.js 14 con App Router e TypeScript.

```bash
npx create-next-app@latest solfege \
  --typescript --tailwind --eslint --app \
  --import-alias="@/*"

cd solfege

npm install @supabase/supabase-js @supabase/ssr
npm install lucide-react
npm install framer-motion
npm install react-hook-form zod @hookform/resolvers
npm install react-big-calendar date-fns
npm install @types/react-big-calendar
npm install @tanstack/react-table
npm install recharts
npm install zustand
npm install sonner
npm install @react-pdf/renderer
npm install resend

npx shadcn@latest init
# Style: Default | CSS variables: YES | Base color: Stone

npx shadcn@latest add button input label card table badge \
  dialog sheet select textarea dropdown-menu avatar \
  separator toast calendar popover tabs skeleton
```

Crea `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://PLACEHOLDER.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=PLACEHOLDER
SUPABASE_SERVICE_ROLE_KEY=PLACEHOLDER
NEXT_PUBLIC_APP_URL=http://localhost:3000
RESEND_API_KEY=PLACEHOLDER
```

Estendi `tailwind.config.ts` con il design system completo (colori, font come da design system in cima al documento).

Aggiungi i Google Fonts in `app/layout.tsx`.

Genera i tipi TypeScript da Supabase:
```bash
npx supabase gen types typescript --project-id IL_TUO_ID > types/database.types.ts
```

### ✅ CHECKPOINT STEP 2

- [ ] `npm run dev` avvia senza errori su localhost:3000
- [ ] `npm run build` passa senza errori
- [ ] `npx tsc --noEmit` → 0 errori TypeScript
- [ ] Font Cormorant Garamond e DM Sans caricati (verifica Network tab)
- [ ] Tailwind: testa `<div className="bg-orange text-white p-4">OK</div>`
- [ ] `types/database.types.ts` generato e non vuoto
- [ ] Tutti i componenti shadcn installati correttamente

---

## 🔐 STEP 3 — Supabase Client, Tipi & Middleware Auth

### Prompt per Antigravity:

1. Crea `/lib/supabase/client.ts` — client browser con `createBrowserClient`
2. Crea `/lib/supabase/server.ts` — client SSR con `createServerClient` + cookies
3. Crea `middleware.ts` nella root:
   - Non autenticato → redirect `/login`
   - Autenticato su `/login` → redirect `/admin/dashboard`
   - Ruolo `insegnante` su `/admin/*` → redirect `/teacher/home`
   - Refresh automatico token
4. Crea `/lib/supabase/queries.ts` con funzioni riutilizzabili:
   - `getProfile(userId)`
   - `getAllievi()` / `getAllievoById(id)`
   - `getInsegnanti()` / `getInsegnanteById(id)`
   - `getLezioniByDateRange(start, end, filters?)`
   - `getPagamentiByAllievo(studentId)`
   - `getPagamentiInRitardo()`
   - `getKpiDashboard(schoolId)`
5. Crea `/store/useAuthStore.ts` con Zustand: `user`, `profile`, `isLoading`, `setUser`, `setProfile`, `logout`
6. Crea `/hooks/useAuth.ts`: espone `user`, `profile`, `role`, `isAdmin`, `isInsegnante`

### ✅ CHECKPOINT STEP 3

- [ ] `client.ts` e `server.ts` esistono e usano le API SSR corrette
- [ ] Middleware: accesso a `/admin/dashboard` senza login → redirect `/login`
- [ ] Middleware: insegnante non accede a `/admin/*`
- [ ] `queries.ts` ha almeno 8 funzioni tipizzate
- [ ] `useAuthStore` si inizializza senza errori
- [ ] `npx tsc --noEmit` → 0 errori

---

## 🔑 STEP 4 — Autenticazione (Login + Onboarding Scuola)

### Prompt per Antigravity:

1. Crea `app/(auth)/login/page.tsx`:
   - Layout split: sinistra bg `#1A1714` con logo Solfège (font Cormorant Garamond, colore arancio) + tagline "Il gestionale per la tua scuola di musica"
   - Destra: form su bg `#FAFAF9`
   - Input email (icona `Mail`) + password (icona `Lock`) + pulsante "Accedi" arancio full-width
   - Validazione Zod: email valida, password min 8 chars
   - Errori con `sonner` toast
   - Link "Crea una nuova scuola →"

2. Crea `app/(auth)/register/page.tsx` — wizard 3 step con progress bar:
   - **Step 1**: Nome, Cognome, Email, Password
   - **Step 2**: Nome scuola (genera slug auto), Telefono, Email scuola, Indirizzo
   - **Step 3**: Riepilogo + pulsante "Crea account" arancio
   - Al submit: crea utente Auth → crea record `schools` → crea `profiles` (ruolo admin) → redirect `/admin/dashboard`

3. Crea `/components/layout/UserMenu.tsx`:
   - Avatar con iniziali, dropdown: nome + ruolo badge + logout
   - Logout: `supabase.auth.signOut()` → redirect `/login`

### ✅ CHECKPOINT STEP 4

- [ ] Pagina login: layout split visibile, font corretti, zero emoji
- [ ] Validazione Zod funziona (invia form vuoto → errori inline)
- [ ] Login errato → toast rosso con messaggio
- [ ] Login corretto → redirect dashboard
- [ ] Wizard register: progress bar funziona tra i 3 step
- [ ] Register crea record in `schools` + `profiles` su Supabase
- [ ] Logout → redirect `/login`
- [ ] `npx tsc --noEmit` → 0 errori

---

## 🏠 STEP 5 — Layout Admin & Dashboard

### Prompt per Antigravity:

1. Crea `app/(admin)/layout.tsx`:
   - Struttura: `<Sidebar />` (240px fissa) + `<main>` con `<Header />` + `{children}`
   - Verifica sessione server-side
   - Su mobile (< 768px): sidebar collassabile con overlay + framer-motion

2. Crea `/components/layout/Sidebar.tsx`:
   - Logo "Solfège" (Cormorant Garamond, arancio) + nome scuola sotto
   - Voci nav con icone lucide-react (NIENTE emoji):
     ```
     LayoutDashboard  → /admin/dashboard
     Users            → /admin/allievi
     GraduationCap    → /admin/insegnanti
     Music            → /admin/corsi
     Calendar         → /admin/calendario
     CreditCard       → /admin/pagamenti
     Wallet           → /admin/compensi
     BarChart3        → /admin/statistiche
     Settings2        → /admin/impostazioni
     ```
   - Voce attiva: bordo sx arancio 3px + testo arancio + bg arancio/10
   - Voce inattiva: testo `#C8C1BA`, hover bg bianco/5
   - Animazione apertura/chiusura con framer-motion
   - In fondo: UserMenu

3. Crea `/components/layout/Header.tsx`:
   - Titolo pagina dinamico (basato su route)
   - Badge rosso pagamenti in ritardo (query Supabase)
   - UserMenu a destra

4. Crea `app/(admin)/dashboard/page.tsx`:
   - 4 KPI card: Allievi Attivi (`Users`), Lezioni Oggi (`Calendar`), Pagamenti Scaduti (`AlertCircle` rosso), Incasso Mese (`TrendingUp`)
   - Dati reali da Supabase
   - Sezione "Lezioni di oggi" (lista compatta)
   - Sezione "Pagamenti in scadenza" (lista con badge status)
   - Grafico incassi ultimi 6 mesi (Recharts BarChart)

### ✅ CHECKPOINT STEP 5

- [ ] Sidebar visibile dopo login, tutte le 9 voci con icone lucide
- [ ] ZERO emoji visibili nell'interfaccia
- [ ] Voce attiva evidenziata correttamente navigando tra le pagine
- [ ] Sidebar collassa su 768px con animazione framer-motion
- [ ] Dashboard mostra KPI reali (anche se 0)
- [ ] Grafico Recharts si renderizza senza errori
- [ ] UserMenu: logout funziona
- [ ] Layout corretto su 375px, 768px, 1440px
- [ ] `npx tsc --noEmit` → 0 errori

---

## 👥 STEP 6 — Modulo Allievi (CRUD Completo)

### Prompt per Antigravity:

1. `app/(admin)/allievi/page.tsx` — tabella con `@tanstack/react-table`:
   - Colonne: N° Tessera · Nome · Email · Telefono · Corsi attivi · Stato · Azioni
   - Ricerca full-text per nome/email
   - Filtri: Stato (attivo/sospeso), Anno scolastico
   - Paginazione 20 per pagina
   - Pulsante "+ Nuovo Allievo" arancio

2. `app/(admin)/allievi/nuovo/page.tsx` — form con react-hook-form + Zod:
   - Sezione **Dati Personali**: nome*, cognome*, data_nascita*, CF, email*, telefono, indirizzo, città, CAP
   - Sezione **Genitore/Tutore** (visibile SOLO se minorenne): nome, cognome, telefono, email
   - Sezione **Note**: note mediche, note private
   - Sezione **Tessera**: tipo, importo, pagata (checkbox)
   - Validazione CF italiano (regex), data_nascita non in futuro

3. `app/(admin)/allievi/[id]/page.tsx` — scheda con 5 tab:
   - **Anagrafica**: dati completi + pulsante Modifica
   - **Iscrizioni**: corsi attivi con insegnante, orario, stato
   - **Presenze**: calendario mensile colorato (verde/rosso/amber/grigio)
   - **Pagamenti**: lista con badge status + pulsante "Registra pagamento"
   - **Note**: area testo libero

4. `app/(admin)/allievi/[id]/edit/page.tsx` — form precompilato + pulsante "Disattiva" con dialog conferma

### ✅ CHECKPOINT STEP 6

- [ ] Tabella allievi carica dati dal seed con `@tanstack/react-table`
- [ ] Ricerca funziona in real-time
- [ ] Paginazione 20 per pagina funziona
- [ ] Form nuovo allievo: campi genitore visibili SOLO se minorenne
- [ ] Validazione Zod su tutti i campi obbligatori
- [ ] Salvataggio crea record in `students` + `tessere`
- [ ] Scheda allievo: 5 tab funzionanti con dati reali
- [ ] Calendario presenze colorato correttamente
- [ ] Modifica allievo aggiorna DB
- [ ] Disattivazione con dialog conferma funziona
- [ ] `npx tsc --noEmit` → 0 errori

---

## 👨‍🏫 STEP 7 — Modulo Insegnanti (CRUD + Disponibilità)

### Prompt per Antigravity:

1. `app/(admin)/insegnanti/page.tsx` — card layout (non tabella):
   - Card per insegnante: avatar iniziali, nome, specializzazioni badge, n° allievi, tariffa/h, badge "Accesso App"
   - Filtro per specializzazione (multi-select)

2. `app/(admin)/insegnanti/nuovo/page.tsx`:
   - **Dati Personali**: nome*, cognome*, email*, telefono*, CF, data nascita, indirizzo
   - **Dati Professionali**: specializzazioni (multi-select tag: chitarra, pianoforte, canto, violino, batteria, flauto, sassofono, basso, altro), tariffa_individuale*, tariffa_collettiva*, IBAN, note contratto, data assunzione
   - **Disponibilità Settimanale**: griglia 7 giorni con toggle on/off + ora_inizio/ora_fine per ciascuno (più fasce per stesso giorno)
   - Submit: INSERT in `teachers` + `disponibilita_insegnanti`

3. `app/(admin)/insegnanti/[id]/page.tsx` — tab:
   - **Profilo**: dati anagrafici e professionali
   - **Disponibilità**: griglia settimanale visuale (componente `DisponibilitaGrid`)
   - **Allievi**: lista allievi assegnati
   - **Calendario**: lezioni del mese con react-big-calendar mini
   - **Compensi**: tabella mese/anno con ore e importo

4. **Invite docente al portale**: pulsante "Invita al portale" → Supabase magic link → docente si registra e viene collegato a `teachers.profile_id`

### ✅ CHECKPOINT STEP 7

- [ ] Card list insegnanti con dati dal seed
- [ ] Multi-select specializzazioni funziona
- [ ] Griglia disponibilità: toggle giorno + ora_inizio/fine si salvano
- [ ] Validazione: ora_fine > ora_inizio
- [ ] INSERT in `teachers` + `disponibilita_insegnanti` funziona
- [ ] 5 tab scheda insegnante funzionanti
- [ ] `DisponibilitaGrid` riutilizzabile in view e edit mode
- [ ] `npx tsc --noEmit` → 0 errori

---

## 🎵 STEP 8 — Modulo Corsi & Iscrizioni

### Prompt per Antigravity:

1. `app/(admin)/corsi/page.tsx` — card grid:
   - Ogni card: banda colorata (`colore_calendario`), nome, strumento, tipo/livello badge, durata, n° iscritti/max, prezzo/mese
   - Filtri: tipo, livello, strumento
   - Pulsante "+ Nuovo Corso"

2. `app/(admin)/corsi/[id]/page.tsx`:
   - Dettaglio corso
   - Lista iscritti con stato pagamento
   - Pulsante "Iscrivi Allievo" → `IscrizioneModal`
   - Badge lista attesa se corso pieno

3. `IscrizioneModal`:
   - Select allievo (autocomplete)
   - Select insegnante (filtrato per disponibilità giorno/ora del corso)
   - Data inizio, sconto percentuale, prezzo override opzionale
   - Al salvataggio: INSERT in `enrollments` → genera lezioni 4 settimane → genera scadenze pagamento (basate su price_model)

### ✅ CHECKPOINT STEP 8

- [ ] Card grid corsi con colori `colore_calendario`
- [ ] Filtri combinati funzionano
- [ ] Modal iscrizione: autocomplete allievo
- [ ] Insegnanti filtrati per disponibilità corrispondente
- [ ] Salvataggio crea record in `enrollments`
- [ ] Lezioni generate automaticamente (verifica in DB)
- [ ] Pagamenti generati automaticamente (verifica in DB)
- [ ] Lista attesa funziona se `max_students` raggiunto

---

## 📅 STEP 9 — Calendario Lezioni

### Prompt per Antigravity:

1. `app/(admin)/calendario/page.tsx` con `react-big-calendar`:
   - Vista default: settimana
   - Toggle: Mese | Settimana | Giorno | Agenda
   - Ogni evento colorato con `colore_calendario` del corso
   - Tooltip hover: allievo, insegnante, aula, orario
   - Filtri laterali: per insegnante, corso, aula, stato lezione

2. Click lezione → Drawer laterale:
   - Dettagli completi
   - Dropdown stato (programmata/completata/cancellata/recupero)
   - Toggle presenze allievi (presente/assente/recupero) — grandi, mobile-friendly
   - Note docente
   - Se cancellata: "Pianifica Recupero" → datepicker nuova data → crea nuova lezione con `lezione_recupero_di`

3. Modal "Nuova Lezione":
   - Select corso, insegnante, aula
   - Data + ora inizio/fine
   - Validazione anti-sovrapposizione: stesso insegnante o stessa aula non possono avere 2 lezioni contemporanee

4. Crea `/hooks/useLezioni.ts`:
   - `getLezioni(start, end, filters)`
   - `createLezione`, `updateLezione`, `cancellaLezione`
   - `pianificaRecupero(lezioneId, nuovaData)`
   - `togglePresenza(lezioneId, studentId, status)`

### ✅ CHECKPOINT STEP 9

- [ ] Calendario mostra lezioni del seed con colori corretti
- [ ] Switch viste funziona
- [ ] Filtri funzionano in combinazione
- [ ] Drawer: cambio stato aggiorna DB
- [ ] Toggle presenze aggiorna `attendance`
- [ ] "Pianifica Recupero" crea nuova lezione con FK corretta
- [ ] Anti-sovrapposizione funziona (testa con 2 lezioni same slot)
- [ ] `npx tsc --noEmit` → 0 errori

---

## 💰 STEP 10 — Modulo Pagamenti & PDF Ricevuta

### Prompt per Antigravity:

1. `app/(admin)/pagamenti/page.tsx` con `@tanstack/react-table`:
   - Colonne: N° Ricevuta · Allievo · Corso · Importo · Scadenza · Pagato il · Metodo · Stato
   - Tab: Tutti | In Attesa | In Ritardo | Pagati
   - KPI: Incassato mese · In attesa · In ritardo
   - Filtri: mese/anno, allievo

2. Badge status con colori del design system:
   - `in_attesa` → amber badge
   - `pagato` → green badge
   - `in_ritardo` → red badge
   - `rimborsato` → stone badge
   - `annullato` → stone/strikethrough

3. Azioni per ogni pagamento:
   - **Segna come Pagato**: dialog con select metodo + data → aggiorna DB → genera numero_ricevuta progressivo
   - **Scarica Ricevuta PDF**: genera PDF con `@react-pdf/renderer`
   - **Stampa**: `window.print()` su PDF
   - **Condividi** (icona `Share2`): Web Share API → WhatsApp/email/altro
   - **Invia Sollecito**: POST a `/api/send-email` → template Resend

4. Crea `/lib/pdf/receipt.tsx`:
   ```
   ┌─────────────────────────────┐
   │ [Logo scuola]    RICEVUTA   │
   │ [Nome scuola]    N° 2025-042│
   │ [Indirizzo]      Data: ...  │
   ├─────────────────────────────┤
   │ Allievo: Mario Rossi        │
   │ Corso: Chitarra Individuale │
   │ Periodo: Ottobre 2025       │
   ├─────────────────────────────┤
   │ Importo: €80,00             │
   │ Metodo: Bonifico bancario   │
   │ Pagato il: 05/10/2025       │
   └─────────────────────────────┘
   ```

5. Aggiornamento automatico stato `in_ritardo`:
   - Supabase Edge Function (cron giornaliero 09:00):
     `UPDATE payments SET status='in_ritardo' WHERE due_date < NOW() AND status='in_attesa'`

### ✅ CHECKPOINT STEP 10

- [ ] Tabella pagamenti con tab e filtri funzionanti
- [ ] Badge colorati corretti per ogni stato
- [ ] KPI card mostrano valori sommati reali
- [ ] "Segna come Pagato" aggiorna status + paid_date
- [ ] Numero ricevuta progressivo senza duplicati
- [ ] PDF generato con dati reali della scuola
- [ ] Download PDF funziona nel browser
- [ ] Web Share API funziona su mobile (testa su telefono)
- [ ] Edge Function cron creata e schedulata
- [ ] `npx tsc --noEmit` → 0 errori

---

## 📱 STEP 11 — Interfaccia Docente (Mobile-first)

### Prompt per Antigravity:

1. `app/(teacher)/layout.tsx`:
   - NO sidebar
   - Bottom Navigation Bar (4 voci):
     `Home` · `ClipboardCheck` (Presenze) · `Users` (Allievi) · `UserRound` (Profilo)
   - Touch target ≥ 48px per ogni voce
   - Header: logo Solfège centrato + nome scuola
   - BG: `#FAFAF9`

2. `app/(teacher)/home/page.tsx`:
   - Sezione "Oggi — [data]": card per ogni lezione del giorno
     ```
     ┌────────────────────────────────┐
     │  14:00 · 1h        Aula 2      │
     │  Chitarra Individuale          │
     │  [UserRound] Marco Bianchi     │
     │  [Segna presenze →]            │
     └────────────────────────────────┘
     ```
   - Empty state se nessuna lezione oggi
   - Sezione "Prossimi 3 giorni" compatta

3. `app/(teacher)/presenze/[corsoId]/page.tsx`:
   - Header: nome corso + data odierna
   - Lista allievi con toggle a 3 stati (tap):
     Presente (verde `CheckCircle2`) | Assente (rosso `XCircle`) | Recupero (amber `RefreshCw`)
   - Pulsante "Salva presenze" arancio in fondo — salva tutto in blocco
   - Se già registrate: mostra valori e permette modifica

4. `app/(teacher)/allievi/page.tsx`:
   - Solo allievi del docente loggato (RLS automatico)
   - Card: nome, corso, prossima lezione, n° assenze mese
   - Tap → mini scheda: nome, telefono, note corso

5. `app/(teacher)/profilo/page.tsx`:
   - Dati docente (sola lettura)
   - Compenso mese corrente: ore lavorate + importo
   - Pulsante Logout

### ✅ CHECKPOINT STEP 11

- [ ] Bottom nav funziona su mobile reale (iOS + Android)
- [ ] Home mostra SOLO lezioni del docente loggato
- [ ] Toggle presenze: tap fluido tra 3 stati su mobile
- [ ] "Salva presenze" crea/aggiorna `attendance` in blocco
- [ ] RLS: docente non vede mai dati di altri docenti o sezioni admin
- [ ] Layout corretto su viewport 375px (iPhone SE)
- [ ] Touch target ≥ 48px su tutti gli elementi interattivi
- [ ] `npx tsc --noEmit` → 0 errori

---

## 📊 STEP 12 — Statistiche

### Prompt per Antigravity:

`app/(admin)/statistiche/page.tsx`:

**Sezione Finanziaria**:
- BarChart Recharts: incassi mensili ultimi 12 mesi
- PieChart: distribuzione metodi pagamento
- KPI: Totale anno · Media mensile · Tasso morosità %

**Sezione Allievi**:
- LineChart: nuove iscrizioni per mese (trend)
- BarChart: allievi per strumento
- KPI: Totale attivi · Nuovi questo mese · Abbandoni

**Sezione Lezioni**:
- BarChart: lezioni settimanali (completate vs cancellate vs recuperi)
- KPI: % presenze media · Lezioni mese · Recuperi da pianificare

**Sezione Insegnanti**:
- Tabella: Insegnante · Ore individuali · Ore collettive · Compenso calcolato

Filtro globale anno scolastico in cima.
Crea `/hooks/useStatistiche.ts` con query aggregate (usa Supabase RPC per calcoli pesanti).
Pulsante "Esporta CSV" → scarica dati in formato .csv.

### ✅ CHECKPOINT STEP 12

- [ ] Tutti i grafici Recharts renderizzano senza errori
- [ ] Dati reali dal seed nei grafici
- [ ] Filtro anno scolastico aggiorna tutti i widget
- [ ] Tabella compensi calcola correttamente
- [ ] Export CSV scarica file valido
- [ ] `npx tsc --noEmit` → 0 errori
- [ ] Nessun errore in console browser

---

## ⚙️ STEP 13 — Impostazioni Scuola

### Prompt per Antigravity:

`app/(admin)/impostazioni/page.tsx` con tab:

- **Scuola**: nome, logo (upload Supabase Storage bucket `logos`), indirizzo, telefono, email, sito — modifica aggiorna sidebar in real-time
- **Anno Accademico**: anno corrente, date inizio/fine
- **Strumenti**: lista con add/remove/rename
- **Aule**: lista con add/remove, nome + capienza + insonorizzata
- **Utenti**: lista profili con ruolo, pulsante "Invita Segreteria"
- **Abbonamento**: piano attivo, scadenza (placeholder — Stripe v2)

### ✅ CHECKPOINT STEP 13

- [ ] Upload logo funziona (Supabase Storage)
- [ ] Modifica nome scuola si riflette in sidebar immediatamente
- [ ] Add/remove strumenti funziona
- [ ] Add/remove aule funziona
- [ ] `npx tsc --noEmit` → 0 errori

---

## 💼 STEP 14 — Compensi Docenti

### Prompt per Antigravity:

`app/(admin)/compensi/page.tsx`:
- Selettore mese/anno in cima
- Tabella: Docente · Ore Individuali · Ore Collettive · Totale Calcolato · Stato
- Badge: "Da pagare" (amber) / "Pagato" (green)
- Calcolo automatico ore da `attendance` JOIN `lessons` JOIN `courses` (rate individuale vs collettiva)
- "Segna come Pagato" → aggiorna `teacher_compensations.paid = true` + `paid_date`

### ✅ CHECKPOINT STEP 14

- [ ] Calcolo ore da presenze è corretto
- [ ] Cambio mese/anno ricarica dati
- [ ] "Segna come Pagato" aggiorna DB
- [ ] `npx tsc --noEmit` → 0 errori

---

## 🚀 STEP 15 — Polish & Deploy Vercel

### Prompt per Antigravity:

1. **Loading States**: skeleton loader per ogni tabella, spinner su form submit, Suspense boundaries
2. **Error Handling**: `app/error.tsx` globale, `app/not-found.tsx` (404), messaggi Supabase user-friendly
3. **Empty States**: componente `EmptyState` riutilizzabile con icona, titolo, CTA
4. **Accessibilità**: aria-label su tutti i pulsanti icon-only, Tab order logico, role aria-* corretti
5. **Responsive**: verifica 375px · 768px · 1024px · 1440px; tabelle scrollabili su mobile
6. **Deploy**:

```bash
npm run build    # deve passare senza errori
vercel --prod
```

Imposta su Vercel Dashboard → Environment Variables tutte le variabili da `.env.local`.
Aggiorna `Site URL` in Supabase Authentication con URL Vercel.
Crea `README.md` con: setup locale, variabili ambiente, come eseguire lo schema SQL.

### ✅ CHECKPOINT FINALE (STEP 15)

**Funzionalità core:**
- [ ] Login/Logout funziona in produzione
- [ ] CRUD Allievi completo
- [ ] CRUD Insegnanti con disponibilità
- [ ] CRUD Corsi con iscrizioni e generazione lezioni
- [ ] Calendario: creazione/modifica/cancellazione/recupero lezioni
- [ ] Presenze: registrazione admin + docente
- [ ] Pagamenti: lista, segna pagato, PDF, Web Share
- [ ] Statistiche con grafici
- [ ] Impostazioni scuola
- [ ] Compensi docenti
- [ ] RLS verificato: docente non vede dati di altri

**UI/UX:**
- [ ] ZERO emoji in tutta l'app (solo lucide-react)
- [ ] Font Cormorant Garamond + DM Sans applicati ovunque
- [ ] Palette orange/green/red/amber corretta
- [ ] Sidebar scura correttamente
- [ ] Skeleton loaders visibili durante caricamento
- [ ] Toast sonner su tutte le operazioni CRUD
- [ ] Empty states su tutte le liste vuote
- [ ] Layout corretto su 375px mobile

**Performance & qualità:**
- [ ] `npm run build` → 0 errori
- [ ] `npx tsc --noEmit` → 0 errori TypeScript
- [ ] Lighthouse score ≥ 80 su mobile
- [ ] Nessun errore in console browser in produzione

**Deploy:**
- [ ] Build Vercel completata senza errori
- [ ] URL produzione funzionante
- [ ] Supabase Auth redirect URLs aggiornate
- [ ] Test flusso completo in produzione: registra scuola → aggiungi dati → genera PDF → testa docente da mobile

---

## 📝 CONVENZIONI CODICE

- **TypeScript strict** — no `any`, usa sempre i tipi generati da Supabase
- **Server Components** dove possibile, `'use client'` solo per interattività
- **Commenti in italiano** per chiarezza
- **Sonner toast** per ogni operazione CRUD (successo + errore)
- **React.memo** dove opportuno per performance
- **Pagination server-side** per tabelle con molti record

## 🚫 NON implementare in v1

- Stripe / pagamenti online
- Fatturazione elettronica SDI/XML
- Portal genitori/allievi
- App store iOS/Android nativa
- Notifiche push
- Export PDF report statistiche

---

*Solfège v1.0 — Gestionale SaaS per Scuole di Musica*
*Stack: Next.js 14 · Supabase · Vercel · Tailwind · shadcn/ui · lucide-react*
