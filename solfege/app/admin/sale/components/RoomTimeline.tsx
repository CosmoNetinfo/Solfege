import { useMemo } from "react";
import { format, parse } from "date-fns";
import BookingCard from "./BookingCard";

interface RoomTimelineProps {
  rooms: any[];
  bookings: any[];
  onSlotClick: (slot: { roomId: string, time: string }) => void;
  onBookingClick: (booking: any) => void;
  selectedDate: Date;
}

const START_HOUR = 8;
const END_HOUR = 22;
const HOUR_HEIGHT = 80; // pixels per hour

export default function RoomTimeline({ rooms, bookings, onSlotClick, onBookingClick, selectedDate }: RoomTimelineProps) {
  const hours = useMemo(() => {
    const h = [];
    for (let i = START_HOUR; i <= END_HOUR; i++) {
      h.push(`${i.toString().padStart(2, '0')}:00`);
      if (i !== END_HOUR) {
        h.push(`${i.toString().padStart(2, '0')}:30`);
      }
    }
    return h;
  }, []);

  const getTopOffset = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const totalHours = hours + (minutes / 60) - START_HOUR;
    return totalHours * HOUR_HEIGHT;
  };

  const getHeight = (startStr: string, endStr: string) => {
    const start = getTopOffset(startStr);
    const end = getTopOffset(endStr);
    return end - start;
  };

  if (rooms.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground p-8">
        Nessuna sala configurata per questa scuola.
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-auto relative bg-slate-50">
      {/* Colonna Orari */}
      <div className="w-20 flex-shrink-0 border-r bg-white sticky left-0 z-20">
        <div className="h-14 border-b bg-muted/30 sticky top-0 z-30" />
        <div className="relative" style={{ height: (END_HOUR - START_HOUR) * HOUR_HEIGHT }}>
          {hours.filter(h => h.endsWith(':00')).map((hour) => (
            <div 
              key={hour} 
              className="absolute w-full text-right pr-3 text-xs text-muted-foreground -translate-y-2"
              style={{ top: getTopOffset(hour) }}
            >
              {hour}
            </div>
          ))}
        </div>
      </div>

      {/* Colonne Sale */}
      <div className="flex flex-1 min-w-max">
        {rooms.map((room) => {
          const roomBookings = bookings.filter(b => b.room_id === room.id);

          return (
            <div key={room.id} className="flex-1 min-w-[200px] border-r flex flex-col relative bg-white">
              <div className="h-14 flex flex-col items-center justify-center border-b bg-muted/30 sticky top-0 z-10 font-medium">
                {room.name || room.nome}
                <span className="text-xs text-muted-foreground font-normal">
                  Capacità: {room.capacita || room.capacity || 1}
                </span>
              </div>

              <div className="relative flex-1" style={{ height: (END_HOUR - START_HOUR) * HOUR_HEIGHT }}>
                {/* Griglia orizzontale per gli slot di 30 min */}
                {hours.map((hour, idx) => (
                  <div
                    key={hour}
                    onClick={() => onSlotClick({ roomId: room.id, time: hour })}
                    className={`absolute w-full border-b border-dashed border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors z-0`}
                    style={{ 
                      top: getTopOffset(hour), 
                      height: idx === hours.length - 1 ? 0 : HOUR_HEIGHT / 2 
                    }}
                  />
                ))}

                {/* Prenotazioni/Lezioni della sala */}
                {roomBookings.map((booking) => {
                  const top = getTopOffset(booking.ora_inizio);
                  const height = getHeight(booking.ora_inizio, booking.ora_fine);

                  return (
                    <div
                      key={booking.id}
                      className="absolute w-full px-1 z-10"
                      style={{ top, height }}
                    >
                      <BookingCard booking={booking} onClick={() => onBookingClick(booking)} />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
