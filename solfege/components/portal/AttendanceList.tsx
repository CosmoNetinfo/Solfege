"use client";

import { useState } from "react";
import { Calendar, Clock, BookOpen, User, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface AttendanceListProps {
  attendanceData: any[];
}

export function AttendanceList({ attendanceData }: AttendanceListProps) {
  const [activeTab, setActiveTab] = useState<"upcoming" | "history">("upcoming");
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);

  const now = new Date();

  // Filtra prossime vs passate
  const upcoming = attendanceData.filter((a) => {
    const date = new Date(a.lessons?.data_ora_inizio || a.lessons?.data);
    return date >= now;
  }).sort((a, b) => {
    return new Date(a.lessons?.data_ora_inizio).getTime() - new Date(b.lessons?.data_ora_inizio).getTime();
  });

  const history = attendanceData.filter((a) => {
    const date = new Date(a.lessons?.data_ora_inizio || a.lessons?.data);
    return date < now;
  }).sort((a, b) => {
    return new Date(b.lessons?.data_ora_inizio).getTime() - new Date(a.lessons?.data_ora_inizio).getTime();
  });

  const getStatusBadge = (status: string, attendanceStatus: string) => {
    if (attendanceStatus === "assente") {
      return <Badge variant="destructive">Assente</Badge>;
    }
    if (attendanceStatus === "recuperato") {
      return <Badge className="bg-amber-100 text-amber-800 border-none">Recuperato</Badge>;
    }
    if (status === "annullata") {
      return <Badge variant="secondary">Annullata</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800 border-none">Presente</Badge>;
  };

  const toggleExpand = (id: string) => {
    setExpandedLessonId(expandedLessonId === id ? null : id);
  };

  const renderLessonCard = (att: any) => {
    const lesson = att.lessons;
    if (!lesson) return null;
    const isExpanded = expandedLessonId === lesson.id;
    const date = new Date(lesson.data_ora_inizio || lesson.data);

    return (
      <Card key={att.id} className="border-none shadow-sm overflow-hidden bg-white hover:shadow-md transition-shadow">
        <CardContent className="p-5 space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="font-bold text-stone-900 text-lg">{lesson.courses?.name}</h3>
              <div className="flex items-center gap-1.5 text-stone-500 text-sm">
                <Calendar className="h-4 w-4 shrink-0 text-orange" />
                <span className="capitalize">
                  {format(date, "EEEE dd MMMM yyyy", { locale: it })}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-stone-500 text-sm">
                <Clock className="h-4 w-4 shrink-0 text-orange" />
                <span>
                  {format(new Date(lesson.data_ora_inizio), "HH:mm")} - {format(new Date(lesson.data_ora_fine), "HH:mm")}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {activeTab === "history" ? (
                getStatusBadge(lesson.stato, att.stato)
              ) : (
                <Badge className="bg-orange/10 text-orange hover:bg-orange/10 border-none font-semibold">Programmata</Badge>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 pt-2 text-xs text-stone-600 border-t border-stone-100">
            <div className="flex items-center gap-1">
              <User className="h-3.5 w-3.5 text-stone-400" />
              <span>{lesson.teachers?.first_name} {lesson.teachers?.last_name}</span>
            </div>
            {lesson.rooms?.name && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-stone-400" />
                <span>{lesson.rooms.name}</span>
              </div>
            )}
          </div>

          {/* Dettagli espandibili (solo per storico lezioni svolte) */}
          {activeTab === "history" && (lesson.argomenti || lesson.compiti) && (
            <div className="pt-2">
              <button 
                onClick={() => toggleExpand(lesson.id)}
                className="w-full flex items-center justify-between text-xs text-orange font-semibold hover:text-[#C94E0E] transition-colors"
              >
                <span>{isExpanded ? "Nascondi argomenti e compiti" : "Visualizza argomenti e compiti"}</span>
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {isExpanded && (
                <div className="mt-3 p-3 bg-stone-50 rounded-xl space-y-3 border border-stone-100 animate-in fade-in slide-in-from-top-1 duration-200">
                  {lesson.argomenti && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1">
                        <BookOpen size={12} className="text-orange" /> Argomenti Trattati
                      </p>
                      <p className="text-xs text-stone-700 whitespace-pre-line">{lesson.argomenti}</p>
                    </div>
                  )}
                  {lesson.compiti && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1">
                        <Calendar size={12} className="text-orange" /> Compiti per Casa
                      </p>
                      <p className="text-xs text-stone-700 whitespace-pre-line">{lesson.compiti}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex bg-stone-200/60 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
            activeTab === "upcoming"
              ? "bg-white text-stone-900 shadow-sm"
              : "text-stone-500 hover:text-stone-800"
          }`}
        >
          Prossime Lezioni ({upcoming.length})
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
            activeTab === "history"
              ? "bg-white text-stone-900 shadow-sm"
              : "text-stone-500 hover:text-stone-800"
          }`}
        >
          Storico Lezioni ({history.length})
        </button>
      </div>

      {/* Elenco lezioni */}
      <div className="space-y-4">
        {activeTab === "upcoming" ? (
          upcoming.length > 0 ? (
            upcoming.map((a) => renderLessonCard(a))
          ) : (
            <div className="text-center py-12 text-stone-400 italic text-sm">
              Nessuna lezione programmata per il futuro.
            </div>
          )
        ) : (
          history.length > 0 ? (
            history.map((a) => renderLessonCard(a))
          ) : (
            <div className="text-center py-12 text-stone-400 italic text-sm">
              Nessuna lezione registrata nello storico.
            </div>
          )
        )}
      </div>
    </div>
  );
}
