"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Calendar, dateFnsLocalizer, type View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { it } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { createClient } from "@/lib/supabase/client";

const locales = { "it": it };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color: string;
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

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from("profiles").select("school_id").eq("id", user.id).single();
    if (!profile?.school_id) return;

    const { data: lessons } = await supabase
      .from("lessons")
      .select("id, data_ora_inizio, data_ora_fine, status, courses(name, colore_calendario), teachers(first_name, last_name), rooms(name)")
      .eq("school_id", profile.school_id)
      .order("data_ora_inizio");

    const mapped: CalendarEvent[] = (lessons || []).map((l: any) => ({
      id: l.id,
      title: l.courses?.name || "Lezione",
      start: new Date(l.data_ora_inizio),
      end: new Date(l.data_ora_fine),
      color: l.courses?.colore_calendario || "#E8621A",
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
      <div className="font-semibold text-[11px]">{event.title}</div>
      {event.resource?.teacher && (
        <div className="text-[10px] opacity-80">{event.resource.teacher}</div>
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
    <div className="flex-1 p-8 pt-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-4xl font-bold tracking-tight text-foreground">Calendario</h2>
      </div>

      <style jsx global>{`
        .rbc-calendar { font-family: var(--font-dm-sans), sans-serif; }
        .rbc-toolbar { margin-bottom: 16px !important; }
        .rbc-toolbar button { color: #1A1714; border: 1px solid #E8E4E0; border-radius: 6px; padding: 6px 14px; font-size: 13px; }
        .rbc-toolbar button:hover { background: #FDF5F0; border-color: #E8621A; color: #E8621A; }
        .rbc-toolbar button.rbc-active { background: #E8621A; color: #fff; border-color: #E8621A; }
        .rbc-header { padding: 8px 4px; font-weight: 600; font-size: 12px; text-transform: uppercase; color: #7A736C; border-bottom: 1px solid #E8E4E0; }
        .rbc-today { background-color: #FDF5F0 !important; }
        .rbc-time-slot { border-top: 1px solid #F4F4F5; }
        .rbc-time-gutter .rbc-label { font-size: 11px; color: #7A736C; }
        .rbc-current-time-indicator { background-color: #E8621A; height: 2px; }
        .rbc-event { box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .rbc-off-range-bg { background-color: #FAFAF9; }
        .rbc-month-view, .rbc-time-view { border: 1px solid #E8E4E0; border-radius: 8px; overflow: hidden; }
      `}</style>

      <div className="bg-white rounded-lg border border-border p-4 shadow-sm" style={{ height: "calc(100vh - 160px)" }}>
        {loading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">Caricamento calendario...</div>
        ) : (
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            eventPropGetter={eventStyleGetter}
            components={components}
            messages={messages}
            culture="it"
            min={new Date(2024, 0, 1, 8, 0)}
            max={new Date(2024, 0, 1, 21, 0)}
            step={30}
            timeslots={2}
            style={{ height: "100%" }}
          />
        )}
      </div>
    </div>
  );
}
