"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { it } from "date-fns/locale";

import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  MapPin,
  Phone,
  Music,
  FileText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { createClient } from "@/lib/supabase/client";
import { registerPublicStudent } from "@/app/actions/public-actions";

const formSchema = z
  .object({
    nome: z.string().min(2, "Inserisci almeno 2 caratteri"),
    cognome: z.string().min(2, "Inserisci almeno 2 caratteri"),
    data_nascita: z.string().min(1, "Campo obbligatorio"),
    luogo_nascita: z.string().optional(),
    codice_fiscale: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine(
        (val) => !val || /^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/i.test(val),
        { message: "Codice Fiscale non valido" }
      ),
    sesso: z.enum(["M", "F"]).optional().or(z.literal("")),
    is_minorenne: z.boolean().default(false),

    indirizzo: z.string().optional(),
    citta: z.string().optional(),
    cap: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine((val) => !val || /^\d{5}$/.test(val), { message: "CAP non valido (5 cifre)" }),
    email: z.string().email("Email non valida"),
    telefono: z.string().min(5, "Inserisci un numero valido"),

    genitore_nome: z.string().optional(),
    genitore_cognome: z.string().optional(),
    genitore_email: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine((val) => !val || z.string().email().safeParse(val).success, {
        message: "Email non valida",
      }),
    genitore_telefono: z.string().optional(),
    genitore_codice_fiscale: z.string().optional(),

    corso_interesse: z.string().min(1, "Campo obbligatorio"),
    livello_esperienza: z
      .enum(["principiante", "intermedio", "avanzato"])
      .optional()
      .or(z.literal("")),
    preferenza_giorni: z.string().optional(),
    preferenza_orario: z
      .enum(["mattina", "pomeriggio", "sera"])
      .optional()
      .or(z.literal("")),
    note: z.string().optional(),
    consenso_privacy: z.boolean().refine((val) => val === true, {
      message: "Devi accettare il consenso privacy",
    }),
  })
  .refine(
    (data) => {
      if (data.is_minorenne && !data.genitore_nome) return false;
      return true;
    },
    { message: "Nome genitore obbligatorio", path: ["genitore_nome"] }
  )
  .refine(
    (data) => {
      if (data.is_minorenne && !data.genitore_cognome) return false;
      return true;
    },
    { message: "Cognome genitore obbligatorio", path: ["genitore_cognome"] }
  )
  .refine(
    (data) => {
      if (data.is_minorenne && !data.genitore_email) return false;
      return true;
    },
    { message: "Email genitore obbligatoria", path: ["genitore_email"] }
  )
  .refine(
    (data) => {
      if (data.is_minorenne && !data.genitore_telefono) return false;
      return true;
    },
    { message: "Telefono genitore obbligatorio", path: ["genitore_telefono"] }
  );

type FormValues = z.infer<typeof formSchema>;

const DAYS_OF_WEEK = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];

export default function RegistrationFormPage() {
  const params = useParams();
  const router = useRouter();
  const schoolSlug = params.school_slug as string;

  const [school, setSchool] = useState<any>(null);
  const [loadingSchool, setLoadingSchool] = useState(true);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [direction, setDirection] = useState(1); // 1 for forward, -1 for backward

  const {
    register,
    handleSubmit,
    control,
    trigger,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      is_minorenne: false,
      consenso_privacy: false,
      preferenza_giorni: "",
    },
  });

  const isMinorenne = watch("is_minorenne");
  const preferenzaGiorniStr = watch("preferenza_giorni") || "";
  const preferenzaGiorniArr = preferenzaGiorniStr ? preferenzaGiorniStr.split(",") : [];

  const handleToggleGiorno = (giorno: string) => {
    let newArr = [...preferenzaGiorniArr];
    if (newArr.includes(giorno)) {
      newArr = newArr.filter((g) => g !== giorno);
    } else {
      newArr.push(giorno);
    }
    setValue("preferenza_giorni", newArr.join(","));
  };

  useEffect(() => {
    async function loadSchool() {
      if (!schoolSlug) return;
      const supabase = createClient();
      const { data, error } = await supabase
        .from("schools")
        .select("*")
        .eq("slug", schoolSlug)
        .single();

      if (error || !data) {
        router.push("/404");
      } else {
        setSchool(data);
        setLoadingSchool(false);
      }
    }
    loadSchool();
  }, [schoolSlug, router]);

  const stepFields: Record<number, (keyof FormValues)[]> = {
    1: ["nome", "cognome", "data_nascita", "luogo_nascita", "codice_fiscale", "sesso", "is_minorenne"],
    2: ["indirizzo", "citta", "cap", "email", "telefono"],
    3: ["genitore_nome", "genitore_cognome", "genitore_email", "genitore_telefono", "genitore_codice_fiscale"],
    4: ["corso_interesse", "livello_esperienza", "preferenza_giorni", "preferenza_orario", "note", "consenso_privacy"],
  };

  const handleNext = async () => {
    const fieldsToValidate = stepFields[step];
    if (fieldsToValidate) {
      const isValid = await trigger(fieldsToValidate);
      if (!isValid) return;
    }

    setDirection(1);
    if (step === 2 && !isMinorenne) {
      setStep(4);
    } else {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setDirection(-1);
    if (step === 4 && !isMinorenne) {
      setStep(2);
    } else {
      setStep((prev) => prev - 1);
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (!school) return;
    setIsSubmitting(true);
    try {
      const { consenso_privacy, ...formData } = data;
      await registerPublicStudent(school.id, formData);
      setIsSuccess(true);
    } catch (error) {
      console.error("Error submitting form", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const variants = {
    enter: (direction: number) => {
      return {
        x: direction > 0 ? 50 : -50,
        opacity: 0,
      };
    },
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => {
      return {
        zIndex: 0,
        x: direction < 0 ? 50 : -50,
        opacity: 0,
      };
    },
  };

  if (loadingSchool) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAFAF9]">
        <Loader2 className="h-10 w-10 animate-spin text-[#E8621A]" />
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAF9] p-4">
        <Card className="w-full max-w-2xl rounded-2xl shadow-sm text-center p-8">
          <CheckCircle2 className="mx-auto h-20 w-20 text-green-500 mb-6" />
          <h1 className="text-3xl font-serif text-stone-950 mb-2">Richiesta Ricevuta!</h1>
          <p className="text-stone-600 font-sans">
            La tua iscrizione è stata inviata con successo. Verrai contattato a breve per ulteriori dettagli.
          </p>
        </Card>
      </div>
    );
  }

  const totalSteps = isMinorenne ? 5 : 4;
  const currentVisualStep = step > 2 && !isMinorenne ? step - 1 : step;
  const progressPercentage = ((currentVisualStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="min-h-screen bg-[#FAFAF9] p-4 flex flex-col items-center">
      <div className="w-full max-w-2xl rounded-t-2xl bg-stone-950 p-6 text-center shadow-sm">
        <h1 className="font-serif text-3xl text-white">{school?.name || "Scuola di Musica"}</h1>
        <p className="font-sans text-[#E8621A] mt-1 font-medium">Portale Iscrizioni Online</p>
      </div>

      <Card className="w-full max-w-2xl rounded-b-2xl rounded-t-none shadow-sm overflow-hidden">
        <div className="w-full bg-stone-100 h-2">
          <motion.div
            className="h-full bg-[#E8621A]"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="px-6 pt-4 pb-2 text-center text-sm text-stone-500 font-sans">
          Passo {currentVisualStep} di {totalSteps}
        </div>

        <CardContent className="p-6 overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <form className="space-y-6">
                {/* STEP 1: Dati Allievo */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b pb-2 mb-4">
                      <User className="h-5 w-5 text-[#E8621A]" />
                      <h2 className="text-xl font-serif text-stone-900">Dati Allievo</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label>Nome *</Label>
                        <Input {...register("nome")} placeholder="Mario" />
                        {errors.nome && <p className="text-red-500 text-sm">{errors.nome.message}</p>}
                      </div>
                      <div className="space-y-1">
                        <Label>Cognome *</Label>
                        <Input {...register("cognome")} placeholder="Rossi" />
                        {errors.cognome && <p className="text-red-500 text-sm">{errors.cognome.message}</p>}
                      </div>
                      <div className="space-y-1">
                        <Label>Data di Nascita *</Label>
                        <Input type="date" {...register("data_nascita")} />
                        {errors.data_nascita && <p className="text-red-500 text-sm">{errors.data_nascita.message}</p>}
                      </div>
                      <div className="space-y-1">
                        <Label>Luogo di Nascita</Label>
                        <Input {...register("luogo_nascita")} placeholder="Roma" />
                      </div>
                      <div className="space-y-1">
                        <Label>Codice Fiscale</Label>
                        <Input
                          {...register("codice_fiscale")}
                          placeholder="RSSMRA80A01H501Z"
                          onChange={(e) => {
                            e.target.value = e.target.value.toUpperCase();
                            register("codice_fiscale").onChange(e);
                          }}
                        />
                        {errors.codice_fiscale && <p className="text-red-500 text-sm">{errors.codice_fiscale.message}</p>}
                      </div>
                      <div className="space-y-1">
                        <Label>Sesso</Label>
                        <Controller
                          name="sesso"
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleziona..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="M">Maschio</SelectItem>
                                <SelectItem value="F">Femmina</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 pt-2">
                      <Checkbox
                        id="is_minorenne"
                        checked={isMinorenne}
                        onCheckedChange={(checked) => setValue("is_minorenne", checked as boolean)}
                      />
                      <label
                        htmlFor="is_minorenne"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        L'allievo è minorenne
                      </label>
                    </div>
                  </div>
                )}

                {/* STEP 2: Residenza & Contatti */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b pb-2 mb-4">
                      <MapPin className="h-5 w-5 text-[#E8621A]" />
                      <h2 className="text-xl font-serif text-stone-900">Residenza & Contatti</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1 md:col-span-2">
                        <Label>Indirizzo</Label>
                        <Input {...register("indirizzo")} placeholder="Via Roma, 1" />
                      </div>
                      <div className="space-y-1">
                        <Label>Città</Label>
                        <Input {...register("citta")} placeholder="Roma" />
                      </div>
                      <div className="space-y-1">
                        <Label>CAP</Label>
                        <Input {...register("cap")} placeholder="00100" />
                        {errors.cap && <p className="text-red-500 text-sm">{errors.cap.message}</p>}
                      </div>
                      <div className="space-y-1">
                        <Label>Email *</Label>
                        <Input type="email" {...register("email")} placeholder="mario@example.com" />
                        {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
                      </div>
                      <div className="space-y-1">
                        <Label>Telefono *</Label>
                        <Input {...register("telefono")} placeholder="+39 333 1234567" />
                        {errors.telefono && <p className="text-red-500 text-sm">{errors.telefono.message}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: Genitore/Tutore (Solo se minorenne) */}
                {step === 3 && isMinorenne && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b pb-2 mb-4">
                      <Phone className="h-5 w-5 text-[#E8621A]" />
                      <h2 className="text-xl font-serif text-stone-900">Dati Genitore / Tutore</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label>Nome Genitore *</Label>
                        <Input {...register("genitore_nome")} placeholder="Giuseppe" />
                        {errors.genitore_nome && <p className="text-red-500 text-sm">{errors.genitore_nome.message}</p>}
                      </div>
                      <div className="space-y-1">
                        <Label>Cognome Genitore *</Label>
                        <Input {...register("genitore_cognome")} placeholder="Rossi" />
                        {errors.genitore_cognome && <p className="text-red-500 text-sm">{errors.genitore_cognome.message}</p>}
                      </div>
                      <div className="space-y-1">
                        <Label>Email Genitore *</Label>
                        <Input type="email" {...register("genitore_email")} placeholder="giuseppe@example.com" />
                        {errors.genitore_email && <p className="text-red-500 text-sm">{errors.genitore_email.message}</p>}
                      </div>
                      <div className="space-y-1">
                        <Label>Telefono Genitore *</Label>
                        <Input {...register("genitore_telefono")} placeholder="+39 333 7654321" />
                        {errors.genitore_telefono && <p className="text-red-500 text-sm">{errors.genitore_telefono.message}</p>}
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <Label>Codice Fiscale Genitore</Label>
                        <Input
                          {...register("genitore_codice_fiscale")}
                          onChange={(e) => {
                            e.target.value = e.target.value.toUpperCase();
                            register("genitore_codice_fiscale").onChange(e);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: Corso & Preferenze */}
                {step === 4 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b pb-2 mb-4">
                      <Music className="h-5 w-5 text-[#E8621A]" />
                      <h2 className="text-xl font-serif text-stone-900">Corso & Preferenze</h2>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <Label>Corso di Interesse *</Label>
                        <Input {...register("corso_interesse")} placeholder="Pianoforte, Chitarra, Canto..." />
                        {errors.corso_interesse && <p className="text-red-500 text-sm">{errors.corso_interesse.message}</p>}
                      </div>
                      
                      <div className="space-y-1">
                        <Label>Livello di Esperienza</Label>
                        <Controller
                          name="livello_esperienza"
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleziona livello..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="principiante">Principiante</SelectItem>
                                <SelectItem value="intermedio">Intermedio</SelectItem>
                                <SelectItem value="avanzato">Avanzato</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>

                      <div className="space-y-2 pt-2">
                        <Label>Giorni Preferiti</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {DAYS_OF_WEEK.map((giorno) => (
                            <div key={giorno} className="flex items-center space-x-2">
                              <Checkbox
                                id={`giorno-${giorno}`}
                                checked={preferenzaGiorniArr.includes(giorno)}
                                onCheckedChange={() => handleToggleGiorno(giorno)}
                              />
                              <label htmlFor={`giorno-${giorno}`} className="text-sm font-medium">
                                {giorno}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1 pt-2">
                        <Label>Fascia Oraria Preferita</Label>
                        <Controller
                          name="preferenza_orario"
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleziona orario..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="mattina">Mattina</SelectItem>
                                <SelectItem value="pomeriggio">Pomeriggio</SelectItem>
                                <SelectItem value="sera">Sera</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>

                      <div className="space-y-1">
                        <Label>Note Aggiuntive</Label>
                        <Textarea {...register("note")} placeholder="Ulteriori informazioni o richieste particolari..." />
                      </div>

                      <div className="bg-stone-50 p-4 rounded-lg mt-4 border border-stone-200">
                        <div className="flex items-start space-x-3">
                          <Controller
                            name="consenso_privacy"
                            control={control}
                            render={({ field }) => (
                              <Checkbox
                                id="consenso_privacy"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="mt-1"
                              />
                            )}
                          />
                          <div className="space-y-1">
                            <label htmlFor="consenso_privacy" className="text-sm font-medium text-stone-900 leading-tight block">
                              Autorizzo il trattamento dei dati personali ai sensi del GDPR (Reg. UE 2016/679) *
                            </label>
                            {errors.consenso_privacy && <p className="text-red-500 text-xs font-semibold">{errors.consenso_privacy.message}</p>}
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* STEP 5: Riepilogo */}
                {step === 5 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 border-b pb-2 mb-4">
                      <FileText className="h-5 w-5 text-[#E8621A]" />
                      <h2 className="text-xl font-serif text-stone-900">Riepilogo Dati</h2>
                    </div>

                    <div className="space-y-4 text-sm font-sans text-stone-700">
                      <div className="bg-stone-50 p-3 rounded-lg border border-stone-100">
                        <h3 className="font-bold text-stone-900 mb-2">Anagrafica Allievo</h3>
                        <div className="grid grid-cols-2 gap-2">
                          <p>Nome: <span className="font-semibold">{watch("nome")}</span></p>
                          <p>Cognome: <span className="font-semibold">{watch("cognome")}</span></p>
                          <p>Data Nascita: <span className="font-semibold">{watch("data_nascita") ? format(new Date(watch("data_nascita")), 'dd/MM/yyyy', { locale: it }) : ''}</span></p>
                          <p>Codice Fiscale: <span className="font-semibold">{watch("codice_fiscale")}</span></p>
                          <p>Minorenne: <span className="font-semibold">{isMinorenne ? "Sì" : "No"}</span></p>
                        </div>
                      </div>

                      <div className="bg-stone-50 p-3 rounded-lg border border-stone-100">
                        <h3 className="font-bold text-stone-900 mb-2">Contatti</h3>
                        <div className="grid grid-cols-2 gap-2">
                          <p>Email: <span className="font-semibold">{watch("email")}</span></p>
                          <p>Telefono: <span className="font-semibold">{watch("telefono")}</span></p>
                          <p>Città: <span className="font-semibold">{watch("citta")} {watch("cap")}</span></p>
                        </div>
                      </div>

                      {isMinorenne && (
                        <div className="bg-stone-50 p-3 rounded-lg border border-stone-100">
                          <h3 className="font-bold text-stone-900 mb-2">Genitore/Tutore</h3>
                          <div className="grid grid-cols-2 gap-2">
                            <p>Nome: <span className="font-semibold">{watch("genitore_nome")} {watch("genitore_cognome")}</span></p>
                            <p>Email: <span className="font-semibold">{watch("genitore_email")}</span></p>
                            <p>Telefono: <span className="font-semibold">{watch("genitore_telefono")}</span></p>
                          </div>
                        </div>
                      )}

                      <div className="bg-stone-50 p-3 rounded-lg border border-stone-100">
                        <h3 className="font-bold text-stone-900 mb-2">Corso e Preferenze</h3>
                        <div className="grid grid-cols-2 gap-2">
                          <p>Corso: <span className="font-semibold">{watch("corso_interesse")}</span></p>
                          <p>Livello: <span className="font-semibold">{watch("livello_esperienza")}</span></p>
                          <p>Giorni: <span className="font-semibold">{watch("preferenza_giorni") || "Nessuna preferenza"}</span></p>
                          <p>Orario: <span className="font-semibold">{watch("preferenza_orario")}</span></p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex justify-between">
            {step > 1 ? (
              <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Indietro
              </Button>
            ) : (
              <div></div>
            )}

            {step < 5 ? (
              <Button
                onClick={handleNext}
                className="bg-[#E8621A] hover:bg-[#C94E0E] text-white"
              >
                Avanti
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="bg-[#E8621A] hover:bg-[#C94E0E] text-white"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                Invia Iscrizione
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
