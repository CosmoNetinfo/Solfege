"use client";

import { useState, useEffect } from "react";
import { Users, GraduationCap, Banknote, CalendarCheck, Clock, AlertCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
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

export default function AdminDashboardPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<any>(null);
  const [todayLessons, setTodayLessons] = useState<any[]>([]);
  const [upcomingPayments, setUpcomingPayments] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const { isDesktop } = await import("@/lib/is-desktop");
        
        if (isDesktop()) {
          // Carica dati direttamente da SQLite locale
          const Database = (await import("@tauri-apps/plugin-sql")).default;
          const db = await Database.load("sqlite:solfege.db");

          // 1. Conta Studenti Attivi
          const students = await db.select<any[]>("SELECT COUNT(*) as count FROM students WHERE active = 1");
          const totalStudents = students[0]?.count || 0;

          // 2. Conta Insegnanti Attivi
          const teachers = await db.select<any[]>("SELECT COUNT(*) as count FROM teachers WHERE active = 1");
          const totalTeachers = teachers[0]?.count || 0;

          // 3. Calcola Incassi Mensili (mese corrente)
          const now = new Date();
          const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
          const payments = await db.select<any[]>(
            "SELECT SUM(importo) as sum FROM payments WHERE stato = 'pagato' AND data_pagamento >= ?",
            [firstDayOfMonth]
          );
          const monthlyIncome = payments[0]?.sum || 0;

          // 4. Conta Lezioni Oggi
          const todayStr = now.toISOString().split('T')[0];
          const lessonsTodayCount = await db.select<any[]>(
            "SELECT COUNT(*) as count FROM lessons WHERE data_ora_inizio >= ? AND data_ora_inizio <= ?",
            [todayStr + 'T00:00:00', todayStr + 'T23:59:59']
          );
          const lessonsToday = lessonsTodayCount[0]?.count || 0;

          setKpis({
            totalStudents,
            totalTeachers,
            monthlyIncome,
            lessonsToday
          });

          // 5. Lezioni di oggi dettagliate (JOIN)
          const lessonsRes = await db.select<any[]>(
            `SELECT l.id, l.data_ora_inizio, l.data_ora_fine, l.stato as status, 
                    c.nome as course_name, t.nome as teacher_first_name, t.cognome as teacher_last_name
             FROM lessons l
             LEFT JOIN courses c ON l.course_id = c.id
             LEFT JOIN teachers t ON l.teacher_id = t.id
             WHERE l.data_ora_inizio >= ? AND l.data_ora_inizio <= ?
             ORDER BY l.data_ora_inizio ASC LIMIT 10`,
            [todayStr + 'T00:00:00', todayStr + 'T23:59:59']
          );
          setTodayLessons(lessonsRes.map(l => ({
            id: l.id,
            data_ora_inizio: l.data_ora_inizio,
            data_ora_fine: l.data_ora_fine,
            status: l.status,
            courses: { name: l.course_name },
            teachers: { first_name: l.teacher_first_name, last_name: l.teacher_last_name }
          })));

          // 6. Pagamenti in scadenza dettagliati (JOIN)
          const paymentsRes = await db.select<any[]>(
            `SELECT p.id, p.importo as amount, p.data_scadenza as due_date, p.stato as status, p.note as description,
                    s.nome as student_first_name, s.cognome as student_last_name
             FROM payments p
             LEFT JOIN students s ON p.student_id = s.id
             WHERE p.stato IN ('in_attesa', 'in_ritardo')
             ORDER BY p.data_scadenza ASC LIMIT 8`
          );
          setUpcomingPayments(paymentsRes.map(p => ({
            id: p.id,
            amount: p.amount,
            due_date: p.due_date,
            status: p.status,
            description: p.description,
            students: { first_name: p.student_first_name, last_name: p.student_last_name }
          })));

          // 7. Dati Grafico Mensile (Ultimi 6 mesi)
          const chartRes = await db.select<any[]>(
            `SELECT strftime('%m', data_pagamento) as month, SUM(importo) as total 
             FROM payments 
             WHERE stato = 'pagato' AND data_pagamento >= date('now', '-6 month')
             GROUP BY month ORDER BY data_pagamento ASC`
          );
          const monthsMap: Record<string, string> = {
            "01": "Gen", "02": "Feb", "03": "Mar", "04": "Apr", "05": "Mag", "06": "Giu",
            "07": "Lug", "08": "Ago", "09": "Set", "10": "Ott", "11": "Nov", "12": "Dic"
          };
          setChartData(chartRes.map(c => ({
            name: monthsMap[c.month] || c.month,
            totale: c.total || 0
          })));

        } else {
          // Web flow (Supabase)
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const profile = await getProfile(supabase, user.id);
          if (!profile || !profile.school_id) return;

          const [kpiRes, lessonsRes, paymentsRes, incomeRes] = await Promise.all([
            getKpiDashboard(supabase, profile.school_id),
            getTodayLessons(supabase, profile.school_id),
            getUpcomingPayments(supabase, profile.school_id),
            getMonthlyIncomeData(supabase, profile.school_id),
          ]);

          setKpis(kpiRes);
          setTodayLessons(lessonsRes || []);
          setUpcomingPayments(paymentsRes || []);
          setChartData(incomeRes || []);
        }
      } catch (err) {
        console.error("Errore caricamento dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 min-h-screen flex items-center justify-center bg-[#FAFAF9]">
        <div className="text-stone-400 font-serif text-lg flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-orange" />
          Caricamento dashboard...
        </div>
      </div>
    );
  }

  if (!kpis) {
    return (
      <div className="flex-1 p-8 text-center text-muted-foreground">
        Nessun dato disponibile. Assicurati che l'account sia configurato correttamente.
      </div>
    );
  }

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
