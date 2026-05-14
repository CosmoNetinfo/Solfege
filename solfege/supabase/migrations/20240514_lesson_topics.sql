-- MIGRATION: 20240514_lesson_topics.sql
-- Descrizione: Aggiunge campi per il registro argomenti e compiti alle lezioni.

ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS topic TEXT;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS homework TEXT;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS internal_notes TEXT;

-- Commenti per chiarezza
COMMENT ON COLUMN public.lessons.topic IS 'Argomenti trattati durante la lezione (visibile allievi)';
COMMENT ON COLUMN public.lessons.homework IS 'Compiti assegnati per la prossima volta (visibile allievi)';
COMMENT ON COLUMN public.lessons.internal_notes IS 'Note interne della scuola/docente (non visibile allievi)';
