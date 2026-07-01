"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getProfile, getSchoolData } from "@/lib/supabase/queries";
import { CompensationsTable } from "@/components/admin/compensations/CompensationsTable";
import { Loader2 } from "lucide-react";

export default function CompensiPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [schoolId, setSchoolId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const profile = await getProfile(supabase, user.id);
        if (!profile || !profile.school_id) return;

        const school = await getSchoolData(supabase, profile.school_id);
        if (!school) return;

        setSchoolId(profile.school_id);
      } catch (err) {
        console.error("Errore compensi:", err);
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

  if (!schoolId) {
    return (
      <div className="flex-1 p-8 text-center text-muted-foreground">
        Nessuna scuola trovata.
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-4xl font-bold tracking-tight text-[#1A1714]">Compensi Docenti</h2>
          <p className="text-muted-foreground mt-2">Gestisci e registra i pagamenti mensili per i tuoi insegnanti.</p>
        </div>
      </div>

      <CompensationsTable schoolId={schoolId} />
    </div>
  );
}
