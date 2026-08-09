import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/'
  const error = searchParams.get('error')

  // Se c'è un errore auth → login
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${error}`)
  }

  if (code) {
    const supabase = await createClient()
    const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!sessionError) {
      if (type === 'invite' || next === '/accept-invite') {
        return NextResponse.redirect(`${origin}/accept-invite`)
      }

      // Controlla se l'utente ha già un profilo con scuola
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('school_id, role')
            .eq('id', user.id)
            .maybeSingle()

          // Utente nuovo senza scuola → manda al setup online
          if (!profile || !profile.school_id) {
            return NextResponse.redirect(`${origin}/setup-trial`)
          }

          // Utente esistente → dashboard normale
          if (profile.role === 'superadmin') {
            return NextResponse.redirect(`${origin}/superadmin`)
          }
          if (profile.role === 'insegnante') {
            return NextResponse.redirect(`${origin}/teacher/home`)
          }
        }
      } catch (err) {
        console.error("Errore nel controllo profilo post-login:", err)
      }

      return NextResponse.redirect(`${origin}/admin/dashboard`)
    }
  }

  // Nessun code → potrebbe essere token nel fragment, redirecta a accept-invite
  // Il client JS gestirà il fragment automaticamente
  if (type === 'invite') {
    return NextResponse.redirect(`${origin}/accept-invite`)
  }

  return NextResponse.redirect(`${origin}/login`)
}
