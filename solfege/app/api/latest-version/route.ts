import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const adminDb = createAdminClient()

    const { data: releaseRes, error } = await adminDb
      .from('app_releases' as any)
      .select('version, release_notes, windows_url, mac_url, linux_url')
      .eq('is_current', true)
      .maybeSingle()

    const release = releaseRes as any

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!release) {
      return NextResponse.json({ version: '0.0.0' })
    }

    return NextResponse.json({
      version: release.version,
      release_notes: release.release_notes,
      windows_url: release.windows_url || null,
      mac_url: release.mac_url || null,
      linux_url: release.linux_url || null
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
