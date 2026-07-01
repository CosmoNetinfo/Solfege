'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/admin/sidebar";
import { DebugPanel } from "@/components/debug/DebugPanel";
import { createClient } from "@/lib/supabase/client";
import { isDesktop } from "@/lib/is-desktop";
import { invoke } from "@tauri-apps/api/core";
import { TrialBanner } from "@/components/desktop/TrialBanner";
import { UpdateChecker } from "@/components/desktop/UpdateChecker";
import { ErrorBoundary } from "@/components/desktop/ErrorBoundary";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuth() {
      if (isDesktop()) {
        try {
          // Check setup status first
          const setupCompleted = await invoke<string | null>("get_config", { key: "setup_completed" });
          console.log("[AUTH] setup_completed:", setupCompleted);
          if (setupCompleted !== "true") {
            router.push("/setup");
            return;
          }

          // Check if trial is expired
          let trial: { is_trial: boolean; is_expired: boolean };
          try {
            trial = await invoke<{ is_trial: boolean; is_expired: boolean }>("get_trial_status");
            console.log("[AUTH] trial status:", trial);
          } catch (trialErr) {
            console.error("[AUTH] get_trial_status failed:", trialErr);
            // Se il trial check fallisce, non blocchiamo — assumiamo non scaduto
            trial = { is_trial: false, is_expired: false };
          }

          if (trial.is_trial && trial.is_expired) {
            console.log("[AUTH] Trial scaduto, redirect /setup");
            router.push("/setup");
            return;
          }

          // Get current user session
          const user = await invoke("get_current_user");
          console.log("[AUTH] get_current_user:", user);
          if (!user) {
            console.warn("[AUTH] Nessun utente in sessione, redirect /login-desktop");
            setAuthError(`SESSIONE VUOTA: get_current_user ha restituito null | user: ${JSON.stringify(user)}`);
            await new Promise(r => setTimeout(r, 5000));
            router.push("/login-desktop");
          } else {
            setAuthenticated(true);
          }
        } catch (err) {
          console.error("[AUTH] checkAuth failed:", err);
          setAuthError(`ERRORE DI SISTEMA: ${String(err)}`);
          await new Promise(r => setTimeout(r, 5000));
          router.push("/login-desktop");
        } finally {
          setLoading(false);
        }
      } else {
        // Web flow
        try {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            router.push("/login");
          } else {
            setAuthenticated(true);
          }
        } catch (err) {
          console.error("Auth check failed on web:", err);
          router.push("/login");
        } finally {
          setLoading(false);
        }
      }
    }

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
        <div className="text-stone-400 font-serif text-lg animate-pulse">Caricamento...</div>
      </div>
    );
  }

  // Mostra l'errore per 3 secondi prima di redirigere — leggibile anche senza DevTools
  if (authError) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center p-6">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 max-w-md w-full space-y-3">
          <h2 className="font-bold text-red-700 text-lg">Errore di autenticazione</h2>
          <p className="text-red-600 text-sm font-mono break-all">{authError}</p>
          <p className="text-stone-400 text-xs">Reindirizzamento al login in corso...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) return null;

  const layoutContent = (
    <div className="flex flex-col min-h-screen w-full bg-background font-sans antialiased">
      {isDesktop() && <TrialBanner />}
      {isDesktop() && <UpdateChecker />}
      <div className="flex flex-1">
        <aside className="w-64 bg-sidebar sticky top-0 h-screen overflow-y-auto no-scrollbar shrink-0 border-r border-sidebar-border">
          <Sidebar />
        </aside>
        <main className="flex-1 min-h-screen">
          {children}
        </main>
      </div>
      <DebugPanel />
    </div>
  );

  if (isDesktop()) {
    return <ErrorBoundary>{layoutContent}</ErrorBoundary>;
  }

  return layoutContent;
}
