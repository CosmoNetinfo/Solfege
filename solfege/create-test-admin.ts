import { createAdminClient } from "./lib/supabase/admin";

async function createTestAdmin() {
  const supabase = createAdminClient();
  const email = "admin@test.com";
  const password = "password123";
  const schoolId = "d4e7a8b0-1234-4a5b-8c9d-0e1f2a3b4c5d"; // From seed.sql

  console.log(`Creazione utente ${email}...`);
  
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'admin' }
  });

  if (authError) {
    if (authError.message.includes("already registered")) {
      console.log("Utente già esistente.");
    } else {
      console.error("Errore creazione auth:", authError);
      return;
    }
  }

  let userId = authUser?.user?.id;
  if (!userId) {
    // Try to get user ID by email
    const { data: users } = await supabase.auth.admin.listUsers();
    const existingUser = users.users.find(u => u.email === email);
    if (!existingUser) return;
    userId = existingUser.id;
  }

  console.log(`Aggiornamento profilo per ${userId}...`);
  
  const { error: profileError } = await supabase.from("profiles").upsert({
    id: userId,
    school_id: schoolId,
    role: 'admin',
    first_name: 'Admin',
    last_name: 'Test'
  });

  if (profileError) {
    console.error("Errore profilo:", profileError);
  } else {
    console.log("Admin test pronto: admin@test.com / password123");
  }
}

createTestAdmin();
