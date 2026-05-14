'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, Globe, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { getInstruments, addInstrument, deleteInstrument } from '@/lib/supabase/queries';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

type Instrument = {
  id: string;
  name: string;
  is_global: boolean;
  school_id: string | null;
};

export function InstrumentsTab({ schoolId }: { schoolId: string }) {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadInstruments();
  }, [schoolId]);

  const loadInstruments = async () => {
    try {
      const data = await getInstruments(supabase, schoolId);
      setInstruments(data as Instrument[]);
    } catch (e) {
      toast.error('Errore caricamento strumenti');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      setIsAdding(true);
      const newInst = await addInstrument(supabase, schoolId, newName.trim());
      setInstruments(prev => [...prev, newInst as Instrument].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName('');
      toast.success('Strumento aggiunto');
    } catch (e) {
      toast.error("Errore durante l'aggiunta");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteInstrument(supabase, id);
      setInstruments(prev => prev.filter(i => i.id !== id));
      toast.success('Strumento eliminato');
    } catch (e) {
      toast.error('Impossibile eliminare: strumento in uso');
    }
  };

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );

  const globalInstruments = instruments.filter(i => i.is_global);
  const customInstruments = instruments.filter(i => !i.is_global);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium">Strumenti e Materie</h3>
        <p className="text-sm text-muted-foreground">
          Gli strumenti globali sono predefiniti e disponibili a tutte le scuole. Puoi aggiungere strumenti personalizzati per la tua scuola.
        </p>
      </div>

      {/* Strumenti Globali — sola lettura */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-muted-foreground" />
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Strumenti Globali
          </h4>
          <Badge variant="outline" className="text-xs">Sola lettura</Badge>
        </div>
        <div className="border rounded-md overflow-hidden max-w-2xl">
          <table className="w-full text-sm text-left">
            <tbody className="divide-y">
              {globalInstruments.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-muted-foreground">
                    Nessuno strumento globale disponibile.
                  </td>
                </tr>
              ) : (
                globalInstruments.map(inst => (
                  <tr key={inst.id} className="bg-stone-50/50">
                    <td className="px-4 py-2.5 text-foreground">{inst.name}</td>
                    <td className="px-4 py-2.5 text-right">
                      <Lock className="w-3.5 h-3.5 text-muted-foreground/50 ml-auto" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Strumenti Custom — modificabili */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Strumenti Personalizzati
          </h4>
          <Badge variant="outline" className="text-xs border-orange/40 text-orange">Modificabili</Badge>
        </div>

        <form onSubmit={handleAdd} className="flex items-center gap-4 max-w-md">
          <Input
            placeholder="Nuovo strumento (es. Basso fretless)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Button
            type="submit"
            disabled={!newName.trim() || isAdding}
            className="bg-[#E8621A] text-white hover:bg-[#E8621A]/90 shrink-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Aggiungi
          </Button>
        </form>

        <div className="border rounded-md overflow-hidden max-w-2xl">
          <table className="w-full text-sm text-left">
            <tbody className="divide-y">
              {customInstruments.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-muted-foreground">
                    Nessuno strumento personalizzato. Aggiungine uno qui sopra.
                  </td>
                </tr>
              ) : (
                customInstruments.map(inst => (
                  <tr key={inst.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">{inst.name}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(inst.id)}
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
