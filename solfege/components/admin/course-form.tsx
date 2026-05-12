"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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

  async function onSubmit(data: CourseFormValues) {
    setIsLoading(true);
    try {
      const payload = {
        school_id: schoolId,
        name: data.name,
        type: data.type as "individuale" | "collettivo" | "online",
        level: (data.level || "principiante") as "principiante" | "intermedio" | "avanzato" | "professionale",
        instrument_id: instrumentId || null,
        room_id: roomId || null,
        day_of_week: data.day_of_week ? parseInt(data.day_of_week) : null,
        start_time: data.start_time || null,
        duration_min: data.duration_min ? parseInt(data.duration_min) : 60,
        max_students: data.max_students ? parseInt(data.max_students) : 1,
        price_model: data.price_model as "mensile" | "pacchetto" | "annuale",
        price: data.price ? parseFloat(data.price) : 0,
        colore_calendario: selectedColor,
        anno_scolastico: data.anno_scolastico || "2024-2025",
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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
            <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Programmazione</h4>
            <div className="grid grid-cols-3 gap-4">
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
              <div className="space-y-2">
                <Label>Durata (min)</Label>
                <Input type="number" {...register("duration_min")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max Studenti</Label>
                <Input type="number" {...register("max_students")} />
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
