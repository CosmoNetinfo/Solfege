"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const studentSchema = z.object({
  first_name: z.string().min(2, "Minimo 2 caratteri"),
  last_name: z.string().min(2, "Minimo 2 caratteri"),
  dob: z.string().optional(),
  email: z.string().email("Email non valida").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  cap: z.string().optional(),
  fiscal_code: z.string().optional(),
  parent_name: z.string().optional(),
  parent_surname: z.string().optional(),
  parent_phone: z.string().optional(),
  parent_email: z.string().optional(),
  note_mediche: z.string().optional(),
  notes: z.string().optional(),
});

type StudentFormValues = z.infer<typeof studentSchema>;

interface StudentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  student?: any; // Existing student for edit mode
  onSuccess: () => void;
}

export function StudentFormDialog({ open, onOpenChange, schoolId, student, onSuccess }: StudentFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();
  const isEdit = !!student;

  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: getStudentDefaultValues(student)
  });

  useEffect(() => {
    if (open) {
      reset(getStudentDefaultValues(student));
    }
  }, [open, student, reset]);

  function getStudentDefaultValues(s: any) {
    if (!s) return {};
    return {
      first_name: s.first_name || "",
      last_name: s.last_name || "",
      dob: s.dob || "",
      email: s.email || "",
      phone: s.phone || "",
      address: s.address || "",
      city: s.city || "",
      cap: s.cap || "",
      fiscal_code: s.fiscal_code || "",
      parent_name: s.parent_name || "",
      parent_surname: s.parent_surname || "",
      parent_phone: s.parent_phone || "",
      parent_email: s.parent_email || "",
      note_mediche: s.note_mediche || "",
      notes: s.notes || "",
    };
  }

  const dobValue = watch("dob");
  const isMinor = dobValue ? (() => {
    const dob = new Date(dobValue);
    const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    return age < 18;
  })() : false;

  async function onSubmit(data: StudentFormValues) {
    setIsLoading(true);
    try {
      const payload = {
        ...data,
        school_id: schoolId,
        dob: data.dob || null,
        email: data.email || null,
      };

      if (isEdit) {
        const { error } = await supabase
          .from("students")
          .update(payload)
          .eq("id", student.id);
        if (error) throw error;
        toast.success("Allievo aggiornato con successo");
      } else {
        const { error } = await supabase
          .from("students")
          .insert(payload);
        if (error) throw error;
        toast.success("Allievo creato con successo");
      }

      reset();
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground font-serif text-xl">
            {isEdit ? "Modifica Allievo" : "Nuovo Allievo"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEdit ? "Modifica i dati dell'allievo." : "Inserisci i dati del nuovo allievo."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                <Label htmlFor="dob">Data di Nascita</Label>
                <Input id="dob" type="date" {...register("dob")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fiscal_code">Codice Fiscale</Label>
                <Input id="fiscal_code" {...register("fiscal_code")} />
              </div>
            </div>
          </div>

          {/* Contatti */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Contatti</h4>
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
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="address">Indirizzo</Label>
                <Input id="address" {...register("address")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cap">CAP</Label>
                <Input id="cap" {...register("cap")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Città</Label>
              <Input id="city" {...register("city")} />
            </div>
          </div>

          {/* Genitore — visibile solo se minorenne */}
          {isMinor && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <h4 className="text-xs font-bold uppercase text-orange tracking-widest flex items-center gap-2">
                Dati Genitore / Tutore
                <span className="text-xs font-normal text-muted-foreground normal-case">(allievo minorenne)</span>
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="parent_name">Nome Genitore</Label>
                  <Input id="parent_name" {...register("parent_name")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parent_surname">Cognome Genitore</Label>
                  <Input id="parent_surname" {...register("parent_surname")} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="parent_phone">Telefono Genitore</Label>
                  <Input id="parent_phone" {...register("parent_phone")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parent_email">Email Genitore</Label>
                  <Input id="parent_email" type="email" {...register("parent_email")} />
                </div>
              </div>
            </div>
          )}

          {/* Note */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Note</h4>
            <div className="space-y-2">
              <Label htmlFor="note_mediche">Note Mediche</Label>
              <Textarea id="note_mediche" {...register("note_mediche")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Note Generali</Label>
              <Textarea id="notes" {...register("notes")} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-border text-muted-foreground">
              Annulla
            </Button>
            <Button type="submit" className="bg-orange hover:bg-orange-dark text-white" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isEdit ? "Salva Modifiche" : "Crea Allievo")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
