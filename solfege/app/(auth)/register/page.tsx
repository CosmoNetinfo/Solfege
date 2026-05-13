"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const registerSchema = z.object({
  // Step 1: User
  firstName: z.string().min(2, "Inserisci il tuo nome"),
  lastName: z.string().min(2, "Inserisci il tuo cognome"),
  email: z.string().email("Email non valida"),
  password: z.string().min(6, "Minimo 6 caratteri"),
  // Step 2: School
  schoolName: z.string().min(3, "Minimo 3 caratteri"),
  schoolSlug: z.string().min(3, "Slug non valido"),
  schoolPhone: z.string().min(5, "Inserisci un telefono"),
  schoolEmail: z.string().email("Email scuola non valida"),
  schoolAddress: z.string().min(5, "Inserisci l'indirizzo"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
    trigger,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
  });

  const schoolName = watch("schoolName");

  // Generazione automatica dello slug
  useEffect(() => {
    if (schoolName) {
      const slug = schoolName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      setValue("schoolSlug", slug);
    }
  }, [schoolName, setValue]);

  const nextStep = async () => {
    const fieldsToValidate = step === 1 
      ? ["firstName", "lastName", "email", "password"] 
      : ["schoolName", "schoolSlug", "schoolPhone", "schoolEmail", "schoolAddress"];
    
    const isStepValid = await trigger(fieldsToValidate as any);
    if (isStepValid) setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  async function onSubmit(data: RegisterFormValues) {
    setIsLoading(true);
    try {
      // 1. SignUp
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Errore durante la creazione dell'utente");

      // 2. Crea Scuola
      const { data: schoolData, error: schoolError } = await supabase
        .from("schools")
        .insert({
          name: data.schoolName,
          slug: data.schoolSlug,
          phone: data.schoolPhone,
          email: data.schoolEmail,
          address: data.schoolAddress,
        })
        .select()
        .single();

      if (schoolError) throw schoolError;

      // 3. Aggiorna Profilo
      // Il trigger SQL handle_new_user crea il profilo, ma potrebbe esserci una minima latenza.
      // Proviamo ad aggiornare il profilo con un piccolo sistema di retry se necessario.
      let profileUpdated = false;
      let lastProfileError = null;

      for (let i = 0; i < 3; i++) {
        const { data: pData, error: pErr } = await supabase
          .from("profiles")
          .update({
            first_name: data.firstName,
            last_name: data.lastName,
            school_id: schoolData.id,
            role: "admin",
          })
          .eq("id", authData.user.id)
          .select();

        if (!pErr && pData && pData.length > 0) {
          profileUpdated = true;
          break;
        }
        
        lastProfileError = pErr;
        // Aspetta 500ms prima di riprovare
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (!profileUpdated) {
        throw new Error(lastProfileError?.message || "Impossibile aggiornare il profilo amministratore. Verifica la connessione.");
      }

      toast.success("Scuola creata con successo!");
      window.location.href = "/admin/dashboard";
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Errore durante la registrazione.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Progress Bar */}
      <div className="relative h-1 w-full bg-border rounded-full overflow-hidden">
        <div 
          className="absolute h-full bg-orange transition-all duration-300"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      <div className="flex justify-between text-xs font-medium text-muted-foreground">
        <span className={cn(step >= 1 && "text-orange")}>Dati Utente</span>
        <span className={cn(step >= 2 && "text-orange")}>Dati Scuola</span>
        <span className={cn(step >= 3 && "text-orange")}>Riepilogo</span>
      </div>

      <div className="space-y-2">
        <h2 className="font-serif text-3xl font-bold text-foreground">
          {step === 1 && "Iniziamo"}
          {step === 2 && "La tua scuola"}
          {step === 3 && "Conferma"}
        </h2>
        <p className="text-muted-foreground text-sm">
          {step === 1 && "Inserisci i tuoi dati personali per creare l'account."}
          {step === 2 && "Parlaci della tua scuola di musica."}
          {step === 3 && "Verifica i dati prima di procedere."}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nome</Label>
                <Input id="firstName" {...register("firstName")} />
                {errors.firstName && <p className="text-red text-xs">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Cognome</Label>
                <Input id="lastName" {...register("lastName")} />
                {errors.lastName && <p className="text-red text-xs">{errors.lastName.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Personale</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-red text-xs">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register("password")} />
              {errors.password && <p className="text-red text-xs">{errors.password.message}</p>}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <Label htmlFor="schoolName">Nome Scuola</Label>
              <Input id="schoolName" {...register("schoolName")} />
              {errors.schoolName && <p className="text-red text-xs">{errors.schoolName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="schoolSlug">URL Scuola (generato)</Label>
              <div className="flex items-center gap-1 text-sm text-muted-foreground bg-warm-gray-100 p-2 rounded border border-border">
                <span>solfege.it/</span>
                <span className="font-medium text-foreground">{watch("schoolSlug")}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="schoolPhone">Telefono</Label>
                <Input id="schoolPhone" {...register("schoolPhone")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schoolEmail">Email Scuola</Label>
                <Input id="schoolEmail" type="email" {...register("schoolEmail")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="schoolAddress">Indirizzo Sede</Label>
              <Input id="schoolAddress" {...register("schoolAddress")} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="rounded-lg border border-border p-4 space-y-4 bg-white">
              <div>
                <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-widest mb-2">Amministratore</h4>
                <p className="text-foreground font-medium">{watch("firstName")} {watch("lastName")}</p>
                <p className="text-muted-foreground text-sm">{watch("email")}</p>
              </div>
              <div className="h-px bg-border w-full" />
              <div>
                <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-widest mb-2">Scuola</h4>
                <p className="text-foreground font-medium">{watch("schoolName")}</p>
                <p className="text-muted-foreground text-sm">{watch("schoolAddress")}</p>
                <p className="text-orange text-xs mt-1">solfege.it/{watch("schoolSlug")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground p-2">
              <Check className="h-4 w-4 text-green" />
              <span>Tutto pronto per la creazione.</span>
            </div>
          </div>
        )}

        <div className="flex gap-4 pt-4">
          {step > 1 && (
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-border text-muted-foreground"
              onClick={prevStep}
              disabled={isLoading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Indietro
            </Button>
          )}
          
          {step < 3 ? (
            <Button
              type="button"
              className="flex-1 bg-orange hover:bg-orange-dark text-white h-11"
              onClick={nextStep}
            >
              Avanti <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              className="flex-1 bg-orange hover:bg-orange-dark text-white h-11"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Crea il mio account"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
