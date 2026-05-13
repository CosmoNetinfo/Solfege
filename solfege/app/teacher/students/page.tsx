"use client";

import { useState, useEffect } from "react";
import { Search, UserRound, Phone, MessageCircle, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function TeacherStudentsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState("");

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

    // Recupera gli studenti iscritti ai corsi di questo insegnante
    const { data: studentsData } = await supabase
      .from("students")
      .select(`
        id,
        first_name,
        last_name,
        phone,
        enrollments!inner (
          id,
          course_id,
          courses (name)
        )
      `)
      .eq("enrollments.teacher_id", teacher.id)
      .eq("active", true);

    setStudents(studentsData || []);
    setLoading(false);
  }

  const filteredStudents = students.filter(s => 
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1A1714]">I Miei Allievi</h2>
        <p className="text-[#7A736C]">Gestisci i contatti e le schede dei tuoi studenti</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-[#7A736C]" />
        <Input 
          placeholder="Cerca allievo..." 
          className="pl-10 h-12 rounded-xl border-[#E8E4E0] bg-white shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="h-24 bg-stone-100 animate-pulse rounded-xl" />)
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-10">
            <UserRound className="h-12 w-12 text-stone-200 mx-auto mb-3" />
            <p className="text-[#7A736C]">Nessun allievo trovato</p>
          </div>
        ) : (
          filteredStudents.map((student) => (
            <Card key={student.id} className="border-[#E8E4E0] hover:shadow-sm transition-shadow overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-[#FDF0E8] flex items-center justify-center text-[#E8621A] font-bold text-lg">
                      {student.first_name[0]}{student.last_name[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-[#1A1714]">{student.last_name} {student.first_name}</h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {student.enrollments.map((e: any) => (
                          <Badge key={e.id} variant="secondary" className="bg-stone-100 text-[#7A736C] border-none text-[10px]">
                            {e.courses.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <a 
                    href={`tel:${student.phone}`} 
                    className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg bg-[#FAFAF9] border border-[#E8E4E0] text-[#1A1714] font-medium text-sm"
                  >
                    <Phone className="h-4 w-4" /> Chiama
                  </a>
                  <a 
                    href={`https://wa.me/${student.phone}`} 
                    target="_blank"
                    className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg bg-[#E8F5EE] border border-[#1A7A4A]/10 text-[#1A7A4A] font-medium text-sm"
                  >
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </a>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
