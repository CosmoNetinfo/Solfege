"use client";

import { useState } from "react";
import { BookOpen, PenLine, Lock, Save, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface LessonTopicEditorProps {
  lessonId: string;
  initialTopic?: string;
  initialHomework?: string;
  initialInternalNotes?: string;
  onSave?: () => void;
}

export function LessonTopicEditor({ 
  lessonId, 
  initialTopic = "", 
  initialHomework = "", 
  initialInternalNotes = "",
  onSave 
}: LessonTopicEditorProps) {
  const [topic, setTopic] = useState(initialTopic);
  const [homework, setHomework] = useState(initialHomework);
  const [internalNotes, setInternalNotes] = useState(initialInternalNotes);
  const [isSaving, setIsSaving] = useState(false);
  const supabase = createClient();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { isDesktop } = await import("@/lib/is-desktop");
      if (isDesktop()) {
        const Database = (await import("@tauri-apps/plugin-sql")).default;
        const db = await Database.load("sqlite:solfege.db");

        await db.execute(
          "UPDATE lessons SET argomenti = ?, compiti = ?, note = ? WHERE id = ?",
          [topic, homework, internalNotes, lessonId]
        );

        toast.success("Registro lezione aggiornato");
        if (onSave) onSave();
        setIsSaving(false);
        return;
      }

      // Web Flow
      const { error } = await supabase
        .from("lessons")
        .update({
          topic,
          homework,
          internal_notes: internalNotes
        })
        .eq("id", lessonId);

      if (error) throw error;
      
      toast.success("Registro lezione aggiornato");
      if (onSave) onSave();
    } catch (error) {
      console.error(error);
      toast.error("Errore durante il salvataggio");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-orange" />
            <h3 className="text-sm font-bold uppercase tracking-tight text-stone-500">Registro Lezione</h3>
        </div>
        
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase text-stone-400 flex items-center gap-1.5">
            <PenLine className="h-3 w-3" /> Argomenti Trattati (Visibile Allievi)
          </label>
          <Textarea 
            placeholder="Cosa avete fatto oggi a lezione?"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="min-h-[80px] bg-white border-stone-200 focus:ring-orange/20"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase text-stone-400 flex items-center gap-1.5">
            <BookOpen className="h-3 w-3" /> Compiti Assegnati (Visibile Allievi)
          </label>
          <Textarea 
            placeholder="Esercizi, brani o teoria per la prossima volta..."
            value={homework}
            onChange={(e) => setHomework(e.target.value)}
            className="min-h-[80px] bg-white border-stone-200 focus:ring-orange/20"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase text-stone-400 flex items-center gap-1.5">
            <Lock className="h-3 w-3" /> Note Interne (Solo Segreteria/Docente)
          </label>
          <Textarea 
            placeholder="Note di progresso, criticità o altro..."
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
            className="min-h-[60px] bg-stone-50 border-stone-200 italic"
          />
        </div>
      </div>

      <Button 
        onClick={handleSave} 
        disabled={isSaving}
        className="w-full bg-orange hover:bg-orange-dark text-white font-bold"
      >
        {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
        Salva Registro
      </Button>
    </div>
  );
}
