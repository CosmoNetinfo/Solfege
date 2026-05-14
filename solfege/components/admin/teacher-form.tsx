"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { checkPlanLimits } from "@/lib/supabase/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { DisponibilitaGrid, type SlotDisponibilita } from "./disponibilita-grid";

const teacherSchema = z.object({
  first_name: z.string().min(2, "Minimo 2 caratteri"),
  last_name: z.string().min(2, "Minimo 2 caratteri"),
  email: z.string().email("Email non valida").optional().or(z.literal("")),
  phone: z.string().optional(),
  fiscal_code: z.string().optional(),
  specializzazioni: z.string().optional(),
  rate_individual: z.string().optional(),
  rate_group: z.string().optional(),
  iban: z.string().optional(),
  note_contratto: z.string().optional(),
  data_assunzione: z.string().optional(),
});

type TeacherFormValues = z.infer<typeof teacherSchema>;

interface TeacherFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  teacher?: any;
  initialSlots?: SlotDisponibilita[];
  onSuccess: () => void;
}

export function TeacherFormDialog({
  open, onOpenChange, schoolId, teacher, initialSlots = [], onSuccess,
}: TeacherFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [slots, setSlots] = useState<SlotDisponibilita[]>(initialSlots);
  const [planLimits, setPlanLimits] = useState<any>(null);
  const supabase = createClient();
  const isEdit = !!teacher;

  const { register, handleSubmit, formState: { errors }, reset } = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherSchema),
    defaultValues: getTeacherDefaultValues(teacher)
  });

  useEffect(() => {
    if (open) {
      reset(getTeacherDefaultValues(teacher));
      setSlots(initialSlots);
      if (!isEdit) {
        checkPlanLimits(supabase, schoolId).then(setPlanLimits);
      }
    }
  }, [open, teacher, initialSlots, reset, schoolId, supabase, isEdit]);

  function getTeacherDefaultValues(t: any) {
    if (!t) return {};
    return {
      first_name: t.first_name || "",
      last_name: t.last_name || "",
      email: t.email || "",
      phone: t.phone || "",
      fiscal_code: t.fiscal_code || "",
      specializzazioni: (t.specializzazioni || []).join(", "),
      rate_individual: String(t.rate_individual || ""),
      rate_group: String(t.rate_group || ""),
      iban: t.iban || "",
      note_contratto: t.note_contratto || "",
      data_assunzione: t.data_assunzione || "",
    };
  }

  async function onSubmit(data: TeacherFormValues) {
    setIsLoading(true);
    try {
      const specs = data.specializzazioni
        ? data.specializzazioni.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

      const payload = {
        school_id: schoolId,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email || null,
        phone: data.phone || null,
        fiscal_code: data.fiscal_code || null,
        specializzazioni: specs,
        rate_individual: data.rate_individual ? parseFloat(data.rate_individual) : 0,
        rate_group: data.rate_group ? parseFloat(data.rate_group) : 0,
        iban: data.iban || null,
        note_contratto: data.note_contratto || null,
        data_assunzione: data.data_assunzione || null,
      };

      let teacherId: string;

      if (isEdit) {
        const { error } = await supabase.from("teachers").update(payload).eq("id", teacher.id);
        if (error) throw error;
        teacherId = teacher.id;
      } else {
        const { data: newTeacher, error } = await supabase.from("teachers").insert(payload).select("id").single();
        if (error) throw error;
        teacherId = newTeacher.id;
      }

      // Salva disponibilità: delete + re-insert
      await supabase.from("disponibilita_insegnanti").delete().eq("teacher_id", teacherId);
      if (slots.length > 0) {
        const dispRows = slots.map((s) => ({
          school_id: schoolId,
          teacher_id: teacherId,
          giorno: s.giorno as "lunedi" | "martedi" | "mercoledi" | "giovedi" | "venerdi" | "sabato" | "domenica",
          ora_inizio: s.ora_inizio,
          ora_fine: s.ora_fine,
        }));
        const { error: dispError } = await supabase.from("disponibilita_insegnanti").insert(dispRows);
        if (dispError) throw dispError;
      }

      toast.success(isEdit ? "Insegnante aggiornato" : "Insegnante creato con successo");
      reset();
      setSlots([]);
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Errore durante il salvataggio");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground font-serif text-xl">
            {isEdit ? "Modifica Insegnante" : "Nuovo Insegnante"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEdit ? "Modifica i dati dell'insegnante." : "Inserisci i dati del nuovo insegnante."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {planLimits && !planLimits.canAddTeacher && (
            <div className="p-4 bg-red/5 border border-red/10 rounded-xl text-red-800 text-sm flex flex-col gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-xs">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                Limite piano raggiunto
              </div>
              <p className="opacity-90">
                Hai raggiunto il limite di <strong>{planLimits.limits.teachers} docenti</strong> previsto dal piano <strong>{planLimits.plan}</strong>.
              </p>
              <Button 
                type="button"
                variant="outline" 
                size="sm" 
                className="w-fit bg-white border-red-200 text-red-600 hover:bg-red-50 font-bold"
                onClick={() => {
                  onOpenChange(false);
                  window.location.href = '/admin/impostazioni';
                }}
              >
                Passa a Starter →
              </Button>
            </div>
          )}

          {/* Dati Anagrafici */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Dati Anagrafici</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">Nome *</Label>
                <Input id="first_name" {...register("first_name")} />
                {errors.first_name && <p className="text-red text-xs">{errors.first_name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Cognome *</Label>
                <Input id="last_name" {...register("last_name")} />
                {errors.last_name && <p className="text-red text-xs">{errors.last_name.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register("email")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefono</Label>
                <Input id="phone" {...register("phone")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fiscal_code">Codice Fiscale</Label>
                <Input id="fiscal_code" {...register("fiscal_code")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_assunzione">Data Assunzione</Label>
                <Input id="data_assunzione" type="date" {...register("data_assunzione")} />
              </div>
            </div>
          </div>

          {/* Competenze */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Competenze & Tariffe</h4>
            <div className="space-y-2">
              <Label htmlFor="specializzazioni">Specializzazioni</Label>
              <Input id="specializzazioni" placeholder="Pianoforte, Teoria musicale, Solfeggio..." {...register("specializzazioni")} />
              <p className="text-xs text-muted-foreground">Separa con virgola</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rate_individual">Tariffa Individuale (€/h)</Label>
                <Input id="rate_individual" type="number" step="0.50" {...register("rate_individual")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rate_group">Tariffa Gruppo (€/h)</Label>
                <Input id="rate_group" type="number" step="0.50" {...register("rate_group")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="iban">IBAN</Label>
              <Input id="iban" {...register("iban")} />
            </div>
          </div>

          {/* Disponibilità Settimanale */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Disponibilità Settimanale</h4>
            <DisponibilitaGrid slots={slots} mode="edit" onChange={setSlots} />
          </div>

          {/* Note */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Note Contratto</h4>
            <Textarea id="note_contratto" {...register("note_contratto")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-border text-muted-foreground">
              Annulla
            </Button>
            <Button 
              type="submit" 
              className="bg-orange hover:bg-orange-dark text-white" 
              disabled={isLoading || (!isEdit && planLimits && !planLimits.canAddTeacher)}
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isEdit ? "Salva Modifiche" : "Crea Insegnante")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
