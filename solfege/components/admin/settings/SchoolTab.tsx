'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { createBrowserClient } from '@/lib/supabase/client';
import { updateSchool } from '@/lib/supabase/queries';
import { useAuthStore } from '@/store/useAuthStore';
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
  const supabase = createBrowserClient();
  const setSchool = useAuthStore((state) => state.setSchool);

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
      setSchool(updatedSchool);
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
      const updatedSchool = await updateSchool(supabase, school.id, {
        logo_url: data.publicUrl,
      });
      setSchool(updatedSchool);
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
        <div>
          <h4 className="font-medium mb-2">Logo Scuola</h4>
          <p className="text-sm text-muted-foreground mb-4">PNG, JPG o WEBP (max 2MB). Sarà visibile nella sidebar e sulle ricevute.</p>
          <Input 
            type="file" 
            accept="image/*" 
            className="w-full max-w-[250px]" 
            onChange={handleLogoUpload}
            disabled={isUploading}
          />
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
