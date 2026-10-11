'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { isDesktop } from '@/lib/is-desktop';
import { getItalianHolidays, HolidayItem } from '@/lib/holidays';
import { Calendar, Trash2, Plus, AlertTriangle, Edit2 } from 'lucide-react';
import { format } from 'date-fns';

export function HolidaysTab({ school }: { school: any }) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [closures, setClosures] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [nome, setNome] = useState('');
  const [dataInizio, setDataInizio] = useState('');
  const [dataFine, setDataFine] = useState('');
  const [tipo, setTipo] = useState<'chiusura' | 'festivita' | 'patrono'>('chiusura');

  // Conflict warning dialog states
  const [warningOpen, setWarningOpen] = useState(false);
  const [impactedLessonsCount, setImpactedLessonsCount] = useState(0);

  const currentYear = new Date().getFullYear();
  const nationalHolidays = [
    ...getItalianHolidays(currentYear),
    ...getItalianHolidays(currentYear + 1),
  ];

  useEffect(() => {
    loadClosures();
  }, [school?.id]);

  async function loadClosures() {
    if (!school?.id) return;
    setLoading(true);
    try {
      if (isDesktop()) {
        const Database = (await import('@tauri-apps/plugin-sql')).default;
        const db = await Database.load('sqlite:solfege.db');
        const rows = await db.select<any[]>(
          'SELECT * FROM school_holidays WHERE school_id = ? ORDER BY data_inizio ASC',
          [school.id]
        );
        setClosures(rows);
      } else {
        const { data, error } = await (supabase as any)
          .from('school_holidays')
          .select('*')
          .eq('school_id', school.id)
          .order('data_inizio', { ascending: true });

        if (error) throw error;
        setClosures(data || []);
      }
    } catch (e) {
      console.error('Errore caricamento chiusure:', e);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenCreate() {
    setEditingId(null);
    setNome('');
    setDataInizio('');
    setDataFine('');
    setTipo('chiusura');
    setDialogOpen(true);
  }

  function handleOpenEdit(item: any) {
    setEditingId(item.id);
    setNome(item.nome);
    setDataInizio(item.data_inizio);
    setDataFine(item.data_fine);
    setTipo(item.tipo);
    setDialogOpen(true);
  }

  async function checkImpactedLessons(start: string, end: string): Promise<number> {
    try {
      if (isDesktop()) {
        const Database = (await import('@tauri-apps/plugin-sql')).default;
        const db = await Database.load('sqlite:solfege.db');
        const rows = await db.select<any[]>(
          `SELECT COUNT(*) as count 
           FROM lessons 
           WHERE data >= ? AND data <= ? AND stato != 'annullata'`,
          [start, end]
        );
        return rows[0]?.count || 0;
      } else {
        const { count, error } = await supabase
          .from('lessons')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', school.id)
          .gte('data_ora_inizio', `${start}T00:00:00`)
          .lte('data_ora_inizio', `${end}T23:59:59`)
          .neq('status', 'cancellata');

        if (error) throw error;
        return count || 0;
      }
    } catch (e) {
      console.error('Errore conteggio lezioni impattate:', e);
      return 0;
    }
  }

  async function handleInitialSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !dataInizio) {
      toast.error('Compila tutti i campi obbligatori');
      return;
    }

    const end = dataFine || dataInizio;
    if (end < dataInizio) {
      toast.error('La data di fine non può essere precedente alla data di inizio');
      return;
    }

    // Se stiamo creando o modificando le date, controlliamo quante lezioni sono già programmate
    const count = await checkImpactedLessons(dataInizio, end);
    if (count > 0 && !editingId) {
      setImpactedLessonsCount(count);
      setWarningOpen(true);
      return;
    }

    await saveClosure(false);
  }

  async function saveClosure(cancelLessons: boolean) {
    const end = dataFine || dataInizio;

    try {
      if (isDesktop()) {
        const Database = (await import('@tauri-apps/plugin-sql')).default;
        const db = await Database.load('sqlite:solfege.db');

        if (editingId) {
          await db.execute(
            `UPDATE school_holidays 
             SET nome = ?, data_inizio = ?, data_fine = ?, tipo = ? 
             WHERE id = ?`,
            [nome, dataInizio, end, tipo, editingId]
          );
        } else {
          const id = crypto.randomUUID();
          await db.execute(
            `INSERT INTO school_holidays (id, school_id, nome, data_inizio, data_fine, tipo)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [id, school.id, nome, dataInizio, end, tipo]
          );
        }

        if (cancelLessons) {
          await db.execute(
            `UPDATE lessons 
             SET stato = 'annullata' 
             WHERE data >= ? AND data <= ? AND stato != 'annullata'`,
            [dataInizio, end]
          );
          toast.success(`${impactedLessonsCount} lezioni annullate nel periodo di chiusura`);
        }
      } else {
        if (editingId) {
          const { error } = await (supabase as any)
            .from('school_holidays')
            .update({ nome, data_inizio: dataInizio, data_fine: end, tipo })
            .eq('id', editingId);
          if (error) throw error;
        } else {
          const { error } = await (supabase as any)
            .from('school_holidays')
            .insert({ school_id: school.id, nome, data_inizio: dataInizio, data_fine: end, tipo });
          if (error) throw error;
        }

        if (cancelLessons) {
          await supabase
            .from('lessons')
            .update({ status: 'cancellata' as any })
            .eq('school_id', school.id)
            .gte('data_ora_inizio', `${dataInizio}T00:00:00`)
            .lte('data_ora_inizio', `${end}T23:59:59`)
            .neq('status', 'cancellata' as any);
          toast.success(`${impactedLessonsCount} lezioni annullate nel periodo`);
        }
      }

      toast.success(editingId ? 'Chiusura modificata' : 'Chiusura salvata');
      setDialogOpen(false);
      setWarningOpen(false);
      loadClosures();
    } catch (e) {
      console.error('Errore salvataggio chiusura:', e);
      toast.error('Errore durante il salvataggio');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Sei sicuro di voler eliminare questa chiusura?')) return;
    try {
      if (isDesktop()) {
        const Database = (await import('@tauri-apps/plugin-sql')).default;
        const db = await Database.load('sqlite:solfege.db');
        await db.execute('DELETE FROM school_holidays WHERE id = ?', [id]);
      } else {
        const { error } = await (supabase as any).from('school_holidays').delete().eq('id', id);
        if (error) throw error;
      }
      toast.success('Chiusura eliminata');
      loadClosures();
    } catch (e) {
      console.error('Errore eliminazione:', e);
      toast.error('Errore durante l\'eliminazione');
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Chiusure, Festività e Patrono</h3>
          <p className="text-sm text-muted-foreground">
            Configura le chiusure della scuola (vacanze natalizie, pasquali, ponti) e il patrono locale.
            Le nuove generazioni di lezioni salteranno automaticamente questi giorni.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="bg-[#E8621A] text-white hover:bg-[#E8621A]/90 gap-2">
          <Plus className="h-4 w-4" /> Aggiungi Chiusura
        </Button>
      </div>

      {/* Chiusure personalizzate della scuola */}
      <div className="bg-white rounded-lg border p-4 space-y-4">
        <h4 className="font-medium text-sm text-stone-700">Periodi di Chiusura e Patrono della Scuola</h4>
        {closures.length === 0 ? (
          <p className="text-sm text-stone-500 py-4 text-center">Nessuna chiusura personalizzata inserita.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Dal</TableHead>
                <TableHead>Al</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {closures.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nome}</TableCell>
                  <TableCell>
                    <Badge variant={c.tipo === 'patrono' ? 'secondary' : 'default'} className="capitalize">
                      {c.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell>{c.data_inizio}</TableCell>
                  <TableCell>{c.data_fine}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(c)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(c.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Festività nazionali calcolate in automatico */}
      <div className="bg-stone-50 rounded-lg border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm text-stone-700">Festività Nazionali Italiane (Gestite Automaticamente)</h4>
          <span className="text-xs text-stone-500">Include Pasquetta calcolata dinamicamente</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-sm text-stone-600">
          {nationalHolidays.slice(0, 11).map((nh, idx) => (
            <div key={idx} className="flex items-center justify-between bg-white px-3 py-2 rounded border text-xs">
              <span className="font-medium">{nh.nome}</span>
              <span className="text-stone-400 font-mono">{nh.data_inizio}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Dialog Aggiunta/Modifica Chiusura */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={handleInitialSubmit}>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Modifica Chiusura' : 'Nuova Chiusura o Festività'}</DialogTitle>
              <DialogDescription>
                Inserisci i dettagli del periodo di sospensione didattica.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Descrizione / Nome</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="es. Vacanze di Natale, Festa del Patrono, Ponte"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo</Label>
                <Select value={tipo} onValueChange={(val: any) => setTipo(val)}>
                  <SelectTrigger id="tipo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chiusura">Chiusura Scolastica (Vacanze/Ponte)</SelectItem>
                    <SelectItem value="patrono">Patrono Locale</SelectItem>
                    <SelectItem value="festivita">Altra Festività</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataInizio">Data Inizio</Label>
                  <Input
                    id="dataInizio"
                    type="date"
                    value={dataInizio}
                    onChange={(e) => {
                      setDataInizio(e.target.value);
                      if (!dataFine) setDataFine(e.target.value);
                    }}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataFine">Data Fine</Label>
                  <Input
                    id="dataFine"
                    type="date"
                    value={dataFine}
                    onChange={(e) => setDataFine(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annulla
              </Button>
              <Button type="submit" className="bg-[#E8621A] text-white hover:bg-[#E8621A]/90">
                Salva
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog di avviso lezioni impattate */}
      <Dialog open={warningOpen} onOpenChange={setWarningOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" /> Lezioni Rilevate nel Periodo
            </DialogTitle>
            <DialogDescription className="pt-2 text-stone-700">
              Nel periodo selezionato ({dataInizio} - {dataFine || dataInizio}) sono presenti{' '}
              <strong className="text-black font-semibold">{impactedLessonsCount} lezioni</strong> già programmate.
              <br /><br />
              Come desideri procedere?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setWarningOpen(false)}>
              Annulla Operazione
            </Button>
            <Button variant="secondary" onClick={() => saveClosure(false)}>
              Mantieni Lezioni Esistenti
            </Button>
            <Button variant="destructive" onClick={() => saveClosure(true)}>
              Annulla {impactedLessonsCount} Lezioni
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
