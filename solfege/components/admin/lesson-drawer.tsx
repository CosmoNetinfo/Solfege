"use client";

import { useState, useEffect } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar, Clock, MapPin, UserRound, GraduationCap, ClipboardCheck,
  Trash2, RotateCcw, CalendarDays, AlertTriangle, CheckCircle, ArrowRight
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { LessonTopicEditor } from "./LessonTopicEditor";
import { checkDidacticConflicts, ConflictItem } from "@/lib/services/conflict-service";
import {
  createRecoveryCredit,
  getStudentRecoveryCredits,
  useRecoveryCredit,
  rescheduleLesson,
  RecoveryCredit
} from "@/lib/services/recovery-service";

type LessonDrawerProps = {
  lessonId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
};

type StatoLezione = 'programmata' | 'completata' | 'cancellata' | 'recupero';

export function LessonDrawer({ lessonId, isOpen, onClose, onRefresh }: LessonDrawerProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [lesson, setLesson] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [updating, setUpdating] = useState(false);

  // Spostamento lezione modal
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newOraInizio, setNewOraInizio] = useState("");
  const [newOraFine, setNewOraFine] = useState("");
  const [newRoomId, setNewRoomId] = useState("");
  const [rescheduleConflicts, setRescheduleConflicts] = useState<ConflictItem[]>([]);
  const [checkingConflicts, setCheckingConflicts] = useState(false);

  // Dialog Recupero
  const [recoveryDialogOpen, setRecoveryDialogOpen] = useState(false);
  const [selectedStudentForRecovery, setSelectedStudentForRecovery] = useState<string>("");
  const [studentCredits, setStudentCredits] = useState<RecoveryCredit[]>([]);

  useEffect(() => {
    if (lessonId && isOpen) {
      loadLessonDetails();
    }
  }, [lessonId, isOpen]);

  async function loadLessonDetails() {
    if (!lessonId) return;
    setLoading(true);

    try {
      const { isDesktop } = await import("@/lib/is-desktop");
      if (isDesktop()) {
        const Database = (await import("@tauri-apps/plugin-sql")).default;
        const db = await Database.load("sqlite:solfege.db");

        const offlineRooms = await db.select<any[]>("SELECT id, nome as name FROM rooms ORDER BY nome ASC");
        setRooms(offlineRooms);

        const lessonsData = await db.select<any[]>(
          `SELECT l.id, l.data, l.ora_inizio, l.ora_fine, l.stato as status, 
                  l.original_date, l.original_ora_inizio, l.original_ora_fine, l.is_spostata, l.spostata_il,
                  l.argomenti as topic, l.compiti as homework, l.note as internal_notes,
                  l.course_id, l.teacher_id, l.room_id, l.school_id,
                  c.nome as course_name, c.colore_calendario, c.tipo as course_type,
                  t.nome as teacher_first_name, t.cognome as teacher_last_name,
                  r.nome as room_name
           FROM lessons l
           LEFT JOIN courses c ON l.course_id = c.id
           LEFT JOIN teachers t ON l.teacher_id = t.id
           LEFT JOIN rooms r ON l.room_id = r.id
           WHERE l.id = ?`,
          [lessonId]
        );

        const localLesson = lessonsData[0];
        if (!localLesson) {
          toast.error("Lezione non trovata");
          onClose();
          return;
        }

        const startISO = `${localLesson.data}T${localLesson.ora_inizio}:00`;
        const endISO = `${localLesson.data}T${localLesson.ora_fine}:00`;

        setLesson({
          ...localLesson,
          data_ora_inizio: startISO,
          data_ora_fine: endISO,
          courses: {
            name: localLesson.course_name,
            colore_calendario: localLesson.colore_calendario,
            type: localLesson.course_type,
          },
          teachers: {
            first_name: localLesson.teacher_first_name,
            last_name: localLesson.teacher_last_name,
          },
          rooms: {
            name: localLesson.room_name,
          },
        });

        const attendData = await db.select<any[]>(
          `SELECT a.id, a.student_id, a.stato as status, a.note,
                  s.nome as student_first_name, s.cognome as student_last_name
           FROM attendances a
           LEFT JOIN students s ON a.student_id = s.id
           WHERE a.lesson_id = ?`,
          [lessonId]
        );

        setAttendance(attendData.map(a => ({
          ...a,
          students: {
            first_name: a.student_first_name,
            last_name: a.student_last_name,
          },
        })));

        setLoading(false);
        return;
      }
    } catch (e) {
      console.error("Errore caricamento dettagli lezione SQLite:", e);
    }

    // Web Supabase
    const { data, error } = await supabase
      .from("lessons")
      .select(`
        *,
        courses(name, colore_calendario, school_id, type),
        teachers(first_name, last_name),
        rooms(name)
      `)
      .eq("id", lessonId)
      .single();

    if (error) {
      toast.error("Errore caricamento dettagli lezione");
      onClose();
      return;
    }

    setLesson(data);

    if (data.courses?.school_id) {
      const { data: onlineRooms } = await supabase
        .from("rooms")
        .select("id, name")
        .eq("school_id", data.courses.school_id)
        .order("name");
      setRooms(onlineRooms || []);
    }

    const { data: attendanceData } = await supabase
      .from("attendance")
      .select(`
        *,
        students(first_name, last_name)
      `)
      .eq("lesson_id", lessonId);

    setAttendance(attendanceData || []);
    setLoading(false);
  }

  async function updateRoom(newRoomVal: string) {
    if (!lessonId) return;
    setUpdating(true);

    try {
      const { isDesktop } = await import("@/lib/is-desktop");
      if (isDesktop()) {
        const Database = (await import("@tauri-apps/plugin-sql")).default;
        const db = await Database.load("sqlite:solfege.db");

        await db.execute(
          "UPDATE lessons SET room_id = ? WHERE id = ?",
          [newRoomVal, lessonId]
        );

        toast.success("Aula aggiornata");
        const selectedRoom = rooms.find(r => r.id === newRoomVal);
        setLesson((prev: any) => ({
          ...prev,
          room_id: newRoomVal,
          rooms: { name: selectedRoom ? selectedRoom.name : prev.rooms?.name },
        }));
        onRefresh();
        setUpdating(false);
        return;
      }
    } catch (e) {
      console.error("Errore spostamento aula SQLite:", e);
    }

    const { error } = await supabase
      .from("lessons")
      .update({ room_id: newRoomVal })
      .eq("id", lessonId);

    if (error) {
      toast.error("Errore spostamento aula");
    } else {
      toast.success("Aula aggiornata");
      const selectedRoom = rooms.find(r => r.id === newRoomVal);
      setLesson((prev: any) => ({
        ...prev,
        room_id: newRoomVal,
        rooms: { name: selectedRoom ? selectedRoom.name : prev.rooms?.name },
      }));
      onRefresh();
    }
    setUpdating(false);
  }

  async function updateStatus(newStatus: string) {
    if (!lessonId) return;
    setUpdating(true);

    try {
      const { isDesktop } = await import("@/lib/is-desktop");
      if (isDesktop()) {
        const Database = (await import("@tauri-apps/plugin-sql")).default;
        const db = await Database.load("sqlite:solfege.db");

        await db.execute(
          "UPDATE lessons SET stato = ? WHERE id = ?",
          [newStatus, lessonId]
        );

        toast.success("Stato aggiornato");
        setLesson({ ...lesson, status: newStatus });
        onRefresh();
        setUpdating(false);
        return;
      }
    } catch (e) {
      console.error("Errore aggiornamento stato SQLite:", e);
    }

    const { error } = await supabase
      .from("lessons")
      .update({ status: newStatus as StatoLezione })
      .eq("id", lessonId);

    if (error) {
      toast.error("Errore aggiornamento stato");
    } else {
      toast.success("Stato aggiornato");
      setLesson({ ...lesson, status: newStatus });
      onRefresh();
    }
    setUpdating(false);
  }

  // Modifica presenza (presente -> assente -> giustificato -> presente)
  async function toggleAttendance(studentId: string, currentStatus: string) {
    if (!lessonId) return;
    const nextStatusMap: Record<string, string> = {
      'presente': 'assente',
      'assente': 'giustificato',
      'giustificato': 'presente',
      'recupero': 'presente',
    };
    const nextStatus = nextStatusMap[currentStatus] || 'presente';

    try {
      const { isDesktop } = await import("@/lib/is-desktop");
      if (isDesktop()) {
        const Database = (await import("@tauri-apps/plugin-sql")).default;
        const db = await Database.load("sqlite:solfege.db");

        await db.execute(
          "UPDATE attendances SET stato = ? WHERE lesson_id = ? AND student_id = ?",
          [nextStatus, lessonId, studentId]
        );

        // Se l'assenza viene segnata come giustificata, matura automaticamente un credito di recupero
        if (nextStatus === 'giustificato') {
          const studentAtt = attendance.find(a => a.student_id === studentId);
          const studentName = studentAtt?.students?.first_name || "Studente";
          await createRecoveryCredit({
            schoolId: lesson.school_id,
            studentId,
            courseId: lesson.course_id,
            lessonId,
            motivo: `Assenza giustificata lezione del ${lesson.data || lesson.data_ora_inizio?.split('T')[0]}`,
          });
          toast.success(`Credito di recupero generato per ${studentName}`);
        }

        setAttendance(attendance.map(a => 
          a.student_id === studentId ? { ...a, status: nextStatus } : a
        ));
        return;
      }
    } catch (e) {
      console.error("Errore aggiornamento presenze SQLite:", e);
    }

    const { error } = await supabase
      .from("attendance")
      .update({ status: nextStatus })
      .eq("lesson_id", lessonId)
      .eq("student_id", studentId);

    if (error) {
      toast.error("Errore aggiornamento presenza");
    } else {
      if (nextStatus === 'giustificato') {
        await createRecoveryCredit({
          schoolId: lesson.school_id,
          studentId,
          courseId: lesson.course_id,
          lessonId,
          motivo: `Assenza giustificata lezione del ${lesson.data_ora_inizio?.split('T')[0]}`,
        });
        toast.success("Credito di recupero generato");
      }
      setAttendance(attendance.map(a => 
        a.student_id === studentId ? { ...a, status: nextStatus } : a
      ));
    }
  }

  // Apertura modale Spostamento Lezione
  function openRescheduleModal() {
    const curDate = lesson.data || lesson.data_ora_inizio?.split('T')[0] || "";
    const curStart = lesson.ora_inizio || lesson.data_ora_inizio?.substring(11, 16) || "";
    const curEnd = lesson.ora_fine || lesson.data_ora_fine?.substring(11, 16) || "";

    setNewDate(curDate);
    setNewOraInizio(curStart);
    setNewOraFine(curEnd);
    setNewRoomId(lesson.room_id || "");
    setRescheduleConflicts([]);
    setRescheduleOpen(true);
  }

  // Verifica conflitti in tempo reale per lo spostamento
  async function checkRescheduleConflicts(date: string, start: string, end: string, rId: string) {
    if (!date || !start || !end || start >= end) {
      setRescheduleConflicts([]);
      return;
    }
    setCheckingConflicts(true);
    try {
      const confs = await checkDidacticConflicts({
        schoolId: lesson.school_id,
        dateStr: date,
        oraInizio: start,
        oraFine: end,
        roomId: rId || lesson.room_id,
        teacherId: lesson.teacher_id,
        excludeLessonId: lesson.id,
      });
      setRescheduleConflicts(confs);
    } catch (e) {
      console.error("Errore verifica conflitti spostamento:", e);
    } finally {
      setCheckingConflicts(false);
    }
  }

  async function handleConfirmReschedule() {
    if (!newDate || !newOraInizio || !newOraFine) {
      toast.error("Compila tutti i campi orari");
      return;
    }
    if (newOraInizio >= newOraFine) {
      toast.error("L'ora di fine deve essere successiva all'ora di inizio");
      return;
    }

    try {
      setUpdating(true);
      await rescheduleLesson({
        lessonId: lesson.id,
        newDate,
        newOraInizio,
        newOraFine,
        newRoomId: newRoomId || lesson.room_id,
      });

      toast.success("Lezione spostata con successo");
      setRescheduleOpen(false);
      onRefresh();
      loadLessonDetails();
    } catch (e) {
      console.error("Errore spostamento lezione:", e);
      toast.error("Errore durante lo spostamento della lezione");
    } finally {
      setUpdating(false);
    }
  }

  // Apertura modale Recupero
  async function openRecoveryModal() {
    if (attendance.length > 0) {
      const firstStudentId = attendance[0].student_id;
      setSelectedStudentForRecovery(firstStudentId);
      const credits = await getStudentRecoveryCredits(firstStudentId, lesson?.school_id);
      setStudentCredits(credits.filter(c => c.stato === "disponibile"));
    }
    setRecoveryDialogOpen(true);
  }

  async function handleStudentChangeForRecovery(stId: string) {
    setSelectedStudentForRecovery(stId);
    const credits = await getStudentRecoveryCredits(stId, lesson?.school_id);
    setStudentCredits(credits.filter(c => c.stato === "disponibile"));
  }

  async function handleApplyRecovery(creditId: string) {
    try {
      await useRecoveryCredit(creditId, lesson.id);
      toast.success("Credito di recupero associato a questa lezione!");
      setRecoveryDialogOpen(false);
      onRefresh();
    } catch (e) {
      toast.error("Errore associazione credito di recupero");
    }
  }

  const handleDeleteLesson = async () => {
    if (!lessonId || !confirm("Sei sicuro di voler eliminare questa lezione?")) return;
    try {
      const { isDesktop } = await import("@/lib/is-desktop");
      if (isDesktop()) {
        const Database = (await import("@tauri-apps/plugin-sql")).default;
        const db = await Database.load("sqlite:solfege.db");
        await db.execute("DELETE FROM lessons WHERE id = ?", [lessonId]);
        await db.execute("DELETE FROM attendances WHERE lesson_id = ?", [lessonId]);
        toast.success("Lezione eliminata");
        onRefresh();
        onClose();
        return;
      }

      const { error } = await supabase.from("lessons").delete().eq("id", lessonId);
      if (error) throw error;
      toast.success("Lezione eliminata");
      onRefresh();
      onClose();
    } catch (e) {
      toast.error("Errore durante l'eliminazione");
    }
  };

  if (!lesson && loading) return null;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="sm:max-w-[800px]! w-full! overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">Caricamento...</div>
          ) : lesson ? (
            <div className="space-y-6 py-4">
              <SheetHeader>
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: lesson.courses?.colore_calendario || "#E8621A" }} 
                  />
                  <span className="text-sm font-semibold text-stone-500 uppercase tracking-wider">
                    {lesson.courses?.type === 'collettivo' ? 'Corso Collettivo' : 'Dettaglio Lezione'}
                  </span>
                </div>
                <SheetTitle className="text-2xl font-bold">{lesson.courses?.name}</SheetTitle>
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <Badge variant={lesson.status === 'completata' ? 'default' : 'secondary'} className="capitalize">
                    {lesson.status}
                  </Badge>
                  {lesson.is_spostata ? (
                    <Badge variant="outline" className="border-amber-500 text-amber-700 bg-amber-50">
                      Spostata (Orig: {lesson.original_date} {lesson.original_ora_inizio})
                    </Badge>
                  ) : null}
                  {lesson.courses?.type === 'collettivo' && (
                    <Badge variant="outline" className="border-blue-400 text-blue-700 bg-blue-50">
                      Lezione Condivisa ({attendance.length} iscritti)
                    </Badge>
                  )}
                </div>
              </SheetHeader>

              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-3 text-stone-600">
                  <Calendar className="h-5 w-5 text-orange" />
                  <span className="font-medium">{format(new Date(lesson.data_ora_inizio), "EEEE d MMMM yyyy", { locale: it })}</span>
                </div>
                <div className="flex items-center gap-3 text-stone-600">
                  <Clock className="h-5 w-5 text-orange" />
                  <span className="font-medium">
                    {format(new Date(lesson.data_ora_inizio), "HH:mm")} - {format(new Date(lesson.data_ora_fine), "HH:mm")}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-stone-600">
                  <MapPin className="h-5 w-5 text-orange" />
                  <span className="font-medium">{lesson.rooms?.name || "Aula non assegnata"}</span>
                </div>
                <div className="flex items-center gap-3 text-stone-600">
                  <GraduationCap className="h-5 w-5 text-orange" />
                  <span className="font-medium">{lesson.teachers?.first_name} {lesson.teachers?.last_name}</span>
                </div>
              </div>

              {/* Pulsante Segna come svolta */}
              <div className="space-y-4">
                {lesson.status !== 'completata' && (
                  <Button 
                    onClick={() => updateStatus('completata')}
                    disabled={updating}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-12 shadow-lg shadow-green-200 animate-in zoom-in-95 duration-500"
                  >
                    <CheckCircle className="mr-2 h-5 w-5" /> Segna come Svolta
                  </Button>
                )}
              </div>

              <Separator />

              {/* Azioni rapide: Sposta lezione e stato */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-tight text-stone-500">Stato Lezione</h3>
                  <Select value={lesson.status} onValueChange={updateStatus} disabled={updating}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Cambia stato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="programmata">Programmata</SelectItem>
                      <SelectItem value="completata">Completata</SelectItem>
                      <SelectItem value="cancellata">Cancellata</SelectItem>
                      <SelectItem value="recupero">Da Recuperare</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-tight text-stone-500">Sposta Lezione</h3>
                    <p className="text-xs text-stone-400">Modifica data, orario o aula con controllo disponibilità</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={openRescheduleModal} className="gap-2 border-orange text-orange hover:bg-orange/10">
                    <CalendarDays className="h-4 w-4" /> Sposta Lezione
                  </Button>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <h3 className="text-sm font-bold uppercase tracking-tight text-stone-500">Cambia Aula Rapido</h3>
                  <Select value={lesson.room_id || "none"} onValueChange={(val) => updateRoom(val === "none" ? "" : val)} disabled={updating}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Seleziona aula" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nessuna aula</SelectItem>
                      {rooms.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name || r.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Registro presenze allievi (gestisce corsi individuali e collettivi) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5 text-stone-400" />
                    <h3 className="text-sm font-bold uppercase tracking-tight text-stone-500">
                      Presenze Allievi ({attendance.length})
                    </h3>
                  </div>
                  <span className="text-xs text-stone-400">Clicca sullo stato per modificarlo</span>
                </div>
                
                {attendance.length === 0 ? (
                  <p className="text-sm text-stone-400 italic">Nessun allievo iscritto a questa lezione</p>
                ) : (
                  <div className="space-y-3">
                    {attendance.map((att) => (
                      <div key={att.student_id} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <UserRound className="h-4 w-4 text-stone-400" />
                          <div>
                            <span className="text-sm font-medium">{att.students?.first_name} {att.students?.last_name}</span>
                            {att.status === 'giustificato' && (
                              <p className="text-[10px] text-amber-600 font-semibold">Credito di recupero maturato</p>
                            )}
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className={`h-8 px-3 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                            att.status === 'presente' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                            att.status === 'assente' ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                            att.status === 'giustificato' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' :
                            'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                          onClick={() => toggleAttendance(att.student_id, att.status)}
                        >
                          {att.status}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              <LessonTopicEditor 
                lessonId={lessonId as string}
                initialTopic={lesson.topic}
                initialHomework={lesson.homework}
                initialInternalNotes={lesson.internal_notes}
                onSave={onRefresh}
              />

              <div className="pt-6 flex flex-col gap-3">
                <Button variant="outline" onClick={openRecoveryModal} className="w-full text-stone-600">
                  <RotateCcw className="mr-2 h-4 w-4" /> Gestisci / Associa Recupero
                </Button>
                <Button onClick={handleDeleteLesson} variant="ghost" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50">
                  <Trash2 className="mr-2 h-4 w-4" /> Elimina Lezione
                </Button>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* Dialog: Sposta Lezione con controllo conflitti */}
      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-orange" /> Sposta Lezione
            </DialogTitle>
            <DialogDescription>
              Seleziona la nuova data, orario e aula. Verrà eseguito un controllo automatico di disponibilità del docente e dell'aula.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label htmlFor="reschedule-date">Nuova Data</Label>
              <Input
                id="reschedule-date"
                type="date"
                value={newDate}
                onChange={(e) => {
                  setNewDate(e.target.value);
                  checkRescheduleConflicts(e.target.value, newOraInizio, newOraFine, newRoomId);
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reschedule-start">Ora Inizio</Label>
                <Input
                  id="reschedule-start"
                  type="time"
                  value={newOraInizio}
                  onChange={(e) => {
                    setNewOraInizio(e.target.value);
                    checkRescheduleConflicts(newDate, e.target.value, newOraFine, newRoomId);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reschedule-end">Ora Fine</Label>
                <Input
                  id="reschedule-end"
                  type="time"
                  value={newOraFine}
                  onChange={(e) => {
                    setNewOraFine(e.target.value);
                    checkRescheduleConflicts(newDate, newOraInizio, e.target.value, newRoomId);
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reschedule-room">Aula</Label>
              <Select
                value={newRoomId || "none"}
                onValueChange={(val) => {
                  const targetRoom = val === "none" ? "" : val;
                  setNewRoomId(targetRoom);
                  checkRescheduleConflicts(newDate, newOraInizio, newOraFine, targetRoom);
                }}
              >
                <SelectTrigger id="reschedule-room">
                  <SelectValue placeholder="Seleziona aula" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nessuna aula</SelectItem>
                  {rooms.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name || r.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Visualizzazione Conflitti Rilevati */}
            {checkingConflicts ? (
              <p className="text-xs text-stone-500 italic">Verifica disponibilità in corso...</p>
            ) : rescheduleConflicts.length > 0 ? (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-2 text-xs text-red-700">
                <div className="flex items-center gap-1.5 font-bold text-red-800">
                  <AlertTriangle className="h-4 w-4" /> Conflitti rilevati:
                </div>
                {rescheduleConflicts.map((c, idx) => (
                  <div key={idx} className="pl-5">
                    • <strong>{c.title}</strong>: {c.description}
                  </div>
                ))}
              </div>
            ) : newDate && newOraInizio && newOraFine ? (
              <div className="p-2.5 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-xs text-green-700">
                <CheckCircle className="h-4 w-4 text-green-600" /> Nessun conflitto rilevato per aula e docente.
              </div>
            ) : null}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRescheduleOpen(false)}>
              Annulla
            </Button>
            <Button 
              onClick={handleConfirmReschedule}
              disabled={updating}
              className={rescheduleConflicts.length > 0 ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-[#E8621A] text-white hover:bg-[#E8621A]/90"}
            >
              {rescheduleConflicts.length > 0 ? "Salva Spostamento Comunque" : "Conferma Spostamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Gestione Crediti Recupero */}
      <Dialog open={recoveryDialogOpen} onOpenChange={setRecoveryDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-orange" /> Registro Crediti di Recupero
            </DialogTitle>
            <DialogDescription>
              Seleziona un allievo per visualizzare i suoi crediti di recupero disponibili o associarne uno a questa lezione.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {attendance.length > 1 && (
              <div className="space-y-2">
                <Label>Allievo</Label>
                <Select value={selectedStudentForRecovery} onValueChange={handleStudentChangeForRecovery}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {attendance.map((att) => (
                      <SelectItem key={att.student_id} value={att.student_id}>
                        {att.students?.first_name} {att.students?.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-tight text-stone-500">Crediti Aperti Disponibili</h4>
              {studentCredits.length === 0 ? (
                <p className="text-sm text-stone-400 italic py-2">Nessun credito di recupero disponibile per questo allievo.</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {studentCredits.map((cr) => (
                    <div key={cr.id} className="p-3 bg-stone-50 border rounded-lg flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-stone-800">{cr.motivo || "Assenza giustificata"}</div>
                        <div className="text-stone-500">Maturato il: {cr.data_maturazione} {cr.course_nome ? `• ${cr.course_nome}` : ''}</div>
                      </div>
                      <Button size="sm" onClick={() => handleApplyRecovery(cr.id)} className="bg-green-600 hover:bg-green-700 text-white text-xs h-7">
                        Usa per questa lezione
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRecoveryDialogOpen(false)}>
              Chiudi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Separator() {
  return <div className="h-[1px] bg-stone-100 w-full" />;
}
