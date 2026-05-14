"use client";

import { useState, useEffect } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, UserRound, GraduationCap, ClipboardCheck, Trash2, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { LessonTopicEditor } from "./LessonTopicEditor";
import { CheckCircle } from "lucide-react";

type LessonDrawerProps = {
  lessonId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
};

type StatoLezione = 'programmata' | 'completata' | 'cancellata' | 'recupero';
type StatoPresenza = 'presente' | 'assente' | 'recupero';

export function LessonDrawer({ lessonId, isOpen, onClose, onRefresh }: LessonDrawerProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [lesson, setLesson] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (lessonId && isOpen) {
      loadLessonDetails();
    }
  }, [lessonId, isOpen]);

  async function loadLessonDetails() {
    if (!lessonId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("lessons")
      .select(`
        *,
        courses(name, colore_calendario),
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

  async function updateStatus(newStatus: string) {
    if (!lessonId) return;
    setUpdating(true);
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

  async function toggleAttendance(studentId: string, currentStatus: string) {
    if (!lessonId) return;
    const nextStatusMap: Record<string, string> = {
      'presente': 'assente',
      'assente': 'recupero',
      'recupero': 'presente'
    };
    const nextStatus = nextStatusMap[currentStatus] || 'presente';

    const { error } = await supabase
      .from("attendance")
      .update({ status: nextStatus as StatoPresenza })
      .eq("lesson_id", lessonId)
      .eq("student_id", studentId);

    if (error) {
      toast.error("Errore aggiornamento presenza");
    } else {
      setAttendance(attendance.map(a => 
        a.student_id === studentId ? { ...a, status: nextStatus } : a
      ));
    }
  }

  if (!lesson && loading) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
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
                  Dettaglio Lezione
                </span>
              </div>
              <SheetTitle className="text-2xl font-bold">{lesson.courses?.name}</SheetTitle>
              <div className="flex gap-2 pt-2">
                <Badge variant={lesson.status === 'completata' ? 'default' : 'secondary'} className="capitalize">
                  {lesson.status}
                </Badge>
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
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-stone-400" />
                <h3 className="text-sm font-bold uppercase tracking-tight text-stone-500">Presenze Allievi</h3>
              </div>
              
              {attendance.length === 0 ? (
                <p className="text-sm text-stone-400 italic">Nessun allievo iscritto a questa lezione</p>
              ) : (
                <div className="space-y-3">
                  {attendance.map((att) => (
                    <div key={att.student_id} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <UserRound className="h-4 w-4 text-stone-400" />
                        <span className="text-sm font-medium">{att.students?.first_name} {att.students?.last_name}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className={`h-8 px-3 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                          att.status === 'presente' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                          att.status === 'assente' ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                          'bg-amber-100 text-amber-700 hover:bg-amber-200'
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
              <Button variant="outline" className="w-full text-stone-600">
                <RotateCcw className="mr-2 h-4 w-4" /> Pianifica Recupero
              </Button>
              <Button variant="ghost" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50">
                <Trash2 className="mr-2 h-4 w-4" /> Elimina Lezione
              </Button>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function Separator() {
  return <div className="h-[1px] bg-stone-100 w-full" />;
}
