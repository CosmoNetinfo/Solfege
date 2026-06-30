import { Sidebar } from "@/components/admin/sidebar";
import { DebugPanel } from "@/components/debug/DebugPanel";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/queries";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const profile = user ? await getProfile(supabase, user.id) : null;

  return (
    <div className="flex flex-col min-h-screen w-full bg-background font-sans antialiased">
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
}
