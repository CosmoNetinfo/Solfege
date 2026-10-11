import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { checkDidacticConflicts } from "@/lib/services/conflict-service";

interface ConflictCheckerProps {
  roomId?: string;
  teacherId?: string;
  studentId?: string;
  dateStr: string; // YYYY-MM-DD
  oraInizio: string; // HH:mm
  oraFine: string; // HH:mm
  excludeBookingId?: string;
  excludeLessonId?: string;
  onConflictStatusChange: (hasConflict: boolean) => void;
}

export default function ConflictChecker({ 
  roomId, 
  teacherId,
  studentId,
  dateStr, 
  oraInizio, 
  oraFine, 
  excludeBookingId,
  excludeLessonId,
  onConflictStatusChange
}: ConflictCheckerProps) {
  const [status, setStatus] = useState<'checking' | 'free' | 'conflict'>('free');
  const [conflictDetails, setConflictDetails] = useState<string>('');

  useEffect(() => {
    if ((!roomId && !teacherId && !studentId) || !dateStr || !oraInizio || !oraFine) {
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

      try {
        const conflicts = await checkDidacticConflicts({
          dateStr,
          oraInizio,
          oraFine,
          roomId: roomId || null,
          teacherId: teacherId || null,
          studentId: studentId || null,
          excludeBookingId,
          excludeLessonId,
        });

        if (conflicts.length > 0) {
          setStatus('conflict');
          setConflictDetails(conflicts.map(c => `${c.title}: ${c.description}`).join(' | '));
          onConflictStatusChange(true);
        } else {
          setStatus('free');
          setConflictDetails('');
          onConflictStatusChange(false);
        }
      } catch (err) {
        console.error("Errore verifica conflitti:", err);
        setStatus('free');
        onConflictStatusChange(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      checkConflicts();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [roomId, teacherId, studentId, dateStr, oraInizio, oraFine, excludeBookingId, excludeLessonId, onConflictStatusChange]);

  if (status === 'checking') {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse py-1">
        <span>Controllo disponibilità in corso...</span>
      </div>
    );
  }

  if (status === 'conflict') {
    return (
      <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-semibold text-red-900">Conflitto rilevato</p>
          <p>{conflictDetails}</p>
        </div>
      </div>
    );
  }

  if (status === 'free' && (roomId || teacherId) && dateStr && oraInizio && oraFine) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs">
        <CheckCircle2 className="w-4 h-4 shrink-0" />
        <span>Tutto libero: nessun conflitto rilevato nella fascia oraria.</span>
      </div>
    );
  }

  return null;
}
