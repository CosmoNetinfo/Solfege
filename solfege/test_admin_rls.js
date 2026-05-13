const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Use the ADMIN's real credentials to test what THEY see in the browser
async function testAdminAccess() {
  const email = 'admindany@gmail.com';
  const password = 'Password123!';
  
  const supabase = createClient(supabaseUrl, anonKey);
  const { data: auth, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
  
  if (loginError) return console.error("Login Error:", loginError);
  
  const userId = auth.user.id;
  console.log("Logged in as Admin ID:", userId);
  
  // Get school_id from profile
  const { data: profile } = await supabase.from('profiles').select('school_id').eq('id', userId).single();
  console.log("Admin School ID:", profile?.school_id);
  
  if (!profile?.school_id) return console.error("No school_id for admin");

  // Test reading teachers
  const { data: teachers, error: tErr } = await supabase.from('teachers').select('*').eq('school_id', profile.school_id);
  console.log("Teachers found:", teachers?.length ?? 0, tErr ? `Error: ${tErr.message}` : "");

  // Test reading courses
  const { data: courses, error: cErr } = await supabase.from('courses').select('*').eq('school_id', profile.school_id);
  console.log("Courses found:", courses?.length ?? 0, cErr ? `Error: ${cErr.message}` : "");
}

testAdminAccess();
