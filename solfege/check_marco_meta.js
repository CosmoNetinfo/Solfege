const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserMeta() {
  const { data: users, error } = await supabase.auth.admin.listUsers();
  if (error) return console.error(error);
  
  const marco = users.users.find(u => u.email === 'marco.bianchi@test.com');
  if (marco) {
    console.log("Marco User Metadata:", JSON.stringify(marco.user_metadata, null, 2));
    console.log("Marco App Metadata:", JSON.stringify(marco.app_metadata, null, 2));
  } else {
    console.log("Marco not found in Auth");
  }
}

checkUserMeta();
