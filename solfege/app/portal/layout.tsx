import { PortalSidebar } from "@/components/portal/PortalSidebar";
import { DebugPanel } from "@/components/debug/DebugPanel";
import { createServerClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/queries";
import { redirect } from "next/navigation";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }

  const profile = await getProfile(supabase, user.id);
  
  if (!profile || (profile.role !== "studente" && profile.role !== "genitore")) {
    if (profile?.role === "admin" || profile?.role === "segreteria") {
      redirect("/admin/dashboard");
    } else if (profile?.role === "insegnante") {
      redirect("/teacher/dashboard");
    } else {
      redirect("/login");
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-stone-50 font-sans antialiased">
      <PortalSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      <DebugPanel />
    </div>
  );
}
