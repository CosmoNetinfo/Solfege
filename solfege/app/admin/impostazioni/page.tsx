"use client";

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SchoolTab } from '@/components/admin/settings/SchoolTab';
import { AcademicYearTab } from '@/components/admin/settings/AcademicYearTab';
import { InstrumentsTab } from '@/components/admin/settings/InstrumentsTab';
import { RoomsTab } from '@/components/admin/settings/RoomsTab';
import { UsersTab } from '@/components/admin/settings/UsersTab';
import { createClient } from '@/lib/supabase/client';
import { getProfile, getSchoolData } from '@/lib/supabase/queries';
import { Loader2 } from 'lucide-react';

export default function ImpostazioniPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [school, setSchool] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const profile = await getProfile(supabase, user.id);
        if (!profile || !profile.school_id) return;

        const schoolData = await getSchoolData(supabase, profile.school_id);
        if (schoolData) {
          setSchool(schoolData);
        }
      } catch (err) {
        console.error("Errore caricamento impostazioni:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 min-h-screen flex items-center justify-center bg-[#FAFAF9]">
        <div className="text-stone-400 font-serif text-lg flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-orange" />
          Caricamento...
        </div>
      </div>
    );
  }

  if (!school) {
    return (
      <div className="flex-1 p-8 text-center text-muted-foreground">
        Nessuna scuola configurata trovata.
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-serif text-[#E8621A] mb-2">Impostazioni</h1>
        <p className="text-muted-foreground">Configura i parametri generali della tua scuola di musica.</p>
      </div>

      <Tabs defaultValue='scuola' className="w-full">
        <TabsList className="mb-8 bg-transparent border-b w-full justify-start rounded-none h-auto p-0 space-x-6 overflow-x-auto">
          <TabsTrigger value="scuola" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#E8621A] data-[state=active]:text-[#E8621A] data-[state=active]:bg-transparent px-0 py-3">Scuola</TabsTrigger>
          <TabsTrigger value="anno" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#E8621A] data-[state=active]:text-[#E8621A] data-[state=active]:bg-transparent px-0 py-3">Anno Accademico</TabsTrigger>
          <TabsTrigger value="strumenti" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#E8621A] data-[state=active]:text-[#E8621A] data-[state=active]:bg-transparent px-0 py-3">Strumenti</TabsTrigger>
          <TabsTrigger value="aule" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#E8621A] data-[state=active]:text-[#E8621A] data-[state=active]:bg-transparent px-0 py-3">Aule</TabsTrigger>
          <TabsTrigger value="utenti" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#E8621A] data-[state=active]:text-[#E8621A] data-[state=active]:bg-transparent px-0 py-3">Utenti</TabsTrigger>
          <TabsTrigger value="abbonamento" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#E8621A] data-[state=active]:text-[#E8621A] data-[state=active]:bg-transparent px-0 py-3">Abbonamento</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="scuola" className="m-0"><SchoolTab school={school} /></TabsContent>
          <TabsContent value="anno" className="m-0"><AcademicYearTab school={school} /></TabsContent>
          <TabsContent value="strumenti" className="m-0"><InstrumentsTab schoolId={school.id} /></TabsContent>
          <TabsContent value="aule" className="m-0"><RoomsTab schoolId={school.id} /></TabsContent>
          <TabsContent value="utenti" className="m-0"><UsersTab schoolId={school.id} schoolName={school.name} /></TabsContent>
          <TabsContent value="abbonamento" className="m-0">
            <div className="bg-stone-50 border border-stone-200 p-8 rounded-2xl max-w-xl mx-auto text-center space-y-6 shadow-sm">
              <h3 className="text-2xl font-serif text-[#E8621A] font-bold">Solfège Desktop</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Stai usando la versione demo web. Per la versione completa desktop (SQLite locale, funzionamento offline, nessun abbonamento) contattaci su WhatsApp.
              </p>
              <div className="pt-2">
                <a
                  href="https://wa.me/393517064080"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center bg-[#E8621A] hover:bg-[#C94E0E] text-white font-bold py-3 px-6 rounded-lg transition-colors text-sm uppercase tracking-wider"
                >
                  Contattaci su WhatsApp
                </a>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
