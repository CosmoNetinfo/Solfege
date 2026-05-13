"use client";

import { useState, useEffect } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  BookOpen, 
  Download, 
  Calendar as CalendarIcon,
  ChevronRight,
  PieChart as PieChartIcon,
  Table as TableIcon
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from "recharts";
import { createClient } from "@/lib/supabase/client";
import { 
  getRevenueHistory, 
  getStudentsDistribution, 
  getTeacherReport 
} from "@/lib/supabase/queries";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function StatsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [distributionData, setDistributionData] = useState<any[]>([]);
  const [teacherData, setTeacherData] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("school_id")
      .eq("id", user.id)
      .single();
      
    if (!profile?.school_id) return;
    
    const now = new Date();
    const [rev, dist, teach] = await Promise.all([
      getRevenueHistory(supabase, profile.school_id, now.getFullYear()),
      getStudentsDistribution(supabase, profile.school_id),
      getTeacherReport(supabase, profile.school_id, now.getMonth(), now.getFullYear())
    ]);
    
    setRevenueData(rev);
    setDistributionData(dist);
    setTeacherData(teach);
    setLoading(false);
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-4xl font-bold tracking-tight text-foreground">Analisi & Reporting</h2>
          <p className="text-muted-foreground mt-1">Monitora la crescita e le performance della tua scuola</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-border text-muted-foreground">
            <Download className="mr-2 h-4 w-4" /> Esporta Report
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-stone-100 border border-border">
          <TabsTrigger value="overview">Panoramica</TabsTrigger>
          <TabsTrigger value="financial">Finanziario</TabsTrigger>
          <TabsTrigger value="didactic">Didattica</TabsTrigger>
          <TabsTrigger value="teachers">Insegnanti</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Chart: Revenue Growth */}
            <Card className="col-span-4 border-border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange" />
                  Andamento Incassi ({new Date().getFullYear()})
                </CardTitle>
                <CardDescription>Totale mensile delle ricevute saldate</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorTotale" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E8621A" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#E8621A" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E4E0" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#7A736C', fontSize: 12 }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#7A736C', fontSize: 12 }}
                      tickFormatter={(value) => `€${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #E8E4E0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                      formatter={(value: any) => [`€ ${value.toFixed(2)}`, 'Incasso']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="totale" 
                      stroke="#E8621A" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorTotale)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Chart: Students Distribution */}
            <Card className="col-span-3 border-border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-orange" />
                  Distribuzione Allievi
                </CardTitle>
                <CardDescription>Iscritti attivi per corso</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px] flex flex-col items-center">
                <ResponsiveContainer width="100%" height={250} minWidth={0}>
                  <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-full mt-4 space-y-2 max-h-[100px] overflow-y-auto pr-2">
                  {distributionData.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-muted-foreground">{item.name}</span>
                      </div>
                      <span className="font-bold text-foreground">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Teacher Hours Table */}
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TableIcon className="h-5 w-5 text-orange" />
                  Report Docenti
                </CardTitle>
                <CardDescription>Riepilogo ore lavorate e compensi maturati nel mese corrente</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                Vedi Dettagli <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground font-semibold">Insegnante</TableHead>
                    <TableHead className="text-muted-foreground font-semibold text-center">Ore Totali</TableHead>
                    <TableHead className="text-muted-foreground font-semibold text-center">Lezioni Svolte</TableHead>
                    <TableHead className="text-right text-muted-foreground font-semibold">Compensi Maturati</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8">Caricamento...</TableCell></TableRow>
                  ) : teacherData.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8">Nessun dato disponibile per il periodo selezionato.</TableCell></TableRow>
                  ) : (
                    teacherData.map((t, i) => (
                      <TableRow key={i} className="border-border hover:bg-stone-50/50">
                        <TableCell className="font-medium">{t.name}</TableCell>
                        <TableCell className="text-center">{t.hours.toFixed(1)} h</TableCell>
                        <TableCell className="text-center">{Math.ceil(t.hours)}</TableCell>
                        <TableCell className="text-right font-bold text-orange">€ {t.earnings.toFixed(2)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
