'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { updateSchool } from '@/lib/supabase/queries';
import { isDesktop } from '@/lib/is-desktop';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  current_academic_year: z.string().min(4, 'Anno troppo corto'),
  academic_year_start: z.string().min(10, 'Data di inizio non valida'),
  academic_year_end: z.string().min(10, 'Data di fine non valida'),
});

export function AcademicYearTab({ school }: { school: any }) {
  const supabase = createClient();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      current_academic_year: school?.current_academic_year || '2026/2027',
      academic_year_start: school?.academic_year_start || '2026-09-15',
      academic_year_end: school?.academic_year_end || '2027-06-15',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (isDesktop()) {
        const Database = (await import('@tauri-apps/plugin-sql')).default;
        const db = await Database.load('sqlite:solfege.db');
        await db.execute(
          `UPDATE schools 
           SET anno_accademico_corrente = ?, academic_year_start = ?, academic_year_end = ? 
           WHERE id = ?`,
          [values.current_academic_year, values.academic_year_start, values.academic_year_end, school.id]
        );
      } else {
        await updateSchool(supabase, school.id, {
          current_academic_year: values.current_academic_year,
          academic_year_start: values.academic_year_start,
          academic_year_end: values.academic_year_end,
        } as any);
      }
      router.refresh();
      toast.success('Anno accademico salvato con successo');
    } catch (error) {
      console.error('Errore aggiornamento anno accademico:', error);
      toast.error('Errore durante il salvataggio');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Anno Accademico</h3>
        <p className="text-sm text-muted-foreground">
          Configura l'anno accademico corrente e le date di inizio e fine per la scuola.
          La generazione automatica delle lezioni ricorrenti utilizzerà questo intervallo temporale.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-md">
          <FormField
            control={form.control}
            name="current_academic_year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Denominazione Anno Accademico</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="2026/2027" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="academic_year_start"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inizio Anno Didattico</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="academic_year_end"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fine Anno Didattico</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" className="bg-[#E8621A] text-white hover:bg-[#E8621A]/90">
            Salva Impostazioni Anno
          </Button>
        </form>
      </Form>
    </div>
  );
}
