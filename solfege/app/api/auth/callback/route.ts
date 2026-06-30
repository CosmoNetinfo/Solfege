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
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      if (type === 'invite' || next === '/accept-invite') {
        return NextResponse.redirect(`${origin}/accept-invite`)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Nessun code → potrebbe essere token nel fragment, redirecta a accept-invite
  // Il client JS gestirà il fragment automaticamente
  if (type === 'invite') {
    return NextResponse.redirect(`${origin}/accept-invite`)
  }

  return NextResponse.redirect(`${origin}/login`)
}
