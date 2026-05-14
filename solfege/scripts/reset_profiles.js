const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  console.log('Resetting profile_id for teachers...');
  const { data, error } = await supabase
    .from('teachers')
    .update({ profile_id: null })
    .neq('email', 'marco.bianchi@test.com')
    .select();
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Success, rows updated:', data.length);
  }
}

run();
