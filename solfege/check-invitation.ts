import { createAdminClient } from "./lib/supabase/admin.js";

async function checkInvite() {
  const supabase = createAdminClient();
  const email = "e.bianchi@email.it"; // Elena Bianchi from seed

  console.log(`Verifica invito per ${email}...`);
  
  const { data: users, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error("Errore listUsers:", error);
    return;
  }

  const user = users.users.find(u => u.email === email);
  
  if (user) {
    console.log("Utente trovato in auth.users:");
    console.log(`- ID: ${user.id}`);
    console.log(`- Last SignIn: ${user.last_sign_in_at}`);
    console.log(`- Invited At: ${user.invited_at}`);
    console.log(`- Metadata: ${JSON.stringify(user.user_metadata, null, 2)}`);

    // Check teachers table
    const { data: teacher } = await supabase
      .from("teachers")
      .select("profile_id")
      .eq("email", email)
      .single();
    
    console.log(`- Profile ID in teachers: ${teacher?.profile_id}`);
  } else {
    console.log("Utente non trovato in auth.users.");
  }
}

checkInvite();
