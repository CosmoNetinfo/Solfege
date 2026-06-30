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

  useEffect(() => {
    async function checkAuth() {
      if (isDesktop()) {
        try {
          // Check setup status first
          const setupCompleted = await invoke<string | null>("get_config", { key: "setup_completed" });
          if (setupCompleted !== "true") {
            router.push("/setup");
            return;
          }

          // Check if trial is expired
          const trial = await invoke<{ is_trial: boolean; is_expired: boolean }>("get_trial_status");
          if (trial.is_trial && trial.is_expired) {
            router.push("/setup");
            return;
          }

          // Get current user session
          const user = await invoke("get_current_user");
          if (!user) {
            router.push("/login-desktop");
          } else {
            setAuthenticated(true);
          }
        } catch (err) {
          console.error("Auth check failed on desktop:", err);
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

  if (!authenticated) return null;

  const layoutContent = (
    <div className="flex flex-col min-h-screen w-full bg-background font-sans antialiased">
      {isDesktop() && <TrialBanner />}
      {isDesktop() && <UpdateChecker />}
      <div className="flex flex-1">
        <aside className="w-64 bg-sidebar sticky top-0 h-screen overflow-y-auto shrink-0 border-r border-sidebar-border">
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
