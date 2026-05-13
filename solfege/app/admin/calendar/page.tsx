"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Calendar, dateFnsLocalizer, type View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { it } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CalendarFilters } from "@/components/admin/calendar-filters";
import { LessonDrawer } from "@/components/admin/lesson-drawer";

const locales = { "it": it };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color: string;
  teacherId: string;
  courseId: string;
  roomId: string;
  resource?: {
    teacher: string;
    room: string;
    status: string;
    courseName: string;
  };
};

export default function CalendarPage() {
  const supabase = createClient();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [view, setView] = useState<View>("week");
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  // Filter states
  const [teachers, setTeachers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);

  // Selection states
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from("profiles").select("school_id").eq("id", user.id).single();
    if (!profile?.school_id) return;

    const [tRes, cRes, rRes] = await Promise.all([
      supabase.from("teachers").select("id, first_name, last_name").eq("school_id", profile.school_id),
      supabase.from("courses").select("id, name, colore_calendario").eq("school_id", profile.school_id),
      supabase.from("rooms").select("id, name").eq("school_id", profile.school_id)
    ]);

    setTeachers((tRes.data || []).map(t => ({ id: t.id, name: `${t.first_name} ${t.last_name}` })));
    setCourses((cRes.data || []).map(c => ({ id: c.id, name: c.name, color: c.colore_calendario })));
    setRooms((rRes.data || []).map(r => ({ id: r.id, name: r.name })));
    
    // Default: select all
    setSelectedTeachers((tRes.data || []).map(t => t.id));
    setSelectedCourses((cRes.data || []).map(c => c.id));
    setSelectedRooms((rRes.data || []).map(r => r.id));

    loadEvents(profile.school_id);
  }

  async function loadEvents(schoolId?: string) {
    setLoading(true);
    let sId = schoolId;
    if (!sId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data: profile } = await supabase.from("profiles").select("school_id").eq("id", user.id).maybeSingle();
      sId = profile?.school_id || undefined;
    }
    if (!sId) return;

    const { data: lessons } = await supabase
      .from("lessons")
      .select("id, data_ora_inizio, data_ora_fine, status, teacher_id, course_id, room_id, courses(name, colore_calendario), teachers(first_name, last_name), rooms(name)")
      .eq("school_id", sId)
      .order("data_ora_inizio");

    const mapped: CalendarEvent[] = (lessons || []).map((l: any) => ({
      id: l.id,
      title: l.courses?.name || "Lezione",
      start: new Date(l.data_ora_inizio),
      end: new Date(l.data_ora_fine),
      color: l.courses?.colore_calendario || "#E8621A",
      teacherId: l.teacher_id,
      courseId: l.course_id,
      roomId: l.room_id,
      resource: {
        teacher: l.teachers ? `${l.teachers.first_name} ${l.teachers.last_name}` : "",
        room: l.rooms?.name || "",
        status: l.status,
        courseName: l.courses?.name || "",
      },
    }));

    setEvents(mapped);
    setLoading(false);
  }

  const filteredEvents = useMemo(() => {
    return events.filter(e => 
      selectedTeachers.includes(e.teacherId) &&
      selectedCourses.includes(e.courseId) &&
      selectedRooms.includes(e.roomId)
    );
  }, [events, selectedTeachers, selectedCourses, selectedRooms]);

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedLessonId(event.id);
    setIsDrawerOpen(true);
  };

  const toggleFilter = (list: string[], setList: (l: string[]) => void, id: string) => {
    setList(list.includes(id) ? list.filter(item => item !== id) : [...list, id]);
  };

  const eventStyleGetter = useCallback((event: CalendarEvent) => ({
    style: {
      backgroundColor: event.color,
      borderRadius: "6px",
      opacity: event.resource?.status === "cancellata" ? 0.4 : 1,
      color: "#fff",
      border: "none",
      padding: "2px 6px",
      fontSize: "12px",
      fontWeight: 500,
    },
  }), []);

  const EventComponent = useCallback(({ event }: { event: CalendarEvent }) => (
    <div className="leading-tight">
      <div className="font-semibold text-[11px] truncate">{event.title}</div>
      {event.resource?.teacher && (
        <div className="text-[10px] opacity-80 truncate">{event.resource.teacher}</div>
      )}
    </div>
  ), []);

  const { components, messages } = useMemo(() => ({
    components: { event: EventComponent },
    messages: {
      today: "Oggi",
      previous: "←",
      next: "→",
      month: "Mese",
      week: "Settimana",
      day: "Giorno",
      agenda: "Agenda",
      date: "Data",
      time: "Orario",
      event: "Evento",
      noEventsInRange: "Nessuna lezione in questo periodo",
    },
  }), [EventComponent]);

  return (
    <div className="flex h-screen overflow-hidden">
      <CalendarFilters 
        teachers={teachers}
        courses={courses}
        rooms={rooms}
        selectedTeachers={selectedTeachers}
        selectedCourses={selectedCourses}
        selectedRooms={selectedRooms}
        onTeacherChange={(id) => toggleFilter(selectedTeachers, setSelectedTeachers, id)}
        onCourseChange={(id) => toggleFilter(selectedCourses, setSelectedCourses, id)}
        onRoomChange={(id) => toggleFilter(selectedRooms, setSelectedRooms, id)}
      />

      <div className="flex-1 flex flex-col min-w-0 bg-stone-50">
        <div className="p-8 pt-6 pb-0 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-4xl font-bold tracking-tight text-foreground">Calendario</h2>
            <p className="text-stone-500 mt-1">Gestisci le lezioni e le presenze della tua scuola</p>
          </div>
          <Button className="bg-orange hover:bg-orange-dark text-white shadow-lg shadow-orange/20 h-11 px-6">
            <Plus className="mr-2 h-5 w-5" /> Nuova Lezione
          </Button>
        </div>

        <style jsx global>{`
          .rbc-calendar { font-family: var(--font-dm-sans), sans-serif; background: white; }
          .rbc-toolbar { margin-bottom: 24px !important; padding: 0 8px; }
          .rbc-toolbar button { color: #7A736C; border: 1px solid #E8E4E0; border-radius: 8px; padding: 8px 16px; font-size: 13px; font-weight: 500; transition: all 0.2s; }
          .rbc-toolbar button:hover { background: #FDF5F0; border-color: #E8621A; color: #E8621A; }
          .rbc-toolbar button.rbc-active { background: #E8621A; color: #fff; border-color: #E8621A; box-shadow: 0 4px 12px rgba(232, 98, 26, 0.2); }
          .rbc-toolbar .rbc-toolbar-label { font-size: 18px; font-weight: 700; color: #1A1714; text-transform: capitalize; }
          .rbc-header { padding: 12px 4px; font-weight: 700; font-size: 11px; text-transform: uppercase; color: #7A736C; border-bottom: 2px solid #F4F4F5; letter-spacing: 0.05em; }
          .rbc-today { background-color: #FDF5F0 !important; }
          .rbc-time-slot { border-top: 1px solid #F4F4F5; }
          .rbc-time-gutter .rbc-label { font-size: 11px; color: #7A736C; font-weight: 500; }
          .rbc-current-time-indicator { background-color: #E8621A; height: 2px; }
          .rbc-event { border: none !important; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
          .rbc-off-range-bg { background-color: #FAFAF9; }
          .rbc-month-view, .rbc-time-view { border: 1px solid #E8E4E0; border-radius: 12px; overflow: hidden; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
          .rbc-time-header.rbc-overflowing { border-right: none !important; }
        `}</style>

        <div className="flex-1 p-8">
          <div className="h-full">
            {loading ? (
              <div className="flex items-center justify-center h-full bg-white rounded-xl border border-border">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-8 w-8 border-4 border-orange border-t-transparent rounded-full animate-spin" />
                  <p className="text-stone-400 font-medium">Caricamento calendario...</p>
                </div>
              </div>
            ) : (
              <Calendar
                localizer={localizer}
                events={filteredEvents}
                startAccessor="start"
                endAccessor="end"
                view={view}
                onView={setView}
                date={date}
                onNavigate={setDate}
                eventPropGetter={eventStyleGetter}
                onSelectEvent={handleSelectEvent}
                components={components}
                messages={messages}
                culture="it"
                min={new Date(2024, 0, 1, 8, 0)}
                max={new Date(2024, 0, 1, 22, 0)}
                step={30}
                timeslots={2}
                style={{ height: "100%" }}
              />
            )}
          </div>
        </div>
      </div>

      <LessonDrawer 
        lessonId={selectedLessonId}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onRefresh={() => loadEvents()}
      />
    </div>
  );
}
