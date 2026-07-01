import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, nome, cognome, license_key } = body

    if (!email || !password || !nome || !cognome) {
      return NextResponse.json({ error: 'Campi obbligatori mancanti' }, { status: 400 })
    }

    const adminDb = createAdminClient()

    // 1. Verifica che la licenza esista e sia attiva (opzionale ma consigliato)
    if (license_key) {
      const { data: licenseRes } = await adminDb
        .from('licenses' as any)
        .select('status')
        .eq('license_key', license_key)
        .maybeSingle()

      if (!licenseRes || (licenseRes as any).status === 'revoked') {
        return NextResponse.json({ error: 'Licenza non valida' }, { status: 403 })
      }
    }

    // 2. Crea utente su Supabase Auth senza conferma email (admin bypass)
    const { data: authData, error: authError } = await adminDb.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // ← confermato immediatamente, nessuna email richiesta
      user_metadata: {
        role: 'admin',
        nome,
        cognome,
      },
    })

    if (authError) {
      // Se l'utente esiste già non è un errore bloccante
      if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
        return NextResponse.json({ success: true, message: 'Utente già esistente' })
      }
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const userId = authData.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'Creazione utente fallita' }, { status: 500 })
    }

    // 3. Inserisci riga in profiles (schema Supabase) — necessaria per le query delle pagine admin
    const { error: profileError } = await adminDb
      .from('profiles' as any)
      .upsert({
        id: userId,
        email,
        role: 'admin',
        full_name: `${nome} ${cognome}`,
      })

    if (profileError) {
      console.error('[REGISTER DESKTOP] Errore inserimento profilo:', profileError.message)
      // Non blocchiamo: il trigger Supabase potrebbe già averlo creato
    }

    return NextResponse.json({ success: true, user_id: userId })
  } catch (err: any) {
    console.error('[REGISTER DESKTOP] Errore:', err)
    return NextResponse.json({ error: err.message || 'Errore interno' }, { status: 500 })
  }
}
