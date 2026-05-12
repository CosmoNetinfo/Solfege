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
CREATE POLICY "school_isolation_students" ON students FOR ALL USING (school_id = get_my_school_id());
CREATE POLICY "school_isolation_instruments" ON instruments FOR ALL USING (school_id = get_my_school_id());
CREATE POLICY "school_isolation_rooms" ON rooms FOR ALL USING (school_id = get_my_school_id());
CREATE POLICY "school_isolation_teachers" ON teachers FOR ALL USING (school_id = get_my_school_id());
CREATE POLICY "school_isolation_courses" ON courses FOR ALL USING (school_id = get_my_school_id());
CREATE POLICY "school_isolation_enrollments" ON enrollments FOR ALL USING (school_id = get_my_school_id());
CREATE POLICY "school_isolation_lista_attesa" ON lista_attesa FOR ALL USING (school_id = get_my_school_id());
CREATE POLICY "school_isolation_lessons" ON lessons FOR ALL USING (school_id = get_my_school_id());
CREATE POLICY "school_isolation_attendance" ON attendance FOR ALL USING (school_id = get_my_school_id());
CREATE POLICY "school_isolation_payments" ON payments FOR ALL USING (school_id = get_my_school_id());
CREATE POLICY "school_isolation_teacher_compensations" ON teacher_compensations FOR ALL USING (school_id = get_my_school_id());
CREATE POLICY "school_isolation_tessere" ON tessere FOR ALL USING (school_id = get_my_school_id());
CREATE POLICY "school_isolation_disponibilita" ON disponibilita_insegnanti FOR ALL USING (school_id = get_my_school_id());

-- Policy: insegnante vede solo i propri corsi e allievi
CREATE POLICY "teacher_own_data" ON lessons
  FOR ALL
  USING (
    school_id = get_my_school_id()
    AND (
      teacher_id IN (SELECT id FROM teachers WHERE profile_id = auth.uid())
      OR get_my_role() IN ('admin', 'segreteria')
    )
  );
