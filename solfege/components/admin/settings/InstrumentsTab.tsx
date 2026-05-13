'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { getInstruments, addInstrument, deleteInstrument } from '@/lib/supabase/queries';
import { Skeleton } from '@/components/ui/skeleton';

export function InstrumentsTab({ schoolId }: { schoolId: string }) {
  const [instruments, setInstruments] = useState<any[]>([]);
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
      setInstruments(data);
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
      setInstruments([...instruments, newInst].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName('');
      toast.success('Strumento aggiunto');
    } catch (e) {
      toast.error('Errore durante l\'aggiunta');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteInstrument(supabase, id);
      setInstruments(instruments.filter(i => i.id !== id));
      toast.success('Strumento eliminato');
    } catch (e) {
      toast.error('Impossibile eliminare: strumento in uso');
    }
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-10 w-full"/><Skeleton className="h-10 w-full"/></div>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Strumenti e Materie</h3>
        <p className="text-sm text-muted-foreground">
          Gestisci l'elenco degli strumenti e delle materie insegnate nella scuola.
        </p>
      </div>

      <form onSubmit={handleAdd} className="flex items-center gap-4 max-w-md">
        <Input 
          placeholder="Nuovo strumento (es. Basso elettrico)" 
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <Button type="submit" disabled={!newName.trim() || isAdding} className="bg-[#E8621A] text-white hover:bg-[#E8621A]/90">
          <Plus className="w-4 h-4 mr-2" />
          Aggiungi
        </Button>
      </form>

      <div className="border rounded-md overflow-hidden max-w-2xl">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 w-20 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {instruments.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-center text-muted-foreground">Nessuno strumento presente.</td>
              </tr>
            ) : (
              instruments.map(inst => (
                <tr key={inst.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">{inst.name}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(inst.id)} className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-100">
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
  );
}
