import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const MAX_DEVICES = 3

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { license_key, machine_id, app_version, os_info } = body

    if (!license_key || !machine_id || !app_version || !os_info) {
      return NextResponse.json({ error: 'Campi obbligatori mancanti' }, { status: 400 })
    }

    const adminDb = createAdminClient()

    // 1. Verifica che la licenza esista e non sia revocata
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
      return NextResponse.json({ error: 'Licenza revocata. Contattaci per assistenza.' }, { status: 403 })
    }

    // 2. Controlla se questo machine_id è già registrato nelle attivazioni
    const { data: existingActivation, error: activationFetchError } = await adminDb
      .from('license_activations' as any)
      .select('*')
      .eq('license_key', license_key)
      .eq('machine_id', machine_id)
      .maybeSingle()

    if (activationFetchError) {
      return NextResponse.json({ error: activationFetchError.message }, { status: 500 })
    }

    if (existingActivation) {
      // 3a. Riattivazione sulla stessa macchina — aggiorna last_seen_at e app_version
      const { error: updateActivationError } = await adminDb
        .from('license_activations' as any)
        .update({
          last_seen_at: new Date().toISOString(),
          app_version,
          os_info,
        })
        .eq('id', (existingActivation as any).id)

      if (updateActivationError) {
        return NextResponse.json({ error: updateActivationError.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, customer_name: license.customer_name })
    }

    // 3b. Machine ID nuovo — conta le attivazioni esistenti
    const { count, error: countError } = await adminDb
      .from('license_activations' as any)
      .select('*', { count: 'exact', head: true })
      .eq('license_key', license_key)

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 })
    }

    if ((count ?? 0) >= MAX_DEVICES) {
      return NextResponse.json(
        { error: `Hai raggiunto il limite di ${MAX_DEVICES} dispositivi per questa licenza. Contattaci per assistenza.` },
        { status: 403 }
      )
    }

    // 4. Nuova attivazione — inserisci in license_activations
    const { error: insertError } = await adminDb
      .from('license_activations' as any)
      .insert({
        license_key,
        machine_id,
        app_version,
        os_info,
        activated_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
      })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // 5. Se la licenza era ancora inactive, aggiorna lo status a active
    if (license.status === 'inactive') {
      await adminDb
        .from('licenses' as any)
        .update({
          status: 'active',
          activated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('license_key', license_key)
    }

    return NextResponse.json({ success: true, customer_name: license.customer_name })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
