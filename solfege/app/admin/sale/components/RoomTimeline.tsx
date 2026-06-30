import { useMemo } from "react";
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
const HOUR_HEIGHT = 80;   // px per ora
const HALF_HEIGHT = HOUR_HEIGHT / 2; // 40px per mezz'ora
const HEADER_HEIGHT = 56; // h-14 = 56px — deve coincidere con l'header sticky

export default function RoomTimeline({ rooms, bookings, onSlotClick, onBookingClick, selectedDate }: RoomTimelineProps) {
  // Slot interi: 08:00 … 22:00
  const fullHours = useMemo(() => {
    const h: string[] = [];
    for (let i = START_HOUR; i <= END_HOUR; i++) {
      h.push(`${i.toString().padStart(2, '0')}:00`);
    }
    return h;
  }, []);

  // Tutti gli slot (ore + mezz'ore), escluso l'ultimo 22:00 che non ha uno slot cliccabile
  const slots = useMemo(() => {
    const h: string[] = [];
    for (let i = START_HOUR; i < END_HOUR; i++) {
      h.push(`${i.toString().padStart(2, '0')}:00`);
      h.push(`${i.toString().padStart(2, '0')}:30`);
    }
    return h; // 28 slot: 08:00 08:30 09:00 … 21:30
  }, []);

  const getTopOffset = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return (h - START_HOUR + m / 60) * HOUR_HEIGHT;
  };

  const getHeight = (startStr: string, endStr: string) => {
    return getTopOffset(endStr) - getTopOffset(startStr);
  };

  // Altezza totale della griglia: da 08:00 a 22:00
  const gridHeight = (END_HOUR - START_HOUR) * HOUR_HEIGHT; // 1120px

  if (rooms.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground p-8">
        Nessuna sala configurata per questa scuola.
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-auto relative bg-white">

      {/* ── COLONNA ORARI ────────────────────────────────── */}
      <div className="w-20 flex-shrink-0 border-r bg-white sticky left-0 z-20 flex flex-col">
        {/* Spacer che allinea la colonna orari con gli header delle sale */}
        <div style={{ height: HEADER_HEIGHT }} className="border-b bg-white sticky top-0 z-30 flex-shrink-0" />

        {/* Area orari: stessa altezza della griglia */}
        <div className="relative flex-shrink-0" style={{ height: gridHeight }}>
          {fullHours.map((hour) => {
            const top = getTopOffset(hour);
            return (
              <div
                key={hour}
                className="absolute w-full text-right pr-3 text-xs text-muted-foreground select-none"
                style={{
                  top,
                  // Allinea il testo: 2px sotto la linea di griglia così
                  // è leggibile e non va sotto l'header per 08:00
                  transform: top === 0 ? 'none' : 'translateY(-50%)',
                  paddingTop: top === 0 ? '2px' : undefined,
                }}
              >
                {hour}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── COLONNE SALE ─────────────────────────────────── */}
      <div className="flex flex-1 min-w-max">
        {rooms.map((room) => {
          const roomBookings = bookings.filter(b => b.room_id === room.id);

          return (
            <div key={room.id} className="flex-1 min-w-[200px] border-r flex flex-col bg-white last:border-r-0">
              {/* Header sala — sticky, stessa altezza dello spacer orari */}
              <div
                style={{ height: HEADER_HEIGHT }}
                className="flex flex-col items-center justify-center border-b bg-white sticky top-0 z-10 font-medium flex-shrink-0"
              >
                {room.name || room.nome}
                <span className="text-xs text-muted-foreground font-normal">
                  Capacità: {room.capacita || room.capacity || 1}
                </span>
              </div>

              {/* Griglia + prenotazioni */}
              <div className="relative flex-shrink-0 bg-white" style={{ height: gridHeight }}>

                {/* Linee griglia — ogni slot da 30 min */}
                {slots.map((slot) => {
                  const isFullHour = slot.endsWith(':00');
                  return (
                    <div
                      key={slot}
                      onClick={() => onSlotClick({ roomId: room.id, time: slot })}
                      className="absolute w-full cursor-pointer hover:bg-orange-50/30 transition-colors"
                      style={{
                        top: getTopOffset(slot),
                        height: HALF_HEIGHT,
                        borderTop: isFullHour
                          ? '1px solid #e2e8f0'   // slate-200 — linea oraria solida
                          : '1px dashed #f1f5f9',  // slate-100 — mezz'ora tratteggiata
                      }}
                    />
                  );
                })}

                {/* Linea finale 22:00 */}
                <div
                  className="absolute w-full pointer-events-none"
                  style={{
                    top: gridHeight,
                    borderTop: '1px solid #e2e8f0',
                  }}
                />

                {/* Prenotazioni e lezioni */}
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
