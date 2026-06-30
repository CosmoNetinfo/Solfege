import { PortalSidebar } from "@/components/portal/PortalSidebar";
import { DebugPanel } from "@/components/debug/DebugPanel";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/queries";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Calendar, Banknote, User, LogOut } from "lucide-react";

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

  const school = Array.isArray(profile.schools) ? profile.schools[0] : profile.schools;
  const schoolName = school?.name || "Solfège";

  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row bg-stone-50 font-sans antialiased pb-16 md:pb-0">
      {/* Sidebar per desktop */}
      <aside className="hidden md:flex w-64 shrink-0">
        <PortalSidebar />
      </aside>

      {/* Header per smartphone */}
      <header className="flex md:hidden items-center justify-between px-6 h-16 bg-white border-b border-stone-200 sticky top-0 z-30 w-full">
        <span className="font-serif font-bold text-orange text-lg truncate">{schoolName}</span>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-stone-600 truncate max-w-[120px]">
            {profile.first_name}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full">
        {children}
      </main>

      {/* Bottom Navigation per smartphone */}
      <nav className="flex md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-stone-200 justify-around items-center z-30 shadow-lg px-2">
        <Link href="/portal/dashboard" className="flex flex-col items-center justify-center text-stone-500 hover:text-orange py-1 flex-1">
          <LayoutDashboard className="h-5.5 w-5.5" />
          <span className="text-[10px] font-medium mt-1">Home</span>
        </Link>
        <Link href="/portal/presenze" className="flex flex-col items-center justify-center text-stone-500 hover:text-orange py-1 flex-1">
          <Calendar className="h-5.5 w-5.5" />
          <span className="text-[10px] font-medium mt-1">Lezioni</span>
        </Link>
        <Link href="/portal/pagamenti" className="flex flex-col items-center justify-center text-stone-500 hover:text-orange py-1 flex-1">
          <Banknote className="h-5.5 w-5.5" />
          <span className="text-[10px] font-medium mt-1">Pagamenti</span>
        </Link>
        <Link href="/portal/profilo" className="flex flex-col items-center justify-center text-stone-500 hover:text-orange py-1 flex-1">
          <User className="h-5.5 w-5.5" />
          <span className="text-[10px] font-medium mt-1">Profilo</span>
        </Link>
      </nav>

      <DebugPanel />
    </div>
  );
}
