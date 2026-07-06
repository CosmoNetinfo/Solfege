"use client";

import { useState, useEffect } from "react";
import { DoorOpen, CheckCircle, XCircle, Search, Clock, ArrowRight, Loader2 } from "lucide-react";
import { format, startOfDay, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { isDesktop } from "@/lib/is-desktop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function StatoAulePage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  
  const [referenceTime, setReferenceTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  });
  
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function load() {
      const { isDesktop } = await import("@/lib/is-desktop");
      if (isDesktop()) {
        try {
          const Database = (await import("@tauri-apps/plugin-sql")).default;
          const db = await Database.load("sqlite:solfege.db");
          const schools = await db.select<any[]>("SELECT id FROM schools LIMIT 1");
          if (schools && schools.length > 0) {
            setSchoolId(schools[0].id);
            await loadDataOffline(schools[0].id);
          }
        } catch (err) {
          console.error("Error loading offline school:", err);
        }
        return;
      }

      // Web Flow
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("school_id").eq("id", user.id).single();
      if (!profile?.school_id) return;
      setSchoolId(profile.school_id);
      await loadDataOnline(profile.school_id);
    }
    load();
  }, []);

  async function loadDataOffline(sid: string) {
    setLoading(true);
    try {
      const Database = (await import("@tauri-apps/plugin-sql")).default;
      const db = await Database.load("sqlite:solfege.db");

      // 1. Aule
      const roomsData = await db.select<any[]>(
        "SELECT id, nome as name, capacita as capacity, insonorizzata FROM rooms ORDER BY nome ASC"
      );
      setRooms(roomsData);

      // Data di oggi formato YYYY-MM-DD
      const todayStr = format(new Date(), "yyyy-MM-dd");

      // 2. Prenotazioni aule oggi
      const bookingsData = await db.select<any[]>(
        "SELECT * FROM room_bookings WHERE data = ?",
        [todayStr]
      );
      setBookings(bookingsData.map(b => ({
        id: b.id,
        room_id: b.room_id,
        tipo: 'prenotazione',
        titolo: b.titolo,
        nome_gruppo: b.nome_gruppo || 'Nessuno',
        ora_inizio: b.ora_inizio,
        ora_fine: b.ora_fine,
        colore: b.colore || '#7C3AED'
      })));

      // 3. Lezioni oggi
      const lessonsData = await db.select<any[]>(
        `SELECT l.id, l.ora_inizio, l.ora_fine, l.stato, l.room_id, 
                c.nome as course_name, c.colore_calendario,
                t.nome as teacher_first_name, t.cognome as teacher_last_name
         FROM lessons l
         JOIN courses c ON l.course_id = c.id
         LEFT JOIN teachers t ON c.teacher_id = t.id
         WHERE l.data = ? AND l.stato != 'annullata'`,
        [todayStr]
      );
      
      setLessons(lessonsData.map(l => ({
        id: `lesson-${l.id}`,
        room_id: l.room_id || '',
        tipo: 'lezione',
        titolo: l.course_name || 'Lezione',
        nome_gruppo: `${l.teacher_first_name || ''} ${l.teacher_last_name || ''}`.trim() || 'Docente non assegnato',
        ora_inizio: l.ora_inizio,
        ora_fine: l.ora_fine,
        colore: l.colore_calendario || '#E8621A'
      })));

    } catch (err) {
      console.error("Errore recupero aule offline:", err);
      toast.error("Errore nel caricamento dei dati aule");
    } finally {
      setLoading(false);
    }
  }

  async function loadDataOnline(sid: string) {
    setLoading(true);
    try {
      const todayStr = format(new Date(), "yyyy-MM-dd");

      const [rRes, bRes, lRes] = await Promise.all([
        supabase.from("rooms").select("*").eq("school_id", sid).order("name"),
        supabase.from("room_bookings").select("*").eq("school_id", sid).eq("data", todayStr),
        supabase.from("lessons").select("id, data_ora_inizio, data_ora_fine, room_id, courses(name, colore_calendario), teachers(first_name, last_name)")
          .eq("school_id", sid)
          .gte("data_ora_inizio", `${todayStr}T00:00:00`)
          .lte("data_ora_inizio", `${todayStr}T23:59:59`)
      ]);

      setRooms(rRes.data || []);
      setBookings((bRes.data || []).map(b => ({
        id: b.id,
        room_id: b.room_id,
        tipo: 'prenotazione',
        titolo: b.titolo,
        nome_gruppo: b.nome_gruppo || 'Nessuno',
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
          ora_inizio: format(start, "HH:mm"),
          ora_fine: format(end, "HH:mm"),
          colore: l.courses?.colore_calendario || '#E8621A'
        };
      }));

    } catch (err) {
      console.error("Errore online aule:", err);
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

  const currentMinutes = timeToMinutes(referenceTime);

  const processedRooms = rooms.map(room => {
    const roomEvents = allEvents.filter(e => e.room_id === room.id);
    
    const activeEvent = roomEvents.find(e => {
      const startMin = timeToMinutes(e.ora_inizio);
      const endMin = timeToMinutes(e.ora_fine);
      return currentMinutes >= startMin && currentMinutes < endMin;
    });

    const futureEvents = roomEvents
      .filter(e => timeToMinutes(e.ora_inizio) >= currentMinutes)
      .sort((a, b) => timeToMinutes(a.ora_inizio) - timeToMinutes(b.ora_inizio));

    const nextEvent = futureEvents[0] || null;

    return {
      ...room,
      isOccupied: !!activeEvent,
      activeEvent,
      nextEvent,
      allEvents: roomEvents.sort((a, b) => timeToMinutes(a.ora_inizio) - timeToMinutes(b.ora_inizio))
    };
  });

  const filteredRooms = processedRooms.filter(r => 
    (r.name || r.nome || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const occupiedCount = processedRooms.filter(r => r.isOccupied).length;
  const freeCount = processedRooms.length - occupiedCount;

  return (
    <div className="p-8 max-w-[1600px] mx-auto flex flex-col h-screen overflow-hidden bg-white">
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-serif text-[#E8621A] mb-1 font-bold">Stato Aule in Tempo Reale</h1>
          <p className="text-muted-foreground text-sm">Controlla quali aule sono libere o occupate all'orario desiderato.</p>
        </div>
        <Button onClick={() => window.location.href = '/admin/sale'} className="bg-[#E8621A] hover:bg-[#C94E0E] text-white">
          Vai a Sale & Prove <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8 shrink-0">
        <div className="border border-stone-200 rounded-2xl p-5 flex items-center justify-between bg-stone-50/50 shadow-sm">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Aule Totali</p>
            <h3 className="text-3xl font-serif font-bold text-stone-900 mt-1">{rooms.length}</h3>
          </div>
          <div className="h-12 w-12 rounded-xl bg-stone-100 flex items-center justify-center">
            <DoorOpen className="h-6 w-6 text-stone-600" />
          </div>
        </div>

        <div className="border border-stone-200 rounded-2xl p-5 flex items-center justify-between bg-green-50/20 shadow-sm">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-green-700">Libere Ora</p>
            <h3 className="text-3xl font-serif font-bold text-green-700 mt-1">{freeCount}</h3>
          </div>
          <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
        </div>

        <div className="border border-stone-200 rounded-2xl p-5 flex items-center justify-between bg-red/5 shadow-sm">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-red-700">Occupate Ora</p>
            <h3 className="text-3xl font-serif font-bold text-red-700 mt-1">{occupiedCount}</h3>
          </div>
          <div className="h-12 w-12 rounded-xl bg-red/10 flex items-center justify-center">
            <XCircle className="h-6 w-6 text-red-600" />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-center justify-between mb-6 shrink-0 bg-stone-50 p-4 rounded-xl border border-stone-150">
        <div className="relative w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
          <Input 
            placeholder="Cerca aula per nome..." 
            className="pl-9 bg-white border-stone-200" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-bold uppercase text-stone-500 flex items-center gap-1.5 shrink-0">
            <Clock className="w-4 h-4" /> Orario di Controllo:
          </label>
          <Input 
            type="time" 
            className="w-28 bg-white border-stone-200"
            value={referenceTime}
            onChange={e => setReferenceTime(e.target.value)}
          />
          <Button variant="outline" size="sm" className="border-stone-200" onClick={() => {
            const now = new Date();
            setReferenceTime(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
          }}>
            Ora Attuale
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-[#E8621A]" />
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="text-center py-16 text-stone-400 border border-dashed rounded-xl border-stone-200">
            Nessuna aula trovata.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredRooms.map(room => (
              <div key={room.id} className={`bg-white rounded-2xl p-5 border border-stone-200 transition-all ${room.isOccupied ? 'shadow-sm border-l-4 border-l-red-500' : 'shadow-sm border-l-4 border-l-green-500'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-serif font-bold text-stone-900">{room.name || room.nome}</h3>
                    <p className="text-xs text-stone-500 mt-0.5">Capienza: {room.capacity || room.capacita} persone</p>
                  </div>
                  <Badge className={room.isOccupied ? "bg-red/10 text-red-700 hover:bg-red/20 font-bold" : "bg-green-100 text-green-700 hover:bg-green-200 font-bold"}>
                    {room.isOccupied ? "Occupata" : "Libera"}
                  </Badge>
                </div>
                <div className="space-y-4">
                  {room.isOccupied && room.activeEvent ? (
                    <div className="p-3 bg-red/5 rounded-xl border border-red/10 space-y-2">
                      <div className="flex items-center justify-between text-xs text-red-800 font-bold">
                        <span className="uppercase tracking-wide">{room.activeEvent.tipo === 'lezione' ? 'Lezione' : 'Prenotazione'}</span>
                        <span>{room.activeEvent.ora_inizio} - {room.activeEvent.ora_fine}</span>
                      </div>
                      <p className="text-sm font-bold text-stone-900 leading-snug">{room.activeEvent.titolo}</p>
                      <p className="text-xs text-stone-600 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-stone-400" /> Occupata fino alle {room.activeEvent.ora_fine}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-green-50/20 rounded-xl border border-green-100 space-y-1">
                      <p className="text-xs text-green-700 font-bold uppercase tracking-wide">Stato</p>
                      <p className="text-sm text-stone-900 font-medium">L'aula è libera all'orario selezionato.</p>
                      {room.nextEvent ? (
                        <p className="text-xs text-stone-500 pt-1">
                          Libera fino alle {room.nextEvent.ora_inizio} (inizio di: {room.nextEvent.titolo})
                        </p>
                      ) : (
                        <p className="text-xs text-stone-500 pt-1">Libera per il resto della giornata.</p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2 pt-2 border-t border-stone-100">
                    <h4 className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">Programma di Oggi</h4>
                    {room.allEvents.length === 0 ? (
                      <p className="text-xs text-stone-400 italic">Nessun evento programmato per oggi.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                        {room.allEvents.map((e: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between text-xs text-stone-600 hover:text-stone-950">
                            <span className="font-medium truncate max-w-[160px]">{e.titolo}</span>
                            <span className="font-mono text-stone-400 font-bold shrink-0">{e.ora_inizio}-{e.ora_fine}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
