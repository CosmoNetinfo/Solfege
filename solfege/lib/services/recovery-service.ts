import { isDesktop } from "@/lib/is-desktop";
import { createClient } from "@/lib/supabase/client";

export interface RecoveryCredit {
  id: string;
  school_id: string;
  student_id: string;
  course_id?: string | null;
  lesson_id?: string | null;
  recovery_lesson_id?: string | null;
  stato: "disponibile" | "utilizzato" | "scaduto" | "annullato";
  data_maturazione: string;
  data_scadenza?: string | null;
  data_utilizzo?: string | null;
  motivo?: string | null;
  note?: string | null;
  course_nome?: string | null;
}

export async function createRecoveryCredit(params: {
  schoolId: string;
  studentId: string;
  courseId?: string | null;
  lessonId?: string | null;
  motivo?: string;
  note?: string;
  dataScadenza?: string;
}): Promise<string> {
  const {
    schoolId,
    studentId,
    courseId,
    lessonId,
    motivo = "Assenza giustificata",
    note,
    dataScadenza,
  } = params;

  if (isDesktop()) {
    const Database = (await import("@tauri-apps/plugin-sql")).default;
    const db = await Database.load("sqlite:solfege.db");
    const id = crypto.randomUUID();
    const today = new Date().toISOString().split("T")[0];

    await db.execute(
      `INSERT INTO recovery_credits 
       (id, school_id, student_id, course_id, lesson_id, stato, data_maturazione, data_scadenza, motivo, note)
       VALUES (?, ?, ?, ?, ?, 'disponibile', ?, ?, ?, ?)`,
      [id, schoolId, studentId, courseId || null, lessonId || null, today, dataScadenza || null, motivo, note || null]
    );
    return id;
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("recovery_credits")
    .insert({
      school_id: schoolId,
      student_id: studentId,
      course_id: courseId,
      lesson_id: lessonId,
      stato: "disponibile",
      data_maturazione: new Date().toISOString().split("T")[0],
      data_scadenza: dataScadenza || null,
      motivo,
      note,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

export async function getStudentRecoveryCredits(
  studentId: string,
  schoolId?: string
): Promise<RecoveryCredit[]> {
  if (isDesktop()) {
    const Database = (await import("@tauri-apps/plugin-sql")).default;
    const db = await Database.load("sqlite:solfege.db");
    return db.select<RecoveryCredit[]>(
      `SELECT rc.*, c.nome as course_nome
       FROM recovery_credits rc
       LEFT JOIN courses c ON rc.course_id = c.id
       WHERE rc.student_id = ?
       ORDER BY rc.created_at DESC`,
      [studentId]
    );
  }

  const supabase = createClient();
  let query = supabase
    .from("recovery_credits")
    .select("*, courses(name)")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  if (schoolId) {
    query = query.eq("school_id", schoolId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Errore lettura crediti di recupero Supabase:", error);
    return [];
  }

  return (data || []).map((rc: any) => ({
    ...rc,
    course_nome: rc.courses?.name || null,
  }));
}

export async function useRecoveryCredit(creditId: string, recoveryLessonId: string) {
  const today = new Date().toISOString().split("T")[0];
  if (isDesktop()) {
    const Database = (await import("@tauri-apps/plugin-sql")).default;
    const db = await Database.load("sqlite:solfege.db");
    await db.execute(
      `UPDATE recovery_credits 
       SET stato = 'utilizzato', recovery_lesson_id = ?, data_utilizzo = ?
       WHERE id = ?`,
      [recoveryLessonId, today, creditId]
    );
    return;
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("recovery_credits")
    .update({
      stato: "utilizzato",
      recovery_lesson_id: recoveryLessonId,
      data_utilizzo: today,
    })
    .eq("id", creditId);

  if (error) throw error;
}

export async function rescheduleLesson(params: {
  lessonId: string;
  newDate: string;        // YYYY-MM-DD
  newOraInizio: string;    // HH:mm
  newOraFine: string;      // HH:mm
  newRoomId?: string | null;
}) {
  const { lessonId, newDate, newOraInizio, newOraFine, newRoomId } = params;

  if (isDesktop()) {
    const Database = (await import("@tauri-apps/plugin-sql")).default;
    const db = await Database.load("sqlite:solfege.db");

    // Prendi stato attuale della lezione
    const currentRows = await db.select<any[]>("SELECT * FROM lessons WHERE id = ?", [lessonId]);
    const current = currentRows[0];
    if (!current) throw new Error("Lezione non trovata");

    const origDate = current.original_date || current.data;
    const origOraInizio = current.original_ora_inizio || current.ora_inizio;
    const origOraFine = current.original_ora_fine || current.ora_fine;
    const nowISO = new Date().toISOString();

    await db.execute(
      `UPDATE lessons 
       SET data = ?, ora_inizio = ?, ora_fine = ?, 
           room_id = COALESCE(?, room_id),
           original_date = ?, original_ora_inizio = ?, original_ora_fine = ?,
           is_spostata = 1, spostata_il = ?, stato = 'programmata'
       WHERE id = ?`,
      [newDate, newOraInizio, newOraFine, newRoomId || null, origDate, origOraInizio, origOraFine, nowISO, lessonId]
    );
    return;
  }

  const supabase = createClient();
  const { data: current, error: fetchErr } = await supabase
    .from("lessons")
    .select("*")
    .eq("id", lessonId)
    .single();

  if (fetchErr || !current) throw new Error("Lezione non trovata");

  const origDate = current.original_date || current.data_ora_inizio.split("T")[0];
  const origOraInizio = current.original_ora_inizio || current.data_ora_inizio.substring(11, 16);
  const origOraFine = current.original_ora_fine || current.data_ora_fine.substring(11, 16);

  const startISO = `${newDate}T${newOraInizio}:00`;
  const endISO = `${newDate}T${newOraFine}:00`;

  const updatePayload: any = {
    data_ora_inizio: startISO,
    data_ora_fine: endISO,
    original_date: origDate,
    original_ora_inizio: origOraInizio,
    original_ora_fine: origOraFine,
    is_spostata: true,
    spostata_il: new Date().toISOString(),
    status: "programmata",
  };
  if (newRoomId) {
    updatePayload.room_id = newRoomId;
  }

  const { error } = await supabase.from("lessons").update(updatePayload).eq("id", lessonId);
  if (error) throw error;
}
