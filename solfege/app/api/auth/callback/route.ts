import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/admin/dashboard'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && user) {
      // Logic for teacher invitation
      const { teacher_id, school_id, role } = user.user_metadata || {};
      
      if (role === 'insegnante' && teacher_id) {
        const { createAdminClient } = await import('@/lib/supabase/admin');
        const admin = createAdminClient();
        
        // 1. Update teachers table
        await admin
          .from('teachers')
          .update({ profile_id: user.id })
          .eq('id', teacher_id);
          
        // 2. Update profiles table (role and school_id)
        await admin
          .from('profiles')
          .update({ 
            role: 'insegnante', 
            school_id: school_id,
            first_name: user.user_metadata.first_name || null,
            last_name: user.user_metadata.last_name || null
          })
          .eq('id', user.id);
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return user to login with an error if something went wrong
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
