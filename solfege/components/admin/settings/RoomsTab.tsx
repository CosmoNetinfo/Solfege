'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus } from 'lucide-react';
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

  const loadRooms = async () => {
    try {
      const { isDesktop } = await import("@/lib/is-desktop");
      if (isDesktop()) {
        const Database = (await import("@tauri-apps/plugin-sql")).default;
        const db = await Database.load("sqlite:solfege.db");
        // Mappiamo le colonne locali SQLite a quelle del frontend
        const data = await db.select<any[]>(
          "SELECT id, nome as name, capacita as capacity, insonorizzata FROM rooms ORDER BY nome ASC"
        );
        setRooms(data.map(r => ({
          ...r,
          // SQLite memorizza i booleani come 0/1
          insonorizzata: r.insonorizzata === 1 || r.insonorizzata === true
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

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const { isDesktop } = await import("@/lib/is-desktop");
      if (isDesktop()) {
        const Database = (await import("@tauri-apps/plugin-sql")).default;
        const db = await Database.load("sqlite:solfege.db");
        const newRoomId = crypto.randomUUID();

        await db.execute(
          `INSERT INTO rooms (id, school_id, nome, capacita, insonorizzata)
           VALUES (?, ?, ?, ?, ?)`,
          [newRoomId, schoolId, values.name, values.capacity, values.insonorizzata ? 1 : 0]
        );

        const newRoom = {
          id: newRoomId,
          name: values.name,
          capacity: values.capacity,
          insonorizzata: values.insonorizzata
        };

        setRooms([...rooms, newRoom].sort((a, b) => a.name.localeCompare(b.name)));
        form.reset();
        toast.success('Aula aggiunta');
        return;
      }

      // Web Flow
      const newRoom = await addRoom(supabase, schoolId, values.name, values.capacity, values.insonorizzata);
      setRooms([...rooms, newRoom].sort((a, b) => a.name.localeCompare(b.name)));
      form.reset();
      toast.success('Aula aggiunta');
    } catch (e) {
      toast.error('Errore durante l\'aggiunta');
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
        return;
      }

      // Web Flow
      await deleteRoom(supabase, id);
      setRooms(rooms.filter(r => r.id !== id));
      toast.success('Aula eliminata');
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
          <Button type="submit" className="bg-[#E8621A] text-white hover:bg-[#E8621A]/90">
            <Plus className="w-4 h-4 mr-2" />
            Aggiungi
          </Button>
        </form>
      </Form>

      <div className="border rounded-md overflow-hidden max-w-2xl">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Nome Aula</th>
              <th className="px-4 py-3 font-medium text-center">Capienza</th>
              <th className="px-4 py-3 font-medium text-center">Insonorizzata</th>
              <th className="px-4 py-3 w-20 text-right">Azioni</th>
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
                  <td className="px-4 py-3 text-right">
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
