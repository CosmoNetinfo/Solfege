import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateLicense() {
  const licenseKey = `SOLFEGE-TEST-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  
  const { data, error } = await supabase.from('licenses').insert({
    license_key: licenseKey,
    customer_name: 'Test Customer',
    customer_email: 'test@cosmonet.info',
    status: 'inactive'
  }).select();

  if (error) {
    console.error("Error creating license:", error);
  } else {
    console.log("License created successfully!");
    console.log("LICENSE KEY:", licenseKey);
  }
}

generateLicense();
