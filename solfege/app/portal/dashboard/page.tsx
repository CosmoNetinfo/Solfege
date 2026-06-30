import { createClient as createServerClient } from "@/lib/supabase/server";
import { getProfile, getStudentDashboardData } from "@/lib/supabase/queries";
import { Calendar, Clock, Bell, GraduationCap, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export default async function PortalDashboard() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const profile = user ? await getProfile(supabase, user.id) : null;
  
  if (!profile?.student_id) {
    return <div className="p-8">Associazione allievo non trovata. Contatta la segreteria.</div>;
  }

  const { enrollments, upcomingLessons, pendingPayments } = await getStudentDashboardData(supabase, profile.student_id);
  const nextLesson = upcomingLessons[0];

  // Recupera gli avvisi della scuola da Supabase
  const { data: notices } = await supabase
    .from("school_notices" as any)
    .select("*")
    .eq("school_id", profile.school_id)
    .order("is_important", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(4) as any;

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-serif font-bold text-stone-900">
          Ciao, {profile?.first_name || "Studente"}!
        </h1>
        <p className="text-stone-500">Benvenuto nel tuo portale Solfège. Ecco cosa c'è in programma per te.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Prossima Lezione */}
        <Card className="md:col-span-2 border-none shadow-sm bg-orange text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <GraduationCap size={120} />
          </div>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Calendar className="h-5 w-5" /> Prossima Lezione
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {nextLesson ? (
              <>
                <div className="text-4xl font-bold">
                  {format(new Date(nextLesson.data_ora_inizio), "EEEE, HH:mm", { locale: it })}
                </div>
                <div className="flex flex-col gap-1 opacity-90">
                  <span className="font-medium">{nextLesson.courses?.name}</span>
                  <span className="text-sm flex items-center gap-1">
                    <Clock size={14} /> con {nextLesson.teachers?.first_name} {nextLesson.teachers?.last_name}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-xl opacity-80 py-4">Nessuna lezione programmata</div>
            )}
          </CardContent>
        </Card>

        {/* Notifiche / Avvisi */}
        <Card className="border-none shadow-sm flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-stone-900">
              <Bell className="h-5 w-5 text-orange" /> Avvisi & Comunicazioni
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 flex-1 overflow-y-auto max-h-[320px]">
            {pendingPayments.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Hai {pendingPayments.length} quota/e in sospeso. Vai in <strong>Pagamenti</strong>.</span>
              </div>
            )}
            
            {notices && notices.length > 0 ? (
              <div className="space-y-3">
                {notices.map((n: any) => (
                  <div key={n.id} className={`p-3 rounded-xl border ${
                    n.is_important 
                      ? 'bg-red-50/50 border-red-100 text-stone-900' 
                      : 'bg-stone-50/50 border-stone-100 text-stone-700'
                  } space-y-1`}>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`font-bold text-xs ${n.is_important ? 'text-red-700 font-serif' : 'text-stone-800'}`}>
                        {n.title}
                      </span>
                      {n.is_important && (
                        <span className="bg-red-100 text-red-800 text-[8px] font-bold px-1.5 py-0.25 rounded uppercase">
                          Importante
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-600 leading-normal whitespace-pre-line">
                      {n.content}
                    </p>
                    <p className="text-[9px] text-stone-400">
                      {format(new Date(n.created_at), "dd MMM, HH:mm", { locale: it })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              !pendingPayments.length && (
                <div className="text-sm text-stone-500 italic py-4">
                  Nessun nuovo avviso dalla bacheca.
                </div>
              )
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-stone-800">Le tue materie</h2>
          <div className="grid gap-4">
            {enrollments.length === 0 ? (
              <p className="text-stone-400 italic text-sm">Non risultano iscrizioni attive.</p>
            ) : (
              enrollments.map((enr) => (
                <div key={enr.id} className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-stone-100">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-orange/10 rounded-lg flex items-center justify-center text-orange">
                      <GraduationCap size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-stone-900">{enr.courses?.name}</p>
                      <p className="text-xs text-stone-500">Stato: <span className="capitalize">{enr.status}</span></p>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-orange uppercase tracking-wider">{enr.status === 'active' ? 'In corso' : enr.status}</div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-stone-800">Situazione Pagamenti</h2>
          {pendingPayments.length === 0 ? (
            <Card className="border-dashed border-2 bg-stone-50/50">
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
                  <CheckCircle2 size={24} />
                </div>
                <p className="font-bold text-stone-900">Sei in regola!</p>
                <p className="text-sm text-stone-500">Non risultano pagamenti in sospeso per questo mese.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-stone-100 border-l-4 border-l-red">
                  <div>
                    <p className="font-bold text-stone-900">€ {Number(p.amount).toFixed(2)}</p>
                    <p className="text-xs text-stone-500">Scadenza: {format(new Date(p.due_date), "dd MMM yyyy", { locale: it })}</p>
                  </div>
                  <Badge variant={p.status === 'in_ritardo' ? 'destructive' : 'secondary'}>
                    {p.status === 'in_ritardo' ? 'In Ritardo' : 'In Attesa'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
