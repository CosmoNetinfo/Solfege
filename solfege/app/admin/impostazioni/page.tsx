'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SchoolTab } from '@/components/admin/settings/SchoolTab';
import { AcademicYearTab } from '@/components/admin/settings/AcademicYearTab';
import { InstrumentsTab } from '@/components/admin/settings/InstrumentsTab';
import { RoomsTab } from '@/components/admin/settings/RoomsTab';
import { UsersTab } from '@/components/admin/settings/UsersTab';
import { SubscriptionTab } from '@/components/admin/settings/SubscriptionTab';
import { useAuthStore } from '@/store/useAuthStore';
import { Skeleton } from '@/components/ui/skeleton';

export default function ImpostazioniPage() {
  const { school, isInitialized } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isInitialized) {
    return <div className="p-8 space-y-8 max-w-5xl"><Skeleton className="h-10 w-48" /><Skeleton className="h-[400px] w-full" /></div>;
  }

  if (!school) {
    return <div className="p-8">Nessuna scuola trovata.</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-serif text-[#E8621A] mb-2">Impostazioni</h1>
        <p className="text-muted-foreground">Configura i parametri generali della tua scuola di musica.</p>
      </div>

      <Tabs defaultValue="scuola" className="w-full">
        <TabsList className="mb-8 bg-transparent border-b w-full justify-start rounded-none h-auto p-0 space-x-6 overflow-x-auto">
          <TabsTrigger 
            value="scuola" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#E8621A] data-[state=active]:text-[#E8621A] data-[state=active]:bg-transparent px-0 py-3"
          >
            Scuola
          </TabsTrigger>
          <TabsTrigger 
            value="anno" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#E8621A] data-[state=active]:text-[#E8621A] data-[state=active]:bg-transparent px-0 py-3"
          >
            Anno Accademico
          </TabsTrigger>
          <TabsTrigger 
            value="strumenti" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#E8621A] data-[state=active]:text-[#E8621A] data-[state=active]:bg-transparent px-0 py-3"
          >
            Strumenti
          </TabsTrigger>
          <TabsTrigger 
            value="aule" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#E8621A] data-[state=active]:text-[#E8621A] data-[state=active]:bg-transparent px-0 py-3"
          >
            Aule
          </TabsTrigger>
          <TabsTrigger 
            value="utenti" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#E8621A] data-[state=active]:text-[#E8621A] data-[state=active]:bg-transparent px-0 py-3"
          >
            Utenti
          </TabsTrigger>
          <TabsTrigger 
            value="abbonamento" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#E8621A] data-[state=active]:text-[#E8621A] data-[state=active]:bg-transparent px-0 py-3"
          >
            Abbonamento
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="scuola" className="m-0">
            <SchoolTab school={school} />
          </TabsContent>
          
          <TabsContent value="anno" className="m-0">
            <AcademicYearTab school={school} />
          </TabsContent>
          
          <TabsContent value="strumenti" className="m-0">
            <InstrumentsTab schoolId={school.id} />
          </TabsContent>
          
          <TabsContent value="aule" className="m-0">
            <RoomsTab schoolId={school.id} />
          </TabsContent>

          <TabsContent value="utenti" className="m-0">
            <UsersTab schoolId={school.id} />
          </TabsContent>

          <TabsContent value="abbonamento" className="m-0">
            <SubscriptionTab school={school} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
