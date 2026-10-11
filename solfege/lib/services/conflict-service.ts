import { isDesktop } from "@/lib/is-desktop";
import { createClient } from "@/lib/supabase/client";

export interface ConflictCheckParams {
  schoolId?: string;
  dateStr: string;       // YYYY-MM-DD
  oraInizio: string;     // HH:mm
  oraFine: string;       // HH:mm
  roomId?: string | null;
  teacherId?: string | null;
  studentId?: string | null;
  excludeLessonId?: string | null;
  excludeBookingId?: string | null;
}

export interface ConflictItem {
  type: "room" | "teacher" | "student";
  title: string;
  description: string;
  dateStr: string;
  oraInizio: string;
  oraFine: string;
}

function timesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  return start1 < end2 && end1 > start2;
}

/**
 * Controlla i conflitti per una singola fascia oraria (data, ora inizio, ora fine).
 * Verifica aula, docente e allievo.
 */
export async function checkDidacticConflicts(
  params: ConflictCheckParams
): Promise<ConflictItem[]> {
  const {
    schoolId,
    dateStr,
    oraInizio,
    oraFine,
    roomId,
    teacherId,
    studentId,
    excludeLessonId,
    excludeBookingId,
  } = params;

  const conflicts: ConflictItem[] = [];

  if (!dateStr || !oraInizio || !oraFine || oraInizio >= oraFine) {
    return conflicts;
  }

  if (isDesktop()) {
    try {
      const Database = (await import("@tauri-apps/plugin-sql")).default;
      const db = await Database.load("sqlite:solfege.db");

      // 1. Conflitti AULA con Prenotazioni Sale
      if (roomId) {
        let bookingQuery = `
          SELECT b.id, b.titolo, b.ora_inizio, b.ora_fine, r.nome as room_nome
          FROM room_bookings b
          LEFT JOIN rooms r ON b.room_id = r.id
          WHERE b.room_id = ? AND b.data = ?
        `;
        const bookingParams: any[] = [roomId, dateStr];
        if (excludeBookingId) {
          bookingQuery += ` AND b.id != ?`;
          bookingParams.push(excludeBookingId);
        }

        const bookings = await db.select<any[]>(bookingQuery, bookingParams);
        for (const b of bookings) {
          if (timesOverlap(oraInizio, oraFine, b.ora_inizio, b.ora_fine)) {
            conflicts.push({
              type: "room",
              title: `Aula occupata (${b.room_nome || "Aula"})`,
              description: `Aula già prenotata per "${b.titolo}" dalle ${b.ora_inizio} alle ${b.ora_fine}`,
              dateStr,
              oraInizio: b.ora_inizio,
              oraFine: b.ora_fine,
            });
          }
        }
      }

      // 2. Conflitti AULA e DOCENTE con altre Lezioni del giorno
      const lessonsQuery = `
        SELECT l.id, l.data, l.ora_inizio, l.ora_fine, l.course_id, l.teacher_id, l.room_id,
               c.nome as course_nome, r.nome as room_nome,
               t.nome as teacher_nome, t.cognome as teacher_cognome
        FROM lessons l
        LEFT JOIN courses c ON l.course_id = c.id
        LEFT JOIN rooms r ON l.room_id = r.id
        LEFT JOIN teachers t ON l.teacher_id = t.id
        WHERE l.data = ? AND l.stato != 'annullata'
      `;
      const dailyLessons = await db.select<any[]>(lessonsQuery, [dateStr]);

      for (const l of dailyLessons) {
        if (excludeLessonId && l.id === excludeLessonId) continue;
        if (!timesOverlap(oraInizio, oraFine, l.ora_inizio, l.ora_fine)) continue;

        // Conflitto Aula
        if (roomId && l.room_id === roomId) {
          conflicts.push({
            type: "room",
            title: `Aula occupata (${l.room_nome || "Aula"})`,
            description: `Aula occupata dalla lezione "${l.course_nome || "Lezione"}" con ${l.teacher_nome || ""} ${l.teacher_cognome || ""} dalle ${l.ora_inizio} alle ${l.ora_fine}`,
            dateStr,
            oraInizio: l.ora_inizio,
            oraFine: l.ora_fine,
          });
        }

        // Conflitto Docente
        if (teacherId && (l.teacher_id === teacherId || (!l.teacher_id && l.course_teacher_id === teacherId))) {
          conflicts.push({
            type: "teacher",
            title: `Docente occupato (${l.teacher_nome || ""} ${l.teacher_cognome || ""})`,
            description: `Il docente è già impegnato nel corso "${l.course_nome || "Lezione"}" dalle ${l.ora_inizio} alle ${l.ora_fine}`,
            dateStr,
            oraInizio: l.ora_inizio,
            oraFine: l.ora_fine,
          });
        }
      }

      // 3. Conflitti ALLIEVO con altre lezioni in cui è iscritto / registrato presente
      if (studentId) {
        const studentLessonsQuery = `
          SELECT l.id, l.data, l.ora_inizio, l.ora_fine, c.nome as course_nome, s.nome as student_nome, s.cognome as student_cognome
          FROM attendances a
          JOIN lessons l ON a.lesson_id = l.id
          LEFT JOIN courses c ON l.course_id = c.id
          LEFT JOIN students s ON a.student_id = s.id
          WHERE a.student_id = ? AND l.data = ? AND l.stato != 'annullata'
        `;
        const stLessons = await db.select<any[]>(studentLessonsQuery, [studentId, dateStr]);

        for (const sl of stLessons) {
          if (excludeLessonId && sl.id === excludeLessonId) continue;
          if (timesOverlap(oraInizio, oraFine, sl.ora_inizio, sl.ora_fine)) {
            conflicts.push({
              type: "student",
              title: `Allievo occupato (${sl.student_nome} ${sl.student_cognome})`,
              description: `L'allievo ha già una lezione di "${sl.course_nome || "Lezione"}" dalle ${sl.ora_inizio} alle ${sl.ora_fine}`,
              dateStr,
              oraInizio: sl.ora_inizio,
              oraFine: sl.ora_fine,
            });
          }
        }
      }

      return conflicts;
    } catch (e) {
      console.error("[ConflictService] Errore verifica SQLite:", e);
      return conflicts;
    }
  }

  // Web (Supabase)
  try {
    const supabase = createClient();
    let sId = schoolId;
    if (!sId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("school_id").eq("id", user.id).single();
        sId = profile?.school_id ?? undefined;
      }
    }
    if (!sId) return conflicts;

    // 1. Conflitti AULA con Prenotazioni Sale
    if (roomId) {
      let bQuery = supabase
        .from("room_bookings")
        .select("id, titolo, ora_inizio, ora_fine, rooms(name)")
        .eq("school_id", sId)
        .eq("room_id", roomId)
        .eq("data", dateStr);

      if (excludeBookingId) {
        bQuery = bQuery.neq("id", excludeBookingId);
      }

      const { data: bData } = await bQuery;
      for (const b of (bData || [])) {
        const bStart = b.ora_inizio.substring(0, 5);
        const bEnd = b.ora_fine.substring(0, 5);
        if (timesOverlap(oraInizio, oraFine, bStart, bEnd)) {
          conflicts.push({
            type: "room",
            title: `Aula occupata (${(b.rooms as any)?.name || "Aula"})`,
            description: `Aula già prenotata per "${b.titolo}" dalle ${bStart} alle ${bEnd}`,
            dateStr,
            oraInizio: bStart,
            oraFine: bEnd,
          });
        }
      }
    }

    // 2. Conflitti Lezioni didattiche (Aula & Docente)
    const { data: lData } = await supabase
      .from("lessons")
      .select(`
        id, data_ora_inizio, data_ora_fine, status, room_id, teacher_id,
        courses(name), rooms(name), teachers(first_name, last_name)
      `)
      .eq("school_id", sId)
      .gte("data_ora_inizio", `${dateStr}T00:00:00`)
      .lte("data_ora_inizio", `${dateStr}T23:59:59`)
      .neq("status", "cancellata");

    for (const l of (lData || [])) {
      if (excludeLessonId && l.id === excludeLessonId) continue;
      const lStart = l.data_ora_inizio.substring(11, 16);
      const lEnd = l.data_ora_fine.substring(11, 16);
      if (!timesOverlap(oraInizio, oraFine, lStart, lEnd)) continue;

      if (roomId && l.room_id === roomId) {
        conflicts.push({
          type: "room",
          title: `Aula occupata (${(l.rooms as any)?.name || "Aula"})`,
          description: `Aula occupata dalla lezione "${(l.courses as any)?.name || "Lezione"}" dalle ${lStart} alle ${lEnd}`,
          dateStr,
          oraInizio: lStart,
          oraFine: lEnd,
        });
      }

      if (teacherId && l.teacher_id === teacherId) {
        conflicts.push({
          type: "teacher",
          title: `Docente occupato (${(l.teachers as any)?.first_name || ""} ${(l.teachers as any)?.last_name || ""})`,
          description: `Docente già impegnato in "${(l.courses as any)?.name || "Lezione"}" dalle ${lStart} alle ${lEnd}`,
          dateStr,
          oraInizio: lStart,
          oraFine: lEnd,
        });
      }
    }

    // 3. Conflitti Allievo
    if (studentId) {
      const { data: aData } = await supabase
        .from("attendance")
        .select(`
          lesson_id,
          lessons!inner(id, data_ora_inizio, data_ora_fine, status, courses(name)),
          students(first_name, last_name)
        `)
        .eq("school_id", sId)
        .eq("student_id", studentId)
        .gte("lessons.data_ora_inizio", `${dateStr}T00:00:00`)
        .lte("lessons.data_ora_inizio", `${dateStr}T23:59:59`);

      for (const att of (aData || [])) {
        const l = (att as any).lessons;
        if (!l || l.status === "annullata") continue;
        if (excludeLessonId && l.id === excludeLessonId) continue;
        const lStart = l.data_ora_inizio.substring(11, 16);
        const lEnd = l.data_ora_fine.substring(11, 16);
        if (timesOverlap(oraInizio, oraFine, lStart, lEnd)) {
          conflicts.push({
            type: "student",
            title: `Allievo occupato`,
            description: `L'allievo ha già una lezione di "${l.courses?.name || "Lezione"}" dalle ${lStart} alle ${lEnd}`,
            dateStr,
            oraInizio: lStart,
            oraFine: lEnd,
          });
        }
      }
    }
  } catch (e) {
    console.error("[ConflictService] Errore verifica Supabase:", e);
  }

  return conflicts;
}
