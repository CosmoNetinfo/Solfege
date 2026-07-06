"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, Euro, Users, Smartphone } from "lucide-react";
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
import { TeacherFormDialog } from "@/components/admin/teacher-form";
import { TeacherSheet } from "@/components/admin/teacher-sheet";
import { DisponibilitaGrid, type SlotDisponibilita } from "@/components/admin/disponibilita-grid";

type Teacher = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  specializzazioni: string[] | null;
  rate_individual: number | null;
  rate_group: number | null;
  profile_id: string | null;
  active: boolean | null;
  active_students?: number;
  disponibilita?: SlotDisponibilita[];
  [key: string]: any;
};

function getInitials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

export default function TeachersPage() {
  const supabase = createClient();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTeacher, setEditTeacher] = useState<Teacher | undefined>(undefined);
  const [editSlots, setEditSlots] = useState<SlotDisponibilita[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const { isDesktop } = await import("@/lib/is-desktop");
      if (isDesktop()) {
        const Database = (await import("@tauri-apps/plugin-sql")).default;
        const db = await Database.load("sqlite:solfege.db");
        const schools = await db.select<any[]>("SELECT id FROM schools LIMIT 1");
        if (schools && schools.length > 0) {
          setSchoolId(schools[0].id);
          await fetchTeachers(schools[0].id);
        }
        return;
      }

      // Web Flow
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("school_id").eq("id", user.id).maybeSingle();
      if (!profile?.school_id) return;
      setSchoolId(profile.school_id);
      await fetchTeachers(profile.school_id);
    }
    load();
  }, []);

  async function fetchTeachers(sid?: string) {
    setLoading(true);
    const id = sid || schoolId;
    if (!id) return;

    try {
      const { isDesktop } = await import("@/lib/is-desktop");
      if (isDesktop()) {
        const Database = (await import("@tauri-apps/plugin-sql")).default;
        const db = await Database.load("sqlite:solfege.db");

        // Fetch teachers
        const teacherData = await db.select<any[]>(
          `SELECT id, nome as first_name, cognome as last_name, email, telefono as phone, 
                  strumento_principale as specializzazioni, tariffa_oraria_individuale as rate_individual, 
                  tariffa_oraria_collettivo as rate_group, active
           FROM teachers ORDER BY cognome, nome`
        );

        if (!teacherData || teacherData.length === 0) {
          setTeachers([]);
          setLoading(false);
          return;
        }

        const teacherIds = teacherData.map((t) => t.id);
        
        // Fetch disponibilità per tutti gli insegnanti
        const dispData = await db.select<any[]>(
          "SELECT teacher_id, giorno, ora_inizio, ora_fine FROM disponibilita_insegnanti WHERE teacher_id IN (" + 
          teacherIds.map(() => '?').join(',') + ")",
          teacherIds
        );

        // Fetch conteggio allievi attivi per insegnante (via enrollments)
        const enrollData = await db.select<any[]>(
          "SELECT teacher_id, student_id FROM enrollments WHERE status = 'active' AND teacher_id IN (" + 
          teacherIds.map(() => '?').join(',') + ")",
          teacherIds
        );

        // Componi i dati
        const enriched = teacherData.map((t) => {
          // specializzazioni salvate come stringa separata da virgola
          const specs = t.specializzazioni 
            ? t.specializzazioni.split(",").map((s: string) => s.trim()).filter(Boolean)
            : [];

          return {
            ...t,
            specializzazioni: specs,
            disponibilita: (dispData || [])
              .filter((d) => d.teacher_id === t.id)
              .map((d) => ({ 
                giorno: d.giorno, 
                ora_inizio: d.ora_inizio.substring(0, 5), 
                ora_fine: d.ora_fine.substring(0, 5) 
              })),
            active_students: new Set(
              (enrollData || []).filter((e) => e.teacher_id === t.id).map((e) => e.student_id)
            ).size,
          };
        });

        setTeachers(enriched);
        setLoading(false);
        return;
      }
    } catch (e) {
      console.error("Errore recupero docenti SQLite:", e);
    }

    // Fetch teachers
    const { data: teacherData, error } = await supabase
      .from("teachers")
      .select("*")
      .eq("school_id", id)
      .order("last_name", { ascending: true });

    if (error || !teacherData) { setLoading(false); return; }

    // Fetch disponibilità per tutti gli insegnanti
    const teacherIds = teacherData.map((t) => t.id);
    const { data: dispData } = await supabase
      .from("disponibilita_insegnanti")
      .select("teacher_id, giorno, ora_inizio, ora_fine")
      .in("teacher_id", teacherIds);

    // Fetch conteggio allievi attivi per insegnante (via enrollments)
    const { data: enrollData } = await supabase
      .from("enrollments")
      .select("teacher_id, student_id")
      .in("teacher_id", teacherIds)
      .eq("status", "active");

    // Componi i dati
    const enriched = teacherData.map((t) => ({
      ...t,
      disponibilita: (dispData || [])
        .filter((d) => d.teacher_id === t.id)
        .map((d) => ({ 
          giorno: d.giorno, 
          ora_inizio: d.ora_inizio.substring(0, 5), 
          ora_fine: d.ora_fine.substring(0, 5) 
        })),
      active_students: new Set(
        (enrollData || []).filter((e) => e.teacher_id === t.id).map((e) => e.student_id)
      ).size,
    }));

    setTeachers(enriched);
    setLoading(false);
  }

  const filtered = teachers.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.first_name.toLowerCase().includes(q) ||
      t.last_name.toLowerCase().includes(q) ||
      (t.specializzazioni || []).some((s) => s.toLowerCase().includes(q))
    );
  });

  async function handleDelete() {
    if (!deleteId) return;
    try {
      const { isDesktop } = await import("@/lib/is-desktop");
      if (isDesktop()) {
        const Database = (await import("@tauri-apps/plugin-sql")).default;
        const db = await Database.load("sqlite:solfege.db");
        await db.execute("DELETE FROM teachers WHERE id = ?", [deleteId]);
        await db.execute("DELETE FROM disponibilita_insegnanti WHERE teacher_id = ?", [deleteId]);
        toast.success("Insegnante eliminato");
        fetchTeachers();
        setDeleteId(null);
        return;
      }

      // Web Flow
      const { error } = await supabase.from("teachers").delete().eq("id", deleteId);
      if (error) toast.error("Errore durante l'eliminazione");
      else { toast.success("Insegnante eliminato"); fetchTeachers(); }
    } catch (e) {
      toast.error("Errore durante l'eliminazione");
    }
    setDeleteId(null);
  }

  function openEdit(t: Teacher) {
    setEditTeacher(t);
    setEditSlots(t.disponibilita || []);
    setDialogOpen(true);
  }

  function openCreate() {
    setEditTeacher(undefined);
    setEditSlots([]);
    setDialogOpen(true);
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-4xl font-bold tracking-tight text-foreground">Insegnanti</h2>
        <Button className="bg-orange hover:bg-orange-dark text-white" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Nuovo Insegnante
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cerca per nome o specializzazione..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Card Grid */}
      {loading ? (
        <p className="text-muted-foreground text-sm py-8 text-center">Caricamento...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">Nessun insegnante trovato.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((t) => (
            <Card 
              key={t.id} 
              className="border-border shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
              onClick={() => {
                setSelectedTeacherId(t.id);
                setSheetOpen(true);
              }}
            >
              <CardContent className="p-5">
                {/* Header: Avatar + Nome + Azioni */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-orange/10 flex items-center justify-center shrink-0">
                      <span className="text-orange font-bold text-lg">{getInitials(t.first_name, t.last_name)}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-base">
                        {t.first_name} {t.last_name}
                      </h3>
                      {t.email && <p className="text-xs text-muted-foreground">{t.email}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={(e) => { e.stopPropagation(); openEdit(t); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red" onClick={(e) => { e.stopPropagation(); setDeleteId(t.id); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Specializzazioni */}
                {(t.specializzazioni && t.specializzazioni.length > 0) && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {t.specializzazioni.map((spec, i) => (
                      <Badge key={i} variant="outline" className="text-xs border-orange/30 text-orange bg-orange/5">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Stats Row */}
                <div className="flex items-center gap-4 mb-3 text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span className="text-foreground font-medium">{t.active_students || 0}</span>
                    <span>allievi</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Euro className="h-3.5 w-3.5" />
                    <span className="text-foreground font-medium">€{Number(t.rate_individual || 0).toFixed(0)}</span>
                    <span>/h</span>
                  </div>
                  {t.profile_id && (
                    <Badge className="bg-green-light text-green border-0 text-[10px] ml-auto">
                      <Smartphone className="h-3 w-3 mr-1" />
                      Accesso App
                    </Badge>
                  )}
                </div>

                {/* Disponibilità in view mode */}
                <div className="pt-3 border-t border-border">
                  <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest mb-2">Disponibilità</p>
                  <DisponibilitaGrid slots={t.disponibilita || []} mode="view" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Conteggio */}
      <div className="text-sm text-muted-foreground">
        {filtered.length} insegnant{filtered.length === 1 ? "e" : "i"} totali
      </div>

      {/* Form Dialog */}
      {schoolId && (
        <TeacherFormDialog
          key={editTeacher?.id || "new"}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          schoolId={schoolId}
          teacher={editTeacher}
          initialSlots={editSlots}
          onSuccess={() => fetchTeachers()}
        />
      )}

      <TeacherSheet 
        teacherId={selectedTeacherId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onEdit={openEdit}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Eliminare questo insegnante?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Questa azione è irreversibile. Tutti i dati associati verranno rimossi.
            </AlertDialogDescription>
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
