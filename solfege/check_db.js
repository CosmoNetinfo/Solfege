const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Assuming we are in d:\Solfege\solfege
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing ENV vars. NEXT_PUBLIC_SUPABASE_URL:", !!supabaseUrl, "SUPABASE_SERVICE_ROLE_KEY:", !!supabaseKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTeacher() {
  const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .ilike('last_name', 'Bianchi');
  
  if (error) {
    console.error("DB Error:", error);
  } else {
    console.log("Teachers found:", JSON.stringify(data, null, 2));
  }
}

checkTeacher();
