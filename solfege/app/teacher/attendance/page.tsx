"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, CheckCircle2, ChevronRight } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { it } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function TeacherAttendancePage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Recupera l'id insegnante
    const { data: teacher } = await supabase
      .from("teachers")
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle();

    if (!teacher) {
      setLoading(false);
      return;
    }

    // Carica le lezioni degli ultimi 7 giorni + oggi
    const lastWeek = subDays(new Date(), 7);
    
    const { data: lessonsData } = await supabase
      .from("lessons")
      .select(`
        id,
        data_ora_inizio,
        data_ora_fine,
        status,
        courses (name, colore_calendario),
        rooms (name)
      `)
      .eq("teacher_id", teacher.id)
      .gte("data_ora_inizio", lastWeek.toISOString())
      .order("data_ora_inizio", { ascending: false });

    setLessons(lessonsData || []);
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1A1714]">Presenze</h2>
        <p className="text-[#7A736C]">Storico lezioni e registro presenze</p>
      </div>

      <div className="space-y-4">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="h-32 bg-stone-100 animate-pulse rounded-xl" />)
        ) : lessons.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-[#E8E4E0]">
            <Calendar className="h-12 w-12 text-stone-200 mx-auto mb-3" />
            <p className="text-[#7A736C]">Nessuna lezione trovata negli ultimi 7 giorni</p>
          </div>
        ) : (
          lessons.map((lesson) => (
            <Link key={lesson.id} href={`/teacher/attendance/${lesson.id}`}>
              <Card className="border-[#E8E4E0] hover:shadow-md transition-all active:scale-[0.98] mb-3">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: lesson.courses?.colore_calendario || "#E8621A" }} 
                        />
                        <h4 className="font-bold text-[#1A1714]">{lesson.courses?.name}</h4>
                      </div>
                      
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs text-[#7A736C]">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{format(new Date(lesson.data_ora_inizio), "EEEE d MMMM", { locale: it })}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#7A736C]">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{format(new Date(lesson.data_ora_inizio), "HH:mm")} - {format(new Date(lesson.data_ora_fine), "HH:mm")}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#7A736C]">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{lesson.rooms?.name || "Aula non assegnata"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <Badge 
                        variant="secondary" 
                        className={`capitalize text-[10px] ${
                          lesson.status === 'completata' ? 'bg-[#E8F5EE] text-[#1A7A4A]' : 'bg-stone-100 text-[#7A736C]'
                        }`}
                      >
                        {lesson.status}
                      </Badge>
                      <ChevronRight className="h-5 w-5 text-stone-300" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
