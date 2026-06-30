import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if ((profile?.role as string) !== 'superadmin') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const body = await request.json()
    const { version, release_notes, windows_url, mac_url, linux_url, is_current } = body

    if (!version || !release_notes) {
      return NextResponse.json({ error: 'Campi obbligatori mancanti' }, { status: 400 })
    }

    const adminDb = createAdminClient()

    if (is_current) {
      // Imposta tutte le altre release a is_current = false
      const { error: resetError } = await adminDb
        .from('app_releases' as any)
        .update({ is_current: false })
        .eq('is_current', true)

      if (resetError) {
        return NextResponse.json({ error: resetError.message }, { status: 500 })
      }
    }

    const { error: insertError } = await adminDb
      .from('app_releases' as any)
      .insert({
        version,
        release_notes,
        windows_url: windows_url || null,
        mac_url: mac_url || null,
        linux_url: linux_url || null,
        is_current: !!is_current
      })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
