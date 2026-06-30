"use client";

import { useState, useEffect } from "react";
import Database from "@tauri-apps/plugin-sql";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Bell,
  Trash2,
  Plus,
  AlertTriangle,
  Loader2,
  Calendar
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

import { isDesktop } from "@/lib/is-desktop";

export default function BachecaAdminPage() {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [important, setImportant] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 1. Carica avvisi da SQLite locale
  const fetchNotices = async () => {
    if (!isDesktop()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const db = await Database.load("sqlite:solfege.db");
      const data = await db.select<any[]>(
        "SELECT * FROM school_notices ORDER BY created_at DESC"
      );
      setNotices(data || []);
    } catch (err: any) {
      console.error("Errore caricamento avvisi:", err);
      toast.error("Impossibile caricare gli avvisi: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  // 2. Crea avviso in SQLite locale
  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Titolo e contenuto sono obbligatori.");
      return;
    }

    setSubmitting(true);
    try {
      const db = await Database.load("sqlite:solfege.db");
      const id = crypto.randomUUID();
      const isImportantVal = important ? 1 : 0;

      await db.execute(
        "INSERT INTO school_notices (id, titolo, contenuto, importante) VALUES (?, ?, ?, ?)",
        [id, title, content, isImportantVal]
      );

      toast.success("Avviso pubblicato in bacheca!");
      setTitle("");
      setContent("");
      setImportant(false);
      fetchNotices();
    } catch (err: any) {
      console.error("Errore creazione avviso:", err);
      toast.error("Impossibile creare l'avviso: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Elimina avviso da SQLite locale
  const handleDeleteNotice = async (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare questo avviso dalla bacheca?")) {
      return;
    }

    try {
      const db = await Database.load("sqlite:solfege.db");
      await db.execute("DELETE FROM school_notices WHERE id = ?", [id]);
      toast.success("Avviso eliminato.");
      setNotices((prev) => prev.filter((n) => n.id !== id));
    } catch (err: any) {
      console.error("Errore eliminazione avviso:", err);
      toast.error("Impossibile eliminare l'avviso: " + err.message);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd MMMM yyyy, HH:mm", { locale: it });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto font-sans">
      <header className="space-y-1">
        <h1 className="text-3xl font-serif font-bold text-stone-900 flex items-center gap-2">
          <Bell className="text-orange h-8 w-8" /> Gestione Bacheca Avvisi
        </h1>
        <p className="text-stone-500">Scrivi comunicazioni e aggiornamenti per la bacheca del Portale Allievi.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form creazione */}
        <Card className="border border-stone-200 shadow-sm bg-white h-fit">
          <CardHeader>
            <CardTitle className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Plus size={18} className="text-orange" /> Nuovo Avviso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateNotice} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-500 uppercase">Titolo Avviso *</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Es. Chiusura festività pasquali"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-500 uppercase">Contenuto *</label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Scrivi qui la comunicazione per gli studenti..."
                  className="min-h-[120px]"
                  required
                />
              </div>

              <div className="flex items-center gap-2 py-1">
                <Checkbox
                  id="important"
                  checked={important}
                  onCheckedChange={(checked) => setImportant(!!checked)}
                />
                <label htmlFor="important" className="text-xs font-semibold text-red-600 flex items-center gap-1 cursor-pointer">
                  <AlertTriangle size={14} /> Segna come Importante (Rilievo)
                </label>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#E8621A] hover:bg-[#C94E0E] text-white flex items-center justify-center gap-1.5"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Pubblica Avviso
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Elenco avvisi pubblicati */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-stone-800">Avvisi Pubblicati in Locale</h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange" />
            </div>
          ) : notices.length > 0 ? (
            <div className="space-y-4">
              {notices.map((n) => (
                <Card key={n.id} className={`border shadow-sm overflow-hidden bg-white ${
                  n.importante ? 'border-l-4 border-l-red-600' : 'border-stone-200'
                }`}>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-stone-900 font-serif text-base">{n.titolo}</h3>
                          {n.importante === 1 && (
                            <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Importante
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-stone-400 font-medium">
                          <Calendar size={12} />
                          <span>Pubblicato il {formatDate(n.created_at)}</span>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleDeleteNotice(n.id)}
                        variant="ghost"
                        size="icon"
                        className="text-stone-400 hover:text-red-600 rounded-lg hover:bg-stone-50"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>

                    <p className="text-sm text-stone-600 whitespace-pre-line leading-relaxed">{n.contenuto}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-2 py-12 bg-stone-50/50">
              <CardContent className="flex flex-col items-center justify-center text-center space-y-3">
                <Bell className="text-stone-400 h-10 w-10" />
                <h3 className="font-semibold text-stone-700">Nessun avviso in bacheca</h3>
                <p className="text-xs text-stone-400 max-w-xs">I tuoi messaggi pubblicati appariranno qui e verranno caricati online per gli allievi al prossimo click su "Sincronizza Cloud".</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
