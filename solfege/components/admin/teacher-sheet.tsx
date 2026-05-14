"use client";

import { useState, useEffect } from "react";
import { 
  User, 
  BookOpen, 
  Calendar, 
  CheckSquare, 
  FileText, 
  Phone, 
  Mail, 
  Euro,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  GraduationCap,
  Smartphone,
  Send,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { inviteTeacher } from "@/app/actions/teacher-actions";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

interface TeacherSheetProps {
  teacherId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (teacher: any) => void;
}

export function TeacherSheet({ teacherId, open, onOpenChange, onEdit }: TeacherSheetProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [teacher, setTeacher] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [compensations, setCompensations] = useState<any[]>([]);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    if (open && teacherId) {
      loadData();
    }
  }, [open, teacherId]);

  async function loadData() {
    if (!teacherId) return;
    setLoading(true);
    try {
      const [
        { data: teacherData },
        { data: enrollmentsForCourses },
        { data: lessonData },
        { data: compData }
      ] = await Promise.all([
        supabase.from("teachers").select("*").eq("id", teacherId).single(),
        supabase.from("enrollments").select("*, courses(*)").eq("teacher_id", teacherId),
        supabase.from("lessons").select("*, courses(name)").eq("teacher_id", teacherId).order("data_ora_inizio", { ascending: false }).limit(20),
        supabase.from("teacher_compensations").select("*").eq("teacher_id", teacherId).order("year", { ascending: false }).order("month", { ascending: false })
      ]);

      // Extract unique courses from enrollments
      const uniqueCourses = Array.from(new Set((enrollmentsForCourses || []).map(e => e.courses?.id)))
        .map(id => enrollmentsForCourses?.find(e => e.courses?.id === id)?.courses)
        .filter(Boolean);

      setTeacher(teacherData);
      setCourses(uniqueCourses);
      setLessons(lessonData || []);
      setCompensations(compData || []);
    } catch (error) {
      console.error("Errore caricamento dettagli insegnante:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite() {
    if (!teacher) return;
    if (!teacher.email) {
      toast.error("L'insegnante non ha un indirizzo email.");
      return;
    }

    if (cooldown > 0) {
      toast.warning(`Attendi ${cooldown} secondi prima di reinviare l'invito.`);
      return;
    }

    setInviting(true);
    try {
      const result = await inviteTeacher({
        id: teacher.id,
        email: teacher.email,
        school_id: teacher.school_id,
        first_name: teacher.first_name,
        last_name: teacher.last_name
      });
      
      if (result.success) {
        toast.success(result.message || "Invito inviato con successo!");
        setCooldown(60);
        
        // Log the link in dev mode for testing
        if ((result as any).action_link) {
          console.log("[INVITE] Link invito:", (result as any).action_link);
        }

        // Se l'utente era già esistente, ricarichiamo i dati per mostrare "Accesso attivo"
        if (result.message?.includes("già registrato")) {
          loadData();
        }
      } else {
        if (result.error?.includes("Limite di invio")) {
          toast.warning(result.error);
        } else {
          toast.error(result.error || "Errore durante l'invio dell'invito");
        }
      }
    } catch (err: any) {
      toast.error("Errore durante l'invio dell'invito");
    } finally {
      setInviting(false);
    }
  }

  if (!teacherId) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[90vw] sm:max-w-[700px] p-0 flex flex-col gap-0 border-l border-border bg-surface">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Caricamento...
          </div>
        ) : teacher ? (
          <>
            <SheetHeader className="p-6 pr-12 pb-4 bg-stone-50/50 border-b border-border/50">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-orange/10 flex items-center justify-center text-orange shrink-0">
                    <GraduationCap className="h-7 w-7" />
                  </div>
                  <div className="space-y-1">
                    <SheetTitle className="text-2xl font-serif font-bold text-foreground leading-tight">
                      {teacher.last_name} {teacher.first_name}
                    </SheetTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={teacher.active ? "outline" : "secondary"} className={teacher.active ? "text-green border-green/20 bg-green/5" : "text-muted-foreground"}>
                        {teacher.active ? "Attivo" : "Inattivo"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">ID: {teacher.id.slice(0, 8)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {teacher.profile_id && (
                    <Badge className="bg-green/10 text-green border-green/20 flex items-center gap-1 px-3 py-1">
                      <Smartphone className="h-3.5 w-3.5" />
                      Accesso attivo
                    </Badge>
                  )}
                  <Button 
                    size="sm" 
                    className={teacher.profile_id 
                      ? "bg-transparent border border-border text-muted-foreground hover:bg-stone-50 gap-2" 
                      : "bg-orange hover:bg-orange-dark text-white gap-2"}
                    onClick={handleInvite}
                    disabled={inviting || cooldown > 0}
                  >
                    {inviting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : cooldown > 0 ? (
                      <span className="text-xs font-mono">{cooldown}s</span>
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    {cooldown > 0 ? `Reinvia tra ${cooldown}s` : (teacher.profile_id ? "Reinvia accesso" : "Invita al portale")}
                  </Button>
                </div>
              </div>
            </SheetHeader>

            <Tabs defaultValue="anagrafica" className="flex-1 flex flex-col">
              <div className="px-6 border-b border-border/50 bg-stone-50/30">
                <TabsList className="h-12 bg-transparent p-0 gap-6 w-full justify-start rounded-none overflow-x-auto no-scrollbar">
                  <TabsTrigger value="anagrafica" className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange data-[state=active]:text-orange data-[state=active]:bg-transparent px-0 text-xs font-bold uppercase tracking-widest shrink-0">
                    Anagrafica
                  </TabsTrigger>
                  <TabsTrigger value="corsi" className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange data-[state=active]:text-orange data-[state=active]:bg-transparent px-0 text-xs font-bold uppercase tracking-widest shrink-0">
                    Corsi
                  </TabsTrigger>
                  <TabsTrigger value="lezioni" className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange data-[state=active]:text-orange data-[state=active]:bg-transparent px-0 text-xs font-bold uppercase tracking-widest shrink-0">
                    Lezioni
                  </TabsTrigger>
                  <TabsTrigger value="compensi" className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange data-[state=active]:text-orange data-[state=active]:bg-transparent px-0 text-xs font-bold uppercase tracking-widest shrink-0">
                    Compensi
                  </TabsTrigger>
                  <TabsTrigger value="note" className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange data-[state=active]:text-orange data-[state=active]:bg-transparent px-0 text-xs font-bold uppercase tracking-widest shrink-0">
                    Note
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-8">
                  
                  {/* Tab ANAGRAFICA */}
                  <TabsContent value="anagrafica" className="m-0 space-y-6">
                    <section className="space-y-4">
                      <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                        <User className="h-3 w-3" /> Contatti & Info
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-lg border border-border/50 bg-stone-50/50 overflow-hidden">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Email</p>
                          <p className="text-sm font-medium flex items-center gap-2 truncate" title={teacher.email || ""}>
                            <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate">{teacher.email || "—"}</span>
                          </p>
                        </div>
                        <div className="p-3 rounded-lg border border-border/50 bg-stone-50/50">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Telefono</p>
                          <p className="text-sm font-medium flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                            {teacher.phone || "—"}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg border border-border/50 bg-stone-50/50">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Tariffa Indiv.</p>
                          <p className="text-sm font-medium flex items-center gap-2 text-green">
                            <Euro className="h-3.5 w-3.5" />
                            {teacher.rate_individual || 0} € / h
                          </p>
                        </div>
                        <div className="p-3 rounded-lg border border-border/50 bg-stone-50/50">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Tariffa Collett.</p>
                          <p className="text-sm font-medium flex items-center gap-2 text-green">
                            <Euro className="h-3.5 w-3.5" />
                            {teacher.rate_group || 0} € / h
                          </p>
                        </div>
                      </div>
                    </section>

                    <section className="space-y-4 pt-2">
                      <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Specializzazioni</h4>
                      <div className="flex flex-wrap gap-2">
                        {teacher.specializzazioni?.map((s: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs border-orange/30 text-orange bg-orange/5 px-3 py-1">
                            {s}
                          </Badge>
                        )) || <p className="text-sm text-muted-foreground">Nessuna specializzazione inserita.</p>}
                      </div>
                    </section>
                  </TabsContent>

                  {/* Tab CORSI */}
                  <TabsContent value="corsi" className="m-0 space-y-4">
                    {courses.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground italic text-sm">Nessun corso assegnato.</div>
                    ) : (
                      courses.map((c) => (
                        <div key={c.id} className="p-4 rounded-lg border border-border bg-white shadow-sm flex justify-between items-center">
                          <div>
                            <h5 className="font-bold text-foreground">{c.name}</h5>
                            <p className="text-xs text-muted-foreground capitalize">{c.type}</p>
                          </div>
                          <Badge variant="outline" className="border-border">
                            {c.active ? "Attivo" : "Inattivo"}
                          </Badge>
                        </div>
                      ))
                    )}
                  </TabsContent>

                  {/* Tab LEZIONI */}
                  <TabsContent value="lezioni" className="m-0 space-y-4">
                    <div className="space-y-2">
                      {lessons.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground italic text-sm">Nessuna lezione registrata.</div>
                      ) : (
                        lessons.map((l) => (
                          <div key={l.id} className="flex items-center justify-between p-3 rounded-md border border-border/50 bg-white text-sm">
                            <div className="flex items-center gap-3">
                              <div className={`p-1.5 rounded-full ${
                                l.status === 'completata' ? 'bg-green/10 text-green' : 
                                l.status === 'pianificata' ? 'bg-blue/10 text-blue' : 'bg-red/10 text-red'
                              }`}>
                                {l.status === 'completata' ? <CheckCircle2 className="h-3.5 w-3.5" /> : 
                                 l.status === 'pianificata' ? <Clock className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                              </div>
                              <div>
                                <p className="font-medium">{l.courses?.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(l.data_ora_inizio), "EEEE dd MMM HH:mm", { locale: it })}
                                </p>
                              </div>
                            </div>
                            <Badge variant="ghost" className="text-[10px] uppercase">{l.status}</Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  {/* Tab COMPENSI */}
                  <TabsContent value="compensi" className="m-0 space-y-4">
                    {compensations.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground italic text-sm">Nessun compenso registrato.</div>
                    ) : (
                      compensations.map((c) => (
                        <div key={c.id} className="p-4 rounded-lg border border-border bg-white flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-sm font-bold">€ {Number(c.total_amount).toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(c.year, c.month - 1), "MMMM yyyy", { locale: it })}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              Indiv: {c.hours_individual}h · Collett: {c.hours_group}h
                            </p>
                          </div>
                          <Badge className={c.paid ? "bg-green text-white" : "bg-amber text-white"}>
                            {c.paid ? "Pagato" : "In attesa"}
                          </Badge>
                        </div>
                      ))
                    )}
                  </TabsContent>

                  {/* Tab NOTE */}
                  <TabsContent value="note" className="m-0 space-y-4">
                    <div className="p-4 rounded-lg border border-border bg-stone-50/50 min-h-[200px] text-sm text-foreground">
                      {teacher.notes || "Nessuna nota presente per questo insegnante."}
                    </div>
                  </TabsContent>

                </div>
              </div>
              
              <Separator />
              <div className="p-6 bg-stone-50/30">
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      if (onEdit && teacher) {
                        onEdit(teacher);
                      }
                      onOpenChange(false);
                    }}
                    className="flex-1 h-10 px-4 rounded-md bg-white border border-border text-sm font-medium hover:bg-stone-50 transition-colors"
                  >
                    Modifica Profilo
                  </button>
                  <button className="flex-1 h-10 px-4 rounded-md bg-orange text-white text-sm font-medium hover:bg-orange-dark transition-colors">
                    Report Mensile
                  </button>
                </div>
              </div>
            </Tabs>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
