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
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  current_academic_year: z.string().min(4, 'Anno troppo corto'),
});

export function AcademicYearTab({ school }: { school: any }) {
  const supabase = createClient();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      current_academic_year: school?.current_academic_year || '2024-2025',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await updateSchool(supabase, school.id, values);
      router.refresh();
      toast.success('Anno accademico aggiornato con successo');
    } catch (error) {
      toast.error('Errore durante il salvataggio');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Anno Accademico</h3>
        <p className="text-sm text-muted-foreground">
          Imposta l'anno accademico corrente (es. 2024-2025). Questo valore viene utilizzato come default globale.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-sm">
          <FormField
            control={form.control}
            name="current_academic_year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Anno Accademico Corrente</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="2024-2025" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="bg-[#E8621A] text-white hover:bg-[#E8621A]/90">
            Salva Anno
          </Button>
        </form>
      </Form>
    </div>
  );
}
