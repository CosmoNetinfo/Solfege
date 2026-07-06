import { SupabaseClient } from "@supabase/supabase-js";
import { addWeeks, setHours, setMinutes, startOfDay, parseISO, addMinutes, format } from "date-fns";
import { it } from "date-fns/locale";

export interface EnrollmentData {
  school_id: string;
  student_id: string;
  course_id: string;
  teacher_id: string | null;
  start_date: string;
  discount_pct: number;
}
export async function enrollStudent(supabase: SupabaseClient, data: EnrollmentData) {
  const { isDesktop } = await import("@/lib/is-desktop");

  if (isDesktop()) {
    const Database = (await import("@tauri-apps/plugin-sql")).default;
    const db = await Database.load("sqlite:solfege.db");

    // 1. Get course details
    const courses = await db.select<any[]>("SELECT * FROM courses WHERE id = ?", [data.course_id]);
    const course = courses[0];
    if (!course) throw new Error("Corso non trovato");

    // 2. Create Enrollment
    const enrollmentId = crypto.randomUUID();
    await db.execute(
      `INSERT INTO enrollments (id, school_id, student_id, course_id, teacher_id, start_date, discount_pct, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        enrollmentId, data.school_id, data.student_id, data.course_id,
        data.teacher_id, data.start_date, data.discount_pct, "active"
      ]
    );

    // 3. Generate Lessons (next 12 weeks)
    let multiSchedules: { day_of_week: string; start_time: string }[] | null = null;
    try {
      const descText = course.descrizione || "";
      if (descText.startsWith("{")) {
        const parsed = JSON.parse(descText);
        if (parsed && Array.isArray(parsed.multiScheduling)) {
          multiSchedules = parsed.multiScheduling;
        }
      }
    } catch (e) {}

    if (multiSchedules && multiSchedules.length > 0) {
      // Flusso Programmazione Multipla
      const duration = course.durata_minuti || 60;
      
      for (const sched of multiSchedules) {
        if (!sched.day_of_week || !sched.start_time) continue;
        const dayOfWeekNum = parseInt(sched.day_of_week);
        const [hours, minutes] = sched.start_time.split(":").map(Number);
        
        let currentDate = startOfDay(parseISO(data.start_date));
        while (currentDate.getDay() !== dayOfWeekNum) {
          currentDate.setDate(currentDate.getDate() + 1);
        }

        for (let i = 0; i < 12; i++) {
          const lessonStart = setMinutes(setHours(currentDate, hours), minutes);
          const lessonEnd = addMinutes(lessonStart, duration);

          const lessonId = crypto.randomUUID();
          const dateStr = format(currentDate, "yyyy-MM-dd");
          const startStr = format(lessonStart, "HH:mm");
          const endStr = format(lessonEnd, "HH:mm");

          await db.execute(
            `INSERT INTO lessons (id, school_id, course_id, teacher_id, room_id, data, ora_inizio, ora_fine, stato)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              lessonId, data.school_id, data.course_id, data.teacher_id,
              course.room_id, dateStr, startStr, endStr, "programmata"
            ]
          );

          await db.execute(
            `INSERT INTO attendances (id, lesson_id, student_id, stato)
             VALUES (lower(hex(randomblob(16))), ?, ?, 'assente')`,
            [lessonId, data.student_id]
          );

          currentDate = addWeeks(currentDate, 1);
        }
      }
    } else if (course.giorno_settimana !== null && course.giorno_settimana !== undefined && course.ora_inizio) {
      // Flusso Singolo standard
      const [hours, minutes] = course.ora_inizio.split(":").map(Number);
      const duration = course.durata_minuti || 60;

      let currentDate = startOfDay(parseISO(data.start_date));
      
      while (currentDate.getDay() !== course.giorno_settimana) {
        currentDate.setDate(currentDate.getDate() + 1);
      }

      for (let i = 0; i < 12; i++) {
        const lessonStart = setMinutes(setHours(currentDate, hours), minutes);
        const lessonEnd = addMinutes(lessonStart, duration);

        const lessonId = crypto.randomUUID();
        const dateStr = format(currentDate, "yyyy-MM-dd");
        const startStr = format(lessonStart, "HH:mm");
        const endStr = format(lessonEnd, "HH:mm");

        await db.execute(
          `INSERT INTO lessons (id, school_id, course_id, teacher_id, room_id, data, ora_inizio, ora_fine, stato)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            lessonId, data.school_id, data.course_id, data.teacher_id,
            course.room_id, dateStr, startStr, endStr, "programmata"
          ]
        );

        await db.execute(
          `INSERT INTO attendances (id, lesson_id, student_id, stato)
           VALUES (lower(hex(randomblob(16))), ?, ?, 'assente')`,
          [lessonId, data.student_id]
        );

        currentDate = addWeeks(currentDate, 1);
      }
    }

    // 4. Generate First Payment
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
  // 1. Get course details
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("*")
    .eq("id", data.course_id)
    .single();

  if (courseError || !course) throw new Error("Corso non trovato");

  // 2. Create Enrollment
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

  // 3. Generate Lessons (next 12 weeks)
  let onlineSchedules: { day_of_week: string; start_time: string }[] | null = null;
  try {
    const descText = course.descrizione || "";
    if (descText.startsWith("{")) {
      const parsed = JSON.parse(descText);
      if (parsed && Array.isArray(parsed.multiScheduling)) {
        onlineSchedules = parsed.multiScheduling;
      }
    }
  } catch (e) {}

  if (onlineSchedules && onlineSchedules.length > 0) {
    const lessonsToInsert = [];
    const duration = course.duration_min || 60;

    for (const sched of onlineSchedules) {
      if (!sched.day_of_week || !sched.start_time) continue;
      const dayOfWeekNum = parseInt(sched.day_of_week);
      const [hours, minutes] = sched.start_time.split(":").map(Number);

      let currentDate = startOfDay(parseISO(data.start_date));
      while (currentDate.getDay() !== dayOfWeekNum) {
        currentDate.setDate(currentDate.getDate() + 1);
      }

      for (let i = 0; i < 12; i++) {
        const lessonStart = setMinutes(setHours(currentDate, hours), minutes);
        const lessonEnd = addMinutes(lessonStart, duration);

        lessonsToInsert.push({
          school_id: data.school_id,
          course_id: data.course_id,
          teacher_id: data.teacher_id,
          room_id: course.room_id,
          data_ora_inizio: lessonStart.toISOString(),
          data_ora_fine: lessonEnd.toISOString(),
          status: "pianificata",
        });

        currentDate = addWeeks(currentDate, 1);
      }
    }

    if (lessonsToInsert.length > 0) {
      const { error: lessonError } = await supabase.from("lessons").insert(lessonsToInsert);
      if (lessonError) console.error("Errore generazione lezioni:", lessonError);
    }
  } else if (course.day_of_week !== null && course.day_of_week !== undefined && course.start_time) {
    const lessonsToInsert = [];
    const [hours, minutes] = course.start_time.split(":").map(Number);
    const duration = course.duration_min || 60;

    let currentDate = startOfDay(parseISO(data.start_date));
    
    while (currentDate.getDay() !== course.day_of_week) {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    for (let i = 0; i < 12; i++) {
      const lessonStart = setMinutes(setHours(currentDate, hours), minutes);
      const lessonEnd = addMinutes(lessonStart, duration);

      lessonsToInsert.push({
        school_id: data.school_id,
        course_id: data.course_id,
        teacher_id: data.teacher_id,
        room_id: course.room_id,
        data_ora_inizio: lessonStart.toISOString(),
        data_ora_fine: lessonEnd.toISOString(),
        status: "pianificata",
      });

      currentDate = addWeeks(currentDate, 1);
    }

    const { error: lessonError } = await supabase.from("lessons").insert(lessonsToInsert);
    if (lessonError) console.error("Errore generazione lezioni:", lessonError);
  }

  // 4. Generate First Payment
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
