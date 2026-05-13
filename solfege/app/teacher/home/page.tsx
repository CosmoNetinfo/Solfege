"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock, MapPin, UserRound, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function TeacherHomePage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState<any[]>([]);
  const [teacherName, setTeacherName] = useState("");
  const [stats, setStats] = useState({ hours: 0, studentsCount: 0 });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Recupera l'id insegnante collegato al profilo
    const { data: teacher } = await supabase
      .from("teachers")
      .select("id, first_name, last_name")
      .eq("profile_id", user.id)
      .single();

    if (!teacher) {
      setLoading(false);
      return;
    }

    setTeacherName(teacher.first_name);

    // Recupera lezioni di oggi per questo insegnante
    const today = new Date().toISOString().split("T")[0];
    
    // Recupera le compensations per il mese corrente per le ore lavorate
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const [
      { data: lessonsData },
      { data: compensationsData },
      { data: enrollmentsData }
    ] = await Promise.all([
      supabase
        .from("lessons")
        .select(`
          id,
          data_ora_inizio,
          data_ora_fine,
          status,
          courses (name, color:colore_calendario),
          rooms (name)
        `)
        .eq("teacher_id", teacher.id)
        .gte("data_ora_inizio", today + "T00:00:00")
        .lte("data_ora_inizio", today + "T23:59:59")
        .order("data_ora_inizio"),
      supabase
        .from("teacher_compensations")
        .select("hours_individual, hours_group")
        .eq("teacher_id", teacher.id)
        .eq("month", currentMonth)
        .eq("year", currentYear)
        .single(),
      supabase
        .from("enrollments")
        .select("student_id")
        .eq("teacher_id", teacher.id)
        .eq("status", "active")
    ]);

    const totalHours = compensationsData 
      ? Number(compensationsData.hours_individual) + Number(compensationsData.hours_group) 
      : 0;

    const uniqueStudents = new Set((enrollmentsData || []).map(e => e.student_id)).size;

    setStats({
      hours: totalHours,
      studentsCount: uniqueStudents
    });
    setLessons(lessonsData || []);
    setLoading(false);
  }

  const todayStr = format(new Date(), "EEEE d MMMM", { locale: it });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-medium text-[#7A736C]">Ciao, {teacherName} 👋</h2>
        <p className="text-2xl font-bold text-[#1A1714] capitalize">{todayStr}</p>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#1A1714]">Lezioni di oggi</h3>
          <Badge variant="outline" className="text-[#E8621A] border-[#E8621A]/20 bg-[#FDF0E8]">
            {lessons.length} totali
          </Badge>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 bg-stone-100 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : lessons.length === 0 ? (
          <Card className="border-dashed border-2 bg-transparent">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <CalendarIcon className="h-10 w-10 text-stone-300 mb-3" />
              <p className="text-[#7A736C] font-medium">Nessuna lezione in programma per oggi</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {lessons.map((lesson) => (
              <Link key={lesson.id} href={`/teacher/attendance/${lesson.id}`}>
                <Card className="overflow-hidden hover:shadow-md transition-shadow active:scale-[0.98] cursor-pointer border-[#E8E4E0]">
                  <CardContent className="p-0">
                    <div className="flex">
                      <div className="w-2" style={{ backgroundColor: lesson.courses?.color || "#E8621A" }} />
                      <div className="flex-1 p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="space-y-0.5">
                            <h4 className="font-bold text-[#1A1714] text-lg">{lesson.courses?.name}</h4>
                            <div className="flex items-center gap-1.5 text-sm text-[#7A736C]">
                              <Clock className="h-3.5 w-3.5" />
                              <span>
                                {format(new Date(lesson.data_ora_inizio), "HH:mm")} - {format(new Date(lesson.data_ora_fine), "HH:mm")}
                              </span>
                            </div>
                          </div>
                          <Badge className="bg-[#E8F5EE] text-[#1A7A4A] border-none text-[10px] uppercase tracking-wider">
                            {lesson.status}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between border-t border-[#FAFAF9] pt-3">
                          <div className="flex items-center gap-2 text-sm text-[#7A736C]">
                            <MapPin className="h-4 w-4" />
                            <span>{lesson.rooms?.name || "Aula non assegnata"}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[#E8621A] font-semibold text-sm">
                            Presenze <ChevronRight className="h-4 w-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white rounded-2xl p-5 border border-[#E8E4E0]">
        <h3 className="text-lg font-bold text-[#1A1714] mb-4">Statistiche Mensili</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-[#7A736C] uppercase font-bold tracking-wider">Ore Lavorate</p>
            <p className="text-2xl font-bold text-[#1A1714]">{stats.hours.toFixed(1)} h</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-[#7A736C] uppercase font-bold tracking-wider">Allievi Attivi</p>
            <p className="text-2xl font-bold text-[#1A1714]">{stats.studentsCount}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
