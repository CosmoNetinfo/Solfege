import { createAdminClient } from "./lib/supabase/admin.js";

async function generateInviteLink() {
  const supabase = createAdminClient();
  const email = "e.bianchi@email.it"; // Elena Bianchi
  const teacherId = "f2a2b2c2-1111-2222-3333-444455556666";
  const schoolId = "d4e7a8b0-1234-4a5b-8c9d-0e1f2a3b4c5d";

  console.log(`Generazione link invito per ${email}...`);
  
  // We use generateLink with type 'signup' or 'invite'
  // Actually 'invite' is what we want.
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'invite',
    email: email,
    options: {
      redirectTo: `http://localhost:3000/api/auth/callback?next=/accept-invite`,
      data: {
        teacher_id: teacherId,
        school_id: schoolId,
        role: 'insegnante',
        first_name: 'Elena',
        last_name: 'Bianchi'
      }
    }
  });

  if (error) {
    console.error("Errore generazione link:", error);
    return;
  }

  console.log("Link generato con successo!");
  console.log("URL:", data.properties.action_link);
}

generateInviteLink();
