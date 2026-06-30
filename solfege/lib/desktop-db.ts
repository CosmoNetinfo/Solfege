// Wrapper SQLite per l'app desktop
// Usa @tauri-apps/plugin-sql
import Database from '@tauri-apps/plugin-sql'

let db: Database | null = null

async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load('sqlite:solfege.db')
  }
  return db
}

// Interfacce dati per desktop
export interface Student {
  id: string
  nome: string
  cognome: string
  data_nascita?: string
  codice_fiscale?: string
  email?: string
  telefono?: string
  indirizzo?: string
  citta?: string
  cap?: string
  is_minorenne?: number
  genitore_nome?: string
  genitore_cognome?: string
  genitore_email?: string
  genitore_telefono?: string
  genitore_codice_fiscale?: string
  note?: string
  created_at?: string
}

export type StudentInsert = Omit<Student, 'id' | 'created_at'>

export interface Teacher {
  id: string
  nome: string
  cognome: string
  email?: string
  telefono?: string
  whatsapp?: string
  strumento_principale?: string
  codice_fiscale?: string
  iban?: string
  tariffa_oraria_individuale?: number
  tariffa_oraria_collettivo?: number
  note?: string
  created_at?: string
}

export type TeacherInsert = Omit<Teacher, 'id' | 'created_at'>

export interface Course {
  id: string
  nome: string
  descrizione?: string
  instrument_id?: string
  teacher_id?: string
  room_id?: string
  tipo: 'individuale' | 'collettivo' | 'ensemble'
  livello?: 'principiante' | 'intermedio' | 'avanzato'
  durata_minuti: number
  max_allievi: number
  colore_calendario: string
  prezzo?: number
  giorno_settimana?: number
  ora_inizio?: string
  ora_fine?: string
  anno_accademico?: string
  created_at?: string
  // Campi join
  teacher_nome?: string
  teacher_cognome?: string
  instrument_nome?: string
  room_name?: string
}

export type CourseInsert = Omit<Course, 'id' | 'created_at'>

export interface Payment {
  id: string
  student_id: string
  course_id?: string
  importo: number
  data_pagamento?: string
  data_scadenza: string
  metodo: 'contanti' | 'bonifico' | 'pos' | 'altro'
  stato: 'in_attesa' | 'pagato' | 'scaduto' | 'annullato'
  numero_ricevuta?: string
  note?: string
  created_at?: string
  // Campi join
  student_nome?: string
  student_cognome?: string
  course_nome?: string
}

export type PaymentInsert = Omit<Payment, 'id' | 'created_at' | 'numero_ricevuta'>

export interface Lesson {
  id: string
  course_id: string
  room_id?: string
  data: string
  ora_inizio: string
  ora_fine: string
  argomenti?: string
  compiti?: string
  stato: 'programmata' | 'svolta' | 'annullata' | 'recupero'
  note?: string
  created_at?: string
  // Campi join
  course_nome?: string
  colore_calendario?: string
  teacher_nome?: string
  teacher_cognome?: string
  room_nome?: string
}

export type LessonInsert = Omit<Lesson, 'id' | 'created_at'>

export interface Attendance {
  id: string
  lesson_id: string
  student_id: string
  stato: 'presente' | 'assente' | 'recuperato' | 'festivo'
  note?: string
  // Campi join
  nome?: string
  cognome?: string
}

export interface TeacherCompensation {
  id: string
  teacher_id: string
  mese: string
  anno: number
  ore_totali: number
  tariffa_oraria?: number
  importo_totale?: number
  stato: 'da_pagare' | 'pagato'
  note?: string
  // Campi join
  nome?: string
  cognome?: string
}

export interface Instrument {
  id: string
  nome: string
  categoria?: string
  created_at?: string
}

export interface Room {
  id: string
  nome: string
  capacita: number
  note?: string
  created_at?: string
}

export type RoomInsert = Omit<Room, 'id' | 'created_at'>

// STUDENTI
export const studentsDb = {
  getAll: async () => {
    const db = await getDb()
    return db.select<Student[]>(
      'SELECT * FROM students ORDER BY cognome, nome'
    )
  },
  getById: async (id: string) => {
    const db = await getDb()
    const results = await db.select<Student[]>(
      'SELECT * FROM students WHERE id = ?', [id]
    )
    return results[0] || null
  },
  create: async (data: StudentInsert) => {
    const db = await getDb()
    const id = crypto.randomUUID()
    await db.execute(
      `INSERT INTO students (id, nome, cognome, data_nascita, codice_fiscale, email, 
       telefono, indirizzo, citta, cap, is_minorenne, genitore_nome, genitore_cognome, 
       genitore_email, genitore_telefono, note) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, data.nome, data.cognome, data.data_nascita, data.codice_fiscale,
       data.email, data.telefono, data.indirizzo, data.citta, data.cap, data.is_minorenne,
       data.genitore_nome, data.genitore_cognome, data.genitore_email,
       data.genitore_telefono, data.note]
    )
    return id
  },
  update: async (id: string, data: Partial<Student>) => {
    const db = await getDb()
    const fields = Object.keys(data).map(k => `${k} = ?`).join(', ')
    await db.execute(
      `UPDATE students SET ${fields} WHERE id = ?`,
      [...Object.values(data), id]
    )
  },
  delete: async (id: string) => {
    const db = await getDb()
    await db.execute('DELETE FROM students WHERE id = ?', [id])
  },
}

// INSEGNANTI
export const teachersDb = {
  getAll: async () => {
    const db = await getDb()
    return db.select<Teacher[]>(
      'SELECT * FROM teachers ORDER BY cognome, nome'
    )
  },
  getById: async (id: string) => {
    const db = await getDb()
    const results = await db.select<Teacher[]>(
      'SELECT * FROM teachers WHERE id = ?', [id]
    )
    return results[0] || null
  },
  create: async (data: TeacherInsert) => {
    const db = await getDb()
    const id = crypto.randomUUID()
    await db.execute(
      `INSERT INTO teachers (id, nome, cognome, email, telefono, whatsapp, 
       strumento_principale, codice_fiscale, iban, tariffa_oraria_individuale, 
       tariffa_oraria_collettivo, note) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, data.nome, data.cognome, data.email, data.telefono, data.whatsapp,
       data.strumento_principale, data.codice_fiscale, data.iban,
       data.tariffa_oraria_individuale, data.tariffa_oraria_collettivo, data.note]
    )
    return id
  },
  update: async (id: string, data: Partial<Teacher>) => {
    const db = await getDb()
    const fields = Object.keys(data).map(k => `${k} = ?`).join(', ')
    await db.execute(
      `UPDATE teachers SET ${fields} WHERE id = ?`,
      [...Object.values(data), id]
    )
  },
  delete: async (id: string) => {
    const db = await getDb()
    await db.execute('DELETE FROM teachers WHERE id = ?', [id])
  },
}

// CORSI
export const coursesDb = {
  getAll: async () => {
    const db = await getDb()
    return db.select<Course[]>(`
      SELECT c.*, t.nome as teacher_nome, t.cognome as teacher_cognome,
             i.nome as instrument_nome, r.nome as room_name
      FROM courses c
      LEFT JOIN teachers t ON c.teacher_id = t.id
      LEFT JOIN instruments i ON c.instrument_id = i.id
      LEFT JOIN rooms r ON c.room_id = r.id
      ORDER BY c.nome
    `)
  },
  create: async (data: CourseInsert) => {
    const db = await getDb()
    const id = crypto.randomUUID()
    await db.execute(
      `INSERT INTO courses (id, nome, descrizione, instrument_id, teacher_id, room_id,
       tipo, livello, durata_minuti, max_allievi, colore_calendario, prezzo,
       giorno_settimana, ora_inizio, ora_fine, anno_accademico)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, data.nome, data.descrizione, data.instrument_id, data.teacher_id,
       data.room_id, data.tipo, data.livello, data.durata_minuti, data.max_allievi,
       data.colore_calendario, data.prezzo, data.giorno_settimana,
       data.ora_inizio, data.ora_fine, data.anno_accademico]
    )
    return id
  },
  update: async (id: string, data: Partial<Course>) => {
    const db = await getDb()
    const fields = Object.keys(data).map(k => `${k} = ?`).join(', ')
    await db.execute(`UPDATE courses SET ${fields} WHERE id = ?`, [...Object.values(data), id])
  },
  delete: async (id: string) => {
    const db = await getDb()
    await db.execute('DELETE FROM courses WHERE id = ?', [id])
  },
}

// PAGAMENTI
export const paymentsDb = {
  getAll: async () => {
    const db = await getDb()
    return db.select<Payment[]>(`
      SELECT p.*, s.nome as student_nome, s.cognome as student_cognome,
             c.nome as course_nome
      FROM payments p
      LEFT JOIN students s ON p.student_id = s.id
      LEFT JOIN courses c ON p.course_id = c.id
      ORDER BY p.data_scadenza DESC
    `)
  },
  create: async (data: PaymentInsert) => {
    const db = await getDb()
    const id = crypto.randomUUID()
    // Genera numero ricevuta progressivo
    const result = await db.select<{count: number}[]>(
      'SELECT COUNT(*) as count FROM payments WHERE stato = ?', ['pagato']
    )
    const numeroRicevuta = `RIC-${new Date().getFullYear()}-${String((result[0]?.count || 0) + 1).padStart(4, '0')}`
    await db.execute(
      `INSERT INTO payments (id, student_id, course_id, importo, data_scadenza,
       metodo, stato, numero_ricevuta, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, data.student_id, data.course_id, data.importo, data.data_scadenza,
       data.metodo, data.stato, numeroRicevuta, data.note]
    )
    return id
  },
  update: async (id: string, data: Partial<Payment>) => {
    const db = await getDb()
    const fields = Object.keys(data).map(k => `${k} = ?`).join(', ')
    await db.execute(`UPDATE payments SET ${fields} WHERE id = ?`, [...Object.values(data), id])
  },
}

// LEZIONI
export const lessonsDb = {
  getAll: async () => {
    const db = await getDb()
    return db.select<Lesson[]>(`
      SELECT l.*, c.nome as course_nome, c.colore_calendario,
             t.nome as teacher_nome, t.cognome as teacher_cognome,
             r.nome as room_nome
      FROM lessons l
      LEFT JOIN courses c ON l.course_id = c.id
      LEFT JOIN teachers t ON c.teacher_id = t.id
      LEFT JOIN rooms r ON c.room_id = r.id
      ORDER BY l.data DESC, l.ora_inizio
    `)
  },
  getByDate: async (date: string) => {
    const db = await getDb()
    return db.select<Lesson[]>(
      `SELECT l.*, c.nome as course_nome, c.colore_calendario
       FROM lessons l
       LEFT JOIN courses c ON l.course_id = c.id
       WHERE l.data = ? ORDER BY l.ora_inizio`, [date]
    )
  },
  create: async (data: LessonInsert) => {
    const db = await getDb()
    const id = crypto.randomUUID()
    await db.execute(
      `INSERT INTO lessons (id, course_id, data, ora_inizio, ora_fine, stato)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, data.course_id, data.data, data.ora_inizio, data.ora_fine, 'programmata']
    )
    return id
  },
  update: async (id: string, data: Partial<Lesson>) => {
    const db = await getDb()
    const fields = Object.keys(data).map(k => `${k} = ?`).join(', ')
    await db.execute(`UPDATE lessons SET ${fields} WHERE id = ?`, [...Object.values(data), id])
  },
}

// PRESENZE
export const attendanceDb = {
  getByLesson: async (lessonId: string) => {
    const db = await getDb()
    return db.select<Attendance[]>(`
      SELECT a.*, s.nome, s.cognome
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      WHERE a.lesson_id = ?`, [lessonId]
    )
  },
  upsert: async (lessonId: string, studentId: string, stato: string) => {
    const db = await getDb()
    const id = crypto.randomUUID()
    await db.execute(
      `INSERT INTO attendance (id, lesson_id, student_id, stato)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(lesson_id, student_id) DO UPDATE SET stato = excluded.stato`,
      [id, lessonId, studentId, stato]
    )
  },
}

// COMPENSI
export const compensiDb = {
  getAll: async () => {
    const db = await getDb()
    return db.select<TeacherCompensation[]>(`
      SELECT tc.*, t.nome, t.cognome
      FROM teacher_compensations tc
      JOIN teachers t ON tc.teacher_id = t.id
      ORDER BY tc.anno DESC, tc.mese DESC
    `)
  },
  calcola: async (teacherId: string, mese: string, anno: number) => {
    const db = await getDb()
    // Calcola ore da presenze del mese
    const presenze = await db.select<{ore: number}[]>(`
      SELECT COUNT(*) * (c.durata_minuti / 60.0) as ore
      FROM attendance a
      JOIN lessons l ON a.lesson_id = l.id
      JOIN courses c ON l.course_id = c.id
      WHERE c.teacher_id = ?
        AND a.stato = 'presente'
        AND strftime('%Y', l.data) = ?
        AND strftime('%m', l.data) = ?
    `, [teacherId, String(anno), mese])
    return presenze[0]?.ore || 0
  },
}

// STRUMENTI
export const instrumentsDb = {
  getAll: async () => {
    const db = await getDb()
    return db.select<Instrument[]>('SELECT * FROM instruments ORDER BY nome')
  },
  create: async (nome: string, categoria?: string) => {
    const db = await getDb()
    const id = crypto.randomUUID()
    await db.execute('INSERT INTO instruments (id, nome, categoria) VALUES (?, ?, ?)', [id, nome, categoria])
    return id
  },
  delete: async (id: string) => {
    const db = await getDb()
    await db.execute('DELETE FROM instruments WHERE id = ?', [id])
  },
}

// AULE
export const roomsDb = {
  getAll: async () => {
    const db = await getDb()
    return db.select<Room[]>('SELECT * FROM rooms ORDER BY nome')
  },
  create: async (data: RoomInsert) => {
    const db = await getDb()
    const id = crypto.randomUUID()
    await db.execute('INSERT INTO rooms (id, nome, capacita, note) VALUES (?, ?, ?, ?)',
      [id, data.nome, data.capacita, data.note])
    return id
  },
  delete: async (id: string) => {
    const db = await getDb()
    await db.execute('DELETE FROM rooms WHERE id = ?', [id])
  },
}

// ROOM BOOKINGS
export interface RoomBooking {
  id: string
  room_id: string
  tipo: 'lezione' | 'sala_prove' | 'evento' | 'altro'
  titolo: string
  nome_gruppo?: string
  contatto_nome?: string
  contatto_telefono?: string
  contatto_email?: string
  data: string
  ora_inizio: string
  ora_fine: string
  note?: string
  colore?: string
  created_at?: string
  room_nome?: string
}

export type RoomBookingInsert = Omit<RoomBooking, 'id' | 'created_at' | 'room_nome'>

export const roomBookingsDb = {
  getByDate: async (date: string) => {
    const db = await getDb()
    return db.select<RoomBooking[]>(`
      SELECT rb.*, r.nome as room_nome
      FROM room_bookings rb
      JOIN rooms r ON rb.room_id = r.id
      WHERE rb.data = ?
      ORDER BY rb.ora_inizio
    `, [date])
  },
  checkConflict: async (roomId: string, date: string, oraInizio: string, oraFine: string, excludeId?: string) => {
    const db = await getDb()
    const query = `
      SELECT id FROM room_bookings
      WHERE room_id = ? AND data = ?
        AND ora_inizio < ? AND ora_fine > ?
        ${excludeId ? 'AND id != ?' : ''}
    `
    const params = excludeId 
      ? [roomId, date, oraFine, oraInizio, excludeId] 
      : [roomId, date, oraFine, oraInizio]
    
    const results = await db.select<{id: string}[]>(query, params)
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
