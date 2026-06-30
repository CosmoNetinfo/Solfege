import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SuperadminSidebar } from "@/components/superadmin/sidebar";

export default async function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if ((profile?.role as string) !== "superadmin") {
    redirect("/admin/dashboard");
  }

  return (
    <div className="flex min-h-screen w-full bg-background font-sans antialiased">
      <aside className="w-64 bg-sidebar sticky top-0 h-screen overflow-y-auto shrink-0 border-r border-sidebar-border">
        <SuperadminSidebar />
      </aside>
      <main className="flex-1 min-h-screen">{children}</main>
    </div>
  );
}
