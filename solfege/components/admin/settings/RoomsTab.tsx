'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, Pencil, X } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { getRooms, addRoom, deleteRoom } from '@/lib/supabase/queries';
import { Skeleton } from '@/components/ui/skeleton';

const formSchema = z.object({
  name: z.string().min(2, 'Nome troppo corto'),
  capacity: z.coerce.number().min(1, 'Minimo 1 persona'),
  insonorizzata: z.boolean().default(false),
});

export function RoomsTab({ schoolId }: { schoolId: string }) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      capacity: 1,
      insonorizzata: false,
    },
  });

  useEffect(() => {
    loadRooms();
  }, [schoolId]);

  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);

  const loadRooms = async () => {
    try {
      const { isDesktop } = await import("@/lib/is-desktop");
      if (isDesktop()) {
        const Database = (await import("@tauri-apps/plugin-sql")).default;
        const db = await Database.load("sqlite:solfege.db");
        // Mappiamo le colonne locali SQLite a quelle del frontend (SQLite mono-scuola non ha school_id e insonorizzata)
        const data = await db.select<any[]>(
          "SELECT id, nome as name, capacita as capacity FROM rooms ORDER BY nome ASC"
        );
        setRooms(data.map(r => ({
          ...r,
          insonorizzata: false
        })));
        setLoading(false);
        return;
      }

      // Web Flow
      const data = await getRooms(supabase, schoolId);
      setRooms(data);
    } catch (e) {
      toast.error('Errore caricamento aule');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (room: any) => {
    setEditingRoomId(room.id);
    form.setValue('name', room.name);
    form.setValue('capacity', room.capacity);
    form.setValue('insonorizzata', room.insonorizzata);
  };

  const cancelEdit = () => {
    setEditingRoomId(null);
    form.reset({
      name: '',
      capacity: 1,
      insonorizzata: false
    });
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const { isDesktop } = await import("@/lib/is-desktop");
      if (isDesktop()) {
        const Database = (await import("@tauri-apps/plugin-sql")).default;
        const db = await Database.load("sqlite:solfege.db");

        if (editingRoomId) {
          // UPDATE offline
          await db.execute(
            `UPDATE rooms SET nome = ?, capacita = ? WHERE id = ?`,
            [values.name, values.capacity, editingRoomId]
          );

          setRooms(rooms.map(r => r.id === editingRoomId ? {
            ...r,
            name: values.name,
            capacity: values.capacity
          } : r).sort((a, b) => a.name.localeCompare(b.name)));

          toast.success('Aula aggiornata');
          cancelEdit();
        } else {
          // INSERT offline
          const newRoomId = crypto.randomUUID();
          await db.execute(
            `INSERT INTO rooms (id, nome, capacita)
             VALUES (?, ?, ?)`,
            [newRoomId, values.name, values.capacity]
          );

          const newRoom = {
            id: newRoomId,
            name: values.name,
            capacity: values.capacity,
            insonorizzata: false
          };

          setRooms([...rooms, newRoom].sort((a, b) => a.name.localeCompare(b.name)));
          form.reset();
          toast.success('Aula aggiunta');
        }
        return;
      }

      // Web Flow
      if (editingRoomId) {
        const { error } = await supabase
          .from("rooms")
          .update({
            name: values.name,
            capacity: values.capacity,
            insonorizzata: values.insonorizzata
          })
          .eq("id", editingRoomId);

        if (error) throw error;

        setRooms(rooms.map(r => r.id === editingRoomId ? {
          ...r,
          name: values.name,
          capacity: values.capacity,
          insonorizzata: values.insonorizzata
        } : r).sort((a, b) => a.name.localeCompare(b.name)));

        toast.success('Aula aggiornata');
        cancelEdit();
      } else {
        const newRoom = await addRoom(supabase, schoolId, values.name, values.capacity, values.insonorizzata);
        setRooms([...rooms, newRoom].sort((a, b) => a.name.localeCompare(b.name)));
        form.reset();
        toast.success('Aula aggiunta');
      }
    } catch (e) {
      toast.error('Errore durante il salvataggio');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { isDesktop } = await import("@/lib/is-desktop");
      if (isDesktop()) {
        const Database = (await import("@tauri-apps/plugin-sql")).default;
        const db = await Database.load("sqlite:solfege.db");

        // Controlla se l'aula è usata in qualche lezione
        const inUse = await db.select<any[]>("SELECT id FROM lessons WHERE room_id = ? LIMIT 1", [id]);
        if (inUse && inUse.length > 0) {
          throw new Error("in_use");
        }

        await db.execute("DELETE FROM rooms WHERE id = ?", [id]);
        setRooms(rooms.filter(r => r.id !== id));
        toast.success('Aula eliminata');
        if (editingRoomId === id) cancelEdit();
        return;
      }

      // Web Flow
      await deleteRoom(supabase, id);
      setRooms(rooms.filter(r => r.id !== id));
      toast.success('Aula eliminata');
      if (editingRoomId === id) cancelEdit();
    } catch (e: any) {
      if (e.message === "in_use") {
        toast.error('Impossibile eliminare: aula in uso');
      } else {
        toast.error('Impossibile eliminare: aula in uso');
      }
    }
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-10 w-full"/><Skeleton className="h-10 w-full"/></div>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Aule</h3>
        <p className="text-sm text-muted-foreground">
          Gestisci le aule disponibili nella scuola, la loro capienza e se sono insonorizzate.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-end gap-4 max-w-2xl bg-card border p-4 rounded-xl">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Nome Aula</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Es. Aula Pianoforte" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="capacity"
            render={({ field }) => (
              <FormItem className="w-24">
                <FormLabel>Capienza</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="insonorizzata"
            render={({ field }) => (
              <FormItem className="flex flex-col items-center justify-end pb-3">
                <div className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0 cursor-pointer text-xs">Insonorizzata</FormLabel>
                </div>
              </FormItem>
            )}
          />
          <div className="flex gap-2">
            {editingRoomId && (
              <Button type="button" onClick={cancelEdit} variant="outline" className="border-stone-200 text-stone-500">
                <X className="w-4 h-4 mr-2" />
                Annulla
              </Button>
            )}
            <Button type="submit" className="bg-[#E8621A] text-white hover:bg-[#E8621A]/90 shrink-0">
              {editingRoomId ? (
                <>
                  <Pencil className="w-4 h-4 mr-2" />
                  Salva
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Aggiungi
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>

      <div className="border rounded-md overflow-hidden max-w-2xl">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Nome Aula</th>
              <th className="px-4 py-3 font-medium text-center">Capienza</th>
              <th className="px-4 py-3 font-medium text-center">Insonorizzata</th>
              <th className="px-4 py-3 w-28 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rooms.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Nessuna aula presente.</td>
              </tr>
            ) : (
              rooms.map(room => (
                <tr key={room.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 font-medium">{room.name}</td>
                  <td className="px-4 py-3 text-center">{room.capacity} persone</td>
                  <td className="px-4 py-3 text-center">
                    {room.insonorizzata ? (
                      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Sì</span>
                    ) : (
                      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full bg-stone-100 text-stone-700">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => startEdit(room)} className="h-8 w-8 text-stone-500 hover:text-stone-700 hover:bg-stone-100">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(room.id)} className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-100">
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
