"use client";

import { useState, useEffect } from "react";
import { Loader2, AlertTriangle, CheckCircle, CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { isDesktop } from "@/lib/is-desktop";
import { checkDidacticConflicts, ConflictItem } from "@/lib/services/conflict-service";
import { checkDateHolidayOrClosure } from "@/lib/holidays";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface CreateLessonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateLessonDialog({ open, onOpenChange, onSuccess }: CreateLessonDialogProps) {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingLists, setLoadingLists] = useState(false);

  // Liste dati
  const [courses, setCourses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [schoolId, setSchoolId] = useState<string>("");

  // Campi form
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [dateStr, setDateStr] = useState<string>(new Date().toISOString().split("T")[0]);
  const [oraInizio, setOraInizio] = useState<string>("15:00");
  const [oraFine, setOraFine] = useState<string>("16:00");
  const [tipoLezione, setTipoLezione] = useState<"programmata" | "recupero">("programmata");
  const [topic, setTopic] = useState<string>("");

  // Gestione Conflitti / Festività
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [detectedConflicts, setDetectedConflicts] = useState<ConflictItem[]>([]);
  const [holidayWarning, setHolidayWarning] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadInitialData();
    }
  }, [open]);

  // Quando si seleziona un corso, pre-imposta docente e aula di default se definiti nel corso
  function handleCourseChange(courseId: string) {
    setSelectedCourse(courseId);
    const c = courses.find((x) => x.id === courseId);
    if (c) {
      if (c.teacher_id) setSelectedTeacher(c.teacher_id);
      if (c.room_id) setSelectedRoom(c.room_id);
      if (c.ora_inizio && c.ora_fine) {
        setOraInizio(c.ora_inizio.substring(0, 5));
        setOraFine(c.ora_fine.substring(0, 5));
      }
    }
  }

  async function loadInitialData() {
    setLoadingLists(true);
    try {
      if (isDesktop()) {
        const Database = (await import("@tauri-apps/plugin-sql")).default;
        const db = await Database.load("sqlite:solfege.db");

        const schoolRows = await db.select<any[]>("SELECT id FROM schools LIMIT 1");
        const sId = schoolRows[0]?.id || "";
        setSchoolId(sId);

        const [cList, tList, rList, sList] = await Promise.all([
          db.select<any[]>("SELECT id, nome, teacher_id, room_id, tipo, ora_inizio, ora_fine FROM courses ORDER BY nome"),
          db.select<any[]>("SELECT id, nome, cognome FROM teachers ORDER BY cognome, nome"),
          db.select<any[]>("SELECT id, nome FROM rooms ORDER BY nome"),
          db.select<any[]>("SELECT id, nome, cognome FROM students ORDER BY cognome, nome"),
        ]);

        setCourses(cList.map(c => ({ id: c.id, name: c.nome, ...c })));
        setTeachers(tList.map(t => ({ id: t.id, name: `${t.cognome} ${t.nome}` })));
        setRooms(rList.map(r => ({ id: r.id, name: r.nome })));
        setStudents(sList.map(s => ({ id: s.id, name: `${s.cognome} ${s.nome}` })));
        return;
      }

      // Web flow (Supabase)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("school_id").eq("id", user.id).single();
      const sId = profile?.school_id || "";
      setSchoolId(sId);

      const [cRes, tRes, rRes, sRes] = await Promise.all([
        supabase.from("courses").select("id, name, teacher_id, room_id, type, ora_inizio, ora_fine").eq("school_id", sId).order("name"),
        supabase.from("teachers").select("id, first_name, last_name").eq("school_id", sId).order("last_name"),
        supabase.from("rooms").select("id, name").eq("school_id", sId).order("name"),
        supabase.from("students").select("id, first_name, last_name").eq("school_id", sId).order("last_name"),
      ]);

      setCourses(cRes.data || []);
      setTeachers((tRes.data || []).map(t => ({ id: t.id, name: `${t.last_name} ${t.first_name}` })));
      setRooms(rRes.data || []);
      setStudents((sRes.data || []).map(s => ({ id: s.id, name: `${s.last_name} ${s.first_name}` })));
    } catch (e) {
      console.error("Errore caricamento liste creazione lezione:", e);
      toast.error("Errore nel caricamento dei dati");
    } finally {
      setLoadingLists(false);
    }
  }

  // Verifica festività al cambio data
  useEffect(() => {
    if (!dateStr) return;
    const h = checkDateHolidayOrClosure(dateStr);
    if (h.isHoliday) {
      setHolidayWarning(`Attenzione: il giorno selezionato è festivo (${h.holidayName || ""}).`);
    } else {
      setHolidayWarning(null);
    }
  }, [dateStr]);

  async function handlePreSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCourse) {
      toast.error("Seleziona il corso di riferimento");
      return;
    }
    if (!dateStr || !oraInizio || !oraFine) {
      toast.error("Compila data, ora inizio e ora fine");
      return;
    }
    if (oraFine <= oraInizio) {
      toast.error("L'ora di fine deve essere successiva all'ora di inizio");
      return;
    }

    setIsLoading(true);
    try {
      // 1. Controllo Conflitti
      const conflicts = await checkDidacticConflicts({
        schoolId,
        dateStr,
        oraInizio,
        oraFine,
        roomId: selectedRoom || undefined,
        teacherId: selectedTeacher || undefined,
        studentId: selectedStudent || undefined,
      });

      if (conflicts.length > 0) {
        setDetectedConflicts(conflicts);
        setConflictDialogOpen(true);
        setIsLoading(false);
        return;
      }

      // Se nessun conflitto, procedi con il salvataggio
      await doCreateLesson();
    } catch (err: any) {
      console.error("Errore verifica conflitti:", err);
      toast.error("Errore durante la verifica dei conflitti");
      setIsLoading(false);
    }
  }

  async function doCreateLesson() {
    setIsLoading(true);
    try {
      if (isDesktop()) {
        const Database = (await import("@tauri-apps/plugin-sql")).default;
        const db = await Database.load("sqlite:solfege.db");
        const lessonId = crypto.randomUUID();

        // 1. Inserisci lezione in SQLite
        await db.execute(
          `INSERT INTO lessons (id, course_id, data, ora_inizio, ora_fine, stato, argomenti, room_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            lessonId,
            selectedCourse,
            dateStr,
            oraInizio,
            oraFine,
            tipoLezione,
            topic || null,
            selectedRoom || null,
          ]
        );

        // 2. Se è specificato uno studente, crea anche il record presenze
        if (selectedStudent) {
          await db.execute(
            `INSERT INTO attendance (id, lesson_id, student_id, stato)
             VALUES (?, ?, ?, 'presente')`,
            [crypto.randomUUID(), lessonId, selectedStudent]
          );
        }

        toast.success("Lezione creata con successo nel calendario");
        onOpenChange(false);
        onSuccess();
        return;
      }

      // Supabase flow
      const startIso = `${dateStr}T${oraInizio}:00`;
      const endIso = `${dateStr}T${oraFine}:00`;

      const { data: newLesson, error } = await supabase
        .from("lessons")
        .insert({
          school_id: schoolId,
          course_id: selectedCourse,
          teacher_id: selectedTeacher || null,
          room_id: selectedRoom || null,
          data_ora_inizio: startIso,
          data_ora_fine: endIso,
          status: tipoLezione,
          topic: topic || null,
        })
        .select("id")
        .single();

      if (error) throw error;

      if (selectedStudent && newLesson?.id) {
        await supabase.from("attendance").insert({
          school_id: schoolId,
          lesson_id: newLesson.id,
          student_id: selectedStudent,
          status: "presente",
        });
      }

      toast.success("Lezione creata con successo nel calendario");
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      console.error("Errore creazione lezione:", err);
      toast.error("Errore salvataggio: " + (err.message || "riprova più tardi"));
    } finally {
      setIsLoading(false);
      setConflictDialogOpen(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <CalendarPlus className="h-5 w-5 text-[#E8621A]" />
              Nuova Lezione Manuale
            </DialogTitle>
            <DialogDescription>
              Crea una lezione singola, straordinaria o di recupero direttamente nel calendario.
            </DialogDescription>
          </DialogHeader>

          {loadingLists ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#E8621A]" />
            </div>
          ) : (
            <form onSubmit={handlePreSubmit} className="space-y-4 pt-2">
              {holidayWarning && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-lg text-xs flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                  <span>{holidayWarning}</span>
                </div>
              )}

              {/* Corso */}
              <div>
                <Label className="text-xs font-semibold">Corso / Materia *</Label>
                <Select value={selectedCourse} onValueChange={handleCourseChange}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Seleziona corso..." />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name || c.nome} {c.tipo ? `(${c.tipo})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Docente & Aula */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Docente</Label>
                  <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Seleziona docente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-semibold">Aula</Label>
                  <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Seleziona aula..." />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.map((r) => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Allievo opzionale (per lezioni individuali o assegnazioni dirette) */}
              <div>
                <Label className="text-xs font-semibold">Allievo (opzionale per lezioni individuali)</Label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Nessuno (o seleziona allievo)..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Nessuno (gestione da registro presenze) --</SelectItem>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Data, Ora Inizio, Ora Fine */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Data *</Label>
                  <Input 
                    type="date" 
                    value={dateStr} 
                    onChange={(e) => setDateStr(e.target.value)} 
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Ora Inizio *</Label>
                  <Input 
                    type="time" 
                    value={oraInizio} 
                    onChange={(e) => setOraInizio(e.target.value)} 
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Ora Fine *</Label>
                  <Input 
                    type="time" 
                    value={oraFine} 
                    onChange={(e) => setOraFine(e.target.value)} 
                    className="mt-1"
                    required
                  />
                </div>
              </div>

              {/* Tipo Lezione */}
              <div>
                <Label className="text-xs font-semibold">Tipo Lezione</Label>
                <Select value={tipoLezione} onValueChange={(val: any) => setTipoLezione(val)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="programmata">Lezione Ordinaria / Straordinaria</SelectItem>
                    <SelectItem value="recupero">Lezione di Recupero</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Argomento / Note */}
              <div>
                <Label className="text-xs font-semibold">Argomento / Note Iniziali (opzionale)</Label>
                <Textarea 
                  placeholder="Es. Lezione di ripasso, preparazione esame..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="mt-1 h-18 text-xs resize-none"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                >
                  Annulla
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  className="bg-[#E8621A] hover:bg-[#C94E0E] text-white"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Crea Lezione
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* MODALE CONFLITTI DI ORARIO / AULA / DOCENTE */}
      <Dialog open={conflictDialogOpen} onOpenChange={setConflictDialogOpen}>
        <DialogContent className="max-w-md border-amber-300">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700 font-bold">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Conflitto Rilevato
            </DialogTitle>
            <DialogDescription>
              Sono state rilevate sovrapposizioni orarie per la data e la fascia selezionata:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-3 max-h-56 overflow-y-auto">
            {detectedConflicts.map((c, i) => (
              <div key={i} className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-1">
                <div className="font-bold text-amber-900">{c.title}</div>
                <div className="text-amber-700">{c.description}</div>
              </div>
            ))}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConflictDialogOpen(false)}>
              Modifica Orario
            </Button>
            <Button 
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => doCreateLesson()}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salva Comunque (Override Admin)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
