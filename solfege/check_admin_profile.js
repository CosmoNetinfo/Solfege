const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdminProfile() {
  const adminId = '90455fb7-1dfa-43ca-be92-5240dc13dda6';
  const { data, error } = await supabase.from('profiles').select('*').eq('id', adminId).single();
  
  if (error) {
    console.error("Error fetching admin profile:", error);
  } else {
    console.log("Admin Profile:", JSON.stringify(data, null, 2));
  }
}

checkAdminProfile();
