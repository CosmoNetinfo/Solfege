"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Database from "@tauri-apps/plugin-sql";
import { studentsDb } from "@/lib/desktop-db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Globe,
  RefreshCw,
  Check,
  X,
  User,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  FileText,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export default function IscrizioniWebPage() {
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const supabase = createClient();

  // 1. Carica lo school_id dal DB locale
  useEffect(() => {
    async function loadSchoolId() {
      try {
        const db = await Database.load("sqlite:solfege.db");
        const schools = await db.select<{ id: string }[]>("SELECT id FROM schools LIMIT 1");
        if (schools && schools.length > 0) {
          setSchoolId(schools[0].id);
        }
      } catch (err) {
        console.error("Errore caricamento school_id locale:", err);
      }
    }
    loadSchoolId();
  }, []);

  // 2. Recupera le iscrizioni pendenti da Supabase
  const fetchRegistrations = async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("online_registrations" as any)
        .select("*")
        .eq("school_id", schoolId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRegistrations(data || []);
    } catch (err: any) {
      console.error("Errore caricamento iscrizioni online:", err);
      toast.error("Impossibile caricare le iscrizioni dal cloud: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (schoolId) {
      fetchRegistrations();
    }
  }, [schoolId]);

  // 3. Approva l'allievo (inserisci in SQLite e segna approved su Supabase)
  const handleApprove = async (reg: any) => {
    setProcessingId(reg.id);
    try {
      // Inserisci in SQLite locale
      const localId = await studentsDb.create({
        nome: reg.nome,
        cognome: reg.cognome,
        data_nascita: reg.data_nascita || undefined,
        codice_fiscale: reg.codice_fiscale || undefined,
        email: reg.email || undefined,
        telefono: reg.telefono || undefined,
        is_minorenne: reg.is_minorenne ? 1 : 0,
        genitore_nome: reg.genitore_nome || undefined,
        genitore_cognome: reg.genitore_cognome || undefined,
        genitore_email: reg.genitore_email || undefined,
        genitore_telefono: reg.genitore_telefono || undefined,
        genitore_codice_fiscale: reg.genitore_codice_fiscale || undefined,
        note: `ISCRITTO ONLINE\nCorso d'interesse: ${reg.corso_interesse || '-'}\nNote: ${reg.note || '-'}`
      });

      if (!localId) throw new Error("Errore durante l'inserimento dell'allievo nel database locale");

      // Aggiorna lo stato su Supabase
      const { error } = await supabase
        .from("online_registrations" as any)
        .update({ status: "approved" })
        .eq("id", reg.id);

      if (error) throw error;

      toast.success(`Studente ${reg.nome} ${reg.cognome} approvato e importato con successo!`);
      // Rimuovi dalla lista locale
      setRegistrations((prev) => prev.filter((r) => r.id !== reg.id));
    } catch (err: any) {
      console.error(err);
      toast.error("Errore durante l'approvazione: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // 4. Rifiuta la richiesta (segna rejected su Supabase)
  const handleReject = async (reg: any) => {
    if (!confirm(`Sei sicuro di voler rifiutare la richiesta di iscrizione di ${reg.nome} ${reg.cognome}?`)) {
      return;
    }
    setProcessingId(reg.id);
    try {
      const { error } = await supabase
        .from("online_registrations" as any)
        .update({ status: "rejected" })
        .eq("id", reg.id);

      if (error) throw error;

      toast.success(`Richiesta di ${reg.nome} ${reg.cognome} rifiutata.`);
      setRegistrations((prev) => prev.filter((r) => r.id !== reg.id));
    } catch (err: any) {
      console.error(err);
      toast.error("Errore durante il rifiuto: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "dd MMM yyyy", { locale: it });
  };

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto font-sans">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-serif font-bold text-stone-900 flex items-center gap-2">
            <Globe className="text-orange h-8 w-8" /> Iscrizioni Online Pendenti
          </h1>
          <p className="text-stone-500">Gestisci le richieste di iscrizione inviate autonomamente dagli allievi tramite il link pubblico.</p>
        </div>
        <Button onClick={fetchRegistrations} disabled={loading} variant="outline" className="flex items-center gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Aggiorna
        </Button>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-orange" />
        </div>
      ) : registrations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {registrations.map((reg) => (
            <Card key={reg.id} className="border border-stone-200 shadow-sm overflow-hidden bg-white">
              <CardHeader className="bg-stone-50/50 pb-3 flex flex-row items-center justify-between border-b">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">
                    Ricevuta il {formatDate(reg.created_at)}
                  </span>
                  <CardTitle className="text-lg font-bold text-stone-900 font-serif">
                    {reg.nome} {reg.cognome}
                  </CardTitle>
                </div>
                <Badge variant={reg.is_minorenne ? "destructive" : "secondary"}>
                  {reg.is_minorenne ? "Minorenne" : "Maggiorenne"}
                </Badge>
              </CardHeader>
              <CardContent className="p-6 space-y-4 text-sm">
                {/* Dati Contatto */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-stone-600">
                    <Mail size={16} className="text-stone-400" />
                    <span>{reg.email || "Email non fornita"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-stone-600">
                    <Phone size={16} className="text-stone-400" />
                    <span>{reg.telefono || "Telefono non fornito"}</span>
                  </div>
                  {reg.data_nascita && (
                    <div className="flex items-center gap-2 text-stone-600">
                      <Calendar size={16} className="text-stone-400" />
                      <span>Data Nascita: {formatDate(reg.data_nascita)}</span>
                    </div>
                  )}
                </div>

                {/* Dati Genitore se minorenne */}
                {reg.is_minorenne && (
                  <div className="p-3 bg-red-50/50 border border-red-100 rounded-xl space-y-1.5">
                    <p className="text-[10px] font-bold text-red-800 uppercase tracking-wide">Genitore / Referente</p>
                    <p className="font-semibold text-stone-800 text-xs">
                      {reg.genitore_nome} {reg.genitore_cognome}
                    </p>
                    <p className="text-xs text-stone-600">Tel: {reg.genitore_telefono || '-'}</p>
                    <p className="text-xs text-stone-600">Email: {reg.genitore_email || '-'}</p>
                  </div>
                )}

                {/* Corso Interesse */}
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Corso d'interesse</p>
                  <p className="font-bold text-orange text-sm">{reg.corso_interesse}</p>
                </div>

                {/* Note */}
                {reg.note && (
                  <div className="p-3 bg-stone-50 rounded-xl space-y-1">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wide flex items-center gap-1">
                      <FileText size={12} /> Messaggio Allievo
                    </p>
                    <p className="text-xs text-stone-600 italic">"{reg.note}"</p>
                  </div>
                )}

                {/* Bottoni Azioni */}
                <div className="flex items-center gap-3 pt-4 border-t">
                  <Button
                    onClick={() => handleApprove(reg)}
                    disabled={processingId !== null}
                    className="flex-1 bg-[#E8621A] hover:bg-[#C94E0E] text-white flex items-center justify-center gap-1.5"
                  >
                    {processingId === reg.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    Approva e Importa
                  </Button>
                  <Button
                    onClick={() => handleReject(reg)}
                    disabled={processingId !== null}
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50 flex items-center justify-center gap-1.5"
                  >
                    <X size={16} />
                    Rifiuta
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-2 py-16 bg-stone-50/50">
          <CardContent className="flex flex-col items-center justify-center text-center space-y-3">
            <div className="h-12 w-12 bg-stone-100 rounded-full flex items-center justify-center text-stone-400">
              <Globe size={24} />
            </div>
            <h2 className="font-bold text-stone-700">Nessuna nuova iscrizione online</h2>
            <p className="text-sm text-stone-400 max-w-sm">Le nuove richieste di iscrizione ricevute tramite il tuo link pubblico appariranno qui per essere approvate.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
