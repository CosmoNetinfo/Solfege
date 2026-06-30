import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      license_key,
      school,
      students = [],
      teachers = [],
      courses = [],
      enrollments = [],
      lessons = [],
      attendance = [],
      payments = [],
      notices = []
    } = body;

    if (!license_key || !school || !school.id) {
      return NextResponse.json({ error: 'Chiave licenza o dati scuola mancanti' }, { status: 400 });
    }

    const adminDb = createAdminClient();

    // 1. Verifica licenza su Supabase
    const { data: licenseRes, error: licenseError } = await adminDb
      .from('licenses' as any)
      .select('*')
      .eq('license_key', license_key)
      .maybeSingle();

    const license = licenseRes as any;

    if (licenseError || !license) {
      return NextResponse.json({ error: 'Licenza non valida o non trovata' }, { status: 403 });
    }

    if (license.status === 'revoked') {
      return NextResponse.json({ error: 'Licenza revocata' }, { status: 403 });
    }

    // 2. Associazione / verifica school_id
    if (!license.school_id) {
      // Primo sync: associa questa scuola alla licenza
      const { error: assocError } = await adminDb
        .from('licenses' as any)
        .update({ school_id: school.id })
        .eq('license_key', license_key);
      
      if (assocError) {
        return NextResponse.json({ error: 'Impossibile associare la scuola alla licenza: ' + assocError.message }, { status: 500 });
      }
    } else if (license.school_id !== school.id) {
      // Controllo di sicurezza: lo school_id deve corrispondere a quello associato alla licenza
      return NextResponse.json({ error: 'Questa licenza è già associata a un altro database scolastico.' }, { status: 403 });
    }

    const schoolId = school.id;

    // 3. Upsert dei dati scuola
    const mappedSchool = {
      id: school.id,
      name: school.nome,
      address: school.indirizzo || null,
      phone: school.telefono || null,
      email: school.email || null,
      website: school.sito_web || null,
      current_academic_year: school.anno_accademico_corrente || '2026/2027',
      slug: school.slug || school.nome.toLowerCase().replace(/[^a-z0-9-]/g, '').substring(0, 50)
    };

    const { error: schoolUpsertError } = await adminDb
      .from('schools' as any)
      .upsert(mappedSchool);

    if (schoolUpsertError) {
      return NextResponse.json({ error: 'Errore sync scuola: ' + schoolUpsertError.message }, { status: 500 });
    }

    // 4. Upsert delle tabelle collegate in blocco (se presenti nel payload)

    // STUDENTI
    if (students.length > 0) {
      const mappedStudents = students.map((s: any) => ({
        id: s.id,
        school_id: schoolId,
        first_name: s.nome,
        last_name: s.cognome,
        dob: s.data_nascita || null,
        fiscal_code: s.codice_fiscale || null,
        email: s.email || null,
        phone: s.telefono || null,
        address: s.indirizzo || null,
        city: s.citta || null,
        cap: s.cap || null,
        active: true,
        parent_name: s.genitore_nome || null,
        parent_surname: s.genitore_cognome || null,
        parent_email: s.genitore_email || null,
        parent_phone: s.genitore_telefono || null,
        notes: s.note || null
      }));
      const { error } = await adminDb.from('students' as any).upsert(mappedStudents);
      if (error) console.error('[SYNC ERROR] students:', error.message);
    }

    // INSEGNANTI
    if (teachers.length > 0) {
      const mappedTeachers = teachers.map((t: any) => ({
        id: t.id,
        school_id: schoolId,
        first_name: t.nome,
        last_name: t.cognome,
        email: t.email || null,
        phone: t.telefono || null,
        fiscal_code: t.codice_fiscale || null,
        iban: t.iban || null,
        rate_individual: t.tariffa_oraria_individuale || 0,
        rate_group: t.tariffa_oraria_collettivo || 0,
        active: true
      }));
      const { error } = await adminDb.from('teachers' as any).upsert(mappedTeachers);
      if (error) console.error('[SYNC ERROR] teachers:', error.message);
    }

    // CORSI
    if (courses.length > 0) {
      const mappedCourses = courses.map((c: any) => ({
        id: c.id,
        school_id: schoolId,
        name: c.nome,
        type: c.tipo || 'individuale',
        price: c.prezzo || null,
        day_of_week: c.giorno_settimana !== undefined ? c.giorno_settimana : null,
        start_time: c.ora_inizio || null,
        duration_min: c.durata_minuti || 60,
        max_students: c.max_allievi || 1,
        colore_calendario: c.colore_calendario || '#E8621A',
        active: true,
        level: c.livello || null,
        anno_scolastico: c.anno_accademico || null,
        room_id: c.room_id || null,
        instrument_id: c.instrument_id || null
      }));
      const { error } = await adminDb.from('courses' as any).upsert(mappedCourses);
      if (error) console.error('[SYNC ERROR] courses:', error.message);
    }

    // ISCRIZIONI
    if (enrollments.length > 0) {
      const mappedEnrollments = enrollments.map((e: any) => ({
        id: e.id,
        school_id: schoolId,
        student_id: e.student_id,
        course_id: e.course_id,
        start_date: e.data_iscrizione || new Date().toISOString().split('T')[0],
        status: e.stato || 'attivo'
      }));
      const { error } = await adminDb.from('enrollments' as any).upsert(mappedEnrollments);
      if (error) console.error('[SYNC ERROR] enrollments:', error.message);
    }

    // LEZIONI
    if (lessons.length > 0) {
      const mappedLessons = lessons.map((l: any) => ({
        id: l.id,
        school_id: schoolId,
        course_id: l.course_id,
        room_id: l.room_id || null,
        data_ora_inizio: l.data + 'T' + l.ora_inizio,
        data_ora_fine: l.data + 'T' + l.ora_fine,
        topic: l.argomenti || null,
        homework: l.compiti || null,
        status: l.stato || 'programmata'
      }));
      const { error } = await adminDb.from('lessons' as any).upsert(mappedLessons);
      if (error) console.error('[SYNC ERROR] lessons:', error.message);
    }

    // PRESENZE
    if (attendance.length > 0) {
      const mappedAttendance = attendance.map((a: any) => ({
        id: a.id,
        school_id: schoolId,
        lesson_id: a.lesson_id,
        student_id: a.student_id,
        status: a.stato || 'presente',
        notes: a.note || null
      }));
      const { error } = await adminDb.from('attendance' as any).upsert(mappedAttendance);
      if (error) console.error('[SYNC ERROR] attendance:', error.message);
    }

    // PAGAMENTI
    if (payments.length > 0) {
      const mappedPayments = payments.map((p: any) => ({
        id: p.id,
        school_id: schoolId,
        student_id: p.student_id,
        course_id: p.course_id || null,
        amount: p.importo || 0,
        paid_date: p.data_pagamento || null,
        due_date: p.data_scadenza,
        method: p.metodo || 'contanti',
        status: p.stato || 'in_attesa',
        numero_ricevuta: p.numero_ricevuta || null,
        notes: p.note || null
      }));
      const { error } = await adminDb.from('payments' as any).upsert(mappedPayments);
      if (error) console.error('[SYNC ERROR] payments:', error.message);
    }

    // AVVISI (SCHOOL NOTICES)
    if (notices.length > 0) {
      const mappedNotices = notices.map((n: any) => ({
        id: n.id,
        school_id: schoolId,
        title: n.titolo,
        content: n.contenuto,
        is_important: n.importante === 1,
        created_at: n.created_at || new Date().toISOString()
      }));
      const { error } = await adminDb.from('school_notices' as any).upsert(mappedNotices);
      if (error) console.error('[SYNC ERROR] school_notices:', error.message);
    }

    return NextResponse.json({ success: true, message: 'Sincronizzazione completata con successo' });
  } catch (err: any) {
    console.error('[SYNC API ERROR]:', err);
    return NextResponse.json({ error: err.message || 'Errore interno del server' }, { status: 500 });
  }
}
