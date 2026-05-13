const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAdminRole() {
  const adminId = '90455fb7-1dfa-43ca-be92-5240dc13dda6';
  const { data, error } = await supabase.auth.admin.updateUserById(adminId, {
    user_metadata: { role: 'admin' }
  });
  
  if (error) {
    console.error("Error updating admin role:", error);
  } else {
    console.log("Admin role updated to 'admin' successfully.");
  }
}

fixAdminRole();
