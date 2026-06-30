import { createClient as createServerClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/queries";
import { AttendanceList } from "@/components/portal/AttendanceList";
import { redirect } from "next/navigation";

export default async function PortalPresenzePage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getProfile(supabase, user.id);
  if (!profile?.student_id) {
    return <div className="p-8">Associazione allievo non trovata. Contatta la segreteria.</div>;
  }

  // Carica storico presenze e lezioni associate
  const { data: attendanceHistory, error } = await supabase
    .from("attendance" as any)
    .select("*, lessons!inner(*, courses(name), teachers(first_name, last_name), rooms(name))")
    .eq("student_id", profile.student_id);

  if (error) {
    console.error("Errore caricamento lezioni:", error.message);
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-stone-900">Le Tue Lezioni</h1>
        <p className="text-sm text-stone-500">Visualizza gli orari delle prossime lezioni e gli argomenti/compiti svolti.</p>
      </header>

      <AttendanceList attendanceData={attendanceHistory || []} />
    </div>
  );
}
