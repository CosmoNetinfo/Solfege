"use client";

import { useState, useCallback } from "react";
import { Plus, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const GIORNI = [
  { key: "lunedi", label: "Lunedì" },
  { key: "martedi", label: "Martedì" },
  { key: "mercoledi", label: "Mercoledì" },
  { key: "giovedi", label: "Giovedì" },
  { key: "venerdi", label: "Venerdì" },
  { key: "sabato", label: "Sabato" },
  { key: "domenica", label: "Domenica" },
] as const;

export type SlotDisponibilita = {
  id?: string;
  giorno: string;
  ora_inizio: string;
  ora_fine: string;
};

interface DisponibilitaGridProps {
  slots: SlotDisponibilita[];
  mode: "view" | "edit";
  onChange?: (slots: SlotDisponibilita[]) => void;
}

export function DisponibilitaGrid({ slots, mode, onChange }: DisponibilitaGridProps) {
  const [newSlot, setNewSlot] = useState<{ giorno: string; ora_inizio: string; ora_fine: string } | null>(null);

  const slotsByDay = GIORNI.map((g) => ({
    ...g,
    slots: slots.filter((s) => s.giorno === g.key).sort((a, b) => a.ora_inizio.localeCompare(b.ora_inizio)),
  }));

  const addSlot = useCallback(() => {
    if (!newSlot || !newSlot.ora_inizio || !newSlot.ora_fine || !onChange) return;
    if (newSlot.ora_fine <= newSlot.ora_inizio) return;
    onChange([...slots, { giorno: newSlot.giorno, ora_inizio: newSlot.ora_inizio, ora_fine: newSlot.ora_fine }]);
    setNewSlot(null);
  }, [newSlot, slots, onChange]);

  const removeSlot = useCallback((index: number) => {
    if (!onChange) return;
    const updated = slots.filter((_, i) => i !== index);
    onChange(updated);
  }, [slots, onChange]);

  // ── VIEW MODE ──
  if (mode === "view") {
    const hasSlots = slots.length > 0;
    return (
      <div className="space-y-1">
        {!hasSlots && (
          <p className="text-xs text-muted-foreground italic">Nessuna disponibilità inserita</p>
        )}
        {slotsByDay.filter((d) => d.slots.length > 0).map((day) => (
          <div key={day.key} className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground w-16 shrink-0">{day.label.slice(0, 3)}</span>
            <div className="flex flex-wrap gap-1">
              {day.slots.map((s, i) => (
                <Badge key={i} variant="outline" className="text-[10px] font-mono border-border text-foreground px-1.5 py-0.5">
                  {s.ora_inizio.slice(0, 5)}–{s.ora_fine.slice(0, 5)}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── EDIT MODE ──
  return (
    <div className="space-y-3">
      {slotsByDay.map((day) => (
        <div key={day.key} className="flex items-start gap-3">
          <div className="w-20 shrink-0 pt-1.5">
            <span className="text-sm font-medium text-foreground">{day.label}</span>
          </div>
          <div className="flex-1 space-y-1.5">
            {day.slots.length === 0 && (
              <span className="text-xs text-muted-foreground italic">Nessuno slot</span>
            )}
            {day.slots.map((s, idx) => {
              const globalIdx = slots.findIndex(
                (sl) => sl.giorno === s.giorno && sl.ora_inizio === s.ora_inizio && sl.ora_fine === s.ora_fine
              );
              return (
                <div key={idx} className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono border-border text-foreground px-2 py-1">
                    <Clock className="h-3 w-3 mr-1 text-orange" />
                    {s.ora_inizio.slice(0, 5)} – {s.ora_fine.slice(0, 5)}
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-red"
                    onClick={() => removeSlot(globalIdx)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
            {newSlot?.giorno === day.key ? (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <Input
                  type="time"
                  className="w-28 h-8 text-xs"
                  value={newSlot.ora_inizio}
                  onChange={(e) => setNewSlot({ ...newSlot, ora_inizio: e.target.value })}
                />
                <span className="text-muted-foreground text-xs">–</span>
                <Input
                  type="time"
                  className="w-28 h-8 text-xs"
                  value={newSlot.ora_fine}
                  onChange={(e) => setNewSlot({ ...newSlot, ora_fine: e.target.value })}
                />
                <Button type="button" size="sm" className="h-8 bg-orange hover:bg-orange-dark text-white text-xs px-3" onClick={addSlot}>
                  Aggiungi
                </Button>
                <Button type="button" variant="ghost" size="sm" className="h-8 text-muted-foreground text-xs" onClick={() => setNewSlot(null)}>
                  Annulla
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-orange hover:text-orange-dark p-0"
                onClick={() => setNewSlot({ giorno: day.key, ora_inizio: "09:00", ora_fine: "13:00" })}
              >
                <Plus className="h-3 w-3 mr-1" /> Aggiungi slot
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
