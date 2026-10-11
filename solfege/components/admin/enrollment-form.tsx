"use client";

import { useState, useEffect } from "react";
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { enrollStudent, getDefaultAcademicYearEnd } from "@/lib/services/enrollment-service";
import { checkDidacticConflicts, ConflictItem } from "@/lib/services/conflict-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { parseISO, startOfDay, addWeeks, setHours, setMinutes, addMinutes, format } from "date-fns";

const DAY_MAP: Record<number, string> = {
  0: "domenica", 1: "lunedi", 2: "martedi", 3: "mercoledi",
  4: "giovedi", 5: "venerdi", 6: "sabato",
};

interface EnrollmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  course: any;
  onSuccess: () => void;
}

export function EnrollmentFormDialog({ open, onOpenChange, schoolId, course, onSuccess }: EnrollmentFormDialogProps) {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [discountPct, setDiscountPct] = useState("0");

  // Conflict modal states
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [detectedConflicts, setDetectedConflicts] = useState<ConflictItem[]>([]);

  useEffect(() => {
    if (!open || !schoolId) return;
    loadData();
  }, [open, schoolId]);

  async function loadData() {
    try {
      const { isDesktop } = await import("@/lib/is-desktop");
      if (isDesktop()) {
        const Database = (await import("@tauri-apps/plugin-sql")).default;
        const db = await Database.load("sqlite:solfege.db");

        const studentData = await db.select<any[]>(
          "SELECT id, nome as first_name, cognome as last_name FROM students ORDER BY cognome, nome"
        );
        setStudents(studentData);

        const teacherData = await db.select<any[]>(
          "SELECT id, nome as first_name, cognome as last_name FROM teachers ORDER BY cognome, nome"
        );

        if (course?.day_of_week !== null && course?.day_of_week !== undefined && course?.start_time) {
          const giorno = DAY_MAP[course.day_of_week];
          const teacherIds = (teacherData || []).map((t: any) => t.id);

          if (teacherIds.length === 0) {
            setTeachers([]);
            return;
          }

          const dispData = await db.select<any[]>(
            "SELECT teacher_id, giorno, ora_inizio, ora_fine FROM disponibilita_insegnanti WHERE giorno = ? AND teacher_id IN (" + 
            teacherIds.map(() => '?').join(',') + ")",
            [giorno, ...teacherIds]
          );

          const courseStartTime = course.start_time;
          const availableTeacherIds = new Set(
            (dispData || [])
              .filter((d: any) => d.ora_inizio <= courseStartTime && d.ora_fine > courseStartTime)
              .map((d: any) => d.teacher_id)
          );

          setTeachers((teacherData || []).filter((t: any) => availableTeacherIds.has(t.id)));
        } else {
          setTeachers(teacherData || []);
        }
        return;
      }
    } catch (e) {
      console.error("Errore caricamento dati iscrizione SQLite:", e);
    }

    // Web Supabase
    const { data: studentData } = await supabase
      .from("students").select("id, first_name, last_name").eq("school_id", schoolId).eq("active", true)
      .order("last_name");

    const { data: teacherData } = await supabase
      .from("teachers").select("id, first_name, last_name").eq("school_id", schoolId).eq("active", true)
      .order("last_name");

    setStudents(studentData || []);

    if (course?.day_of_week !== null && course?.day_of_week !== undefined && course?.start_time) {
      const giorno = DAY_MAP[course.day_of_week];
      const teacherIds = (teacherData || []).map((t: any) => t.id);

      const { data: dispData } = await supabase
        .from("disponibilita_insegnanti")
        .select("teacher_id, giorno, ora_inizio, ora_fine")
        .in("teacher_id", teacherIds)
        .eq("giorno", giorno as any);

      const courseStartTime = course.start_time;
      const availableTeacherIds = new Set(
        (dispData || [])
          .filter((d: any) => d.ora_inizio <= courseStartTime && d.ora_fine > courseStartTime)
          .map((d: any) => d.teacher_id)
      );

      setTeachers((teacherData || []).filter((t: any) => availableTeacherIds.has(t.id)));
    } else {
      setTeachers(teacherData || []);
    }
  }

  // Pre-scansione conflitti sulle date generate del corso
  async function scanConflicts(): Promise<ConflictItem[]> {
    const allConflicts: ConflictItem[] = [];
    const endDateStr = getDefaultAcademicYearEnd(startDate);
    const endDate = startOfDay(parseISO(endDateStr));
    const duration = course.duration_min || course.durata_minuti || 60;

    let schedulesToRun: { dayOfWeekNum: number; startTime: string }[] = [];
    try {
      const rawAnno = course.anno_scolastico || course.anno_accademico || "";
      if (rawAnno.includes("|")) {
        const parts = rawAnno.split("|");
        const parsed = JSON.parse(parts[1]);
        if (parsed && Array.isArray(parsed.multiScheduling)) {
          schedulesToRun = parsed.multiScheduling.map((s: any) => ({
            dayOfWeekNum: parseInt(s.day_of_week, 10),
            startTime: s.start_time,
          }));
        }
      }
    } catch {}

    if (schedulesToRun.length === 0 && course.day_of_week !== null && course.day_of_week !== undefined && course.start_time) {
      schedulesToRun.push({
        dayOfWeekNum: course.day_of_week,
        startTime: course.start_time,
      });
    }

    for (const sched of schedulesToRun) {
      const [hours, minutes] = sched.startTime.split(":").map(Number);
      let currentDate = startOfDay(parseISO(startDate));

      while (currentDate.getDay() !== sched.dayOfWeekNum) {
        currentDate.setDate(currentDate.getDate() + 1);
      }

      while (currentDate <= endDate) {
        const dateStr = format(currentDate, "yyyy-MM-dd");
        const lessonStart = setMinutes(setHours(currentDate, hours), minutes);
        const lessonEnd = addMinutes(lessonStart, duration);
        const startStr = format(lessonStart, "HH:mm");
        const endStr = format(lessonEnd, "HH:mm");

        const dayConfs = await checkDidacticConflicts({
          schoolId,
          dateStr,
          oraInizio: startStr,
          oraFine: endStr,
          roomId: course.room_id,
          teacherId: selectedTeacher || course.teacher_id,
          studentId: selectedStudent,
        });

        allConflicts.push(...dayConfs);
        currentDate = addWeeks(currentDate, 1);
      }
    }

    return allConflicts;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStudent) { toast.error("Seleziona uno studente"); return; }
    setIsLoading(true);

    try {
      const confs = await scanConflicts();
      if (confs.length > 0) {
        setDetectedConflicts(confs);
        setConflictDialogOpen(true);
        setIsLoading(false);
        return;
      }

      await doEnroll(false);
    } catch (err: any) {
      toast.error(err.message || "Errore");
      setIsLoading(false);
    }
  }

  async function doEnroll(skipConflictDates: boolean) {
    setIsLoading(true);
    try {
      await enrollStudent(supabase, {
        school_id: schoolId,
        student_id: selectedStudent,
        course_id: course.id,
        teacher_id: selectedTeacher || null,
        start_date: startDate,
        discount_pct: parseFloat(discountPct) || 0,
        skipConflictDates,
      });
      toast.success(
        skipConflictDates 
          ? "Iscrizione completata (date con conflitto saltate)"
          : "Iscrizione completata per l'intero anno accademico"
      );
      setConflictDialogOpen(false);
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Errore durante l'iscrizione");
    } finally {
      setIsLoading(false);
    }
  }

  const dayLabel = course?.day_of_week !== null && course?.day_of_week !== undefined 
    ? ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"][course.day_of_week] 
    : null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-foreground font-serif text-xl">Nuova Iscrizione</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Iscrivi uno studente a <span className="font-semibold text-foreground">{course?.name}</span>
              {dayLabel && course?.start_time && (
                <span> · {dayLabel} ore {course.start_time?.slice(0, 5)}</span>
              )}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>Studente *</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger><SelectValue placeholder="Seleziona studente..." /></SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.last_name} {s.first_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Insegnante {teachers.length < (students.length || 999) && course?.start_time ? "(filtrati per disponibilità)" : ""}</Label>
              <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                <SelectTrigger><SelectValue placeholder="Seleziona insegnante..." /></SelectTrigger>
                <SelectContent>
                  {teachers.length === 0 ? (
                    <SelectItem value="none" disabled>Nessun insegnante disponibile</SelectItem>
                  ) : (
                    teachers.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.last_name} {t.first_name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {course?.start_time && teachers.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Solo insegnanti disponibili il {dayLabel} alle {course.start_time?.slice(0, 5)}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Inizio</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Sconto (%)</Label>
                <Input type="number" min="0" max="100" value={discountPct} onChange={(e) => setDiscountPct(e.target.value)} />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-border text-muted-foreground">
                Annulla
              </Button>
              <Button type="submit" className="bg-[#E8621A] hover:bg-[#E8621A]/90 text-white" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Iscrivi Studente"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Conflitti Sovrapposizione Didattica */}
      <Dialog open={conflictDialogOpen} onOpenChange={setConflictDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" /> Conflitti di Sovrapposizione Rilevati
            </DialogTitle>
            <DialogDescription className="pt-2 text-stone-700">
              Durante la generazione delle lezioni fino a fine anno accademico sono stati rilevati{' '}
              <strong className="text-red-600 font-semibold">{detectedConflicts.length} conflitti</strong>:
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-60 overflow-y-auto space-y-2 py-2 pr-1">
            {detectedConflicts.map((c, i) => (
              <div key={i} className="p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                <div className="font-semibold text-red-900">{c.dateStr} ({c.oraInizio} - {c.oraFine}): {c.title}</div>
                <div>{c.description}</div>
              </div>
            ))}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            <Button variant="outline" onClick={() => setConflictDialogOpen(false)}>
              Annulla
            </Button>
            <Button variant="secondary" onClick={() => doEnroll(true)} disabled={isLoading}>
              Genera Solo Date Libere
            </Button>
            <Button 
              className="bg-amber-600 hover:bg-amber-700 text-white" 
              onClick={() => doEnroll(false)} 
              disabled={isLoading}
            >
              Salva Comunque Tutto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
