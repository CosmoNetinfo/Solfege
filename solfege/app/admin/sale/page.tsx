"use client";

import { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
import { it } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import RoomTimeline from "./components/RoomTimeline";
import BookingDialog from "./components/BookingDialog";
import { isDesktop } from "@/lib/is-desktop";
import { roomsDb, roomBookingsDb, lessonsDb } from "@/lib/desktop-db";

export default function SalePage() {
  const supabase = createClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [rooms, setRooms] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ roomId: string, time: string } | null>(null);

  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate]);

  async function loadData(date: Date) {
    const dateStr = format(date, "yyyy-MM-dd");

    if (isDesktop()) {
      try {
        const allRooms = await roomsDb.getAll();
        setRooms(allRooms);

        const dailyBookings = await roomBookingsDb.getByDate(dateStr);
        setBookings(dailyBookings);

        const dailyLessons = await lessonsDb.getByDate(dateStr);
        setLessons(dailyLessons.map(l => ({
          id: `lesson-${l.id}`,
          room_id: l.room_id || '',
          tipo: 'lezione',
          titolo: l.course_nome || 'Lezione',
          nome_gruppo: `${l.teacher_nome} ${l.teacher_cognome}`,
          ora_inizio: l.ora_inizio,
          ora_fine: l.ora_fine,
          colore: l.colore_calendario || '#E8621A',
        })));
      } catch (err) {
        console.error("Error loading SQLite data:", err);
      }
      return;
    }

    // Supabase fetching
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from("profiles").select("school_id").eq("id", user.id).single();
    if (!profile?.school_id) return;

    const [rRes, bRes, lRes] = await Promise.all([
      supabase.from("rooms").select("*").eq("school_id", profile.school_id).order("name"),
      supabase.from("room_bookings").select("*, rooms(name)").eq("school_id", profile.school_id).eq("data", dateStr),
      supabase.from("lessons").select("id, data_ora_inizio, data_ora_fine, room_id, courses(name, colore_calendario), teachers(first_name, last_name)")
        .eq("school_id", profile.school_id)
        // Extract lessons for this day
        .gte("data_ora_inizio", `${dateStr}T00:00:00`)
        .lte("data_ora_inizio", `${dateStr}T23:59:59`)
    ]);

    setRooms(rRes.data || []);
    setBookings(bRes.data || []);
    
    // Map lessons to a common format
    const mappedLessons = (lRes.data || []).map((l: any) => {
      const startDate = new Date(l.data_ora_inizio);
      const endDate = new Date(l.data_ora_fine);
      return {
        id: `lesson-${l.id}`,
        room_id: l.room_id,
        tipo: 'lezione',
        titolo: l.courses?.name || 'Lezione',
        nome_gruppo: l.teachers ? `${l.teachers.first_name} ${l.teachers.last_name}` : '',
        ora_inizio: format(startDate, 'HH:mm'),
        ora_fine: format(endDate, 'HH:mm'),
        colore: l.courses?.colore_calendario || '#E8621A',
      }
    });

    setLessons(mappedLessons);
  }

  const handleDateChange = (days: number) => {
    setSelectedDate(prev => addDays(prev, days));
  };

  const handleOpenNewBooking = (slot?: { roomId: string, time: string }) => {
    setSelectedBooking(null);
    setSelectedSlot(slot || null);
    setIsDialogOpen(true);
  };

  const handleEditBooking = (booking: any) => {
    if (booking.tipo === 'lezione') return; // Non modificare le lezioni da qui
    setSelectedBooking(booking);
    setSelectedSlot(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto flex flex-col h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif text-[#E8621A] mb-2">Sale & Prove</h1>
          <p className="text-muted-foreground">Gestisci le prenotazioni e l'occupazione delle aule.</p>
        </div>
        <Button onClick={() => handleOpenNewBooking()} className="bg-[#E8621A] hover:bg-[#E8621A]/90 text-white gap-2">
          <Plus className="w-4 h-4" /> Nuova Prenotazione
        </Button>
      </div>

      <div className="flex items-center justify-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => handleDateChange(-1)}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-xl font-medium w-64 text-center capitalize">
          {format(selectedDate, "EEEE d MMMM yyyy", { locale: it })}
        </h2>
        <Button variant="outline" size="icon" onClick={() => handleDateChange(1)}>
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button variant="ghost" onClick={() => setSelectedDate(new Date())}>
          Oggi
        </Button>
      </div>

      <div className="flex-1 overflow-hidden border rounded-xl bg-card shadow-sm flex flex-col">
        <RoomTimeline 
          rooms={rooms} 
          bookings={[...bookings, ...lessons]} 
          onSlotClick={handleOpenNewBooking}
          onBookingClick={handleEditBooking}
          selectedDate={selectedDate}
        />
      </div>

      {isDialogOpen && (
        <BookingDialog 
          isOpen={isDialogOpen}
          onClose={() => { setIsDialogOpen(false); setSelectedBooking(null); setSelectedSlot(null); }}
          onSaved={() => loadData(selectedDate)}
          rooms={rooms}
          initialBooking={selectedBooking}
          initialSlot={selectedSlot}
          selectedDate={selectedDate}
        />
      )}
    </div>
  );
}
