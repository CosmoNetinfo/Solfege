import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ⚠️ ROUTE DI DEBUG TEMPORANEA — ELIMINARE DOPO IL TEST
// Visitare: /api/debug/email per vedere lo stato della configurazione email

export async function GET() {
  const results: Record<string, unknown> = {}

  // 1. Verifica variabili ambiente
  results.env = {
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ presente' : '❌ mancante',
    SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ presente' : '❌ mancante',
    SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ presente' : '❌ mancante',
    RESEND_API_KEY: process.env.RESEND_API_KEY ? '✅ presente' : '❌ mancante',
    APP_URL: process.env.NEXT_PUBLIC_APP_URL || '❌ mancante',
  }

  // 2. Verifica connessione Supabase Admin
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const { data, error } = await supabaseAdmin.auth.admin.listUsers()
    results.supabase_admin = error
      ? `❌ ${error.message}`
      : `✅ connesso — ${data.users.length} utenti`
  } catch (e) {
    results.supabase_admin = `❌ eccezione: ${e}`
  }

  // 3. Testa invio email via Supabase invite
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      'debug-test@resend.dev',
      { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/accept-invite` }
    )
    results.supabase_invite = error
      ? `❌ ${error.message} (status: ${error.status})`
      : `✅ invito inviato — user: ${data.user?.id}`
  } catch (e) {
    results.supabase_invite = `❌ eccezione: ${e}`
  }

  // 4. Testa Resend direttamente
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Solfège <onboarding@resend.dev>',
        to: ['debug-test@resend.dev'],
        subject: 'Test Solfège',
        html: '<p>Test email debug</p>'
      })
    })
    const resendData = await res.json()
    results.resend_direct = res.ok
      ? `✅ Resend OK — id: ${resendData.id}`
      : `❌ Resend errore: ${JSON.stringify(resendData)}`
  } catch (e) {
    results.resend_direct = `❌ eccezione: ${e}`
  }

  return NextResponse.json(results, { status: 200 })
}
