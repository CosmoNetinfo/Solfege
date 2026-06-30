"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { registerPublicStudent } from "@/app/actions/public-actions";

const formSchema = z.object({
  nome: z.string().min(2, "Il nome deve avere almeno 2 caratteri"),
  cognome: z.string().min(2, "Il cognome deve avere almeno 2 caratteri"),
  data_nascita: z.string().optional(),
  codice_fiscale: z.string().toUpperCase().optional(),
  email: z.string().email("Inserisci un indirizzo email valido").or(z.literal("")),
  telefono: z.string().min(5, "Inserisci un numero di telefono valido").or(z.literal("")),
  is_minorenne: z.boolean().default(false),
  genitore_nome: z.string().optional(),
  genitore_cognome: z.string().optional(),
  genitore_email: z.string().email("Inserisci un'email valida per il genitore").or(z.literal("")),
  genitore_telefono: z.string().optional(),
  genitore_codice_fiscale: z.string().toUpperCase().optional(),
  corso_interesse: z.string().min(2, "Specificare il corso o lo strumento d'interesse"),
  note: z.string().optional(),
}).refine((data) => {
  if (data.is_minorenne) {
    return !!data.genitore_nome && !!data.genitore_cognome;
  }
  return true;
}, {
  message: "I dati del genitore (Nome e Cognome) sono obbligatori per i minorenni",
  path: ["genitore_nome"],
});

export default function IscrizionePubblicaPage() {
  const params = useParams();
  const router = useRouter();
  const schoolSlug = params.school_slug as string;
  const supabase = createClient();

  const [school, setSchool] = useState<any>(null);
  const [loadingSchool, setLoadingSchool] = useState(true);
  const [step, setStep] = useState(1);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      cognome: "",
      data_nascita: "",
      codice_fiscale: "",
      email: "",
      telefono: "",
      is_minorenne: false,
      genitore_nome: "",
      genitore_cognome: "",
      genitore_email: "",
      genitore_telefono: "",
      genitore_codice_fiscale: "",
      corso_interesse: "",
      note: "",
    },
  });

  const isMinorenne = watch("is_minorenne");

  useEffect(() => {
    async function fetchSchool() {
      try {
        const { data, error } = await supabase
          .from("schools")
          .select("*")
          .eq("slug", schoolSlug)
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          router.push("/404");
          return;
        }
        setSchool(data);
      } catch (err) {
        console.error("Errore recupero scuola:", err);
      } finally {
        setLoadingSchool(false);
      }
    }
    if (schoolSlug) {
      fetchSchool();
    }
  }, [schoolSlug, supabase, router]);

  const handleNextStep = async () => {
    let fieldsToValidate: any[] = [];
    if (step === 1) {
      fieldsToValidate = ["nome", "cognome", "data_nascita", "codice_fiscale"];
    } else if (step === 2) {
      fieldsToValidate = ["email", "telefono"];
    } else if (step === 3 && isMinorenne) {
      fieldsToValidate = [
        "genitore_nome",
        "genitore_cognome",
        "genitore_email",
        "genitore_telefono",
        "genitore_codice_fiscale"
      ];
    }

    const isValid = await trigger(fieldsToValidate as any);
    if (isValid) {
      if (step === 2 && !isMinorenne) {
        setStep(4); // Salta step genitore
      } else {
        setStep((prev) => prev + 1);
      }
    }
  };

  const handlePrevStep = () => {
    if (step === 4 && !isMinorenne) {
      setStep(2); // Salta indietro step genitore
    } else {
      setStep((prev) => prev - 1);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoadingSubmit(true);
    setErrorMsg("");
    try {
      const res = await registerPublicStudent(school.id, values);
      if (res.success) {
        setSubmitted(true);
      } else {
        setErrorMsg(res.error || "Errore durante l'invio della richiesta.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Errore di connessione.");
    } finally {
      setLoadingSubmit(false);
    }
  };

  if (loadingSchool) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#E8621A]" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <div className="bg-white border rounded-2xl p-8 max-w-md w-full text-center space-y-6 shadow-sm">
          <div className="flex justify-center">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-serif font-bold text-stone-900">Richiesta Ricevuta!</h1>
            <p className="text-sm text-stone-600">
              Grazie {watch("nome")}. La tua richiesta di iscrizione a <strong>{school?.name}</strong> è stata inviata con successo. La segreteria ti contatterà al più presto.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-6 flex items-center justify-center font-sans">
      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm max-w-lg w-full overflow-hidden">
        
        {/* Banner superiore / Logo scuola */}
        <div className="bg-stone-950 text-white p-6 text-center space-y-2 border-b border-stone-800">
          <h2 className="text-3xl font-serif tracking-wide">{school?.name}</h2>
          <p className="text-xs font-serif font-bold uppercase tracking-widest text-[#E8621A]">
            Portale Iscrizioni Online
          </p>
        </div>

        <div className="p-8 space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between text-xs font-bold text-stone-400 uppercase tracking-wider border-b pb-4">
            <span className={step === 1 ? "text-[#E8621A]" : ""}>1. Anagrafica</span>
            <span>•</span>
            <span className={step === 2 ? "text-[#E8621A]" : ""}>2. Contatti</span>
            {isMinorenne && (
              <>
                <span>•</span>
                <span className={step === 3 ? "text-[#E8621A]" : ""}>3. Genitore</span>
              </>
            )}
            <span>•</span>
            <span className={step === 4 ? "text-[#E8621A]" : ""}>{isMinorenne ? "4. Corso" : "3. Corso"}</span>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            
            {/* STEP 1: ANAGRAFICA */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="nome">Nome *</Label>
                    <Input id="nome" {...register("nome")} placeholder="Mario" />
                    {errors.nome && <p className="text-xs text-red-600">{errors.nome.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cognome">Cognome *</Label>
                    <Input id="cognome" {...register("cognome")} placeholder="Rossi" />
                    {errors.cognome && <p className="text-xs text-red-600">{errors.cognome.message}</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="data_nascita">Data di Nascita</Label>
                  <Input id="data_nascita" type="date" {...register("data_nascita")} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="codice_fiscale">Codice Fiscale</Label>
                  <Input id="codice_fiscale" {...register("codice_fiscale")} placeholder="RSSMRA80A01F205Z" />
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox 
                    id="is_minorenne" 
                    checked={isMinorenne} 
                    onCheckedChange={(checked) => setValue("is_minorenne", checked === true)} 
                  />
                  <Label htmlFor="is_minorenne" className="font-medium cursor-pointer">L'allievo è minorenne</Label>
                </div>
              </div>
            )}

            {/* STEP 2: CONTATTI */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Indirizzo Email</Label>
                  <Input id="email" type="email" {...register("email")} placeholder="mario.rossi@example.com" />
                  {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="telefono">Numero di Telefono</Label>
                  <Input id="telefono" {...register("telefono")} placeholder="+39 333 1234567" />
                  {errors.telefono && <p className="text-xs text-red-600">{errors.telefono.message}</p>}
                </div>
              </div>
            )}

            {/* STEP 3: DATI GENITORE (SOLO SE MINORENNE) */}
            {step === 3 && isMinorenne && (
              <div className="space-y-4">
                <p className="text-xs text-stone-500 font-semibold uppercase tracking-wider">Dati del Genitore / Tutore Legale</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="genitore_nome">Nome Genitore *</Label>
                    <Input id="genitore_nome" {...register("genitore_nome")} placeholder="Luigi" />
                    {errors.genitore_nome && <p className="text-xs text-red-600">{errors.genitore_nome.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="genitore_cognome">Cognome Genitore *</Label>
                    <Input id="genitore_cognome" {...register("genitore_cognome")} placeholder="Rossi" />
                    {errors.genitore_cognome && <p className="text-xs text-red-600">{errors.genitore_cognome.message}</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="genitore_email">Email Genitore</Label>
                  <Input id="genitore_email" type="email" {...register("genitore_email")} placeholder="luigi.rossi@example.com" />
                  {errors.genitore_email && <p className="text-xs text-red-600">{errors.genitore_email.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="genitore_telefono">Telefono Genitore</Label>
                  <Input id="genitore_telefono" {...register("genitore_telefono")} placeholder="+39 333 9876543" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="genitore_codice_fiscale">Codice Fiscale Genitore</Label>
                  <Input id="genitore_codice_fiscale" {...register("genitore_codice_fiscale")} placeholder="RSS LGU 55A01 F205Z" />
                </div>
              </div>
            )}

            {/* STEP 4: CORSO E NOTE */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="corso_interesse">Corso / Strumento di Interesse *</Label>
                  <Input id="corso_interesse" {...register("corso_interesse")} placeholder="Pianoforte Classico, Chitarra, Canto..." />
                  {errors.corso_interesse && <p className="text-xs text-red-600">{errors.corso_interesse.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="note">Messaggio o Note Aggiuntive</Label>
                  <Textarea id="note" {...register("note")} placeholder="Fornisci eventuali dettagli o preferenze di orario..." />
                </div>
              </div>
            )}

            {/* NAV BOTTONI */}
            <div className="flex items-center justify-between pt-4 border-t">
              {step > 1 ? (
                <Button type="button" variant="outline" onClick={handlePrevStep}>
                  <ArrowLeft className="h-4 w-4 mr-1.5" /> Indietro
                </Button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <Button type="button" className="bg-[#E8621A] hover:bg-[#C94E0E] text-white" onClick={handleNextStep}>
                  Avanti <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              ) : (
                <Button type="submit" className="bg-[#E8621A] hover:bg-[#C94E0E] text-white" disabled={loadingSubmit}>
                  {loadingSubmit ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Invio...
                    </>
                  ) : (
                    "Invia Iscrizione"
                  )}
                </Button>
              )}
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
