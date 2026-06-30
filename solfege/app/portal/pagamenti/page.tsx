import { createClient as createServerClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/queries";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, Clock, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export default async function PortalPagamentiPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getProfile(supabase, user.id);
  if (!profile?.student_id) {
    return <div className="p-8">Associazione allievo non trovata. Contatta la segreteria.</div>;
  }

  // Recupera tutti i pagamenti dell'allievo ordinati per data di scadenza
  const { data: payments, error } = await supabase
    .from("payments" as any)
    .select("*, courses(name)")
    .eq("student_id", profile.student_id)
    .order("due_date", { ascending: false });

  if (error) {
    console.error("Errore caricamento pagamenti:", error.message);
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pagato":
        return (
          <Badge className="bg-green-100 text-green-800 border-none font-semibold flex items-center gap-1">
            <CheckCircle2 size={12} /> Pagato
          </Badge>
        );
      case "scaduto":
        return (
          <Badge variant="destructive" className="font-semibold flex items-center gap-1">
            <AlertTriangle size={12} /> Scaduto
          </Badge>
        );
      case "annullato":
        return (
          <Badge variant="secondary" className="font-semibold">
            Annullato
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-100 text-amber-800 border-none font-semibold flex items-center gap-1">
            <Clock size={12} /> In Attesa
          </Badge>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "dd MMMM yyyy", { locale: it });
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto font-sans">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-stone-900">Situazione Pagamenti</h1>
        <p className="text-sm text-stone-500">Controlla lo stato delle tue quote associative e le ricevute di pagamento.</p>
      </header>

      <div className="space-y-4">
        {payments && payments.length > 0 ? (
          payments.map((p: any) => (
            <Card key={p.id} className="border-none shadow-sm overflow-hidden bg-white">
              <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl shrink-0 ${
                    p.status === 'pagato' ? 'bg-green-50 text-green-600' : p.status === 'scaduto' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    <CreditCard size={24} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-stone-900">€ {Number(p.importo).toFixed(2)}</span>
                      {p.courses?.name && (
                        <span className="text-xs text-stone-500 font-medium truncate max-w-[150px] sm:max-w-xs">
                          ({p.courses.name})
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-stone-500 space-y-0.5">
                      <p>Scadenza: <span className="font-semibold">{formatDate(p.data_scadenza)}</span></p>
                      {p.status === 'pagato' && p.data_pagamento && (
                        <p className="text-green-700">
                          Saldato il {formatDate(p.data_pagamento)} {p.metodo && `tramite ${p.metodo}`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 border-t sm:border-none pt-3 sm:pt-0">
                  {getStatusBadge(p.stato || p.status)}
                  {p.numero_ricevuta && (
                    <span className="text-xs text-stone-400 font-mono">
                      Ricevuta: {p.numero_ricevuta}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 text-stone-400 italic text-sm">
            Nessun pagamento registrato a tuo nome.
          </div>
        )}
      </div>
    </div>
  );
}
