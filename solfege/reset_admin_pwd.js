const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetAdminPassword() {
  const adminId = '90455fb7-1dfa-43ca-be92-5240dc13dda6';
  const { data, error } = await supabase.auth.admin.updateUserById(adminId, {
    password: 'Password123!'
  });
  
  if (error) {
    console.error("Error resetting admin password:", error);
  } else {
    console.log("Admin password reset to 'Password123!' successfully.");
  }
}

resetAdminPassword();
