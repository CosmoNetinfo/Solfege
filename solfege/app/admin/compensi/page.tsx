import { createClient } from "@/lib/supabase/server";
import { getProfile, getSchoolData } from "@/lib/supabase/queries";
import { redirect } from "next/navigation";
import { CompensationsTable } from "@/components/admin/compensations/CompensationsTable";

export const metadata = {
  title: "Compensi Docenti | Solfège",
};

export default async function CompensiPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getProfile(supabase, user.id);
  if (!profile || !profile.school_id) redirect("/");

  // Verifichiamo che la scuola esista
  const school = await getSchoolData(supabase, profile.school_id);
  if (!school) redirect("/");

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-4xl font-bold tracking-tight text-[#1A1714]">Compensi Docenti</h2>
          <p className="text-muted-foreground mt-2">Gestisci e registra i pagamenti mensili per i tuoi insegnanti.</p>
        </div>
      </div>

      <CompensationsTable schoolId={profile.school_id} />
    </div>
  );
}
