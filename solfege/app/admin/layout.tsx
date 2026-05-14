import { Sidebar } from "@/components/admin/sidebar";
import { DebugPanel } from "@/components/debug/DebugPanel";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/queries";
import { TrialBanner } from "@/components/admin/TrialBanner";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const profile = user ? await getProfile(supabase, user.id) : null;
  const school = profile?.schools;

  return (
    <div className="flex flex-col min-h-screen w-full bg-background font-sans antialiased">
      <TrialBanner 
        trialEndsAt={school?.trial_ends_at || null} 
        plan={school?.plan || null} 
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      <DebugPanel />
    </div>
  );
}
