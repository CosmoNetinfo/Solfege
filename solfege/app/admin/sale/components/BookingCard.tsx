import { Calendar, Music2, Users, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookingCardProps {
  booking: any;
  onClick: () => void;
}

export default function BookingCard({ booking, onClick }: BookingCardProps) {
  const isLezione = booking.tipo === 'lezione';
  const color = booking.colore || (isLezione ? '#E8621A' : '#7C3AED');
  
  const getIcon = () => {
    switch(booking.tipo) {
      case 'lezione': return <Users className="w-3 h-3" />;
      case 'sala_prove': return <Music2 className="w-3 h-3" />;
      case 'evento': return <Calendar className="w-3 h-3" />;
      default: return <AlertCircle className="w-3 h-3" />;
    }
  };

  return (
    <div 
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "w-full h-full rounded-md border p-2 flex flex-col cursor-pointer transition-shadow hover:shadow-md overflow-hidden",
        isLezione ? "opacity-90" : "opacity-100"
      )}
      style={{ 
        backgroundColor: `${color}1A`, 
        borderColor: `${color}40`,
        borderLeft: `4px solid ${color}`,
      }}
    >
      <div className="flex items-start justify-between gap-1 mb-1">
        <div className="font-semibold text-xs truncate" style={{ color: color }}>
          {booking.titolo}
        </div>
        <div style={{ color: color }} className="opacity-80 flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
      </div>
      
      {booking.nome_gruppo && (
        <div className="text-[10px] text-slate-600 truncate leading-tight">
          {booking.nome_gruppo}
        </div>
      )}
      
      <div className="text-[10px] font-medium mt-auto text-slate-500">
        {booking.ora_inizio} - {booking.ora_fine}
      </div>
    </div>
  );
}
