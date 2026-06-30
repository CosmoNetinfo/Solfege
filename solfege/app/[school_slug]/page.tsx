import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Calendar, Mail, Phone, MapPin, ExternalLink, ShieldAlert, AlertTriangle } from "lucide-react";
import Image from "next/image";

export default async function PublicSchoolPage({
  params,
}: {
  params: Promise<{ school_slug: string }>;
}) {
  const { school_slug } = await params;
  const supabase = createAdminClient();

  // 1. Trova la scuola tramite lo slug
  const { data: school, error: schoolError } = await (supabase
    .from("schools" as any)
    .select("*")
    .eq("slug", school_slug)
    .maybeSingle() as any);

  if (schoolError || !school) {
    notFound();
  }

  // 2. Carica gli avvisi pubblici della scuola
  const { data: notices } = await supabase
    .from("school_notices" as any)
    .select("*")
    .eq("school_id", school.id)
    .order("is_important", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(10) as any;

  // 3. Carica le variazioni orari recenti (lezioni annullate o recuperi dell'ultima settimana e future)
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: variations } = await supabase
    .from("lessons" as any)
    .select("*, courses(name), teachers(first_name, last_name)")
    .eq("school_id", school.id)
    .in("status", ["annullata", "recupero"])
    .gte("data_ora_inizio", oneWeekAgo)
    .order("data_ora_inizio", { ascending: true }) as any;

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "dd MMMM yyyy", { locale: it });
  };

  const formatTime = (dateStr: string) => {
    return format(new Date(dateStr), "HH:mm", { locale: it });
  };

  return (
    <div className="min-h-screen bg-stone-50 font-sans pb-12">
      {/* Header Scuola */}
      <header className="bg-white border-b border-stone-200 py-6 px-6 shadow-sm">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
            {school.logo_url ? (
              <Image
                src={school.logo_url}
                alt={school.name}
                width={120}
                height={50}
                className="h-12 w-auto object-contain"
                priority
              />
            ) : (
              <div className="h-12 w-12 bg-orange/10 text-orange rounded-full flex items-center justify-center font-serif text-2xl font-bold">
                {school.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-serif font-bold text-stone-900">{school.name}</h1>
              <p className="text-xs text-stone-400 uppercase tracking-widest font-bold mt-0.5">Bacheca Pubblica Informativa</p>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end gap-1.5 text-xs text-stone-500">
            {school.address && (
              <span className="flex items-center gap-1.5"><MapPin size={13} className="text-orange" /> {school.address}</span>
            )}
            <div className="flex gap-4">
              {school.phone && (
                <span className="flex items-center gap-1"><Phone size={13} className="text-orange" /> {school.phone}</span>
              )}
              {school.email && (
                <span className="flex items-center gap-1"><Mail size={13} className="text-orange" /> {school.email}</span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-4xl mx-auto px-6 mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Avvisi e Comunicazioni */}
        <section className="md:col-span-2 space-y-4">
          <h2 className="text-lg font-serif font-bold text-stone-950 flex items-center gap-2 border-b pb-2 border-stone-200">
            <Bell className="text-orange h-5 w-5" /> Avvisi per gli Allievi
          </h2>

          {notices && notices.length > 0 ? (
            <div className="space-y-4">
              {notices.map((n: any) => (
                <Card key={n.id} className={`border shadow-sm overflow-hidden bg-white ${
                  n.is_important ? 'border-l-4 border-l-red-600' : 'border-stone-100'
                }`}>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex justify-between items-start gap-3">
                      <h3 className={`font-bold text-base ${n.is_important ? 'text-red-700 font-serif' : 'text-stone-900'}`}>
                        {n.title}
                      </h3>
                      {n.is_important && (
                        <Badge variant="destructive" className="text-[9px] uppercase font-bold tracking-wider">
                          Importante
                        </Badge>
                      )}
                    </div>
                    <p className="text-stone-600 text-sm whitespace-pre-line leading-relaxed">{n.content}</p>
                    <div className="text-[10px] text-stone-400 pt-1">
                      Pubblicato il {formatDate(n.created_at)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-stone-400 italic text-sm bg-white rounded-2xl border border-stone-100 shadow-sm">
              Nessuna comunicazione attiva in bacheca.
            </div>
          )}
        </section>

        {/* Variazioni Orari */}
        <section className="space-y-4">
          <h2 className="text-lg font-serif font-bold text-stone-950 flex items-center gap-2 border-b pb-2 border-stone-200">
            <Calendar className="text-orange h-5 w-5" /> Variazioni Lezioni
          </h2>

          {variations && variations.length > 0 ? (
            <div className="space-y-3">
              {variations.map((v: any) => (
                <Card key={v.id} className={`border border-stone-100 shadow-sm overflow-hidden bg-white ${
                  v.status === 'annullata' ? 'border-l-4 border-l-stone-400' : 'border-l-4 border-l-amber-500'
                }`}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-stone-900 text-xs block truncate max-w-[130px]">
                        {v.courses?.name}
                      </span>
                      <Badge variant={v.status === 'annullata' ? 'secondary' : 'warning' as any} className="text-[8px] h-4 uppercase font-bold">
                        {v.status === 'annullata' ? 'Annullata' : 'Recupero'}
                      </Badge>
                    </div>

                    <div className="text-xs text-stone-500 space-y-0.5">
                      <p className="font-semibold text-stone-700">{formatDate(v.data_ora_inizio)}</p>
                      <p>Orario: {formatTime(v.data_ora_inizio)} - {formatTime(v.data_ora_fine)}</p>
                      <p className="text-[10px]">Docente: {v.teachers?.first_name} {v.teachers?.last_name}</p>
                    </div>

                    {v.note && (
                      <div className="text-[10px] bg-stone-50 p-2 rounded text-stone-600 italic mt-1 border border-stone-100">
                        {v.note}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-stone-400 italic text-xs bg-white rounded-2xl border border-stone-100 shadow-sm">
              Nessuna variazione recente o programmata.
            </div>
          )}
        </section>
      </main>

      {/* Footer / Quick Links */}
      <footer className="max-w-4xl mx-auto px-6 mt-12 pt-6 border-t border-stone-200 text-center space-y-6">
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 text-sm font-medium">
          <Link href={`/${school_slug}/iscriviti`} className="px-6 py-2.5 bg-orange text-white rounded-xl hover:bg-[#C94E0E] shadow-sm transition-colors flex items-center gap-1.5">
            Modulo Iscrizioni Online <ExternalLink size={14} />
          </Link>
          <Link href="/login" className="px-6 py-2.5 bg-white border border-stone-200 text-stone-700 rounded-xl hover:bg-stone-50 shadow-sm transition-colors">
            Accedi al Portale Allievi Privato
          </Link>
        </div>
        <p className="text-xs text-stone-400">Solfège © 2026 · CosmoNet.info</p>
      </footer>
    </div>
  );
}
