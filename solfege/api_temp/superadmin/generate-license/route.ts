import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

function generateLicenseKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no ambigui: 0/O, 1/I
  const segment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `SOLFEGE-${segment()}-${segment()}-${segment()}`
}

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
    const { customer_name, customer_email, customer_whatsapp, notes } = body

    if (!customer_name || !customer_email) {
      return NextResponse.json({ error: 'Campi obbligatori mancanti' }, { status: 400 })
    }

    const license_key = generateLicenseKey()
    const adminDb = createAdminClient()

    const { error } = await adminDb
      .from('licenses' as any)
      .insert({
        license_key,
        customer_name,
        customer_email,
        customer_whatsapp: customer_whatsapp || null,
        notes: notes || null,
        status: 'inactive'
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ license_key })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
