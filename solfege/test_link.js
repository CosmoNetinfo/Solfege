const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLink() {
  console.log("Generating link for marco.bianchi@email.it...");
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'invite',
    email: 'marco.bianchi@email.it',
    options: {
      redirectTo: 'http://localhost:3000/api/auth/callback?next=/accept-invite',
      data: {
        teacher_id: '6b7740da-91d2-410f-97b6-418ff7c7ab9e',
        school_id: 'd4e7a8b0-1234-4a5b-8c9d-0e1f2a3b4c5d',
        role: 'insegnante'
      }
    }
  });
  
  if (error) {
    console.error("Link Error:", error);
  } else {
    console.log("Link Success:", JSON.stringify(data, null, 2));
  }
}

testLink();
