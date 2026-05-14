"use client";

import { useState, useEffect } from "react";
import { 
  User, 
  BookOpen, 
  Calendar, 
  CreditCard, 
  FileText, 
  Phone, 
  Mail, 
  MapPin, 
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
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
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { inviteStudent } from "@/app/actions/portal-actions";

interface StudentSheetProps {
  studentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (student: any) => void;
}

export function StudentSheet({ studentId, open, onOpenChange, onEdit }: StudentSheetProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [availability, setAvailability] = useState<any[]>([]);
  const [inviting, setInviting] = useState(false);

  async function handleInvitePortal() {
    if (!student || (!student.email && !student.parent_email)) {
      toast.error("L'allievo non ha un'email configurata.");
      return;
    }

    setInviting(true);
    try {
      // Priorità email allievo, altrimenti genitore
      const email = student.email || student.parent_email;
      const isParent = !student.email && !!student.parent_email;

      const result = await inviteStudent({
        id: student.id,
        email: email,
        school_id: student.school_id,
        first_name: student.first_name,
        last_name: student.last_name,
        isParent: isParent
      });

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Errore durante l'invio dell'invito.");
    } finally {
      setInviting(false);
    }
  }

  useEffect(() => {
    if (open && studentId) {
      loadData();
    }
  }, [open, studentId]);

  async function loadData() {
    if (!studentId) return;
    setLoading(true);
    try {
      const [
        { data: studentData },
        { data: enrollData },
        { data: payData },
        { data: attendData },
        { data: availabilityData }
      ] = await Promise.all([
        supabase.from("students").select("*").eq("id", studentId).single(),
        supabase.from("enrollments").select("*, courses(*)").eq("student_id", studentId).order("created_at", { ascending: false }),
        supabase.from("payments").select("*, enrollments(courses(name))").eq("student_id", studentId).order("due_date", { ascending: false }),
        supabase.from("attendance").select("*, lessons(*, courses(name))").eq("student_id", studentId).order("created_at", { ascending: false }).limit(20),
        (supabase.from("disponibilita_allievi" as any)).select("*").eq("student_id", studentId).order("giorno")
      ]);

      setStudent(studentData);
      setEnrollments(enrollData || []);
      setPayments(payData || []);
      setAttendance(attendData || []);
      setAvailability((availabilityData as any) || []);
    } catch (error) {
      console.error("Errore caricamento dettagli studente:", error);
    } finally {
      setLoading(false);
    }
  }

  if (!studentId) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[900px] p-0 flex flex-col gap-0 border-l border-border bg-surface">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Caricamento...
          </div>
        ) : student ? (
          <>
            <SheetHeader className="p-6 pb-4 bg-stone-50/50 border-b border-border/50">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-orange/10 flex items-center justify-center text-orange shrink-0">
                  <User className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <SheetTitle className="text-2xl font-serif font-bold text-foreground leading-tight">
                    {student.last_name} {student.first_name}
                  </SheetTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={student.active ? "outline" : "secondary"} className={student.active ? "text-green border-green/20 bg-green/5" : "text-muted-foreground"}>
                      {student.active ? "Attivo" : "Inattivo"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">ID: {student.id.slice(0, 8)}</span>
                  </div>
                </div>
              </div>
            </SheetHeader>

            <Tabs defaultValue="anagrafica" className="flex-1 flex flex-col">
              <div className="px-6 border-b border-border/50 bg-stone-50/30">
                <TabsList className="h-12 bg-transparent p-0 gap-6 w-full justify-start rounded-none">
                  <TabsTrigger value="anagrafica" className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange data-[state=active]:text-orange data-[state=active]:bg-transparent px-0 text-xs font-bold uppercase tracking-widest">
                    Anagrafica
                  </TabsTrigger>
                  <TabsTrigger value="iscrizioni" className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange data-[state=active]:text-orange data-[state=active]:bg-transparent px-0 text-xs font-bold uppercase tracking-widest">
                    Iscrizioni
                  </TabsTrigger>
                  <TabsTrigger value="presenze" className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange data-[state=active]:text-orange data-[state=active]:bg-transparent px-0 text-xs font-bold uppercase tracking-widest">
                    Presenze
                  </TabsTrigger>
                  <TabsTrigger value="pagamenti" className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange data-[state=active]:text-orange data-[state=active]:bg-transparent px-0 text-xs font-bold uppercase tracking-widest">
                    Pagamenti
                  </TabsTrigger>
                  <TabsTrigger value="note" className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange data-[state=active]:text-orange data-[state=active]:bg-transparent px-0 text-xs font-bold uppercase tracking-widest">
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
                        <div className="p-3 rounded-lg border border-border/50 bg-stone-50/50">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Email</p>
                          <p className="text-sm font-medium flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            {student.email || "—"}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg border border-border/50 bg-stone-50/50">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Telefono</p>
                          <p className="text-sm font-medium flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                            {student.phone || "—"}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg border border-border/50 bg-stone-50/50">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Data Nascita</p>
                          <p className="text-sm font-medium flex items-center gap-2">
                            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                            {student.dob ? format(new Date(student.dob), "dd MMMM yyyy", { locale: it }) : "—"}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg border border-border/50 bg-stone-50/50">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Data Iscrizione</p>
                          <p className="text-sm font-medium flex items-center gap-2">
                            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                            {student.enrolled_at ? format(new Date(student.enrolled_at), "dd/MM/yyyy") : "—"}
                          </p>
                        </div>
                      </div>
                    </section>

                    {student.parent_name && (
                      <section className="space-y-4 pt-2">
                        <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Tutore / Genitore</h4>
                        <div className="p-4 rounded-lg border border-amber/20 bg-amber/5 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold">{student.parent_name}</span>
                            <Badge className="bg-amber text-white border-0 text-[10px]">Minorenne</Badge>
                          </div>
                          {student.parent_email && (
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                              <Mail className="h-3.5 w-3.5" /> {student.parent_email}
                            </p>
                          )}
                          {student.parent_phone && (
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                              <Phone className="h-3.5 w-3.5" /> {student.parent_phone}
                            </p>
                          )}
                        </div>
                      </section>
                    )}

                    <section className="space-y-4 pt-2">
                      <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                        <Clock className="h-3 w-3" /> Disponibilità Settimanale
                      </h4>
                      {availability.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">Nessuna disponibilità registrata.</p>
                      ) : (
                        <div className="grid grid-cols-1 gap-2">
                          {availability.map((slot) => (
                            <div key={slot.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-stone-50/50">
                              <span className="text-sm font-bold capitalize">{slot.giorno}</span>
                              <Badge variant="outline" className="text-xs border-orange/20 text-orange bg-orange/5">
                                {slot.ora_inizio.substring(0, 5)} - {slot.ora_fine.substring(0, 5)}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>

                    <section className="space-y-4 pt-2">
                      <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                        <MapPin className="h-3 w-3" /> Indirizzo
                      </h4>
                      <p className="text-sm text-foreground bg-stone-50 p-3 rounded-md border border-border/50">
                        {student.address || "Nessun indirizzo salvato."}
                      </p>
                    </section>
                  </TabsContent>

                  {/* Tab ISCRIZIONI */}
                  <TabsContent value="iscrizioni" className="m-0 space-y-4">
                    {enrollments.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground italic text-sm">
                        Nessuna iscrizione attiva.
                      </div>
                    ) : (
                      enrollments.map((en) => (
                        <div key={en.id} className="p-4 rounded-lg border border-border bg-white shadow-sm hover:border-orange/30 transition-colors">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h5 className="font-bold text-foreground leading-tight">{en.courses?.name}</h5>
                              <p className="text-[10px] text-muted-foreground uppercase font-bold mt-1">Inizio: {format(new Date(en.start_date), "dd/MM/yyyy")}</p>
                            </div>
                            <Badge className={en.status === "active" ? "bg-green text-white" : "bg-muted text-muted-foreground"}>
                              {en.status === "active" ? "Attiva" : en.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {en.courses?.type}</span>
                            {en.discount_pct > 0 && (
                              <span className="text-green font-semibold">Sconto {en.discount_pct}%</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </TabsContent>

                  {/* Tab PRESENZE */}
                  <TabsContent value="presenze" className="m-0 space-y-4">
                    <div className="space-y-2">
                      {attendance.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground italic text-sm">Nessuna presenza registrata.</div>
                      ) : (
                        attendance.map((att) => (
                          <div key={att.id} className="flex items-center justify-between p-3 rounded-md border border-border/50 bg-white text-sm">
                            <div className="flex items-center gap-3">
                              <div className={`p-1.5 rounded-full ${
                                att.status === 'present' ? 'bg-green/10 text-green' : 
                                att.status === 'absent' ? 'bg-red/10 text-red' : 'bg-amber/10 text-amber'
                              }`}>
                                {att.status === 'present' ? <CheckCircle2 className="h-3.5 w-3.5" /> : 
                                 att.status === 'absent' ? <XCircle className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                              </div>
                              <div>
                                <p className="font-medium">{att.lessons?.courses?.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(att.lessons?.data_ora_inizio), "EEEE dd MMM HH:mm", { locale: it })}
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold uppercase text-muted-foreground">{att.status}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  {/* Tab PAGAMENTI */}
                  <TabsContent value="pagamenti" className="m-0 space-y-4">
                    {payments.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground italic text-sm">Nessun pagamento trovato.</div>
                    ) : (
                      payments.map((p) => (
                        <div key={p.id} className="p-4 rounded-lg border border-border bg-white flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-sm font-bold">€ {Number(p.amount).toFixed(2)}</p>
                            <p className="text-[11px] text-muted-foreground">Scadenza: {format(new Date(p.due_date), "dd/MM/yyyy")}</p>
                            <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                              {p.enrollments?.courses?.name || p.description}
                            </p>
                          </div>
                          <Badge className={`
                            ${p.status === 'pagato' ? 'bg-green-light text-green border-green/20' : 
                              p.status === 'in_ritardo' ? 'bg-red-light text-red border-red/20' : 
                              'bg-amber-light text-amber border-amber/20'} border
                          `}>
                            {p.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      ))
                    )}
                  </TabsContent>

                  {/* Tab NOTE */}
                  <TabsContent value="note" className="m-0 space-y-4">
                    <div className="p-4 rounded-lg border border-border bg-stone-50/50 min-h-[200px] text-sm text-foreground">
                      {student.notes || "Nessuna nota presente per questo allievo."}
                    </div>
                  </TabsContent>

                </div>
              </div>
              
              <Separator />
              <div className="p-6 bg-stone-50/30">
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      if (onEdit && student) {
                        onEdit(student);
                      }
                      onOpenChange(false);
                    }}
                    className="flex-1 h-10 px-4 rounded-md bg-white border border-border text-sm font-medium hover:bg-stone-50 transition-colors"
                  >
                    Modifica Allievo
                  </button>
                  <button 
                    onClick={handleInvitePortal}
                    disabled={inviting || !student.active}
                    className="flex-1 h-10 px-4 rounded-md bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Invita al Portale"}
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
