import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { isDesktop } from "@/lib/is-desktop";
import { roomBookingsDb } from "@/lib/desktop-db";
import ConflictChecker from "./ConflictChecker";

interface BookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  rooms: any[];
  initialBooking?: any;
  initialSlot?: { roomId: string, time: string } | null;
  selectedDate: Date;
}

export default function BookingDialog({ 
  isOpen, 
  onClose, 
  onSaved, 
  rooms, 
  initialBooking,
  initialSlot,
  selectedDate 
}: BookingDialogProps) {
  const [loading, setLoading] = useState(false);
  const [hasConflict, setHasConflict] = useState(false);

  // Form states
  const [tipo, setTipo] = useState(initialBooking?.tipo || 'sala_prove');
  const [roomId, setRoomId] = useState(initialBooking?.room_id || initialSlot?.roomId || '');
  const [titolo, setTitolo] = useState(initialBooking?.titolo || '');
  const [nomeGruppo, setNomeGruppo] = useState(initialBooking?.nome_gruppo || '');
  const [data, setData] = useState(initialBooking?.data || format(selectedDate, "yyyy-MM-dd"));
  const [oraInizio, setOraInizio] = useState(initialBooking?.ora_inizio || initialSlot?.time || '09:00');
  
  // Calcolo ora fine (1 ora dopo l'inizio di default)
  const defaultOraFine = () => {
    if (initialBooking?.ora_fine) return initialBooking.ora_fine;
    if (initialSlot?.time) {
      const [h, m] = initialSlot.time.split(':').map(Number);
      return `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
    return '10:00';
  };
  
  const [oraFine, setOraFine] = useState(defaultOraFine());
  const [contattoNome, setContattoNome] = useState(initialBooking?.contatto_nome || '');
  const [contattoTelefono, setContattoTelefono] = useState(initialBooking?.contatto_telefono || '');
  const [note, setNote] = useState(initialBooking?.note || '');

  const isEditing = !!initialBooking;

  const handleSave = async () => {
    if (!roomId || !titolo || !data || !oraInizio || !oraFine) return;
    if (hasConflict) return;

    setLoading(true);
    try {
      const bookingData = {
        room_id: roomId,
        tipo,
        titolo,
        nome_gruppo: nomeGruppo,
        data,
        ora_inizio: oraInizio,
        ora_fine: oraFine,
        contatto_nome: contattoNome,
        contatto_telefono: contattoTelefono,
        note,
        colore: tipo === 'sala_prove' ? '#7C3AED' : tipo === 'evento' ? '#1A7A4A' : '#D97706'
      };

      if (isDesktop()) {
        if (isEditing) {
          await roomBookingsDb.update(initialBooking.id, bookingData);
        } else {
          await roomBookingsDb.create(bookingData as any);
        }
      } else {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Utente non autenticato");
        const { data: profile } = await supabase.from("profiles").select("school_id").eq("id", user.id).single();
        if (!profile?.school_id) throw new Error("Scuola non trovata");

        const supabaseData = { ...bookingData, school_id: profile.school_id };

        if (isEditing) {
          const { error } = await supabase.from("room_bookings").update(supabaseData).eq("id", initialBooking.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("room_bookings").insert(supabaseData);
          if (error) throw error;
        }
      }

      onSaved();
      onClose();
    } catch (error) {
      console.error("Errore salvataggio prenotazione:", error);
      alert("Si è verificato un errore durante il salvataggio.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!initialBooking || !confirm("Sei sicuro di voler eliminare questa prenotazione?")) return;
    
    setLoading(true);
    try {
      if (isDesktop()) {
        await roomBookingsDb.delete(initialBooking.id);
      } else {
        const supabase = createClient();
        const { error } = await supabase.from("room_bookings").delete().eq("id", initialBooking.id);
        if (error) throw error;
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error("Errore eliminazione:", err);
      alert("Si è verificato un errore durante l'eliminazione.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Modifica Prenotazione' : 'Nuova Prenotazione'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sala_prove">Sala Prove</SelectItem>
                  <SelectItem value="evento">Evento</SelectItem>
                  <SelectItem value="altro">Altro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sala *</Label>
              <Select value={roomId} onValueChange={setRoomId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona sala" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name || r.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Titolo *</Label>
            <Input value={titolo} onChange={e => setTitolo(e.target.value)} placeholder="es. Prove band, Saggio di fine anno" />
          </div>

          <div className="space-y-2">
            <Label>Nome Gruppo / Band</Label>
            <Input value={nomeGruppo} onChange={e => setNomeGruppo(e.target.value)} placeholder="es. I Dannati" />
          </div>

          <div className="space-y-2">
            <Label>Data *</Label>
            <Input type="date" value={data} onChange={e => setData(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ora Inizio *</Label>
              <Input type="time" value={oraInizio} onChange={e => setOraInizio(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Ora Fine *</Label>
              <Input type="time" value={oraFine} onChange={e => setOraFine(e.target.value)} />
            </div>
          </div>

          {roomId && data && oraInizio && oraFine && (
            <ConflictChecker
              roomId={roomId}
              dateStr={data}
              oraInizio={oraInizio}
              oraFine={oraFine}
              excludeBookingId={initialBooking?.id}
              onConflictStatusChange={setHasConflict}
            />
          )}

          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="space-y-2">
              <Label>Nome Contatto</Label>
              <Input value={contattoNome} onChange={e => setContattoNome(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Telefono Contatto</Label>
              <Input value={contattoTelefono} onChange={e => setContattoTelefono(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Note</Label>
            <Textarea value={note} onChange={e => setNote(e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          {isEditing ? (
            <Button variant="destructive" onClick={handleDelete} disabled={loading} type="button">
              Elimina
            </Button>
          ) : (
            <div></div> /* placeholder per flex-between */
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Annulla
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={loading || hasConflict || !roomId || !titolo || !data || !oraInizio || !oraFine} 
              className="bg-[#E8621A] hover:bg-[#E8621A]/90 text-white"
            >
              {loading ? "Salvataggio..." : "Salva Prenotazione"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
