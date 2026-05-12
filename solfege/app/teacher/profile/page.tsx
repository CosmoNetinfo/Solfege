"use client";

import { useState, useEffect } from "react";
import { 
  UserRound, 
  Mail, 
  Phone, 
  FileText, 
  LogOut, 
  Settings, 
  ChevronRight,
  TrendingUp,
  Clock
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function TeacherProfilePage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [teacher, setTeacher] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: teacherData } = await supabase
      .from("teachers")
      .select("*")
      .eq("profile_id", user.id)
      .single();

    setTeacher(teacherData);
    setLoading(false);
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (loading) {
    return <div className="h-screen bg-[#FAFAF9]" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center py-6">
        <div className="h-24 w-24 rounded-full bg-[#FDF0E8] border-4 border-white shadow-sm flex items-center justify-center text-[#E8621A] text-3xl font-bold mb-4">
          {teacher?.first_name?.[0]}{teacher?.last_name?.[0]}
        </div>
        <h2 className="text-2xl font-bold text-[#1A1714]">{teacher?.first_name} {teacher?.last_name}</h2>
        <p className="text-[#7A736C]">Insegnante di {teacher?.specializzazioni?.join(", ")}</p>
      </div>

      <Card className="border-[#E8E4E0] overflow-hidden">
        <CardHeader className="bg-[#FAFAF9] pb-3">
          <CardTitle className="text-sm font-bold text-[#1A1714] uppercase tracking-wider">I Tuoi Compensi</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#E8F5EE] rounded-lg">
                <TrendingUp className="h-5 w-5 text-[#1A7A4A]" />
              </div>
              <div>
                <p className="text-xs text-[#7A736C] font-medium">Mese Corrente</p>
                <p className="text-xl font-bold text-[#1A1714]">€ 490.00</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="text-[#7A736C]">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          <Separator className="bg-[#FAFAF9]" />
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#FDF0E8] rounded-lg">
                <Clock className="h-5 w-5 text-[#E8621A]" />
              </div>
              <div>
                <p className="text-xs text-[#7A736C] font-medium">Ore Totali</p>
                <p className="text-xl font-bold text-[#1A1714]">24.5 h</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h3 className="text-xs font-bold text-[#7A736C] uppercase tracking-wider px-1">Informazioni</h3>
        <Card className="border-[#E8E4E0]">
          <CardContent className="p-0 divide-y divide-[#FAFAF9]">
            <div className="p-4 flex items-center gap-3">
              <Mail className="h-5 w-5 text-[#7A736C]" />
              <div className="flex-1">
                <p className="text-xs text-[#7A736C]">Email</p>
                <p className="text-sm font-medium text-[#1A1714]">{teacher?.email}</p>
              </div>
            </div>
            <div className="p-4 flex items-center gap-3">
              <Phone className="h-5 w-5 text-[#7A736C]" />
              <div className="flex-1">
                <p className="text-xs text-[#7A736C]">Telefono</p>
                <p className="text-sm font-medium text-[#1A1714]">{teacher?.phone}</p>
              </div>
            </div>
            <div className="p-4 flex items-center gap-3">
              <FileText className="h-5 w-5 text-[#7A736C]" />
              <div className="flex-1">
                <p className="text-xs text-[#7A736C]">Codice Fiscale</p>
                <p className="text-sm font-medium text-[#1A1714] uppercase">{teacher?.fiscal_code}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3 pt-4">
        <Button variant="outline" className="w-full h-12 rounded-xl border-[#E8E4E0] text-[#1A1714] justify-start px-4">
          <Settings className="mr-3 h-5 w-5 text-[#7A736C]" /> Impostazioni Profilo
        </Button>
        <Button 
          variant="ghost" 
          className="w-full h-12 rounded-xl text-[#C0392B] hover:bg-[#FDECEA] hover:text-[#C0392B] justify-start px-4"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-5 w-5" /> Esci dal Portale
        </Button>
      </div>
    </div>
  );
}
