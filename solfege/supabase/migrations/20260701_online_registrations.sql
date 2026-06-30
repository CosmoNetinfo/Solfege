-- Tabella per le registrazioni online temporanee
CREATE TABLE IF NOT EXISTS online_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cognome TEXT NOT NULL,
  data_nascita DATE,
  codice_fiscale TEXT,
  email TEXT,
  telefono TEXT,
  is_minorenne BOOLEAN DEFAULT false,
  genitore_nome TEXT,
  genitore_cognome TEXT,
  genitore_email TEXT,
  genitore_telefono TEXT,
  genitore_codice_fiscale TEXT,
  corso_interesse TEXT,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE online_registrations ENABLE ROW LEVEL SECURITY;

-- Policy 1: Chiunque (anonimo) può inserire una registrazione (form pubblico)
CREATE POLICY anon_insert_registrations ON online_registrations
  FOR INSERT TO anon WITH CHECK (true);

-- Policy 2: Il Superadmin può fare tutto
CREATE POLICY superadmin_all_registrations ON online_registrations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- Policy 3: Gli amministratori della scuola (admin o segreteria) possono gestire le proprie iscrizioni
CREATE POLICY school_admin_manage_registrations ON online_registrations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND (role = 'admin' OR role = 'segreteria') AND school_id = online_registrations.school_id
    )
  );

-- Associa la licenza ad una scuola specifica su Supabase
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE SET NULL;

-- Tabella per gli avvisi/comunicazioni della scuola in bacheca
CREATE TABLE IF NOT EXISTS school_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_important BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE school_notices ENABLE ROW LEVEL SECURITY;

-- Policy 1: Chiunque (anonimo/allievo) può leggere gli avvisi
CREATE POLICY public_read_notices ON school_notices
  FOR SELECT TO anon USING (true);

-- Policy 2: Gli amministratori della scuola (admin o segreteria) possono gestire gli avvisi
CREATE POLICY school_admin_manage_notices ON school_notices
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND (role = 'admin' OR role = 'segreteria') AND school_id = school_notices.school_id
    )
  );


