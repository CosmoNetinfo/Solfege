import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isDesktop } from "@/lib/is-desktop";
import { roomBookingsDb, lessonsDb } from "@/lib/desktop-db";

interface ConflictCheckerProps {
  roomId: string;
  dateStr: string; // YYYY-MM-DD
  oraInizio: string; // HH:mm
  oraFine: string; // HH:mm
  excludeBookingId?: string;
  onConflictStatusChange: (hasConflict: boolean) => void;
}

export default function ConflictChecker({ 
  roomId, 
  dateStr, 
  oraInizio, 
  oraFine, 
  excludeBookingId,
  onConflictStatusChange
}: ConflictCheckerProps) {
  const [status, setStatus] = useState<'checking' | 'free' | 'conflict'>('free');
  const [conflictDetails, setConflictDetails] = useState<string>('');

  useEffect(() => {
    if (!roomId || !dateStr || !oraInizio || !oraFine) {
      setStatus('free');
      onConflictStatusChange(false);
      return;
    }

    if (oraInizio >= oraFine) {
      setStatus('conflict');
      setConflictDetails("L'ora di fine deve essere successiva all'ora di inizio.");
      onConflictStatusChange(true);
      return;
    }

    const checkConflicts = async () => {
      setStatus('checking');
      let hasConflict = false;
      let details = "";

      try {
        if (isDesktop()) {
          // Check SQLite
          const isBookingConflict = await roomBookingsDb.checkConflict(roomId, dateStr, oraInizio, oraFine, excludeBookingId);
          if (isBookingConflict) {
            hasConflict = true;
            details = "Sala già prenotata in questa fascia oraria.";
          } else {
            // Check lessons
            const dailyLessons = await lessonsDb.getByDate(dateStr);
            const overlappingLesson = dailyLessons.find(l => 
              l.room_id === roomId && 
              l.ora_inizio < oraFine && 
              l.ora_fine > oraInizio
            );
            if (overlappingLesson) {
              hasConflict = true;
              details = `Sala occupata da una lezione (${overlappingLesson.course_nome}) dalle ${overlappingLesson.ora_inizio} alle ${overlappingLesson.ora_fine}.`;
            }
          }
        } else {
          // Check Supabase
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          const { data: profile } = await supabase.from("profiles").select("school_id").eq("id", user.id).single();
          if (!profile) return;

          // Bookings query
          let bQuery = supabase.from("room_bookings")
            .select("titolo, ora_inizio, ora_fine")
            .eq("school_id", profile.school_id as string)
            .eq("room_id", roomId)
            .eq("data", dateStr)
            .lt("ora_inizio", oraFine)
            .gt("ora_fine", oraInizio);
          
          if (excludeBookingId) {
            bQuery = bQuery.neq("id", excludeBookingId);
          }
          
          const { data: bData } = await bQuery;
          
          if (bData && bData.length > 0) {
            hasConflict = true;
            details = `Sala occupata: ${bData[0].titolo} dalle ${bData[0].ora_inizio.substring(0,5)} alle ${bData[0].ora_fine.substring(0,5)}`;
          } else {
            // Lessons query
            const { data: lData } = await supabase.from("lessons")
              .select("courses(name), data_ora_inizio, data_ora_fine")
              .eq("school_id", profile.school_id as string)
              .eq("room_id", roomId)
              .gte("data_ora_inizio", `${dateStr}T00:00:00`)
              .lte("data_ora_inizio", `${dateStr}T23:59:59`);
              
            const overlapping = (lData || []).find((l: any) => {
              const lessonStart = l.data_ora_inizio.split('T')[1].substring(0, 5);
              const lessonEnd = l.data_ora_fine.split('T')[1].substring(0, 5);
              return lessonStart < oraFine && lessonEnd > oraInizio;
            });
            
            if (overlapping) {
              hasConflict = true;
              const lessonStart = overlapping.data_ora_inizio.split('T')[1].substring(0, 5);
              const lessonEnd = overlapping.data_ora_fine.split('T')[1].substring(0, 5);
              details = `Sala occupata da lezione (${(overlapping.courses as any)?.name}) dalle ${lessonStart} alle ${lessonEnd}`;
            }
          }
        }

        setStatus(hasConflict ? 'conflict' : 'free');
        setConflictDetails(details);
        onConflictStatusChange(hasConflict);
      } catch (err) {
        console.error("Conflict check failed:", err);
      }
    };

    const timeoutId = setTimeout(() => {
      checkConflicts();
    }, 300); // debounce

    return () => clearTimeout(timeoutId);
  }, [roomId, dateStr, oraInizio, oraFine, excludeBookingId, onConflictStatusChange]);

  if (status === 'checking') {
    return <div className="text-sm text-muted-foreground mt-2">Verifica disponibilità...</div>;
  }

  if (status === 'conflict') {
    return (
      <div className="flex items-center gap-2 p-3 mt-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span>{conflictDetails}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-3 mt-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md">
      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
      <span>Sala disponibile in questo orario.</span>
    </div>
  );
}
