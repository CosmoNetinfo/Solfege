"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  ChevronLeft, 
  Loader2,
  Save,
  MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export default function AttendancePage({ params }: { params: Promise<{ lessonId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lesson, setLesson] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, { status: string, notes: string }>>({});
  const [lessonNote, setLessonNote] = useState("");

  useEffect(() => {
    loadData();
  }, [resolvedParams.lessonId]);

  async function loadData() {
    setLoading(true);
    
    // Recupera i dettagli della lezione e del corso
    const { data: lessonData, error: lessonError } = await supabase
      .from("lessons")
      .select(`
        id,
        course_id,
        status,
        note_docente,
        courses (
          name,
          enrollments (
            student_id,
            students (id, first_name, last_name)
          )
        )
      `)
      .eq("id", resolvedParams.lessonId)
      .single();

    if (lessonError || !lessonData) {
      toast.error("Lezione non trovata");
      router.push("/teacher/home");
      return;
    }

    setLesson(lessonData);
    setLessonNote(lessonData.note_docente || "");

    // Trasforma enrollments in una lista piatta di studenti
    const studentList = lessonData.courses.enrollments.map((e: any) => e.students);
    setStudents(studentList);

    // Carica presenze già registrate
    const { data: attendanceData } = await supabase
      .from("attendance")
      .select("*")
      .eq("lesson_id", resolvedParams.lessonId);

    const attendanceMap: Record<string, any> = {};
    attendanceData?.forEach(a => {
      attendanceMap[a.student_id] = { status: a.status, notes: a.notes || "" };
    });

    // Per gli studenti senza presenza registrata, impostiamo "present" di default
    const initialAttendance: Record<string, any> = { ...attendanceMap };
    studentList.forEach((s: any) => {
      if (!initialAttendance[s.id]) {
        initialAttendance[s.id] = { status: "present", notes: "" };
      }
    });

    setAttendance(initialAttendance);
    setLoading(false);
  }

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status }
    }));
  };

  async function handleSave() {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) throw new Error("Utente non autenticato");
      const { data: profile } = await supabase.from("profiles").select("school_id").eq("id", user.id).single();

      if (!profile?.school_id) throw new Error("Scuola non trovata");
      const schoolId = profile.school_id as string;

      // Prepara i record per la tabella attendance
      const records = Object.entries(attendance).map(([studentId, data]) => ({
        school_id: schoolId,
        lesson_id: resolvedParams.lessonId,
        student_id: studentId,
        status: data.status,
        notes: data.notes
      }));

      // Inserimento con upsert (basato sulla constraint unique lesson_id, student_id)
      const { error: attError } = await supabase
        .from("attendance")
        .upsert(records, { onConflict: "lesson_id, student_id" });

      if (attError) throw attError;

      // Aggiorna nota docente e stato lezione
      const { error: lessonUpdateError } = await supabase
        .from("lessons")
        .update({
          status: "completata",
          note_docente: lessonNote,
          updated_at: new Date().toISOString()
        })
        .eq("id", resolvedParams.lessonId);

      if (lessonUpdateError) throw lessonUpdateError;

      toast.success("Presenze salvate correttamente");
      router.push("/teacher/home");
    } catch (err: any) {
      toast.error("Errore durante il salvataggio: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#E8621A]" />
        <p className="text-[#7A736C]">Caricamento appello...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()}
          className="text-[#7A736C]"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <div>
          <h2 className="text-xl font-bold text-[#1A1714] line-clamp-1">{lesson?.courses?.name}</h2>
          <p className="text-sm text-[#7A736C]">Registrazione presenze</p>
        </div>
      </div>

      <div className="space-y-4">
        {students.map((student) => (
          <Card key={student.id} className="border-[#E8E4E0] overflow-hidden">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#1A1714]">{student.last_name} {student.first_name}</span>
                <Badge variant="outline" className={cn(
                  "capitalize border-none px-3 py-1",
                  attendance[student.id]?.status === 'present' && "bg-[#E8F5EE] text-[#1A7A4A]",
                  attendance[student.id]?.status === 'absent' && "bg-[#FDECEA] text-[#C0392B]",
                  attendance[student.id]?.status === 'recovered' && "bg-[#FEF3C7] text-[#D97706]",
                )}>
                  {attendance[student.id]?.status === 'present' ? 'Presente' : 
                   attendance[student.id]?.status === 'absent' ? 'Assente' : 'Recupero'}
                </Badge>
              </div>

              {/* Toggle a 3 stati mobile-friendly */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={attendance[student.id]?.status === 'present' ? 'default' : 'outline'}
                  className={cn(
                    "flex flex-col gap-1 h-16 rounded-xl border-[#E8E4E0]",
                    attendance[student.id]?.status === 'present' ? "bg-[#1A7A4A] hover:bg-[#1A7A4A]/90 text-white" : "text-[#7A736C]"
                  )}
                  onClick={() => handleStatusChange(student.id, 'present')}
                >
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-[10px] uppercase font-bold">Presente</span>
                </Button>
                <Button
                  type="button"
                  variant={attendance[student.id]?.status === 'absent' ? 'default' : 'outline'}
                  className={cn(
                    "flex flex-col gap-1 h-16 rounded-xl border-[#E8E4E0]",
                    attendance[student.id]?.status === 'absent' ? "bg-[#C0392B] hover:bg-[#C0392B]/90 text-white" : "text-[#7A736C]"
                  )}
                  onClick={() => handleStatusChange(student.id, 'absent')}
                >
                  <XCircle className="h-5 w-5" />
                  <span className="text-[10px] uppercase font-bold">Assente</span>
                </Button>
                <Button
                  type="button"
                  variant={attendance[student.id]?.status === 'recovered' ? 'default' : 'outline'}
                  className={cn(
                    "flex flex-col gap-1 h-16 rounded-xl border-[#E8E4E0]",
                    attendance[student.id]?.status === 'recovered' ? "bg-[#D97706] hover:bg-[#D97706]/90 text-white" : "text-[#7A736C]"
                  )}
                  onClick={() => handleStatusChange(student.id, 'recovered')}
                >
                  <RefreshCw className="h-5 w-5" />
                  <span className="text-[10px] uppercase font-bold">Recupero</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-bold text-[#1A1714]">
          <MessageSquare className="h-4 w-4" /> Note sulla lezione
        </label>
        <Textarea 
          placeholder="Scrivi cosa avete fatto a lezione o note importanti..."
          className="min-h-[120px] rounded-xl border-[#E8E4E0] bg-white focus:ring-[#E8621A]"
          value={lessonNote}
          onChange={(e) => setLessonNote(e.target.value)}
        />
      </div>

      <Button 
        className="w-full h-14 rounded-2xl bg-[#E8621A] hover:bg-[#C94E0E] text-white font-bold text-lg shadow-lg shadow-orange/20"
        disabled={saving}
        onClick={handleSave}
      >
        {saving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
        Salva Presenze
      </Button>
    </div>
  );
}
