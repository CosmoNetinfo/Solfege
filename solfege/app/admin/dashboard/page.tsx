import { redirect } from "next/navigation";
import { Users, GraduationCap, Banknote, CalendarCheck, Clock, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getKpiDashboard, getTodayLessons, getUpcomingPayments, getMonthlyIncomeData } from "@/lib/supabase/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IncomeChart } from "@/components/admin/dashboard-charts";

function formatTime(isoString: string) {
  return new Date(isoString).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

function getStatusBadge(status: string) {
  switch (status) {
    case "in_ritardo":
      return <Badge className="bg-red-light text-red border-0 text-xs">In ritardo</Badge>;
    case "in_attesa":
      return <Badge className="bg-amber-light text-amber border-0 text-xs">In attesa</Badge>;
    default:
      return <Badge className="bg-muted text-muted-foreground border-0 text-xs">{status}</Badge>;
  }
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/login");
  }

  const profile = await getProfile(supabase, user.id);
  if (!profile || !profile.school_id) {
    redirect("/");
  }

  // Tutte le query in parallelo per performance
  const [kpis, todayLessons, upcomingPayments, chartData] = await Promise.all([
    getKpiDashboard(supabase, profile.school_id),
    getTodayLessons(supabase, profile.school_id),
    getUpcomingPayments(supabase, profile.school_id),
    getMonthlyIncomeData(supabase, profile.school_id),
  ]);

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-4xl font-bold tracking-tight text-foreground">
          Dashboard
        </h2>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Studenti Attivi</CardTitle>
            <Users className="h-4 w-4 text-orange" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{kpis.totalStudents}</div>
            <p className="text-xs text-muted-foreground mt-1">Iscritti regolarmente</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Insegnanti Attivi</CardTitle>
            <GraduationCap className="h-4 w-4 text-orange" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{kpis.totalTeachers}</div>
            <p className="text-xs text-muted-foreground mt-1">Attualmente operativi</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Incassi Mensili</CardTitle>
            <Banknote className="h-4 w-4 text-green" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              €{kpis.monthlyIncome.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Totale pagato questo mese</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lezioni Oggi</CardTitle>
            <CalendarCheck className="h-4 w-4 text-orange" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{kpis.lessonsToday}</div>
            <p className="text-xs text-muted-foreground mt-1">Programmate per oggi</p>
          </CardContent>
        </Card>
      </div>

      {/* Grafico Incassi — dati reali da Supabase */}
      <div className="grid gap-4 lg:grid-cols-4">
        <IncomeChart data={chartData} />
      </div>

      {/* Lezioni di oggi (60%) + Pagamenti in scadenza (40%) */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Lezioni di oggi — 60% (3/5) */}
        <Card className="lg:col-span-3 border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-foreground flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange" />
              Lezioni di oggi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayLessons.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4">Nessuna lezione programmata per oggi.</p>
            ) : (
              <div className="space-y-3">
                {todayLessons.map((lesson: any) => (
                  <div key={lesson.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-mono font-medium text-orange w-24">
                        {formatTime(lesson.data_ora_inizio)} - {formatTime(lesson.data_ora_fine)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {lesson.courses?.name || "Corso"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {lesson.teachers?.first_name} {lesson.teachers?.last_name}
                          {lesson.rooms?.name && ` · ${lesson.rooms.name}`}
                        </p>
                      </div>
                    </div>
                    <Badge className={
                      lesson.status === 'completata' ? "bg-green-light text-green border-0 text-xs"
                      : lesson.status === 'cancellata' ? "bg-red-light text-red border-0 text-xs"
                      : "bg-orange-light text-orange border-0 text-xs"
                    }>
                      {lesson.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagamenti in scadenza — 40% (2/5) */}
        <Card className="lg:col-span-2 border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-foreground flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber" />
              Pagamenti in scadenza
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingPayments.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4">Nessun pagamento in scadenza.</p>
            ) : (
              <div className="space-y-3">
                {upcomingPayments.map((payment: any) => (
                  <div key={payment.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {payment.students?.first_name} {payment.students?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {payment.description || "Pagamento"} · Scad. {new Date(payment.due_date).toLocaleDateString("it-IT")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">
                        €{Number(payment.amount).toFixed(2)}
                      </span>
                      {getStatusBadge(payment.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
