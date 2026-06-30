"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User, Mail, Phone, Calendar, MessageSquare, Loader2, CheckCircle2, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { registerPublicStudent } from "@/app/actions/public-actions";
import Link from "next/link";

const registrationSchema = z.object({
  first_name: z.string().min(2, "Inserisci il tuo nome"),
  last_name: z.string().min(2, "Inserisci il tuo cognome"),
  email: z.string().email("Inserisci un'email valida").optional().or(z.literal("")),
  phone: z.string().min(6, "Inserisci un numero di telefono"),
  dob: z.string().optional(),
  notes: z.string().optional(),
});

type RegistrationFormValues = z.infer<typeof registrationSchema>;

interface RegistrationFormProps {
  school: {
    id: string;
    name: string;
    logo_url?: string | null;
  };
}

export function RegistrationForm({ school }: RegistrationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
  });

  async function onSubmit(data: RegistrationFormValues) {
    setIsSubmitting(true);
    try {
      const result = await registerPublicStudent(school.id, data);
      if (result.success) {
        setIsSuccess(true);
        toast.success("Richiesta inviata con successo!");
      } else {
        toast.error("Errore: " + result.error);
      }
    } catch (err) {
      toast.error("Errore durante l'invio della richiesta.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="bg-white p-12 rounded-3xl shadow-xl text-center space-y-6 animate-in zoom-in-95 duration-500 max-w-md w-full border border-stone-100">
        <div className="flex justify-center">
            <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                <CheckCircle2 size={48} />
            </div>
        </div>
        <div className="space-y-2">
            <h2 className="text-2xl font-serif font-bold text-stone-900">Richiesta Ricevuta!</h2>
            <p className="text-stone-500">Grazie per l'interesse. La segreteria di <strong>{school.name}</strong> ti contatterà al più presto per finalizzare l'iscrizione.</p>
        </div>
        <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="w-full mt-4"
        >
            Invia un'altra richiesta
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl p-8 md:p-12 rounded-3xl shadow-2xl shadow-stone-200/50 border border-white space-y-8 w-full max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-3">
        <div className="inline-flex h-12 w-12 bg-orange/10 rounded-xl items-center justify-center text-orange mb-2">
            <Music size={24} />
        </div>
        <h1 className="text-3xl font-serif font-bold text-stone-900 leading-tight">Iscriviti a {school.name}</h1>
        <p className="text-stone-500 text-sm">Compila il modulo per richiedere l'iscrizione. Verrai ricontattato dalla nostra segreteria.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name" className="text-xs font-bold uppercase text-stone-500 tracking-wider">Nome *</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
              <Input id="first_name" placeholder="Mario" className="pl-10 h-12 bg-stone-50/50 border-stone-200 focus:bg-white transition-all" {...register("first_name")} />
            </div>
            {errors.first_name && <p className="text-red-500 text-[10px] font-bold">{errors.first_name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name" className="text-xs font-bold uppercase text-stone-500 tracking-wider">Cognome *</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
              <Input id="last_name" placeholder="Rossi" className="pl-10 h-12 bg-stone-50/50 border-stone-200 focus:bg-white transition-all" {...register("last_name")} />
            </div>
            {errors.last_name && <p className="text-red-500 text-[10px] font-bold">{errors.last_name.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs font-bold uppercase text-stone-500 tracking-wider">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
            <Input id="email" type="email" placeholder="nome@esempio.it" className="pl-10 h-12 bg-stone-50/50 border-stone-200 focus:bg-white transition-all" {...register("email")} />
          </div>
          {errors.email && <p className="text-red-500 text-[10px] font-bold">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-xs font-bold uppercase text-stone-500 tracking-wider">Telefono *</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
            <Input id="phone" placeholder="333 1234567" className="pl-10 h-12 bg-stone-50/50 border-stone-200 focus:bg-white transition-all" {...register("phone")} />
          </div>
          {errors.phone && <p className="text-red-500 text-[10px] font-bold">{errors.phone.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="dob" className="text-xs font-bold uppercase text-stone-500 tracking-wider">Data di Nascita</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
            <Input id="dob" type="date" className="pl-10 h-12 bg-stone-50/50 border-stone-200 focus:bg-white transition-all" {...register("dob")} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes" className="text-xs font-bold uppercase text-stone-500 tracking-wider">Note o Strumento di interesse</Label>
          <div className="relative">
            <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
            <Textarea id="notes" placeholder="Esempio: Vorrei iniziare il corso di chitarra per principianti..." className="pl-10 min-h-[100px] bg-stone-50/50 border-stone-200 focus:bg-white transition-all" {...register("notes")} />
          </div>
        </div>

        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-orange hover:bg-orange-dark text-white h-14 text-lg font-bold rounded-2xl shadow-lg shadow-orange/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
        >
          {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Invia Richiesta Iscrizione"}
        </Button>

        <p className="text-[10px] text-center text-stone-400 italic">
          Inviando il modulo acconsenti al trattamento dei dati personali secondo la normativa vigente. 
          Leggi la nostra <Link href="/privacy" className="underline hover:text-orange transition-colors">Privacy Policy</Link>.
        </p>
      </form>
    </div>
  );
}
