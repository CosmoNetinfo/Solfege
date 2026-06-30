import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      license_key,
      error_type,
      error_message,
      error_stack,
      screen_name,
      action_performed,
      app_version,
      os_info
    } = body

    if (!license_key || !error_type || !error_message || !app_version || !os_info) {
      return NextResponse.json({ error: 'Campi obbligatori mancanti' }, { status: 400 })
    }

    const adminDb = createAdminClient()

    // Verifica che la licenza esista
    const { data: licenseRes, error: licenseError } = await adminDb
      .from('licenses' as any)
      .select('license_key')
      .eq('license_key', license_key)
      .maybeSingle()

    const license = licenseRes as any

    if (licenseError || !license) {
      return NextResponse.json({ error: 'Licenza non valida o non trovata' }, { status: 400 })
    }

    // Salva l'error report
    const { error: reportError } = await adminDb
      .from('error_reports' as any)
      .insert({
        license_key,
        error_type,
        error_message,
        error_stack: error_stack || null,
        screen_name: screen_name || null,
        action_performed: action_performed || null,
        app_version,
        os_info,
        resolved: false
      })

    if (reportError) {
      return NextResponse.json({ error: reportError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
