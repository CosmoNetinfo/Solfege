const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdminMeta() {
  const { data: users, error } = await supabase.auth.admin.listUsers();
  if (error) return console.error(error);
  
  const admin = users.users.find(u => u.email === 'admindany@gmail.com');
  if (admin) {
    console.log("Admin User Metadata:", JSON.stringify(admin.user_metadata, null, 2));
    console.log("Admin ID:", admin.id);
  } else {
    console.log("Admin not found in Auth");
  }
}

checkAdminMeta();
