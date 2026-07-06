"use client";

import { useState, useEffect } from "react";
import { DoorOpen, CheckCircle, XCircle, Search, Clock, ArrowRight, Loader2, Calendar, LayoutGrid, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfDay, parseISO, addDays, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, startOfMonth, endOfMonth, addMonths, subMonths, isSameDay } from "date-fns";
import { it } from "date-fns/locale";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { isDesktop } from "@/lib/is-desktop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function StatoAulePage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  
  // Viste: giornaliero, settimanale, mensile
  const [viewType, setViewType] = useState<"giornaliero" | "settimanale" | "mensile">("giornaliero");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedRoomId, setSelectedRoomId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [referenceTime, setReferenceTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  });

  useEffect(() => {
    async function init() {
      const { isDesktop: desktopCheck } = await import("@/lib/is-desktop");
      if (desktopCheck()) {
        try {
          const Database = (await import("@tauri-apps/plugin-sql")).default;
          const db = await Database.load("sqlite:solfege.db");
          const schools = await db.select<any[]>("SELECT id FROM schools LIMIT 1");
          if (schools && schools.length > 0) {
            setSchoolId(schools[0].id);
          }
        } catch (err) {
          console.error("Error loading offline school:", err);
        }
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase.from("profiles").select("school_id").eq("id", user.id).single();
          if (profile?.school_id) {
            setSchoolId(profile.school_id);
          }
        }
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (schoolId) {
      loadAllData();
    }
  }, [schoolId, selectedDate, viewType]);

  async function loadAllData() {
    setLoading(true);
    try {
      const { isDesktop: desktopCheck } = await import("@/lib/is-desktop");

      // Calcola l'intervallo di date in base alla vista
      let startDateStr = "";
      let endDateStr = "";

      if (viewType === "giornaliero") {
        startDateStr = format(selectedDate, "yyyy-MM-dd");
        endDateStr = startDateStr;
      } else if (viewType === "settimanale") {
        const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
        startDateStr = format(start, "yyyy-MM-dd");
        endDateStr = format(end, "yyyy-MM-dd");
      } else {
        const start = startOfMonth(selectedDate);
        const end = endOfMonth(selectedDate);
        startDateStr = format(start, "yyyy-MM-dd");
        endDateStr = format(end, "yyyy-MM-dd");
      }

      if (desktopCheck()) {
        const Database = (await import("@tauri-apps/plugin-sql")).default;
        const db = await Database.load("sqlite:solfege.db");

        // 1. Carica aule
        const roomsData = await db.select<any[]>(
          "SELECT id, nome as name, capacita as capacity FROM rooms ORDER BY nome ASC"
        );
        setRooms(roomsData.map(r => ({ ...r, insonorizzata: false })));

        // 2. Carica prenotazioni sale nell'intervallo
        const bookingsData = await db.select<any[]>(
          "SELECT * FROM room_bookings WHERE data >= ? AND data <= ?",
          [startDateStr, endDateStr]
        );
        setBookings(bookingsData.map(b => ({
          id: b.id,
          room_id: b.room_id,
          tipo: 'prenotazione',
          titolo: b.titolo,
          nome_gruppo: b.nome_gruppo || 'Nessuno',
          data: b.data,
          ora_inizio: b.ora_inizio,
          ora_fine: b.ora_fine,
          colore: b.colore || '#7C3AED'
        })));

        // 3. Carica lezioni nell'intervallo
        const lessonsData = await db.select<any[]>(
          `SELECT l.id, l.data, l.ora_inizio, l.ora_fine, l.stato, l.room_id, 
                  c.nome as course_name, c.colore_calendario,
                  t.nome as teacher_first_name, t.cognome as teacher_last_name
           FROM lessons l
           JOIN courses c ON l.course_id = c.id
           LEFT JOIN teachers t ON c.teacher_id = t.id
           WHERE l.data >= ? AND l.data <= ? AND l.stato != 'annullata'`,
          [startDateStr, endDateStr]
        );
        setLessons(lessonsData.map(l => ({
          id: `lesson-${l.id}`,
          room_id: l.room_id || '',
          tipo: 'lezione',
          titolo: l.course_name || 'Lezione',
          nome_gruppo: `${l.teacher_first_name || ''} ${l.teacher_last_name || ''}`.trim() || 'Docente non assegnato',
          data: l.data,
          ora_inizio: l.ora_inizio,
          ora_fine: l.ora_fine,
          colore: l.colore_calendario || '#E8621A'
        })));

        // Web Flow (Supabase)
        if (!schoolId) throw new Error("Scuola non impostata");
        const sid = schoolId as string;
        const [rRes, bRes, lRes] = await Promise.all([
          supabase.from("rooms").select("*").eq("school_id", sid).order("name"),
          supabase.from("room_bookings").select("*").eq("school_id", sid).gte("data", startDateStr).lte("data", endDateStr),
          supabase.from("lessons").select("id, data_ora_inizio, data_ora_fine, room_id, courses(name, colore_calendario), teachers(first_name, last_name)")
            .eq("school_id", sid)
            .gte("data_ora_inizio", `${startDateStr}T00:00:00`)
            .lte("data_ora_inizio", `${endDateStr}T23:59:59`)
        ]);

        setRooms(rRes.data || []);
        setBookings((bRes.data || []).map(b => ({
          id: b.id,
          room_id: b.room_id,
          tipo: 'prenotazione',
          titolo: b.titolo,
          nome_gruppo: b.nome_gruppo || 'Nessuno',
          data: b.data,
          ora_inizio: b.ora_inizio,
          ora_fine: b.ora_fine,
          colore: b.colore || '#7C3AED'
        })));

        setLessons((lRes.data || []).map(l => {
          const start = new Date(l.data_ora_inizio);
          const end = new Date(l.data_ora_fine);
          return {
            id: `lesson-${l.id}`,
            room_id: l.room_id || '',
            tipo: 'lezione',
            titolo: l.courses?.name || 'Lezione',
            nome_gruppo: l.teachers ? `${l.teachers.first_name} ${l.teachers.last_name}` : 'Docente non assegnato',
            data: format(start, "yyyy-MM-dd"),
            ora_inizio: format(start, "HH:mm"),
            ora_fine: format(end, "HH:mm"),
            colore: l.courses?.colore_calendario || '#E8621A'
          };
        }));
      }
    } catch (err) {
      console.error("Error loading classroom control data:", err);
      toast.error("Errore nel caricamento delle lezioni");
    } finally {
      setLoading(false);
    }
  }

  const allEvents = [...bookings, ...lessons];

  const timeToMinutes = (t: string) => {
    if (!t) return 0;
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const getDayName = (date: Date) => {
    return format(date, "EEEE d MMMM", { locale: it });
  };

  // Navigazione date
  const prevDate = () => {
    if (viewType === "giornaliero") setSelectedDate(addDays(selectedDate, -1));
    else if (viewType === "settimanale") setSelectedDate(subWeeks(selectedDate, 1));
    else setSelectedDate(subMonths(selectedDate, 1));
  };

  const nextDate = () => {
    if (viewType === "giornaliero") setSelectedDate(addDays(selectedDate, 1));
    else if (viewType === "settimanale") setSelectedDate(addWeeks(selectedDate, 1));
    else setSelectedDate(addMonths(selectedDate, 1));
  };

  // Calcolo occupazione in tempo reale (solo per vista giornaliera)
  const currentMinutes = timeToMinutes(referenceTime);
  const processedRooms = rooms.map(room => {
    const todayStr = format(selectedDate, "yyyy-MM-dd");
    const roomEventsToday = allEvents.filter(e => e.room_id === room.id && e.data === todayStr);
    
    const activeEvent = roomEventsToday.find(e => {
      const startMin = timeToMinutes(e.ora_inizio);
      const endMin = timeToMinutes(e.ora_fine);
      return currentMinutes >= startMin && currentMinutes < endMin;
    });

    const futureEvents = roomEventsToday
      .filter(e => timeToMinutes(e.ora_inizio) >= currentMinutes)
      .sort((a, b) => timeToMinutes(a.ora_inizio) - timeToMinutes(b.ora_inizio));

    const nextEvent = futureEvents[0] || null;

    return {
      ...room,
      isOccupied: !!activeEvent,
      activeEvent,
      nextEvent,
      allEventsToday: roomEventsToday.sort((a, b) => timeToMinutes(a.ora_inizio) - timeToMinutes(b.ora_inizio))
    };
  });

  const occupiedCount = processedRooms.filter(r => r.isOccupied).length;
  const freeCount = processedRooms.length - occupiedCount;

  // Genera ore della giornata (es: dalle 8 alle 21)
  const hoursRange = Array.from({ length: 14 }, (_, i) => i + 8); // 8:00 -> 21:00

  // Vista Settimanale: giorni lun-dom
  const startOfSelectedWeek = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({
    start: startOfSelectedWeek,
    end: endOfWeek(selectedDate, { weekStartsOn: 1 })
  });

  return (
    <div className="p-8 max-w-[1600px] mx-auto flex flex-col min-h-screen bg-[#FAF9F6] text-stone-800">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-serif text-[#E8621A] font-bold tracking-tight mb-1">Stato & Controllo Aule</h1>
          <p className="text-stone-500 text-sm">Monitora disponibilità, lezioni e prenotazioni giornaliere, settimanali e mensili.</p>
        </div>

        {/* Controlli di Vista */}
        <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-xl border border-stone-200 self-start md:self-auto">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setViewType("giornaliero")}
            className={`rounded-lg text-xs font-semibold px-3 py-2 transition-all ${viewType === "giornaliero" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"}`}
          >
            <Clock className="w-3.5 h-3.5 mr-1.5" /> Giornaliero
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setViewType("settimanale")}
            className={`rounded-lg text-xs font-semibold px-3 py-2 transition-all ${viewType === "settimanale" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"}`}
          >
            <Calendar className="w-3.5 h-3.5 mr-1.5" /> Settimanale
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setViewType("mensile")}
            className={`rounded-lg text-xs font-semibold px-3 py-2 transition-all ${viewType === "mensile" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"}`}
          >
            <LayoutGrid className="w-3.5 h-3.5 mr-1.5" /> Mensile
          </Button>
        </div>
      </div>

      {/* KPI Cards (Solo vista giornaliera per tempo reale) */}
      {viewType === "giornaliero" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white border-stone-200/80 shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-400">Aule Totali</p>
                <h3 className="text-3xl font-serif font-bold text-stone-800 mt-1">{rooms.length}</h3>
              </div>
              <div className="h-12 w-12 rounded-xl bg-stone-100 flex items-center justify-center">
                <DoorOpen className="h-6 w-6 text-stone-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-stone-200/80 shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-green-600">Libere Ora</p>
                <h3 className="text-3xl font-serif font-bold text-green-600 mt-1">{freeCount}</h3>
              </div>
              <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-stone-200/80 shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-red-500">Occupate Ora</p>
                <h3 className="text-3xl font-serif font-bold text-red-500 mt-1">{occupiedCount}</h3>
              </div>
              <div className="h-12 w-12 rounded-xl bg-red-50 flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigatore Data e Filtri */}
      <Card className="bg-white border-stone-200/80 shadow-sm rounded-2xl mb-6">
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={prevDate} className="h-9 w-9 rounded-xl border-stone-200 hover:bg-stone-50">
              <ChevronLeft className="w-4 h-4 text-stone-600" />
            </Button>
            
            <span className="font-serif text-lg font-bold text-stone-800 min-w-[180px] text-center">
              {viewType === "giornaliero" && getDayName(selectedDate)}
              {viewType === "settimanale" && `Settimana ${format(startOfSelectedWeek, "d MMMM", { locale: it })} - ${format(endOfWeek(selectedDate, { weekStartsOn: 1 }), "d MMMM yyyy", { locale: it })}`}
              {viewType === "mensile" && format(selectedDate, "MMMM yyyy", { locale: it }).toUpperCase()}
            </span>

            <Button variant="outline" size="icon" onClick={nextDate} className="h-9 w-9 rounded-xl border-stone-200 hover:bg-stone-50">
              <ChevronRight className="w-4 h-4 text-stone-600" />
            </Button>

            <Button variant="ghost" size="sm" onClick={() => setSelectedDate(new Date())} className="text-xs font-semibold text-[#E8621A] hover:bg-orange/5 rounded-lg">
              Oggi
            </Button>
          </div>

          <div className="flex items-center gap-3">
            {viewType === "giornaliero" && (
              <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5">
                <Clock className="w-4 h-4 text-stone-400" />
                <span className="text-xs font-semibold text-stone-500 mr-1">Orario Riferimento:</span>
                <input 
                  type="time" 
                  value={referenceTime} 
                  onChange={(e) => setReferenceTime(e.target.value)}
                  className="bg-transparent text-sm font-bold text-stone-800 outline-none w-16"
                />
              </div>
            )}

            {viewType === "settimanale" && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-stone-500">Seleziona Aula:</span>
                <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                  <SelectTrigger className="w-48 bg-stone-50 border-stone-200 rounded-xl text-xs font-bold">
                    <SelectValue placeholder="Seleziona..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte le Aule</SelectItem>
                    {rooms.map(r => <SelectItem key={r.id} value={r.id}>{r.name || r.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
              <Input
                placeholder="Cerca aula..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 w-48 bg-stone-50 border-stone-200 rounded-xl text-xs placeholder:text-stone-400"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contenuto Dinamico delle Viste */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-stone-200/80 shadow-sm flex-1">
          <Loader2 className="w-8 h-8 text-[#E8621A] animate-spin mb-4" />
          <p className="text-sm font-semibold text-stone-500">Elaborazione prospetto in corso...</p>
        </div>
      ) : (
        <>
          {/* 1. VISTA GIORNALIERA (TIMELINE ORARIA COMPLETA) */}
          {viewType === "giornaliero" && (
            <div className="flex-1 bg-white rounded-2xl border border-stone-200/80 shadow-sm overflow-hidden p-6">
              <h3 className="text-lg font-serif font-bold mb-6 text-stone-800 border-b pb-4">Prospetto Orario Aule</h3>
              <div className="overflow-x-auto">
                <div className="min-w-[1000px]">
                  {/* Riga Intestazione Ore */}
                  <div className="grid grid-cols-[200px_1fr] border-b border-stone-100 pb-3 mb-3">
                    <span className="font-bold text-xs text-stone-400 uppercase tracking-wider">Aula</span>
                    <div className="grid grid-cols-14 text-center text-xs font-bold text-stone-400 uppercase tracking-wider">
                      {hoursRange.map(h => (
                        <div key={h} className="border-l border-stone-100">
                          {String(h).padStart(2, "0")}:00
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Righe Aule */}
                  {processedRooms
                    .filter(r => (r.name || "").toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(room => (
                      <div key={room.id} className="grid grid-cols-[200px_1fr] items-center border-b border-stone-100 py-4 hover:bg-stone-50/50 transition-colors">
                        <div>
                          <p className="font-serif font-bold text-stone-800">{room.name}</p>
                          <span className="text-xs text-stone-400">Capienza: {room.capacity} persone</span>
                        </div>
                        
                        {/* Timeline dell'aula */}
                        <div className="grid grid-cols-14 h-12 relative bg-stone-50/40 rounded-xl overflow-hidden border border-stone-100">
                          {/* Segmenti orari vuoti */}
                          {hoursRange.map(h => (
                            <div key={h} className="border-l border-stone-100/70 h-full" />
                          ))}

                          {/* Posizionamento degli eventi */}
                          {room.allEventsToday.map(event => {
                            const [startH, startM] = event.ora_inizio.split(":").map(Number);
                            const [endH, endM] = event.ora_fine.split(":").map(Number);
                            
                            // Limita all'intervallo 8:00 - 22:00
                            const startMin = Math.max(8 * 60, startH * 60 + startM);
                            const endMin = Math.min(22 * 60, endH * 60 + endM);
                            
                            if (startMin >= endMin) return null;

                            const totalTimelineMinutes = 14 * 60; // 8:00 a 22:00 (14 ore)
                            const offsetMinutes = startMin - (8 * 60);
                            const durationMinutes = endMin - startMin;

                            const leftPercent = (offsetMinutes / totalTimelineMinutes) * 100;
                            const widthPercent = (durationMinutes / totalTimelineMinutes) * 100;

                            return (
                              <div
                                key={event.id}
                                className="absolute top-1 bottom-1 rounded-lg px-2.5 py-1 text-[10px] font-bold text-white flex flex-col justify-center overflow-hidden shadow-sm leading-tight transition-all hover:scale-[1.01]"
                                style={{
                                  left: `${leftPercent}%`,
                                  width: `${widthPercent}%`,
                                  backgroundColor: event.colore || "#E8621A"
                                }}
                                title={`${event.titolo} (${event.ora_inizio} - ${event.ora_fine}) - ${event.nome_gruppo}`}
                              >
                                <span className="truncate">{event.titolo}</span>
                                <span className="text-[8px] opacity-90 truncate">{event.ora_inizio} - {event.ora_fine}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. VISTA SETTIMANALE */}
          {viewType === "settimanale" && (
            <div className="flex-1 bg-white rounded-2xl border border-stone-200/80 shadow-sm p-6 overflow-x-auto">
              <h3 className="text-lg font-serif font-bold mb-6 text-stone-800 border-b pb-4">Calendario Settimanale Aule</h3>
              <div className="min-w-[1200px]">
                {/* Intestazione Colonne Giorni */}
                <div className="grid grid-cols-[100px_repeat(7,1fr)] text-center font-bold text-xs text-stone-400 uppercase tracking-wider border-b border-stone-100 pb-3 mb-3">
                  <div>Ora</div>
                  {weekDays.map(day => (
                    <div key={day.toISOString()} className={isSameDay(day, new Date()) ? "text-[#E8621A]" : ""}>
                      {format(day, "EEEE", { locale: it })}
                      <div className="text-sm font-normal text-stone-500 font-sans mt-0.5">{format(day, "d MMM")}</div>
                    </div>
                  ))}
                </div>

                {/* Righe Orarie */}
                {hoursRange.map(hour => (
                  <div key={hour} className="grid grid-cols-[100px_repeat(7,1fr)] border-b border-stone-100 min-h-[70px] py-1 hover:bg-stone-50/20 transition-colors">
                    {/* Colonna Ora */}
                    <div className="flex items-center justify-center text-xs font-bold text-stone-400 border-r border-stone-100">
                      {String(hour).padStart(2, "0")}:00
                    </div>

                    {/* Colonne Giorni per questa ora */}
                    {weekDays.map(day => {
                      const dayStr = format(day, "yyyy-MM-dd");
                      const hourStartMin = hour * 60;
                      const hourEndMin = (hour + 1) * 60;

                      // Trova gli eventi in questa ora per l'aula selezionata (o per tutte)
                      const eventsInSlot = allEvents.filter(e => {
                        const isMatchDate = e.data === dayStr;
                        const isMatchRoom = selectedRoomId === "all" || e.room_id === selectedRoomId;
                        if (!isMatchDate || !isMatchRoom) return false;

                        const startMin = timeToMinutes(e.ora_inizio);
                        const endMin = timeToMinutes(e.ora_fine);
                        
                        // Controlla la sovrapposizione temporale con la fascia oraria di 1 ora
                        return startMin < hourEndMin && endMin > hourStartMin;
                      });

                      return (
                        <div key={day.toISOString()} className="border-r border-stone-100 px-1.5 py-1 space-y-1">
                          {eventsInSlot.map(event => {
                            const roomName = rooms.find(r => r.id === event.room_id)?.name || "Aula";
                            return (
                              <div
                                key={event.id}
                                className="p-1 rounded-lg text-[9px] font-bold text-white leading-tight shadow-sm"
                                style={{ backgroundColor: event.colore || "#E8621A" }}
                                title={`${event.titolo} (${event.ora_inizio}-${event.ora_fine}) in ${roomName}`}
                              >
                                <div className="truncate">{event.titolo}</div>
                                <div className="text-[7.5px] opacity-90 truncate">{event.ora_inizio}-{event.ora_fine} {selectedRoomId === "all" && `(${roomName})`}</div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. VISTA MENSILE */}
          {viewType === "mensile" && (
            <div className="flex-1 bg-white rounded-2xl border border-stone-200/80 shadow-sm p-6">
              <h3 className="text-lg font-serif font-bold mb-6 text-stone-800 border-b pb-4">Calendario Mensile delle Occupazioni</h3>
              
              {/* Griglia Calendario Mensile */}
              <div className="grid grid-cols-7 gap-2">
                {/* Intestazione Lun-Dom */}
                {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map(d => (
                  <div key={d} className="text-center font-bold text-xs text-stone-400 uppercase tracking-wider py-2">
                    {d}
                  </div>
                ))}

                {/* Genera giorni del mese */}
                {(() => {
                  const startM = startOfMonth(selectedDate);
                  const endM = endOfMonth(selectedDate);
                  
                  // Allinea con il lunedì precedente all'inizio del mese
                  const startDayOfWeek = startM.getDay() === 0 ? 6 : startM.getDay() - 1;
                  const blankDays = Array.from({ length: startDayOfWeek });

                  const daysInMonth = eachDayOfInterval({ start: startM, end: endM });

                  return (
                    <>
                      {/* Giorni vuoti per allineamento griglia */}
                      {blankDays.map((_, idx) => (
                        <div key={`blank-${idx}`} className="bg-stone-50/40 border border-stone-100 rounded-xl min-h-[90px] opacity-40" />
                      ))}

                      {/* Giorni Effettivi */}
                      {daysInMonth.map(day => {
                        const dayStr = format(day, "yyyy-MM-dd");
                        const eventsToday = allEvents.filter(e => e.data === dayStr && (selectedRoomId === "all" || e.room_id === selectedRoomId));
                        const isToday = isSameDay(day, new Date());

                        return (
                          <div 
                            key={day.toISOString()} 
                            className={`border rounded-xl min-h-[90px] p-2 flex flex-col justify-between transition-colors hover:bg-stone-50/50 ${
                              isToday 
                                ? "bg-orange/5 border-[#E8621A]" 
                                : "bg-white border-stone-200/60"
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className={`text-xs font-bold ${isToday ? "text-[#E8621A]" : "text-stone-500"}`}>
                                {format(day, "d")}
                              </span>
                              {eventsToday.length > 0 && (
                                <Badge className="bg-stone-100 hover:bg-stone-200 text-stone-600 border-none font-bold text-[9px] px-1.5 py-0.5">
                                  {eventsToday.length} lez/pr
                                </Badge>
                              )}
                            </div>

                            {/* Mini anteprima degli eventi del giorno */}
                            <div className="space-y-1 mt-2 flex-1 overflow-y-auto max-h-[50px] scrollbar-thin">
                              {eventsToday.slice(0, 3).map(event => (
                                <div 
                                  key={event.id}
                                  className="text-[8px] font-bold text-white px-1 py-0.5 rounded truncate"
                                  style={{ backgroundColor: event.colore || "#E8621A" }}
                                  title={`${event.titolo} (${event.ora_inizio}-${event.ora_fine})`}
                                >
                                  {event.ora_inizio} {event.titolo}
                                </div>
                              ))}
                              {eventsToday.length > 3 && (
                                <p className="text-[7.5px] text-stone-400 font-semibold text-center mt-0.5">
                                  +{eventsToday.length - 3} altri
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
