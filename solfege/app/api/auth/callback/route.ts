import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/admin/dashboard'

  console.log('[CALLBACK] URL:', request.url)
  console.log('[CALLBACK] code:', !!code, 'type:', type, 'next:', next)

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
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
      const { teacher_id, school_id, role } = user.user_metadata || {}

      if (role === 'insegnante' && teacher_id) {
        const { createAdminClient } = await import('@/lib/supabase/admin')
        const admin = createAdminClient()

        await admin
          .from('teachers')
          .update({ profile_id: user.id })
          .eq('id', teacher_id)

        await admin
          .from('profiles')
          .update({
            role: 'insegnante',
            school_id: school_id,
            first_name: user.user_metadata.first_name || null,
            last_name: user.user_metadata.last_name || null,
          })
          .eq('id', user.id)
      }

      // Se è un invito (type=invite o ruolo insegnante) → pagina imposta password
      if (type === 'invite' || role === 'insegnante' || next === '/accept-invite') {
        console.log('[CALLBACK] Invito rilevato → /accept-invite')
        return NextResponse.redirect(`${origin}/accept-invite`)
      }

      console.log('[CALLBACK] Redirect a:', next)
      return NextResponse.redirect(`${origin}${next}`)
    }

    const error_msg = error?.message || 'auth_exchange_failed'
    console.error('[CALLBACK] Errore:', error_msg)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error_msg)}`)
  }

  console.warn('[CALLBACK] Nessun codice trovato')
  return NextResponse.redirect(`${origin}/login?error=codice_mancante`)
}
