"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isDesktop } from "@/lib/is-desktop";
import Database from "@tauri-apps/plugin-sql";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { 
  Globe, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  FileText, 
  Loader2, 
  Users, 
  Archive, 
  Trash2 
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { syncOnlineRegistrations } from "@/lib/services/registration-sync";
import Link from "next/link";

interface PendingRegistration {
  id: string;
  nome: string;
  cognome: string;
  email: string;
  telefono?: string;
  created_at: string;
}

interface SyncLogEntry {
  id: number;
  student_id: string | null;
  action: string;
  synced_at: string;
  student_nome?: string;
  student_cognome?: string;
}

export default function IscrizioniPage() {
  const [pending, setPending] = useState<PendingRegistration[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      let schoolId = "";

      if (isDesktop()) {
        const db = await Database.load("sqlite:solfege.db");
        const settings = await db.select<{ key: string; value: string }[]>(
          "SELECT * FROM settings WHERE key = 'school_id'"
        );
        if (settings.length > 0) {
          schoolId = settings[0].value;
        }

        // Load sync logs
        const logs = await db.select<SyncLogEntry[]>(
          `SELECT sl.*, s.nome as student_nome, s.cognome as student_cognome 
           FROM sync_log sl 
           LEFT JOIN students s ON sl.student_id = s.id 
           ORDER BY sl.synced_at DESC LIMIT 20`
        );
        setSyncLogs(logs);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("school_id")
            .eq("id", user.id)
            .single();
          schoolId = profile?.school_id || "";
        }
      }

      if (schoolId) {
        const { data, error } = await supabase
          .from("online_registrations" as any)
          .select("*")
          .eq("school_id", schoolId)
          .eq("status", "pending")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setPending((data as any) || []);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Errore nel caricamento dei dati: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleManualSync = async () => {
    if (!isDesktop()) {
      toast.error("La sincronizzazione è disponibile solo nell'app desktop.");
      return;
    }
    
    setSyncing(true);
    try {
      await syncOnlineRegistrations();
      toast.success("Sincronizzazione completata con successo!");
      await loadData();
    } catch (err: any) {
      console.error(err);
      toast.error("Errore durante la sincronizzazione: " + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'creata': return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'aggiornata': return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'ignorata': return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
      default: return 'bg-stone-100 text-stone-800 hover:bg-stone-100';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-stone-900">
            Iscrizioni Online
          </h1>
          <p className="text-stone-500 mt-1">
            Monitoraggio delle registrazioni dal modulo pubblico.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={loadData} 
            disabled={loading || syncing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Aggiorna
          </Button>
          {isDesktop() && (
            <Button 
              className="bg-primary hover:bg-primary/90 text-white"
              onClick={handleManualSync}
              disabled={loading || syncing}
            >
              {syncing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Globe className="w-4 h-4 mr-2" />
              )}
              Forza Sincronizzazione
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Registrations */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-stone-800 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            Nuove in attesa
          </h2>
          
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : pending.length === 0 ? (
            <Card className="border-dashed bg-stone-50 shadow-none">
              <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                <Check className="w-12 h-12 text-stone-300 mb-3" />
                <p className="text-stone-500 font-medium">Nessuna iscrizione in attesa.</p>
                <p className="text-sm text-stone-400 mt-1">Tutte le nuove richieste sono state sincronizzate.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {pending.map((reg) => (
                <Card key={reg.id} className="shadow-sm">
                  <CardContent className="p-4 flex flex-col sm:flex-row justify-between gap-4">
                    <div>
                      <h3 className="font-medium text-stone-900 text-lg">
                        {reg.nome} {reg.cognome}
                      </h3>
                      <div className="text-sm text-stone-500 mt-1 space-y-1">
                        <p>{reg.email}</p>
                        {reg.telefono && <p>{reg.telefono}</p>}
                      </div>
                    </div>
                    <div className="flex flex-col items-start sm:items-end justify-between">
                      <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                        In attesa
                      </Badge>
                      <span className="text-xs text-stone-400 mt-2 sm:mt-0">
                        {format(new Date(reg.created_at), "d MMMM yyyy, HH:mm", { locale: it })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Recently Synced (Desktop Only) */}
        {isDesktop() && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-stone-800 flex items-center gap-2">
              <Archive className="w-5 h-5 text-stone-500" />
              Ultime Sincronizzate
            </h2>
            
            {loading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : syncLogs.length === 0 ? (
              <Card className="bg-stone-50 border-stone-100 shadow-none">
                <CardContent className="p-8 text-center">
                  <Archive className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                  <p className="text-stone-500 font-medium">Nessuna sincronizzazione recente.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {syncLogs.map((log) => (
                  <Card key={log.id} className="shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-stone-100 p-2 rounded-full hidden sm:block">
                          <Users className="w-4 h-4 text-stone-600" />
                        </div>
                        <div>
                          <p className="font-medium text-stone-900">
                            {log.student_nome ? `${log.student_nome} ${log.student_cognome}` : 'Sconosciuto'}
                          </p>
                          <p className="text-xs text-stone-500">
                            {format(new Date(log.synced_at), "d MMMM yyyy, HH:mm", { locale: it })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getActionColor(log.action)} variant="secondary">
                          {log.action}
                        </Badge>
                        {log.student_id && (
                          <Link href={`/admin/students/${log.student_id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-stone-400 hover:text-stone-600">
                              <FileText className="w-4 h-4" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
