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
import { isDesktop } from '@/lib/is-desktop';
import { Loader2 } from 'lucide-react';

export default function ImpostazioniPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [school, setSchool] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        if (isDesktop()) {
          // Su desktop: legge dati scuola direttamente da SQLite locale
          const Database = (await import('@tauri-apps/plugin-sql')).default;
          const db = await Database.load('sqlite:solfege.db');
          const rows = await db.select<any[]>('SELECT * FROM schools LIMIT 1');
          if (rows.length > 0) {
            const s = rows[0];
            // Mappa i campi SQLite al formato atteso dai componenti
            setSchool({
              id: s.id,
              name: s.nome,
              address: s.indirizzo || null,
              phone: s.telefono || null,
              email: s.email || null,
              website: s.sito_web || null,
              slug: s.slug || null,
              current_academic_year: s.anno_accademico_corrente || '2026/2027',
            });
          }
        } else {
          // Su web: usa Supabase normalmente
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const profile = await getProfile(supabase, user.id);
          if (!profile || !profile.school_id) return;

          const schoolData = await getSchoolData(supabase, profile.school_id);
          if (schoolData) {
            setSchool(schoolData);
          }
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
        <TabsList className="mb-8 bg-transparent border-b w-full justify-start rounded-none h-auto p-0 space-x-6">
          <TabsTrigger value="scuola" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#E8621A] data-[state=active]:text-[#E8621A] data-[state=active]:bg-transparent px-0 py-3">Scuola</TabsTrigger>
          <TabsTrigger value="anno" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#E8621A] data-[state=active]:text-[#E8621A] data-[state=active]:bg-transparent px-0 py-3">Anno Accademico</TabsTrigger>
          <TabsTrigger value="strumenti" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#E8621A] data-[state=active]:text-[#E8621A] data-[state=active]:bg-transparent px-0 py-3">Strumenti</TabsTrigger>
          <TabsTrigger value="aule" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#E8621A] data-[state=active]:text-[#E8621A] data-[state=active]:bg-transparent px-0 py-3">Aule</TabsTrigger>
          <TabsTrigger value="utenti" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#E8621A] data-[state=active]:text-[#E8621A] data-[state=active]:bg-transparent px-0 py-3">Utenti</TabsTrigger>
          <TabsTrigger value="abbonamento" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#E8621A] data-[state=active]:text-[#E8621A] data-[state=active]:bg-transparent px-0 py-3">Abbonamento</TabsTrigger>
          {isDesktop() && (
            <TabsTrigger value="aggiornamenti" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#E8621A] data-[state=active]:text-[#E8621A] data-[state=active]:bg-transparent px-0 py-3">Aggiornamenti</TabsTrigger>
          )}
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
          {isDesktop() && (
            <TabsContent value="aggiornamenti" className="m-0">
              <UpdateSettingsPanel />
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
}

// Sottocomponente per la gestione aggiornamenti manuale
function UpdateSettingsPanel() {
  const [currentVersion, setCurrentVersion] = useState('1.1.8');
  const [checking, setChecking] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState<any>(null);
  const [statusText, setStatusText] = useState('');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'downloading' | 'completed' | 'error'>('idle');

  useEffect(() => {
    async function loadVersion() {
      try {
        const { getVersion } = await import('@tauri-apps/api/app');
        const v = await getVersion();
        setCurrentVersion(v);
      } catch (e) {
        console.warn("Impossibile caricare versione Tauri:", e);
      }
    }
    loadVersion();
  }, []);

  const handleCheck = async () => {
    setChecking(true);
    setStatusText('Ricerca aggiornamenti in corso...');
    setUpdateAvailable(null);
    setStatus('idle');
    try {
      const { check } = await import('@tauri-apps/plugin-updater');
      const update = await check();
      if (update) {
        setUpdateAvailable(update);
        setStatusText(`Nuova versione disponibile: v${update.version}`);
      } else {
        setStatusText('Solfège è aggiornato all\'ultima versione.');
      }
    } catch (err: any) {
      console.error(err);
      setStatusText(`Errore di connessione: ${err.message || err}`);
    } finally {
      setChecking(false);
    }
  };

  const handleInstall = async () => {
    if (!updateAvailable) return;
    try {
      setStatus('downloading');
      setDownloadProgress(0);
      let downloadedLength = 0;
      let totalSize: number | undefined = undefined;

      await updateAvailable.downloadAndInstall((event: any) => {
        switch (event.event) {
          case 'Started':
            setDownloadProgress(0);
            totalSize = event.data.contentLength;
            break;
          case 'Progress':
            downloadedLength += event.data.chunkLength;
            if (totalSize) {
              setDownloadProgress(Math.round((downloadedLength / totalSize) * 100));
            }
            break;
          case 'Finished':
            setDownloadProgress(100);
            break;
        }
      });

      setStatus('completed');
      const { relaunch } = await import('@tauri-apps/plugin-process');
      await relaunch();
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setStatusText(`Errore durante l'installazione: ${err.message || err}`);
    }
  };

  return (
    <div className="bg-white border border-stone-200 p-8 rounded-2xl max-w-xl mx-auto space-y-6 shadow-sm">
      <div className="space-y-1">
        <h3 className="text-xl font-serif text-[#E8621A] font-bold">Aggiornamenti Software</h3>
        <p className="text-sm text-muted-foreground">
          Gestisci le versioni dell'applicazione Solfège installate su questo PC.
        </p>
      </div>

      <div className="border border-stone-100 rounded-xl bg-stone-50 p-4 flex justify-between items-center">
        <div>
          <p className="text-xs font-bold text-stone-400 uppercase">Versione Installata</p>
          <p className="text-lg font-mono font-bold text-stone-800">v{currentVersion}</p>
        </div>
        
        {status === 'idle' && (
          <button
            onClick={handleCheck}
            disabled={checking}
            className="bg-[#E8621A] hover:bg-[#C94E0E] disabled:opacity-50 text-white font-bold py-2.5 px-5 rounded-lg text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-2"
          >
            {checking && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {checking ? 'Verifica...' : 'Verifica Aggiornamenti'}
          </button>
        )}
      </div>

      {statusText && (
        <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-700 flex flex-col gap-3">
          <p>{statusText}</p>
          
          {updateAvailable && status === 'idle' && (
            <button
              onClick={handleInstall}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg text-xs uppercase tracking-wider transition-colors self-start"
            >
              Scarica ed Installa v{updateAvailable.version}
            </button>
          )}

          {status === 'downloading' && (
            <div className="space-y-2 w-full pt-1">
              <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-[#E8621A] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs font-bold text-stone-500">
                <span>DOWNLOAD IN CORSO...</span>
                <span>{downloadProgress}%</span>
              </div>
            </div>
          )}

          {status === 'completed' && (
            <p className="text-xs text-green-600 font-bold">Download completato. Riavvio dell'applicazione in corso...</p>
          )}
        </div>
      )}
    </div>
  );
}
