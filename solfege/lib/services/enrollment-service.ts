import { SupabaseClient } from "@supabase/supabase-js";
import { addWeeks, setHours, setMinutes, startOfDay, parseISO, addMinutes, format } from "date-fns";
import { it } from "date-fns/locale";
import { checkDateHolidayOrClosure, HolidayItem } from "@/lib/holidays";
import { checkDidacticConflicts, ConflictItem } from "./conflict-service";

export interface EnrollmentData {
  school_id: string;
  student_id: string;
  course_id: string;
  teacher_id: string | null;
  start_date: string;
  discount_pct: number;
  skipConflictDates?: boolean;
}

export interface LessonGenerationPreview {
  dateStr: string;
  startStr: string;
  endStr: string;
  isHoliday: boolean;
  holidayName?: string;
  conflicts: ConflictItem[];
  isExistingSharedLesson: boolean;
}

/**
 * Calcola la data di fine anno accademico per una determinata data di inizio corso.
 * Default: 15 giugno dell'anno accademico in corso.
 */
export function getDefaultAcademicYearEnd(startDateStr: string): string {
  const parsed = parseISO(startDateStr);
  const startYear = parsed.getFullYear();
  const startMonth = parsed.getMonth(); // 0 = Jan, 8 = Sep

  if (startMonth >= 7) {
    // Da agosto a dicembre: fine anno accademico è il 15 giugno dell'anno successivo
    return `${startYear + 1}-06-15`;
  } else {
    // Da gennaio a luglio: fine anno accademico è il 15 giugno dell'anno corrente
    return `${startYear}-06-15`;
  }
}

export async function enrollStudent(supabase: SupabaseClient, data: EnrollmentData) {
  const { isDesktop } = await import("@/lib/is-desktop");

  if (isDesktop()) {
    const Database = (await import("@tauri-apps/plugin-sql")).default;
    const db = await Database.load("sqlite:solfege.db");

    // 1. Dati corso e scuola
    const courses = await db.select<any[]>("SELECT * FROM courses WHERE id = ?", [data.course_id]);
    const course = courses[0];
    if (!course) throw new Error("Corso non trovato");

    const schools = await db.select<any[]>("SELECT * FROM schools WHERE id = ? LIMIT 1", [data.school_id]);
    const school = schools[0] || (await db.select<any[]>("SELECT * FROM schools LIMIT 1"))[0];

    // Data di fine anno accademico
    let academicYearEnd = school?.academic_year_end;
    if (!academicYearEnd || academicYearEnd < data.start_date) {
      academicYearEnd = getDefaultAcademicYearEnd(data.start_date);
    }
    const endDate = startOfDay(parseISO(academicYearEnd));

    // Carica chiusure e festività della scuola da SQLite
    let customClosures: HolidayItem[] = [];
    try {
      customClosures = await db.select<HolidayItem[]>(
        "SELECT nome, data_inizio, data_fine, tipo FROM school_holidays WHERE school_id = ?",
        [data.school_id]
      );
    } catch {
      // Tabella non ancora popolata o nuova
    }

    // 2. Crea Enrollment
    const enrollmentId = crypto.randomUUID();
    await db.execute(
      `INSERT INTO enrollments (id, school_id, student_id, course_id, teacher_id, start_date, discount_pct, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        enrollmentId, data.school_id, data.student_id, data.course_id,
        data.teacher_id, data.start_date, data.discount_pct, "active"
      ]
    );

    const isCollective = course.tipo === "collettivo" || course.tipo === "ensemble";

    // 3. Generazione Lezioni fino a fine anno accademico (saltando festività e chiusure)
    let multiSchedules: { day_of_week: string; start_time: string }[] | null = null;
    try {
      const rawAnno = course.anno_accademico || "";
      if (rawAnno.includes("|")) {
        const parts = rawAnno.split("|");
        const parsed = JSON.parse(parts[1]);
        if (parsed && Array.isArray(parsed.multiScheduling)) {
          multiSchedules = parsed.multiScheduling;
        }
      }
    } catch {}

    const schedulesToRun: { dayOfWeekNum: number; startTime: string }[] = [];
    if (multiSchedules && multiSchedules.length > 0) {
      for (const sched of multiSchedules) {
        if (sched.day_of_week && sched.start_time) {
          schedulesToRun.push({
            dayOfWeekNum: parseInt(sched.day_of_week, 10),
            startTime: sched.start_time,
          });
        }
      }
    } else if (course.giorno_settimana !== null && course.giorno_settimana !== undefined && course.ora_inizio) {
      schedulesToRun.push({
        dayOfWeekNum: course.giorno_settimana,
        startTime: course.ora_inizio,
      });
    }

    const duration = course.durata_minuti || 60;

    for (const sched of schedulesToRun) {
      const [hours, minutes] = sched.startTime.split(":").map(Number);
      let currentDate = startOfDay(parseISO(data.start_date));

      while (currentDate.getDay() !== sched.dayOfWeekNum) {
        currentDate.setDate(currentDate.getDate() + 1);
      }

      while (currentDate <= endDate) {
        const dateStr = format(currentDate, "yyyy-MM-dd");

        // Controllo festività o chiusura
        const holCheck = checkDateHolidayOrClosure(dateStr, customClosures);
        if (holCheck.isHoliday) {
          // Salta automaticamente il giorno festivo
          currentDate = addWeeks(currentDate, 1);
          continue;
        }

        const lessonStart = setMinutes(setHours(currentDate, hours), minutes);
        const lessonEnd = addMinutes(lessonStart, duration);
        const startStr = format(lessonStart, "HH:mm");
        const endStr = format(lessonEnd, "HH:mm");

        // Controllo opzionale di salto per conflitti
        if (data.skipConflictDates) {
          const conflicts = await checkDidacticConflicts({
            schoolId: data.school_id,
            dateStr,
            oraInizio: startStr,
            oraFine: endStr,
            roomId: course.room_id,
            teacherId: data.teacher_id,
            studentId: data.student_id,
          });
          if (conflicts.length > 0) {
            currentDate = addWeeks(currentDate, 1);
            continue;
          }
        }

        let targetLessonId: string;

        if (isCollective) {
          // Corso collettivo: cerca se esiste già una lezione per il corso in quella data e orario
          const existing = await db.select<any[]>(
            "SELECT id FROM lessons WHERE course_id = ? AND data = ? AND ora_inizio = ? AND stato != 'annullata' LIMIT 1",
            [data.course_id, dateStr, startStr]
          );

          if (existing.length > 0) {
            targetLessonId = existing[0].id;
          } else {
            targetLessonId = crypto.randomUUID();
            await db.execute(
              `INSERT INTO lessons (id, school_id, course_id, teacher_id, room_id, data, ora_inizio, ora_fine, stato)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                targetLessonId, data.school_id, data.course_id, data.teacher_id,
                course.room_id, dateStr, startStr, endStr, "programmata"
              ]
            );
          }
        } else {
          // Corso individuale: crea lezione dedicata
          targetLessonId = crypto.randomUUID();
          await db.execute(
            `INSERT INTO lessons (id, school_id, course_id, teacher_id, room_id, data, ora_inizio, ora_fine, stato)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              targetLessonId, data.school_id, data.course_id, data.teacher_id,
              course.room_id, dateStr, startStr, endStr, "programmata"
            ]
          );
        }

        // Inserisci presenza/partecipante (attendances table)
        await db.execute(
          `INSERT OR IGNORE INTO attendances (id, lesson_id, student_id, stato)
           VALUES (lower(hex(randomblob(16))), ?, ?, 'assente')`,
          [targetLessonId, data.student_id]
        );

        currentDate = addWeeks(currentDate, 1);
      }
    }

    // Se corso collettivo, assicuriamoci di agganciare l'allievo anche a eventuali altre lezioni future già presenti
    if (isCollective) {
      const futureLessons = await db.select<any[]>(
        "SELECT id FROM lessons WHERE course_id = ? AND data >= ? AND stato != 'annullata'",
        [data.course_id, data.start_date]
      );
      for (const fl of futureLessons) {
        await db.execute(
          `INSERT OR IGNORE INTO attendances (id, lesson_id, student_id, stato)
           VALUES (lower(hex(randomblob(16))), ?, ?, 'assente')`,
          [fl.id, data.student_id]
        );
      }
    }

    // 4. Genera primo pagamento
    const amount = course.prezzo ? (course.prezzo * (1 - data.discount_pct / 100)) : 0;
    if (amount > 0) {
      const paymentId = crypto.randomUUID();
      const desc = `Mensilità ${format(new Date(data.start_date), "MMMM yyyy", { locale: it })} - ${course.nome}`;
      await db.execute(
        `INSERT INTO payments (id, school_id, student_id, enrollment_id, amount, due_date, status, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          paymentId, data.school_id, data.student_id, enrollmentId,
          amount, data.start_date, "in_attesa", desc
        ]
      );
    }

    return { id: enrollmentId };
  }

  // Web Flow (Supabase)
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("*")
    .eq("id", data.course_id)
    .single();

  if (courseError || !course) throw new Error("Corso non trovato");

  const { data: school } = await supabase
    .from("schools")
    .select("academic_year_end")
    .eq("id", data.school_id)
    .maybeSingle();

  let academicYearEnd = school?.academic_year_end;
  if (!academicYearEnd || academicYearEnd < data.start_date) {
    academicYearEnd = getDefaultAcademicYearEnd(data.start_date);
  }
  const endDate = startOfDay(parseISO(academicYearEnd));

  // Carica chiusure e festività della scuola da Supabase
  const { data: closuresData } = await supabase
    .from("school_holidays")
    .select("nome, data_inizio, data_fine, tipo")
    .eq("school_id", data.school_id);

  const customClosures: HolidayItem[] = closuresData || [];

  // 2. Crea Enrollment
  const { data: enrollment, error: enrollError } = await supabase
    .from("enrollments")
    .insert({
      school_id: data.school_id,
      student_id: data.student_id,
      course_id: data.course_id,
      teacher_id: data.teacher_id,
      start_date: data.start_date,
      discount_pct: data.discount_pct,
      status: "active",
    })
    .select()
    .single();

  if (enrollError) throw enrollError;

  const isCollective = course.type === "collettivo" || course.type === "ensemble";

  // 3. Generazione lezioni fino a fine anno accademico
  let onlineSchedules: { day_of_week: string; start_time: string }[] | null = null;
  try {
    const rawAnno = course.anno_scolastico || "";
    if (rawAnno.includes("|")) {
      const parts = rawAnno.split("|");
      const parsed = JSON.parse(parts[1]);
      if (parsed && Array.isArray(parsed.multiScheduling)) {
        onlineSchedules = parsed.multiScheduling;
      }
    }
  } catch {}

  const schedulesToRun: { dayOfWeekNum: number; startTime: string }[] = [];
  if (onlineSchedules && onlineSchedules.length > 0) {
    for (const sched of onlineSchedules) {
      if (sched.day_of_week && sched.start_time) {
        schedulesToRun.push({
          dayOfWeekNum: parseInt(sched.day_of_week, 10),
          startTime: sched.start_time,
        });
      }
    }
  } else if (course.day_of_week !== null && course.day_of_week !== undefined && course.start_time) {
    schedulesToRun.push({
      dayOfWeekNum: course.day_of_week,
      startTime: course.start_time,
    });
  }

  const duration = course.duration_min || 60;

  for (const sched of schedulesToRun) {
    const [hours, minutes] = sched.startTime.split(":").map(Number);
    let currentDate = startOfDay(parseISO(data.start_date));

    while (currentDate.getDay() !== sched.dayOfWeekNum) {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    while (currentDate <= endDate) {
      const dateStr = format(currentDate, "yyyy-MM-dd");

      // Controllo festività o chiusura
      const holCheck = checkDateHolidayOrClosure(dateStr, customClosures);
      if (holCheck.isHoliday) {
        currentDate = addWeeks(currentDate, 1);
        continue;
      }

      const lessonStart = setMinutes(setHours(currentDate, hours), minutes);
      const lessonEnd = addMinutes(lessonStart, duration);
      const startISO = lessonStart.toISOString();
      const endISO = lessonEnd.toISOString();

      if (data.skipConflictDates) {
        const conflicts = await checkDidacticConflicts({
          schoolId: data.school_id,
          dateStr,
          oraInizio: format(lessonStart, "HH:mm"),
          oraFine: format(lessonEnd, "HH:mm"),
          roomId: course.room_id,
          teacherId: data.teacher_id,
          studentId: data.student_id,
        });
        if (conflicts.length > 0) {
          currentDate = addWeeks(currentDate, 1);
          continue;
        }
      }

      let targetLessonId: string;

      if (isCollective) {
        // Cerca lezione esistente
        const { data: existing } = await supabase
          .from("lessons")
          .select("id")
          .eq("course_id", data.course_id)
          .gte("data_ora_inizio", `${dateStr}T00:00:00`)
          .lte("data_ora_inizio", `${dateStr}T23:59:59`)
          .neq("status", "annullata")
          .maybeSingle();

        if (existing) {
          targetLessonId = existing.id;
        } else {
          const { data: newLesson, error: nlErr } = await supabase
            .from("lessons")
            .insert({
              school_id: data.school_id,
              course_id: data.course_id,
              teacher_id: data.teacher_id,
              room_id: course.room_id,
              data_ora_inizio: startISO,
              data_ora_fine: endISO,
              status: "programmata",
            })
            .select("id")
            .single();

          if (nlErr) {
            console.error("Errore inserimento lezione collettiva:", nlErr);
            currentDate = addWeeks(currentDate, 1);
            continue;
          }
          targetLessonId = newLesson.id;
        }
      } else {
        const { data: newLesson, error: nlErr } = await supabase
          .from("lessons")
          .insert({
            school_id: data.school_id,
            course_id: data.course_id,
            teacher_id: data.teacher_id,
            room_id: course.room_id,
            data_ora_inizio: startISO,
            data_ora_fine: endISO,
            status: "programmata",
          })
          .select("id")
          .single();

        if (nlErr) {
          console.error("Errore inserimento lezione individuale:", nlErr);
          currentDate = addWeeks(currentDate, 1);
          continue;
        }
        targetLessonId = newLesson.id;
      }

      // Inserisci riga presenze
      await supabase
        .from("attendance")
        .upsert({
          school_id: data.school_id,
          lesson_id: targetLessonId,
          student_id: data.student_id,
          status: "absent",
        }, { onConflict: "lesson_id,student_id" });

      currentDate = addWeeks(currentDate, 1);
    }
  }

  // Per corsi collettivi, aggancia l'allievo a tutte le lezioni future già create
  if (isCollective) {
    const { data: futureLessons } = await supabase
      .from("lessons")
      .select("id")
      .eq("course_id", data.course_id)
      .gte("data_ora_inizio", `${data.start_date}T00:00:00`)
      .neq("status", "annullata");

    if (futureLessons && futureLessons.length > 0) {
      const attendanceInserts = futureLessons.map((fl) => ({
        school_id: data.school_id,
        lesson_id: fl.id,
        student_id: data.student_id,
        status: "absent",
      }));
      await supabase.from("attendance").upsert(attendanceInserts, { onConflict: "lesson_id,student_id" });
    }
  }

  // 4. Primo Pagamento
  const amount = course.price ? (course.price * (1 - data.discount_pct / 100)) : 0;
  if (amount > 0) {
    const { error: payError } = await supabase.from("payments").insert({
      school_id: data.school_id,
      student_id: data.student_id,
      enrollment_id: enrollment.id,
      amount: amount,
      due_date: data.start_date,
      status: "in_attesa",
      description: `Mensilità ${format(new Date(data.start_date), "MMMM yyyy", { locale: it })} - ${course.name}`,
    });
    if (payError) console.error("Errore generazione pagamento:", payError);
  }

  return enrollment;
}
