"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const DAY_MAP: Record<number, string> = {
  0: "domenica", 1: "lunedi", 2: "martedi", 3: "mercoledi",
  4: "giovedi", 5: "venerdi", 6: "sabato",
};

interface EnrollmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  course: any; // Il corso a cui iscrivere
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

  useEffect(() => {
    if (!open || !schoolId) return;
    loadData();
  }, [open, schoolId]);

  async function loadData() {
    // Carica studenti attivi
    const { data: studentData } = await supabase
      .from("students").select("id, first_name, last_name").eq("school_id", schoolId).eq("active", true)
      .order("last_name");

    // Carica insegnanti con disponibilità filtrata per giorno/ora del corso
    const { data: teacherData } = await supabase
      .from("teachers").select("id, first_name, last_name").eq("school_id", schoolId).eq("active", true)
      .order("last_name");

    setStudents(studentData || []);

    // Se il corso ha un giorno configurato, filtra per disponibilità
    if (course?.day_of_week !== null && course?.day_of_week !== undefined && course?.start_time) {
      const giorno = DAY_MAP[course.day_of_week];
      const teacherIds = (teacherData || []).map((t: any) => t.id);

      const { data: dispData } = await supabase
        .from("disponibilita_insegnanti")
        .select("teacher_id, giorno, ora_inizio, ora_fine")
        .in("teacher_id", teacherIds)
        .eq("giorno", giorno as "lunedi" | "martedi" | "mercoledi" | "giovedi" | "venerdi" | "sabato" | "domenica");

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStudent) { toast.error("Seleziona uno studente"); return; }
    setIsLoading(true);
    try {
      const { error } = await supabase.from("enrollments").insert({
        school_id: schoolId,
        student_id: selectedStudent,
        course_id: course.id,
        teacher_id: selectedTeacher || null,
        start_date: startDate,
        discount_pct: parseFloat(discountPct) || 0,
        status: "active",
      });
      if (error) throw error;
      toast.success("Iscrizione completata");
      onOpenChange(false);
      onSuccess();
    } catch (err: any) { toast.error(err.message || "Errore"); }
    finally { setIsLoading(false); }
  }

  const dayLabel = course?.day_of_week !== null ? ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"][course.day_of_week] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-border text-muted-foreground">Annulla</Button>
            <Button type="submit" className="bg-orange hover:bg-orange-dark text-white" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Iscrivi Studente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
