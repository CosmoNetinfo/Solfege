"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Music, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function SetupTrialPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [schoolName, setSchoolName] = useState("");
  const [userName, setUserName] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Se ha già una scuola, vai alla dashboard
      const { data: profile } = await supabase
        .from("profiles")
        .select("school_id")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.school_id) {
        router.push("/admin/dashboard");
        return;
      }

      // Pre-compila il nome dall'account Google
      const name = user.user_metadata?.name || user.user_metadata?.full_name || "";
      setUserName(name);
      setSchoolName(`Scuola di ${name}`);
      setChecking(false);
    }
    init();
  }, []);

  async function handleCreate() {
    if (!schoolName.trim()) {
      toast.error("Inserisci il nome della tua scuola!");
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utente non trovato");

      // Genera slug univoco
      const slug = `scuola-${user.id.slice(0, 8)}`;
      const trialEnds = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();

      // 1. Crea la scuola
      const { data: newSchool, error: schoolErr } = await supabase
        .from("schools" as any)
        .insert({
          name: schoolName.trim(),
          slug,
          plan: "trial",
          trial_ends_at: trialEnds,
        })
        .select("id")
        .single();

      if (schoolErr || !newSchool) {
        throw new Error(schoolErr?.message || "Errore nella creazione della scuola");
      }

      // 2. Crea il profilo admin
      const firstName = user.user_metadata?.given_name || user.user_metadata?.first_name || userName;
      const lastName = user.user_metadata?.family_name || user.user_metadata?.last_name || "";

      const { error: profErr } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          school_id: (newSchool as any).id,
          role: "admin",
          first_name: firstName,
          last_name: lastName,
        });

      if (profErr) throw profErr;

      toast.success("Benvenuto! La tua prova gratuita di 15 giorni è attiva!");
      router.push("/admin/dashboard");
    } catch (err: any) {
      console.error(err);
      toast.error("Errore: " + err.message);
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
        <Loader2 className="h-8 w-8 animate-spin text-[#E8621A]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="bg-[#1A1714] p-8 text-center space-y-3">
          <div className="w-14 h-14 bg-[#E8621A]/10 rounded-full flex items-center justify-center mx-auto">
            <Music className="h-7 w-7 text-[#E8621A]" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-white">Benvenuto su Solfège!</h1>
          <p className="text-stone-400 text-sm">
            Configura la tua scuola per iniziare la prova gratuita di <span className="text-[#E8621A] font-bold">15 giorni</span>.
          </p>
        </div>

        {/* Form */}
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-stone-700">
              Nome della tua scuola di musica *
            </label>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="es. Scuola di Musica Verdi"
              className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8621A]/30 focus:border-[#E8621A]"
            />
          </div>

          <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-sm text-orange-700 space-y-1">
            <p className="font-bold">✅ 15 giorni di prova gratuita</p>
            <p>Accesso completo a tutte le funzionalità online senza carta di credito.</p>
          </div>

          <button
            onClick={handleCreate}
            disabled={loading || !schoolName.trim()}
            className="w-full bg-[#E8621A] hover:bg-[#C94E0E] disabled:opacity-50 text-white font-bold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Inizia la prova gratuita <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>

          <p className="text-center text-xs text-stone-400">
            Dopo 15 giorni puoi acquistare la versione desktop a €249 una tantum.<br />
            Nessun addebito automatico.
          </p>
        </div>
      </div>
    </div>
  );
}
