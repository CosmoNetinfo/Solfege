"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Plus, Trash } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const courseSchema = z.object({
  name: z.string().min(2, "Minimo 2 caratteri"),
  type: z.enum(["individuale", "collettivo", "online"]),
  level: z.enum(["principiante", "intermedio", "avanzato", "professionale"]).optional(),
  day_of_week: z.string().optional(),
  start_time: z.string().optional(),
  duration_min: z.string().optional(),
  max_students: z.string().optional(),
  price_model: z.enum(["mensile", "pacchetto", "annuale"]),
  price: z.string().optional(),
  colore_calendario: z.string().optional(),
  anno_scolastico: z.string().optional(),
});

type CourseFormValues = z.infer<typeof courseSchema>;

const DAYS = [
  { value: "0", label: "Domenica" }, { value: "1", label: "Lunedì" }, { value: "2", label: "Martedì" },
  { value: "3", label: "Mercoledì" }, { value: "4", label: "Giovedì" }, { value: "5", label: "Venerdì" },
  { value: "6", label: "Sabato" },
];

const COLORS = [
  "#E8621A", "#D4A853", "#22C55E", "#3B82F6", "#8B5CF6", "#EC4899", "#F97316", "#14B8A6", "#EF4444",
];

interface CourseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  course?: any;
  instruments: { id: string; name: string }[];
  rooms: { id: string; name: string }[];
  onSuccess: () => void;
}

export function CourseFormDialog({ open, onOpenChange, schoolId, course, instruments, rooms, onSuccess }: CourseFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedColor, setSelectedColor] = useState(course?.colore_calendario || "#E8621A");
  const [instrumentId, setInstrumentId] = useState(course?.instrument_id || "");
  const [roomId, setRoomId] = useState(course?.room_id || "");
  
  // Stati per la programmazione multipla
  const [multiDay, setMultiDay] = useState(false);
  const [schedules, setSchedules] = useState<{ day_of_week: string; start_time: string }[]>([]);

  const supabase = createClient();
  const isEdit = !!course;

  const { register, handleSubmit, setValue, formState: { errors }, reset } = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: course ? {
      name: course.name, type: course.type, level: course.level,
      day_of_week: String(course.day_of_week ?? ""), start_time: course.start_time || "",
      duration_min: String(course.duration_min || "60"), max_students: String(course.max_students || "1"),
      price_model: course.price_model, price: String(course.price || ""),
      colore_calendario: course.colore_calendario, anno_scolastico: course.anno_scolastico || "2024-2025",
    } : { type: "individuale", price_model: "mensile", duration_min: "60", max_students: "1", anno_scolastico: "2024-2025" },
  });

  useEffect(() => {
    if (open) {
      if (course) {
        // Estrai anno scolastico e programmazione multipla se presente (es: "2024-2025|{...}")
        const rawAnno = course.anno_accademico || course.anno_scolastico || "2024-2025";
        let cleanAnno = rawAnno;
        let multiSchedulesList = [{ 
          day_of_week: course.day_of_week !== null ? String(course.day_of_week) : "", 
          start_time: course.start_time || "" 
        }];
        let isMulti = false;

        if (rawAnno.includes("|")) {
          const parts = rawAnno.split("|");
          cleanAnno = parts[0];
          try {
            const parsed = JSON.parse(parts[1]);
            if (parsed && Array.isArray(parsed.multiScheduling)) {
              multiSchedulesList = parsed.multiScheduling;
              isMulti = true;
            }
          } catch (e) {}
        }

        reset({
          name: course.name,
          type: course.type,
          level: course.level,
          day_of_week: course.day_of_week !== null ? String(course.day_of_week) : "",
          start_time: course.start_time || "",
          duration_min: String(course.duration_min || "60"),
          max_students: String(course.max_students || "1"),
          price_model: course.price_model,
          price: String(course.price || ""),
          anno_scolastico: cleanAnno,
        });
        setSelectedColor(course.colore_calendario || "#E8621A");
        setInstrumentId(course.instrument_id || "");
        setRoomId(course.room_id || "");
        setSchedules(multiSchedulesList);
        setMultiDay(isMulti);
      } else {
        reset({
          type: "individuale",
          price_model: "mensile",
          duration_min: "60",
          max_students: "1",
          anno_scolastico: "2024-2025",
          name: "",
          level: "principiante",
          day_of_week: "",
          start_time: "",
          price: "",
        });
        setSelectedColor("#E8621A");
        setInstrumentId("");
        setRoomId("");
        setSchedules([{ day_of_week: "", start_time: "" }]);
        setMultiDay(false);
      }
    }
  }, [course, open, reset]);

  const addScheduleRow = () => {
    setSchedules([...schedules, { day_of_week: "", start_time: "" }]);
  };

  const removeScheduleRow = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  const handleScheduleChange = (index: number, key: 'day_of_week' | 'start_time', value: string) => {
    const next = [...schedules];
    next[index][key] = value;
    setSchedules(next);
  };

  async function onSubmit(data: CourseFormValues) {
    setIsLoading(true);
    try {
      const { isDesktop } = await import("@/lib/is-desktop");

      // Calcola primo orario per allineamento colonne classiche
      const mainDay = multiDay && schedules.length > 0 ? schedules[0].day_of_week : data.day_of_week;
      const mainTime = multiDay && schedules.length > 0 ? schedules[0].start_time : data.start_time;

      // Genera stringa programmazione JSON
      const descPayload = multiDay && schedules.length > 0 
        ? JSON.stringify({ multiScheduling: schedules.filter(s => s.day_of_week && s.start_time) })
        : null;

      const baseAnno = data.anno_scolastico || "2024-2025";
      const finalAnno = descPayload ? `${baseAnno}|${descPayload}` : baseAnno;

      const localPayload = {
        school_id: schoolId,
        nome: data.name,
        tipo: data.type as "individuale" | "collettivo" | "online",
        livello: (data.level || "principiante") as "principiante" | "intermedio" | "avanzato" | "professionale",
        instrument_id: instrumentId || null,
        room_id: roomId || null,
        giorno_settimana: mainDay ? parseInt(mainDay) : null,
        ora_inizio: mainTime || null,
        ora_fine: mainTime && data.duration_min ? (() => {
          const [h, m] = mainTime.split(':').map(Number);
          const totalMin = h * 60 + m + parseInt(data.duration_min);
          const endH = Math.floor(totalMin / 60) % 24;
          const endM = totalMin % 60;
          return `${endH < 10 ? '0' : ''}${endH}:${endM < 10 ? '0' : ''}${endM}`;
        })() : null,
        durata_minuti: data.duration_min ? parseInt(data.duration_min) : 60,
        max_allievi: data.max_students ? parseInt(data.max_students) : 1,
        prezzo: data.price ? parseFloat(data.price) : 0,
        colore_calendario: selectedColor,
        anno_accademico: finalAnno
      };

      if (isDesktop()) {
        const Database = (await import("@tauri-apps/plugin-sql")).default;
        const db = await Database.load("sqlite:solfege.db");

        if (isEdit) {
          const fields = Object.keys(localPayload).map(k => `${k} = ?`).join(', ');
          await db.execute(
            `UPDATE courses SET ${fields} WHERE id = ?`,
            [...Object.values(localPayload), course.id]
          );
        } else {
          const newCourseId = crypto.randomUUID();
          await db.execute(
            `INSERT INTO courses (id, school_id, nome, tipo, livello, instrument_id, 
             room_id, giorno_settimana, ora_inizio, ora_fine, durata_minuti, max_allievi, 
             prezzo, colore_calendario, anno_accademico) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              newCourseId, schoolId, localPayload.nome, localPayload.tipo, localPayload.livello,
              localPayload.instrument_id, localPayload.room_id, localPayload.giorno_settimana,
              localPayload.ora_inizio, localPayload.ora_fine, localPayload.durata_minuti,
              localPayload.max_allievi, localPayload.prezzo, localPayload.colore_calendario,
              localPayload.anno_accademico
            ]
          );
        }

        toast.success(isEdit ? "Corso aggiornato" : "Corso creato con successo");
        reset();
        onOpenChange(false);
        onSuccess();
        return;
      }

      // Web Flow
      const payload = {
        school_id: schoolId,
        name: data.name,
        type: data.type as "individuale" | "collettivo" | "online",
        level: (data.level || "principiante") as "principiante" | "intermedio" | "avanzato" | "professionale",
        instrument_id: instrumentId || null,
        room_id: roomId || null,
        day_of_week: mainDay ? parseInt(mainDay) : null,
        start_time: mainTime || null,
        duration_min: data.duration_min ? parseInt(data.duration_min) : 60,
        max_students: data.max_students ? parseInt(data.max_students) : 1,
        price_model: data.price_model as "mensile" | "pacchetto" | "annuale",
        price: data.price ? parseFloat(data.price) : 0,
        colore_calendario: selectedColor,
        anno_scolastico: finalAnno
      };

      if (isEdit) {
        const { error } = await supabase.from("courses").update(payload).eq("id", course.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("courses").insert(payload);
        if (error) throw error;
      }
      toast.success(isEdit ? "Corso aggiornato" : "Corso creato con successo");
      reset(); onOpenChange(false); onSuccess();
    } catch (err: any) { toast.error(err.message || "Errore"); }
    finally { setIsLoading(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground font-serif text-xl">{isEdit ? "Modifica Corso" : "Nuovo Corso"}</DialogTitle>
          <DialogDescription className="text-muted-foreground">{isEdit ? "Modifica i dettagli del corso." : "Configura il nuovo corso."}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Informazioni Corso</h4>
            <div className="space-y-2">
              <Label>Nome Corso *</Label>
              <Input {...register("name")} placeholder="Es. Pianoforte Classico Lv.1" />
              {errors.name && <p className="text-red text-xs">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select defaultValue={course?.type || "individuale"} onValueChange={(v) => setValue("type", v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individuale">Individuale</SelectItem>
                    <SelectItem value="collettivo">Collettivo</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Livello</Label>
                <Select defaultValue={course?.level || "principiante"} onValueChange={(v) => setValue("level", v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="principiante">Principiante</SelectItem>
                    <SelectItem value="intermedio">Intermedio</SelectItem>
                    <SelectItem value="avanzato">Avanzato</SelectItem>
                    <SelectItem value="professionale">Professionale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Strumento</Label>
                <Select value={instrumentId} onValueChange={setInstrumentId}>
                  <SelectTrigger><SelectValue placeholder="Seleziona..." /></SelectTrigger>
                  <SelectContent>
                    {instruments.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Programmazione Oraria</h4>
              <div className="flex items-center gap-2">
                <Checkbox id="multi-day" checked={multiDay} onCheckedChange={(c) => {
                  setMultiDay(!!c);
                  if (!!c && schedules.length === 0) {
                    setSchedules([{ day_of_week: "", start_time: "" }]);
                  }
                }} />
                <Label htmlFor="multi-day" className="cursor-pointer text-xs">Ripeti più giorni alla settimana</Label>
              </div>
            </div>

            {multiDay ? (
              <div className="space-y-3">
                {schedules.map((row, idx) => (
                  <div key={idx} className="flex gap-4 items-end bg-stone-50 p-3 rounded-lg border border-stone-200">
                    <div className="flex-1 space-y-2">
                      <Label>Giorno {idx + 1}</Label>
                      <Select value={row.day_of_week} onValueChange={(v) => handleScheduleChange(idx, 'day_of_week', v)}>
                        <SelectTrigger><SelectValue placeholder="Scegli giorno..." /></SelectTrigger>
                        <SelectContent>{DAYS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label>Ora Inizio</Label>
                      <Input type="time" value={row.start_time} onChange={(e) => handleScheduleChange(idx, 'start_time', e.target.value)} />
                    </div>
                    {schedules.length > 1 && (
                      <Button type="button" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 h-10 px-3" onClick={() => removeScheduleRow(idx)}>
                        <Trash className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" className="border-stone-200 mt-1" onClick={addScheduleRow}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Aggiungi Giorno/Orario
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Giorno</Label>
                  <Select defaultValue={String(course?.day_of_week ?? "")} onValueChange={(v) => setValue("day_of_week", v)}>
                    <SelectTrigger><SelectValue placeholder="Seleziona..." /></SelectTrigger>
                    <SelectContent>{DAYS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ora Inizio</Label>
                  <Input type="time" {...register("start_time")} />
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Max Studenti</Label>
                <Input type="number" {...register("max_students")} />
              </div>
              <div className="space-y-2">
                <Label>Durata (min)</Label>
                <Input type="number" {...register("duration_min")} />
              </div>
              <div className="space-y-2">
                <Label>Aula</Label>
                <Select value={roomId} onValueChange={setRoomId}>
                  <SelectTrigger><SelectValue placeholder="Seleziona..." /></SelectTrigger>
                  <SelectContent>{rooms.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Prezzo & Aspetto</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Modello Prezzo</Label>
                <Select defaultValue={course?.price_model || "mensile"} onValueChange={(v) => setValue("price_model", v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensile">Mensile</SelectItem>
                    <SelectItem value="pacchetto">Pacchetto</SelectItem>
                    <SelectItem value="annuale">Annuale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prezzo (€)</Label>
                <Input type="number" step="0.50" {...register("price")} />
              </div>
              <div className="space-y-2">
                <Label>Anno Scolastico</Label>
                <Input {...register("anno_scolastico")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Colore Calendario</Label>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setSelectedColor(c)}
                    className={`h-8 w-8 rounded-full border-2 transition-all ${selectedColor === c ? "border-foreground scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-border text-muted-foreground">Annulla</Button>
            <Button type="submit" className="bg-orange hover:bg-orange-dark text-white" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isEdit ? "Salva Modifiche" : "Crea Corso")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
