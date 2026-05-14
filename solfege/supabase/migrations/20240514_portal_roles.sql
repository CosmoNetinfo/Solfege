-- MIGRATION: 20240514_portal_roles.sql
-- Descrizione: Aggiunge i ruoli per il portale allievi/genitori e il collegamento profilo-studente.

-- 1. Aggiunta ruoli all'enum esistente
-- Nota: In PostgreSQL gli enum non possono essere modificati all'interno di una transazione in alcune versioni.
-- Se eseguito via Supabase Dashboard, questo script aggiungerà i valori necessari.

ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'studente';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'genitore';

-- 2. Modifica tabella profiles per collegare l'utente auth all'allievo nel database
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES public.students(id);

-- 3. RLS Policies per il Portale (Sola Lettura Iniziale)

-- Gli Allievi possono vedere il proprio profilo
CREATE POLICY "Allievi: visualizza proprio profilo" ON public.profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

-- Gli Allievi possono vedere i propri dati anagrafici
CREATE POLICY "Allievi: visualizza propri dati" ON public.students
    FOR SELECT TO authenticated
    USING (
        id IN (SELECT student_id FROM public.profiles WHERE id = auth.uid())
    );

-- Gli Allievi possono vedere le proprie presenze/lezioni
CREATE POLICY "Allievi: visualizza proprie presenze" ON public.attendance
    FOR SELECT TO authenticated
    USING (
        student_id IN (SELECT student_id FROM public.profiles WHERE id = auth.uid())
    );

-- Gli Allievi possono vedere i propri pagamenti
CREATE POLICY "Allievi: visualizza propri pagamenti" ON public.payments
    FOR SELECT TO authenticated
    USING (
        student_id IN (SELECT student_id FROM public.profiles WHERE id = auth.uid())
    );
