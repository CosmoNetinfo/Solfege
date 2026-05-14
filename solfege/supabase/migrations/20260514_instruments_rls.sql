-- Migration: RLS policy per strumenti globali
-- Gli strumenti con is_global=true sono visibili a tutti gli utenti autenticati
-- Gli strumenti custom (is_global=false) sono visibili solo alla propria scuola

-- 1. Aggiungi colonna is_global se non esiste
ALTER TABLE instruments 
  ADD COLUMN IF NOT EXISTS is_global BOOLEAN NOT NULL DEFAULT false;

-- 2. Abilita RLS sulla tabella
ALTER TABLE instruments ENABLE ROW LEVEL SECURITY;

-- 3. Rimuovi policy esistenti per ricrearle pulite
DROP POLICY IF EXISTS "instruments_select" ON instruments;
DROP POLICY IF EXISTS "instruments_insert" ON instruments;
DROP POLICY IF EXISTS "instruments_update" ON instruments;
DROP POLICY IF EXISTS "instruments_delete" ON instruments;

-- 4. SELECT: utenti autenticati vedono strumenti globali + quelli della propria scuola
CREATE POLICY "instruments_select" ON instruments
  FOR SELECT
  TO authenticated
  USING (
    is_global = true
    OR school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

-- 5. INSERT: solo strumenti custom (is_global=false) per la propria scuola
CREATE POLICY "instruments_insert" ON instruments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_global = false
    AND school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

-- 6. UPDATE: solo i propri strumenti custom (non globali)
CREATE POLICY "instruments_update" ON instruments
  FOR UPDATE
  TO authenticated
  USING (
    is_global = false
    AND school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

-- 7. DELETE: solo i propri strumenti custom (non globali)
CREATE POLICY "instruments_delete" ON instruments
  FOR DELETE
  TO authenticated
  USING (
    is_global = false
    AND school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

-- 8. Inserisci strumenti globali predefiniti (se non esistono già)
INSERT INTO instruments (name, is_global, school_id)
SELECT name, true, NULL
FROM (VALUES
  ('Pianoforte'),
  ('Chitarra'),
  ('Chitarra elettrica'),
  ('Chitarra classica'),
  ('Basso elettrico'),
  ('Violino'),
  ('Viola'),
  ('Violoncello'),
  ('Contrabbasso'),
  ('Flauto'),
  ('Clarinetto'),
  ('Sassofono'),
  ('Tromba'),
  ('Trombone'),
  ('Corno'),
  ('Percussioni'),
  ('Batteria'),
  ('Canto'),
  ('Solfeggio'),
  ('Teoria musicale'),
  ('Arpa'),
  ('Fisarmonica'),
  ('Organo'),
  ('Ukulele')
) AS t(name)
WHERE NOT EXISTS (
  SELECT 1 FROM instruments WHERE name = t.name AND is_global = true
);
