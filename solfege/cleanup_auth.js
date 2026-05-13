const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanup() {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) return console.error(error);
  
  const bianchis = data.users.filter(u => u.email.includes('bianchi'));
  for (const u of bianchis) {
    console.log("Deleting:", u.email);
    await supabase.auth.admin.deleteUser(u.id);
  }
}

cleanup();
