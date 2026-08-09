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
      // Controllo ed onboarding automatico del trial Google
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          // Verifica se l'utente ha già una scuola associata nel profilo
          const { data: profile } = await supabase
            .from('profiles')
            .select('school_id')
            .eq('id', user.id)
            .maybeSingle()

          if (!profile || !profile.school_id) {
            // Nuova registrazione OAuth (Google): creiamo una scuola Demo Trial e il profilo
            const name = user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utente'
            const schoolName = `Scuola Prova di ${name}`
            const schoolSlug = `scuola-${user.id.slice(0, 8)}`
            const trialEnds = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()

            // 1. Crea la scuola
            const { data: newSchool, error: schoolErr } = await supabase
              .from('schools')
              .insert({
                name: schoolName,
                slug: schoolSlug,
                plan: 'trial',
                trial_ends_at: trialEnds
              })
              .select('id')
              .single()

            if (newSchool && !schoolErr) {
              // 2. Crea o aggiorna il profilo
              const firstName = user.user_metadata?.given_name || user.user_metadata?.first_name || name
              const lastName = user.user_metadata?.family_name || user.user_metadata?.last_name || 'Demo'
              
              await supabase
                .from('profiles')
                .upsert({
                  id: user.id,
                  school_id: newSchool.id,
                  role: 'admin',
                  first_name: firstName,
                  last_name: lastName
                })
            }
          }
        }
      } catch (err) {
        console.error("Errore nell'onboarding automatico Google:", err)
      }

      if (type === 'invite' || next === '/accept-invite') {
        return NextResponse.redirect(`${origin}/accept-invite`)
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
