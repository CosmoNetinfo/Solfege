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
    isBooking?: boolean;
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
    try {
      const { isDesktop } = await import("@/lib/is-desktop");
      if (isDesktop()) {
        const Database = (await import("@tauri-apps/plugin-sql")).default;
        const db = await Database.load("sqlite:solfege.db");

        // 1. Carica Insegnanti
        const tList = await db.select<any[]>("SELECT id, nome, cognome FROM teachers");
        const formattedTeachers = tList.map(t => ({ id: t.id, name: `${t.nome} ${t.cognome}` }));
        setTeachers(formattedTeachers);
        setSelectedTeachers(formattedTeachers.map(t => t.id));

        // 2. Carica Corsi
        const cList = await db.select<any[]>("SELECT id, nome, colore_calendario FROM courses");
        const formattedCourses = cList.map(c => ({ id: c.id, name: c.nome, color: c.colore_calendario }));
        setCourses(formattedCourses);
        setSelectedCourses(formattedCourses.map(c => c.id));

        // 3. Carica Aule
        const rList = await db.select<any[]>("SELECT id, nome FROM rooms");
        const formattedRooms = rList.map(r => ({ id: r.id, name: r.nome }));
        setRooms(formattedRooms);
        setSelectedRooms(formattedRooms.map(r => r.id));

        // 4. Carica eventi
        loadEvents();
        return;
      }
    } catch (err) {
      console.error("Error loading SQLite initial calendar filters:", err);
    }

    // Web flow (Supabase)
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
    
    setSelectedTeachers((tRes.data || []).map(t => t.id));
    setSelectedCourses((cRes.data || []).map(c => c.id));
    setSelectedRooms((rRes.data || []).map(r => r.id));

    loadEvents(profile.school_id);
  }

  async function loadEvents(schoolId?: string) {
    setLoading(true);
    try {
      const { isDesktop } = await import("@/lib/is-desktop");
      if (isDesktop()) {
        const Database = (await import("@tauri-apps/plugin-sql")).default;
        const db = await Database.load("sqlite:solfege.db");

        // 1. Carica lezioni da SQLite
        const lessons = await db.select<any[]>(
          `SELECT l.id, l.data, l.ora_inizio, l.ora_fine, l.stato as status, l.course_id,
                  c.nome as course_name, c.colore_calendario as course_color,
                  t.nome as teacher_first_name, t.cognome as teacher_last_name, t.id as teacher_id,
                  r.nome as room_name, r.id as room_id
           FROM lessons l
           LEFT JOIN courses c ON l.course_id = c.id
           LEFT JOIN teachers t ON c.teacher_id = t.id
           LEFT JOIN rooms r ON c.room_id = r.id`
        );

        const mapped: CalendarEvent[] = lessons.map(l => {
          const startDate = new Date(`${l.data}T${l.ora_inizio}:00`);
          const endDate = new Date(`${l.data}T${l.ora_fine}:00`);
          return {
            id: l.id,
            title: l.course_name || "Lezione",
            start: isNaN(startDate.getTime()) ? new Date() : startDate,
            end: isNaN(endDate.getTime()) ? new Date() : endDate,
            color: l.course_color || "#E8621A",
            teacherId: l.teacher_id || "",
            courseId: l.course_id || "",
            roomId: l.room_id || "",
            resource: {
              teacher: l.teacher_first_name ? `${l.teacher_first_name} ${l.teacher_last_name}` : "",
              room: l.room_name || "",
              status: l.status || "programmata",
              courseName: l.course_name || "",
            }
          };
        });

        // 2. Carica prenotazioni da SQLite
        const bookings = await db.select<any[]>(
          `SELECT b.id, b.room_id, b.tipo, b.titolo, b.nome_gruppo, b.data, b.ora_inizio, b.ora_fine, b.colore,
                  r.nome as room_name
           FROM room_bookings b
           LEFT JOIN rooms r ON b.room_id = r.id`
        );

        const mappedBookings: CalendarEvent[] = bookings.map(b => {
          const startDate = new Date(`${b.data}T${b.ora_inizio}:00`);
          const endDate = new Date(`${b.data}T${b.ora_fine}:00`);
          return {
            id: `booking-${b.id}`,
            title: `${b.titolo}${b.nome_gruppo ? ` — ${b.nome_gruppo}` : ''} (${b.room_name || ''})`,
            start: isNaN(startDate.getTime()) ? new Date() : startDate,
            end: isNaN(endDate.getTime()) ? new Date() : endDate,
            color: b.colore || '#7C3AED',
            teacherId: '',
            courseId: '',
            roomId: b.room_id || '',
            resource: {
              teacher: '',
              room: b.room_name || '',
              status: b.tipo,
              courseName: 'Prenotazione',
              isBooking: true
            }
          };
        });

        setEvents([...mapped, ...mappedBookings]);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error("Error loading SQLite calendar events:", err);
    }

    // Web flow (Supabase)
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
    if (!sId) {
      setLoading(false);
      return;
    }

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

    const { data: bookings } = await supabase
      .from('room_bookings')
      .select('*, rooms(name)')
      .eq('school_id', sId)

    const mappedBookings: CalendarEvent[] = (bookings || []).map((b: any) => ({
      id: `booking-${b.id}`,
      title: `${b.titolo}${b.nome_gruppo ? ` — ${b.nome_gruppo}` : ''} (${b.rooms?.name || ''})`,
      start: new Date(`${b.data}T${b.ora_inizio}`),
      end: new Date(`${b.data}T${b.ora_fine}`),
      color: b.colore || '#7C3AED',
      teacherId: '',
      courseId: '',
      roomId: b.room_id || '',
      resource: {
        teacher: '',
        room: b.rooms?.name || '',
        status: b.tipo,
        courseName: 'Prenotazione',
        isBooking: true
      }
    }));

    setEvents([...mapped, ...mappedBookings]);
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

  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    if (event.resource?.isBooking) {
      return {
        style: {
          backgroundColor: `${event.color}26`,
          borderRadius: "6px",
          borderLeft: `4px solid ${event.color}`,
          color: event.color,
          display: "block",
          padding: "2px 6px",
          fontSize: "12px",
          fontWeight: 500,
        }
      };
    }
    
    return {
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
    };
  }, []);

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
    <div className="flex h-screen overflow-hidden bg-white">
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

      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Header superiore con titolo e bottone */}
        <div className="p-8 pb-4 flex items-center justify-between border-b border-stone-100 bg-white">
          <div>
            <h2 className="font-serif text-3xl font-bold tracking-tight text-stone-900">Calendario</h2>
            <p className="text-stone-500 text-sm mt-0.5">Gestisci le lezioni e le presenze della tua scuola</p>
          </div>
          <Button className="bg-[#E8621A] hover:bg-[#C94E0E] text-white shadow-md shadow-orange/10 h-10 px-5 rounded-xl font-bold uppercase tracking-wider text-xs">
            <Plus className="mr-2 h-4 w-4" /> Nuova Lezione
          </Button>
        </div>

        <style jsx global>{`
          .rbc-calendar { font-family: var(--font-dm-sans), sans-serif; background: white; }
          .rbc-toolbar { margin-bottom: 20px !important; padding: 0 4px; display: flex; align-items: center; justify-content: space-between; }
          .rbc-toolbar button { color: #57534E; border: 1px solid #E7E5E4; border-radius: 8px; padding: 6px 12px; font-size: 13px; font-weight: 600; transition: all 0.15s; background: white; cursor: pointer; }
          .rbc-toolbar button:hover { background: #FAF8F5; border-color: #E8621A; color: #E8621A; }
          .rbc-toolbar button.rbc-active { background: #E8621A !important; color: #fff !important; border-color: #E8621A !important; }
          .rbc-toolbar .rbc-toolbar-label { font-size: 16px; font-weight: 700; color: #1C1917; text-transform: capitalize; font-family: var(--font-dm-sans), sans-serif; }
          .rbc-header { padding: 10px 4px; font-weight: 700; font-size: 11px; text-transform: uppercase; color: #78716C; border-bottom: 2px solid #F5F5F4; letter-spacing: 0.05em; border-left: 1px solid #E7E5E4; }
          .rbc-header:first-child { border-left: none; }
          .rbc-today { background-color: #FDF6F0 !important; }
          .rbc-time-slot { border-top: 1px solid #F5F5F4; }
          .rbc-time-gutter .rbc-label { font-size: 11px; color: #78716C; font-weight: 500; padding-right: 8px; }
          .rbc-current-time-indicator { background-color: #E8621A; height: 2px; }
          .rbc-event { border: none !important; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
          .rbc-off-range-bg { background-color: #FAF9F6; }
          .rbc-month-view, .rbc-time-view { border: 1px solid #E7E5E4; border-radius: 12px; overflow: hidden; background: white; }
          .rbc-time-header.rbc-overflowing { border-right: none !important; }
          .rbc-time-content { border-top: 1px solid #E7E5E4; }
          .rbc-timeslot-group { border-bottom: 1px solid #F5F5F4; }
        `}</style>

        {/* Contenitore Griglia Calendario */}
        <div className="flex-1 p-8 pt-6 bg-white overflow-hidden">
          <div className="h-full pb-4">
            {loading ? (
              <div className="flex items-center justify-center h-full bg-white rounded-xl border border-stone-200">
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
