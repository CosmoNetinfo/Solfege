-- ============================================================
-- SEED DATA FOR SOLFÈGE
-- ============================================================

-- 1. SCHOOL
INSERT INTO schools (id, name, slug, address, phone, email, website)
VALUES (
  'd4e7a8b0-1234-4a5b-8c9d-0e1f2a3b4c5d',
  'Accademia Verdi',
  'accademia-verdi',
  'Via delle Note 12, Milano',
  '02 1234567',
  'info@accademiaverdi.it',
  'https://accademiaverdi.it'
);

-- 2. INSTRUMENTS
INSERT INTO instruments (school_id, name) VALUES 
('d4e7a8b0-1234-4a5b-8c9d-0e1f2a3b4c5d', 'Pianoforte'),
('d4e7a8b0-1234-4a5b-8c9d-0e1f2a3b4c5d', 'Chitarra'),
('d4e7a8b0-1234-4a5b-8c9d-0e1f2a3b4c5d', 'Canto'),
('d4e7a8b0-1234-4a5b-8c9d-0e1f2a3b4c5d', 'Violino');

-- 3. ROOMS
INSERT INTO rooms (school_id, name, capacity, insonorizzata) VALUES
('d4e7a8b0-1234-4a5b-8c9d-0e1f2a3b4c5d', 'Aula Mozart', 2, TRUE),
('d4e7a8b0-1234-4a5b-8c9d-0e1f2a3b4c5d', 'Aula Vivaldi', 10, FALSE),
('d4e7a8b0-1234-4a5b-8c9d-0e1f2a3b4c5d', 'Aula Rossini', 1, TRUE);

-- 4. TEACHERS
INSERT INTO teachers (id, school_id, first_name, last_name, email, specializzazioni, rate_individual, rate_group)
VALUES 
('f1a1b1c1-1111-2222-3333-444455556666', 'd4e7a8b0-1234-4a5b-8c9d-0e1f2a3b4c5d', 'Marco', 'Rossi', 'm.rossi@email.it', ARRAY['Pianoforte', 'Teoria'], 30.00, 15.00),
('f2a2b2c2-1111-2222-3333-444455556666', 'd4e7a8b0-1234-4a5b-8c9d-0e1f2a3b4c5d', 'Elena', 'Bianchi', 'e.bianchi@email.it', ARRAY['Canto', 'Coro'], 35.00, 20.00),
('f3a3b3c3-1111-2222-3333-444455556666', 'd4e7a8b0-1234-4a5b-8c9d-0e1f2a3b4c5d', 'Luca', 'Verdi', 'l.verdi@email.it', ARRAY['Chitarra'], 25.00, 12.00);

-- 5. TEACHER AVAILABILITY
INSERT INTO disponibilita_insegnanti (school_id, teacher_id, giorno, ora_inizio, ora_fine) VALUES
('d4e7a8b0-1234-4a5b-8c9d-0e1f2a3b4c5d', 'f1a1b1c1-1111-2222-3333-444455556666', 'lunedi', '14:00', '20:00'),
('d4e7a8b0-1234-4a5b-8c9d-0e1f2a3b4c5d', 'f2a2b2c2-1111-2222-3333-444455556666', 'martedi', '15:00', '19:00'),
('d4e7a8b0-1234-4a5b-8c9d-0e1f2a3b4c5d', 'f3a3b3c3-1111-2222-3333-444455556666', 'mercoledi', '10:00', '18:00');

-- 6. STUDENTS (10 students, 3 minors)
INSERT INTO students (id, school_id, first_name, last_name, email, dob, parent_name, parent_surname, enrolled_at) VALUES
('a1a1a1a1-1111-2222-3333-444455556666', 'd4e7a8b0-1234-4a5b-8c9d-0e1f2a3b4c5d', 'Giulia', 'Neri', 'giulia@email.it', '2015-05-20', 'Stefano', 'Neri', '2024-09-01'),
('a2a2a2a2-1111-2222-3333-444455556666', 'd4e7a8b0-1234-4a5b-8c9d-0e1f2a3b4c5d', 'Matteo', 'Russo', 'matteo@email.it', '2016-10-12', 'Anna', 'Gallo', '2024-09-01'),
('a3a3a3a3-1111-2222-3333-444455556666', 'd4e7a8b0-1234-4a5b-8c9d-0e1f2a3b4c5d', 'Sofia', 'Ferrari', 'sofia@email.it', '2017-02-28', 'Paolo', 'Ferrari', '2024-09-01'),
('a4a4a4a4-1111-2222-3333-444455556666', 'd4e7a8b0-1234-4a5b-8c9d-0e1f2a3b4c5d', 'Andrea', 'Costa', 'andrea@email.it', '1995-03-15', NULL, NULL, '2024-09-01'),
('a5a5a5a5-1111-2222-3333-444455556666', 'd4e7a8b0-1234-4a5b-8c9d-0e1f2a3b4c5d', 'Francesca', 'Longo', 'francy@email.it', '1990-07-22', NULL, NULL, '2024-09-01'),
('a6a6a6a6-1111-2222-3333-444455556666', 'd4e7a8b0-1234-4a5b-8c9d-0e1f2a3b4c5d', 'Lorenzo', 'Gatti', 'lorenzo@email.it', '1988-11-05', NULL, NULL, '2024-09-01'),
('a7a7a7a7-1111-2222-3333-444455556666', 'd4e7a8b0-1234-4a5b-8c9d-0e1f2a3b4c5d', 'Chiara', 'Marini', 'chiara@email.it', '2000-01-30', NULL, NULL, '2024-09-01'),
('a8a8a8a8-1111-2222-3333-444455556666', 'd4e7a8b0-1234-4a5b-8c9d-0e1f2a3b4c5d', 'Riccardo', 'Sanna', 'riccardo@email.it', '1992-06-18', NULL, NULL, '2024-09-01'),
('a9a9a9a9-1111-2222-3333-444455556666', 'd4e7a8b0-1234-4a5b-8c9d-0e1f2a3b4c5d', 'Marta', 'Bruno', 'marta@email.it', '1985-09-25', NULL, NULL, '2024-09-01'),
('a0a0a0a0-1111-2222-3333-444455556666', 'd4e7a8b0-1234-4a5b-8c9d-0e1f2a3b4c5d', 'Davide', 'Riva', 'davide@email.it', '1998-12-10', NULL, NULL, '2024-09-01');

-- 7. COURSES (5 courses)
INSERT INTO courses (id, school_id, name, type, level, instrument_id, room_id, day_of_week, start_time, duration_min, price, price_model) VALUES
('c1c1c1c1-1111-2222-3333-444455556666', 'd4e7a8b0-1234-4a5b-8c9d-0e1f2a3b4c5d', 'Pianoforte Base', 'individuale', 'principiante', (SELECT id FROM instruments WHERE name = 'Pianoforte'), (SELECT id FROM rooms WHERE name = 'Aula Mozart'), 1, '15:00', 60, 120.00, 'mensile'),
('c2c2c2c2-1111-2222-3333-444455556666', 'd4e7a8b0-1234-4a5b-8c9d-0e1f2a3b4c5d', 'Coro Junior', 'collettivo', 'principiante', (SELECT id FROM instruments WHERE name = 'Canto'), (SELECT id FROM rooms WHERE name = 'Aula Vivaldi'), 2, '17:00', 90, 60.00, 'mensile'),
('c3c3c3c3-1111-2222-3333-444455556666', 'd4e7a8b0-1234-4a5b-8c9d-0e1f2a3b4c5d', 'Chitarra Moderna', 'individuale', 'intermedio', (SELECT id FROM instruments WHERE name = 'Chitarra'), (SELECT id FROM rooms WHERE name = 'Aula Rossini'), 3, '16:00', 45, 100.00, 'mensile'),
('c4c4c4c4-1111-2222-3333-444455556666', 'd4e7a8b0-1234-4a5b-8c9d-0e1f2a3b4c5d', 'Teoria e Solfeggio', 'collettivo', 'principiante', (SELECT id FROM instruments WHERE name = 'Pianoforte'), (SELECT id FROM rooms WHERE name = 'Aula Vivaldi'), 1, '18:00', 60, 40.00, 'mensile'),
('c5c5c5c5-1111-2222-3333-444455556666', 'd4e7a8b0-1234-4a5b-8c9d-0e1f2a3b4c5d', 'Violino Avanzato', 'individuale', 'avanzato', (SELECT id FROM instruments WHERE name = 'Violino'), (SELECT id FROM rooms WHERE name = 'Aula Mozart'), 4, '14:30', 60, 150.00, 'mensile');

-- 8. ENROLLMENTS
INSERT INTO enrollments (school_id, student_id, course_id, teacher_id, start_date) VALUES
('d4e7a8b0-1234-4a5b-8c9d-0e1f2a3b4c5d', 'a1a1a1a1-1111-2222-3333-444455556666', 'c1c1c1c1-1111-2222-3333-444455556666', 'f1a1b1c1-1111-2222-3333-444455556666', '2024-09-01'),
('d4e7a8b0-1234-4a5b-8c9d-0e1f2a3b4c5d', 'a2a2a2a2-1111-2222-3333-444455556666', 'c2c2c2c2-1111-2222-3333-444455556666', 'f2a2b2c2-1111-2222-3333-444455556666', '2024-09-01'),
('d4e7a8b0-1234-4a5b-8c9d-0e1f2a3b4c5d', 'a3a3a3a3-1111-2222-3333-444455556666', 'c4c4c4c4-1111-2222-3333-444455556666', 'f1a1b1c1-1111-2222-3333-444455556666', '2024-09-01');

-- 9. PAYMENTS
INSERT INTO payments (school_id, student_id, amount, due_date, status, description) VALUES
('d4e7a8b0-1234-4a5b-8c9d-0e1f2a3b4c5d', 'a1a1a1a1-1111-2222-3333-444455556666', 120.00, '2024-10-05', 'pagato', 'Mensilità Ottobre - Pianoforte'),
('d4e7a8b0-1234-4a5b-8c9d-0e1f2a3b4c5d', 'a2a2a2a2-1111-2222-3333-444455556666', 60.00, '2024-10-05', 'in_attesa', 'Mensilità Ottobre - Coro'),
('d4e7a8b0-1234-4a5b-8c9d-0e1f2a3b4c5d', 'a3a3a3a3-1111-2222-3333-444455556666', 40.00, '2024-10-05', 'in_ritardo', 'Mensilità Ottobre - Teoria');
