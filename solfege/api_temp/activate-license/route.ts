import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { license_key, machine_id, app_version, os_info } = body

    if (!license_key || !machine_id || !app_version || !os_info) {
      return NextResponse.json({ error: 'Campi obbligatori mancanti' }, { status: 400 })
    }

    const adminDb = createAdminClient()

    const { data: licenseRes, error: fetchError } = await adminDb
      .from('licenses' as any)
      .select('*')
      .eq('license_key', license_key)
      .maybeSingle()

    const license = licenseRes as any

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!license) {
      return NextResponse.json({ error: 'Licenza non trovata' }, { status: 404 })
    }

    if (license.status === 'revoked') {
      return NextResponse.json({ error: 'Licenza revocata' }, { status: 403 })
    }

    if (license.status === 'active') {
      if (license.machine_id === machine_id) {
        // Ri-attivazione sulla stessa macchina, ok
        return NextResponse.json({ success: true, customer_name: license.customer_name })
      } else {
        return NextResponse.json({ error: 'Licenza già attiva su un altro dispositivo' }, { status: 403 })
      }
    }

    // Se status è 'inactive', procediamo all'attivazione
    const { error: updateError } = await adminDb
      .from('licenses' as any)
      .update({
        status: 'active',
        machine_id,
        app_version,
        os_info,
        activated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('license_key', license_key)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, customer_name: license.customer_name })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
