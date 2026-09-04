import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * Header CORS condivisi per consentire l'accesso da client esterni/desktop
 */
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

/**
 * Helper per creare risposte JSON con header CORS inclusi
 */
function jsonWithCors(data: any, init?: { status?: number }) {
  const response = NextResponse.json(data, { status: init?.status ?? 200 })
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    response.headers.set(key, value)
  }
  return response
}

/**
 * 1. GET - Recupero registrazioni online (con supporto sincronizzazione incrementale)
 * Parametri query:
 * - school_id: string (obbligatorio)
 * - since: ISO_DATE (opzionale) - se fornito, restituisce solo record con created_at >= since
 * - status: string (opzionale, default 'pending') - filtra per stato ('pending', 'approved', 'rejected', 'synced', 'all')
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('school_id')

    if (!schoolId) {
      return jsonWithCors({ error: 'school_id richiesto' }, { status: 400 })
    }

    const since = searchParams.get('since')
    const statusParam = searchParams.get('status')
    const status = statusParam && statusParam.trim() !== '' ? statusParam.trim() : 'pending'

    const adminDb = createAdminClient()

    let query = adminDb
      .from('online_registrations' as any)
      .select('*')
      .eq('school_id', schoolId)

    // Filtra per stato a meno che non sia richiesto esplicitamente 'all'
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    // Sincronizzazione incrementale: record creati da una data specifica in poi
    if (since && since.trim() !== '') {
      query = query.gte('created_at', since.trim())
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      return jsonWithCors({ error: error.message }, { status: 500 })
    }

    return jsonWithCors(data || [])
  } catch (err: any) {
    return jsonWithCors({ error: err.message || 'Errore interno del server' }, { status: 500 })
  }
}

/**
 * 2. POST - Aggiorna lo stato delle registrazioni (singolo o batch)
 * Body:
 * - registration_id?: string
 * - registration_ids?: string[]
 * - status: 'approved' | 'rejected' | 'synced' (obbligatorio)
 * Se status === 'synced', imposta automaticamente synced_at al timestamp corrente
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { registration_id, registration_ids, status } = body

    if (!status) {
      return jsonWithCors({ error: 'Campo status richiesto' }, { status: 400 })
    }

    const validStatuses = ['approved', 'rejected', 'synced']
    if (!validStatuses.includes(status)) {
      return jsonWithCors(
        { error: 'Stato non valido. Valori ammessi: approved, rejected, synced' },
        { status: 400 }
      )
    }

    // Raccoglie gli ID da aggiornare (supporta operazione singola o batch)
    const ids: string[] = []
    if (Array.isArray(registration_ids) && registration_ids.length > 0) {
      ids.push(...registration_ids.filter((id: any) => typeof id === 'string' && id.trim() !== ''))
    } else if (registration_id && typeof registration_id === 'string' && registration_id.trim() !== '') {
      ids.push(registration_id.trim())
    }

    if (ids.length === 0) {
      return jsonWithCors(
        { error: 'registration_id o registration_ids (array non vuoto) richiesto' },
        { status: 400 }
      )
    }

    const nowIso = new Date().toISOString()
    const updateData: Record<string, any> = {
      status,
      updated_at: nowIso,
    }

    // Se lo stato è 'synced', aggiorna anche il timestamp di sincronizzazione
    if (status === 'synced') {
      updateData.synced_at = nowIso
    }

    const adminDb = createAdminClient()

    const { data, error } = await adminDb
      .from('online_registrations' as any)
      .update(updateData)
      .in('id', ids)
      .select()

    if (error) {
      return jsonWithCors({ error: error.message }, { status: 500 })
    }

    return jsonWithCors({
      success: true,
      count: data?.length ?? 0,
      data,
    })
  } catch (err: any) {
    return jsonWithCors({ error: err.message || 'Errore interno del server' }, { status: 500 })
  }
}

/**
 * 3. DELETE - Pulizia dei record già sincronizzati più vecchi di 30 giorni
 * Query:
 * - school_id: string (obbligatorio)
 * Elimina: status = 'synced' AND synced_at < (now - 30 giorni)
 * Restituisce il conteggio dei record eliminati
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('school_id')

    if (!schoolId) {
      return jsonWithCors({ error: 'school_id richiesto' }, { status: 400 })
    }

    // Calcola il cutoff a 30 giorni fa
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const adminDb = createAdminClient()

    const { data, error, count } = await adminDb
      .from('online_registrations' as any)
      .delete({ count: 'exact' })
      .eq('school_id', schoolId)
      .eq('status', 'synced')
      .lt('synced_at', thirtyDaysAgo)
      .select()

    if (error) {
      return jsonWithCors({ error: error.message }, { status: 500 })
    }

    const deletedCount = count !== null && count !== undefined ? count : (data?.length ?? 0)

    return jsonWithCors({
      success: true,
      count: deletedCount,
    })
  } catch (err: any) {
    return jsonWithCors({ error: err.message || 'Errore interno del server' }, { status: 500 })
  }
}

/**
 * 4. OPTIONS - Preflight handler per CORS
 */
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 })
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    response.headers.set(key, value)
  }
  return response
}
