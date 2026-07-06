"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, Users, Clock, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CourseFormDialog } from "@/components/admin/course-form";
import { EnrollmentFormDialog } from "@/components/admin/enrollment-form";

const DAYS = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
const TYPE_LABELS: Record<string, string> = { individuale: "Individuale", collettivo: "Collettivo", online: "Online" };
const LEVEL_LABELS: Record<string, string> = { principiante: "Principiante", intermedio: "Intermedio", avanzato: "Avanzato", professionale: "Professionale" };

export default function CoursesPage() {
  const supabase = createClient();
  const [courses, setCourses] = useState<any[]>([]);
  const [instruments, setInstruments] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editCourse, setEditCourse] = useState<any>(undefined);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [enrollCourse, setEnrollCourse] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      console.log("[COURSES] Avvio caricamento pagina corsi...");
      try {
        const { isDesktop } = await import("@/lib/is-desktop");
        if (isDesktop()) {
          console.log("[COURSES] Rilevato ambiente Desktop nativo. Caricamento SQLite...");
          const Database = (await import("@tauri-apps/plugin-sql")).default;
          const db = await Database.load("sqlite:solfege.db");
          
          // Auto-seeding degli strumenti locali se vuoti
          try {
            const checkInstr = await db.select<any[]>("SELECT COUNT(*) as count FROM instruments");
            if (checkInstr && checkInstr.length > 0 && checkInstr[0].count === 0) {
              console.log("[COURSES] Tabella strumenti locale vuota. Avvio seeding strumenti...");
              const DEFAULT_INSTRUMENTS = [
                "Arpa", "Basso Elettrico", "Batteria", "Canto", "Chitarra", "Chitarra Elettrica",
                "Clarinetto", "Clavicembalo", "Composizione", "Contrabbasso", "Corno", "Fagotto",
                "Fisarmonica", "Flauto", "Mandolino", "Musica d'insieme", "Oboe", "Organo",
                "Percussioni", "Pianoforte", "Sassofono", "Tromba", "Trombone", "Viola", "Violino", "Violoncello"
              ];
              for (const name of DEFAULT_INSTRUMENTS) {
                await db.execute("INSERT INTO instruments (nome, categoria) VALUES (?, 'Classico')", [name]);
              }
              console.log("[COURSES] Seeding strumenti completato!");
            }
          } catch (err) {
            console.error("[COURSES] Errore durante il seeding degli strumenti:", err);
          }

          const schools = await db.select<any[]>("SELECT id FROM schools LIMIT 1");
          console.log("[COURSES] Scuole trovate nel DB locale:", schools);
          if (schools && schools.length > 0) {
            setSchoolId(schools[0].id);
            await fetchAll(schools[0].id);
          } else {
            console.warn("[COURSES] Nessuna scuola trovata nel DB locale SQLite!");
          }
          return;
        }

        // Web Flow
        console.log("[COURSES] Rilevato ambiente Web Flow. Caricamento Supabase...");
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.warn("[COURSES] Nessun utente autenticato su Supabase!");
          return;
        }
        const { data: profile } = await supabase.from("profiles").select("school_id").eq("id", user.id).single();
        if (!profile?.school_id) {
          console.warn("[COURSES] Nessuna scuola associata al profilo utente!");
          return;
        }
        setSchoolId(profile.school_id);
        await fetchAll(profile.school_id);
      } catch (err) {
        console.error("[COURSES] Errore critico nel load() dei corsi:", err);
      }
    }
    load();
  }, []);

  async function fetchAll(sid?: string) {
    setLoading(true);
    const id = sid || schoolId;
    console.log("[COURSES] Avvio fetchAll con schoolId:", id);
    if (!id) {
      console.warn("[COURSES] fetchAll annullato: schoolId non valido");
      return;
    }

    try {
      const { isDesktop } = await import("@/lib/is-desktop");
      if (isDesktop()) {
        const Database = (await import("@tauri-apps/plugin-sql")).default;
        const db = await Database.load("sqlite:solfege.db");

        // Fetch courses con join su strumenti e aule (usando alias per mantenere compatibilità)
        const coursesData = await db.select<any[]>(
          `SELECT c.id, c.nome as name, c.tipo as type, c.livello as level, 
                  c.giorno_settimana as day_of_week, c.ora_inizio as start_time, 
                  c.durata_minuti as duration_min, c.max_allievi as max_students, 
                  c.prezzo as price, c.colore_calendario, c.anno_accademico as anno_scolastico,
                  c.instrument_id, c.room_id,
                  i.nome as instrument_name, r.nome as room_name
           FROM courses c
           LEFT JOIN instruments i ON c.instrument_id = i.id
           LEFT JOIN rooms r ON c.room_id = r.id
           ORDER BY c.nome ASC`
        );
        console.log("[COURSES] Corsi caricati offline:", coursesData);

        // Fetch conteggio iscritti (enrollments)
        const enrollData = await db.select<any[]>(
          "SELECT course_id FROM enrollments WHERE stato = 'attivo' OR stato = 'active'"
        );

        const enrollCounts: Record<string, number> = {};
        (enrollData || []).forEach((e: any) => { enrollCounts[e.course_id] = (enrollCounts[e.course_id] || 0) + 1; });

        const mappedCourses = coursesData.map((c: any) => ({
          ...c,
          instruments: c.instrument_id ? { name: c.instrument_name } : null,
          rooms: c.room_id ? { name: c.room_name } : null,
          enrolled_count: enrollCounts[c.id] || 0,
          price_model: "mensile" // Valore di fallback
        }));

        // Fetch strumenti
        let instrumentsData: any[] = [];
        try {
          instrumentsData = await db.select<any[]>(
            "SELECT id, nome as name FROM instruments ORDER BY nome ASC"
          );
          if (instrumentsData.length === 0) {
            const DEFAULT_INSTRUMENTS = [
              "Arpa", "Basso Elettrico", "Batteria", "Canto", "Chitarra", "Chitarra Elettrica",
              "Clarinetto", "Clavicembalo", "Composizione", "Contrabbasso", "Corno", "Fagotto",
              "Fisarmonica", "Flauto", "Mandolino", "Musica d'insieme", "Oboe", "Organo",
              "Percussioni", "Pianoforte", "Sassofono", "Tromba", "Trombone", "Viola", "Violino", "Violoncello"
            ];
            instrumentsData = DEFAULT_INSTRUMENTS.map((name, index) => ({
              id: `global-${index}`,
              name: name
            }));
          }
          console.log("[COURSES] Strumenti caricati offline:", instrumentsData);
        } catch (err) {
          console.error("[COURSES] Errore caricamento strumenti SQLite:", err);
        }

        // Fetch aule
        let roomsData: any[] = [];
        try {
          roomsData = await db.select<any[]>(
            "SELECT id, nome as name FROM rooms ORDER BY nome ASC"
          );
          console.log("[COURSES] Aule caricate offline:", roomsData);
        } catch (err) {
          console.error("[COURSES] Errore caricamento aule SQLite:", err);
        }

        setCourses(mappedCourses);
        setInstruments(instrumentsData);
        setRooms(roomsData);
        setLoading(false);
        return;
      }
    } catch (e) {
      console.error("[COURSES] Errore nel try di fetchAll SQLite:", e);
    }

    const [coursesRes, instrRes, roomsRes] = await Promise.all([
      supabase.from("courses").select("*, instruments(name), rooms(name)").eq("school_id", id).order("name"),
      supabase.from("instruments").select("id, name, is_global").or(`is_global.eq.true,school_id.eq.${id}`).order("name"),
      supabase.from("rooms").select("id, name").eq("school_id", id).order("name"),
    ]);

    // Conteggio iscritti per corso
    const courseIds = (coursesRes.data || []).map((c: any) => c.id);
    const { data: enrollData } = await supabase
      .from("enrollments").select("course_id").in("course_id", courseIds).eq("status", "active");

    const enrollCounts: Record<string, number> = {};
    (enrollData || []).forEach((e: any) => { enrollCounts[e.course_id] = (enrollCounts[e.course_id] || 0) + 1; });

    setCourses((coursesRes.data || []).map((c: any) => ({ ...c, enrolled_count: enrollCounts[c.id] || 0 })));
    setInstruments(instrRes.data || []);
    setRooms(roomsRes.data || []);
    setLoading(false);
  }

  const filtered = courses.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  async function handleDelete() {
    if (!deleteId) return;
    try {
      const { isDesktop } = await import("@/lib/is-desktop");
      if (isDesktop()) {
        const Database = (await import("@tauri-apps/plugin-sql")).default;
        const db = await Database.load("sqlite:solfege.db");
        await db.execute("DELETE FROM courses WHERE id = ?", [deleteId]);
        await db.execute("DELETE FROM enrollments WHERE course_id = ?", [deleteId]);
        toast.success("Corso eliminato");
        fetchAll();
        setDeleteId(null);
        return;
      }

      // Web Flow
      const { error } = await supabase.from("courses").delete().eq("id", deleteId);
      if (error) toast.error("Errore durante l'eliminazione");
      else { toast.success("Corso eliminato"); fetchAll(); }
    } catch (e) {
      toast.error("Errore durante l'eliminazione");
    }
    setDeleteId(null);
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-4xl font-bold tracking-tight text-foreground">Corsi</h2>
        <Button className="bg-orange hover:bg-orange-dark text-white" onClick={() => { setEditCourse(undefined); setFormOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Nuovo Corso
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Cerca per nome corso..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm py-8 text-center">Caricamento...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">Nessun corso trovato.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <Card key={c.id} className="border-border shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              {/* Banda colorata */}
              <div className="h-2" style={{ backgroundColor: c.colore_calendario || "#E8621A" }} />
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground text-base">{c.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {c.instruments?.name || "Strumento non assegnato"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => { setEditCourse(c); setFormOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red"
                      onClick={() => setDeleteId(c.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  <Badge variant="outline" className="text-xs border-border text-foreground">{TYPE_LABELS[c.type] || c.type}</Badge>
                  <Badge variant="outline" className="text-xs border-border text-foreground">{LEVEL_LABELS[c.level] || c.level}</Badge>
                  <Badge variant="outline" className="text-xs border-border text-muted-foreground">{c.price_model}</Badge>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  {(() => {
                    const DAYS_SHORT = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
                    const rawAnno = c.anno_accademico || c.anno_scolastico || "";
                    let scheduleText = "";
                    
                    if (rawAnno.includes("|")) {
                      try {
                        const parts = rawAnno.split("|");
                        const parsed = JSON.parse(parts[1]);
                        if (parsed && Array.isArray(parsed.multiScheduling) && parsed.multiScheduling.length > 0) {
                          scheduleText = parsed.multiScheduling.map((s: any) => {
                            const dayName = DAYS_SHORT[parseInt(s.day_of_week)] || "";
                            const time = s.start_time ? s.start_time.slice(0, 5) : "";
                            return `${dayName} ${time}`;
                          }).join(", ");
                        }
                      } catch (err) {}
                    }
                    
                    if (!scheduleText && c.day_of_week !== null && c.day_of_week !== undefined) {
                      const dayName = DAYS_SHORT[c.day_of_week] || "";
                      const time = c.start_time ? c.start_time.slice(0, 5) : "";
                      scheduleText = `${dayName} ${time}`;
                    }

                    if (scheduleText) {
                      return (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-stone-400" />
                          <span className="text-foreground font-semibold">{scheduleText}</span>
                          <span>· {c.duration_min}min</span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      <span className="text-foreground font-medium">{c.enrolled_count}</span>
                      <span>/ {c.max_students}</span>
                    </div>
                    <span className="text-foreground font-bold">€{Number(c.price || 0).toFixed(0)}<span className="text-muted-foreground font-normal text-xs">/{c.price_model === "mensile" ? "mese" : c.price_model === "annuale" ? "anno" : "pkt"}</span></span>
                  </div>
                  <Button size="sm" variant="outline" className="border-orange/30 text-orange hover:bg-orange/5 h-8 text-xs"
                    onClick={() => { setEnrollCourse(c); setEnrollOpen(true); }}>
                    <UserPlus className="h-3.5 w-3.5 mr-1" /> Iscrivi
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="text-sm text-muted-foreground">{filtered.length} cors{filtered.length === 1 ? "o" : "i"} totali</div>

      {/* Course Form */}
      {schoolId && (
        <CourseFormDialog
          key={editCourse?.id || "new"}
          open={formOpen}
          onOpenChange={setFormOpen}
          schoolId={schoolId}
          course={editCourse}
          instruments={instruments}
          rooms={rooms}
          onSuccess={() => fetchAll()}
        />
      )}

      {/* Enrollment Form */}
      {schoolId && enrollCourse && (
        <EnrollmentFormDialog open={enrollOpen} onOpenChange={setEnrollOpen} schoolId={schoolId}
          course={enrollCourse} onSuccess={() => fetchAll()} />
      )}

      {/* Delete */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Eliminare questo corso?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">Verranno rimosse anche tutte le iscrizioni associate.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border text-muted-foreground">Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red hover:bg-red/90 text-white">Elimina</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
