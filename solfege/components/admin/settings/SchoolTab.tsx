'use client';

import { useState } from 'react';
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
import Image from 'next/image';

const formSchema = z.object({
  name: z.string().min(2, 'Nome troppo corto'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email non valida').optional().or(z.literal('')),
  website: z.string().url('URL non valido').optional().or(z.literal('')),
});

export function SchoolTab({ school }: { school: any }) {
  const [isUploading, setIsUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState(school?.logo_url || null);
  const supabase = createClient();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: school?.name || '',
      address: school?.address || '',
      phone: school?.phone || '',
      email: school?.email || '',
      website: school?.website || '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const updatedSchool = await updateSchool(supabase, school.id, {
        ...values,
        logo_url: logoUrl,
      });
      router.refresh();
      toast.success('Dati scuola aggiornati con successo');
    } catch (error) {
      toast.error('Errore durante il salvataggio');
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${school.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('logos').getPublicUrl(filePath);
      setLogoUrl(data.publicUrl);
      
      // Auto-save the logo
      await updateSchool(supabase, school.id, {
        logo_url: data.publicUrl,
      });
      router.refresh();
      toast.success('Logo aggiornato con successo');
    } catch (error) {
      console.error(error);
      toast.error('Errore durante il caricamento del logo. Assicurati che il bucket "logos" esista e sia pubblico.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Informazioni Scuola</h3>
        <p className="text-sm text-muted-foreground">Aggiorna le informazioni di base della tua scuola.</p>
      </div>

      <div className="flex items-center gap-6 p-4 border rounded-xl bg-card">
        <div className="relative w-24 h-24 rounded-lg bg-sidebar/10 flex items-center justify-center overflow-hidden border">
          {logoUrl ? (
            <Image src={logoUrl} alt="Logo scuola" fill className="object-contain p-2" />
          ) : (
            <span className="text-2xl font-serif text-muted-foreground">
              {school?.name?.charAt(0) || 'S'}
            </span>
          )}
        </div>
        <div className="flex-1">
          <h4 className="font-medium mb-1">Logo Scuola</h4>
          <p className="text-xs text-muted-foreground mb-3">PNG, JPG o WEBP (max 2MB).</p>
          <Input 
            type="file" 
            accept="image/*" 
            className="w-full max-w-[250px] h-9 text-xs" 
            onChange={handleLogoUpload}
            disabled={isUploading}
          />
        </div>
      </div>

      <div className="p-6 border rounded-xl bg-orange/5 border-orange/10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-orange flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-link"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              Link Iscrizioni Pubblico
            </h3>
            <p className="text-sm text-stone-600 mt-1">Condividi questo link sui tuoi social o sul tuo sito per permettere ai nuovi allievi di iscriversi autonomamente.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-white border border-orange/20 rounded-lg px-4 py-2 text-sm font-mono text-stone-700 truncate">
            {typeof window !== 'undefined' ? `${window.location.origin}/${school.slug}/iscriviti` : `/${school.slug}/iscriviti`}
          </div>
          <Button 
            variant="outline" 
            className="border-orange/20 text-orange hover:bg-orange hover:text-white"
            onClick={() => {
              const url = `${window.location.origin}/${school.slug}/iscriviti`;
              navigator.clipboard.writeText(url);
              toast.success("Link copiato negli appunti!");
            }}
          >
            Copia Link
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Scuola *</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Pubblica</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="info@scuola.it" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefono</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="+39 012 3456789" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Indirizzo Completo</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Via Roma 1, Milano (MI)" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sito Web</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="https://www.scuola.it" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="bg-[#E8621A] text-white hover:bg-[#E8621A]/90">
            Salva Modifiche
          </Button>
        </form>
      </Form>
    </div>
  );
}
