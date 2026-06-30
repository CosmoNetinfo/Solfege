import { createClient as createServerClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/queries";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, Calendar, FileText, MapPin, ShieldAlert, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export default async function PortalProfiloPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getProfile(supabase, user.id);
  if (!profile?.student_id) {
    return <div className="p-8">Associazione allievo non trovata. Contatta la segreteria.</div>;
  }

  // Recupera i dati anagrafici dettagliati dell'allievo da Supabase
  const { data: student, error } = await (supabase
    .from("students" as any)
    .select("*")
    .eq("id", profile.student_id)
    .maybeSingle() as any);

  if (error) {
    console.error("Errore caricamento profilo allievo:", error.message);
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return format(new Date(dateStr), "dd MMMM yyyy", { locale: it });
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto font-sans">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-stone-900">Mio Profilo</h1>
        <p className="text-sm text-stone-500">Gestisci e verifica la correttezza dei tuoi dati anagrafici e di contatto.</p>
      </header>

      {student ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card riassuntiva */}
          <Card className="border-none shadow-sm md:col-span-1 bg-stone-950 text-white flex flex-col justify-between p-6">
            <div className="space-y-4">
              <div className="h-16 w-16 bg-[#E8621A]/20 text-[#E8621A] rounded-full flex items-center justify-center font-serif text-2xl font-bold">
                {student.nome.charAt(0)}{student.cognome.charAt(0)}
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold font-serif">{student.nome} {student.cognome}</h2>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider border-orange/40 text-orange">
                    {student.is_minorenne ? "Minorenne" : "Maggiorenne"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="text-xs text-stone-400 mt-8 pt-4 border-t border-stone-800 space-y-1">
              <p>Stato Allievo: <span className="text-green-500 font-semibold flex items-center gap-1 mt-1"><ShieldCheck size={14} /> Attivo nel registro</span></p>
            </div>
          </Card>

          {/* Dettagli anagrafici */}
          <div className="md:col-span-2 space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <User className="h-4.5 w-4.5 text-orange" /> Dati Anagrafici
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3.5 text-sm">
                <div className="grid grid-cols-3 gap-2 border-b border-stone-50 pb-2">
                  <span className="text-stone-400 font-medium">Codice Fiscale</span>
                  <span className="col-span-2 font-mono text-stone-900 font-bold">{student.codice_fiscale || "-"}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 border-b border-stone-50 pb-2">
                  <span className="text-stone-400 font-medium">Data di Nascita</span>
                  <span className="col-span-2 text-stone-900">{formatDate(student.data_nascita)}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 border-b border-stone-50 pb-2">
                  <span className="text-stone-400 font-medium">Indirizzo</span>
                  <span className="col-span-2 text-stone-900">
                    {student.indirizzo ? `${student.indirizzo}, ${student.cap || ""} ${student.citta || ""}` : "-"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 border-b border-stone-50 pb-2">
                  <span className="text-stone-400 font-medium">Email</span>
                  <span className="col-span-2 text-stone-900 flex items-center gap-1.5">
                    <Mail size={14} className="text-stone-400" /> {student.email || "-"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 pb-1">
                  <span className="text-stone-400 font-medium">Telefono</span>
                  <span className="col-span-2 text-stone-900 flex items-center gap-1.5">
                    <Phone size={14} className="text-stone-400" /> {student.telefono || "-"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Dati Genitore se minorenne */}
            {student.is_minorenne && (
              <Card className="border-none shadow-sm border-l-4 border-l-[#E8621A]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold text-stone-900 flex items-center gap-2">
                    <ShieldAlert className="h-4.5 w-4.5 text-orange" /> Referente / Genitore
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3.5 text-sm">
                  <div className="grid grid-cols-3 gap-2 border-b border-stone-50 pb-2">
                    <span className="text-stone-400 font-medium">Genitore</span>
                    <span className="col-span-2 text-stone-900 font-semibold">{student.genitore_nome} {student.genitore_cognome}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 border-b border-stone-50 pb-2">
                    <span className="text-stone-400 font-medium">Codice Fiscale</span>
                    <span className="col-span-2 font-mono text-stone-900 font-bold">{student.genitore_codice_fiscale || "-"}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 border-b border-stone-50 pb-2">
                    <span className="text-stone-400 font-medium">Email Genitore</span>
                    <span className="col-span-2 text-stone-900 flex items-center gap-1.5">
                      <Mail size={14} className="text-stone-400" /> {student.genitore_email || "-"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pb-1">
                    <span className="text-stone-400 font-medium">Telefono Genitore</span>
                    <span className="col-span-2 text-stone-900 flex items-center gap-1.5">
                      <Phone size={14} className="text-stone-400" /> {student.genitore_telefono || "-"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-stone-400 italic text-sm">
          Impossibile caricare il profilo dettagliato. Contatta l'amministratore.
        </div>
      )}
    </div>
  );
}
