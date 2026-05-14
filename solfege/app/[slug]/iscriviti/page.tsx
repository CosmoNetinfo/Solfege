import { getSchoolBySlug } from "@/lib/supabase/queries";
import { createServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { RegistrationForm } from "../../portal/iscriviti/RegistrationForm";
import Image from "next/image";

export default async function PublicRegistrationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createServerClient();
  const school = await getSchoolBySlug(supabase, slug);

  if (!school) {
    notFound();
  }

  return (
    <div className="min-h-screen w-full bg-stone-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-orange/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-orange/5 rounded-full blur-3xl" />
      
      <div className="z-10 w-full flex flex-col items-center">
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-1000">
          {school.logo_url ? (
            <Image src={school.logo_url} alt={school.name} width={180} height={60} className="h-12 w-auto object-contain" />
          ) : (
            <h2 className="text-2xl font-serif font-bold text-orange uppercase tracking-widest">{school.name}</h2>
          )}
        </div>

        <RegistrationForm school={{ id: school.id, name: school.name }} />
        
        <footer className="mt-12 text-stone-400 text-xs flex flex-col items-center gap-2">
            <p>Powered by Solfège — Platform v1.5</p>
            <div className="h-1 w-12 bg-stone-200 rounded-full" />
        </footer>
      </div>
    </div>
  );
}
