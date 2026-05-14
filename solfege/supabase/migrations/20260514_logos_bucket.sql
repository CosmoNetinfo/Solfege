-- Crea il bucket 'logos' se non esiste
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Assicurati che il bucket accetti le estensioni corrette e limiti le dimensioni (opzionale, di base accetta tutto se non specificato in allowed_mime_types, ma per sicurezza settiamo a null o lo lasciamo gestire dal client)
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp'],
    file_size_limit = 2097152 -- 2MB
WHERE id = 'logos';

-- Policy per visualizzare i loghi (pubblico)
CREATE POLICY "Logos sono pubblici" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'logos');

-- Policy per permettere upload agli utenti autenticati
CREATE POLICY "Utenti autenticati possono caricare loghi" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'logos');

-- Policy per permettere update e delete dei loghi
CREATE POLICY "Utenti autenticati possono modificare loghi" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'logos');

CREATE POLICY "Utenti autenticati possono eliminare loghi" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'logos');
