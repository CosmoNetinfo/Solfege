const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function moveAdminToVerdi() {
  const adminId = '90455fb7-1dfa-43ca-be92-5240dc13dda6';
  const verdiSchoolId = 'd4e7a8b0-1234-4a5b-8c9d-0e1f2a3b4c5d';
  
  const { error } = await supabase.from('profiles').update({ school_id: verdiSchoolId }).eq('id', adminId);
  
  if (error) {
    console.error("Error moving admin:", error);
  } else {
    console.log("Admin moved to Accademia Verdi successfully.");
  }
}

moveAdminToVerdi();
