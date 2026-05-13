import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({
        status: 'NO_USER',
        error: userError?.message ?? 'No user found',
        user: null,
        profile: null,
      })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Test with admin client too
    let adminProfile = null;
    let adminErrorMsg = null;
    try {
      const adminClient = createAdminClient();
      const { data: aProfile, error: aError } = await adminClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      adminProfile = aProfile;
      adminErrorMsg = aError?.message;
    } catch (err: any) {
      adminErrorMsg = err.message;
    }

    return NextResponse.json({
      status: 'OK',
      user: {
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role,
      },
      profile: profile ?? null,
      profileError: profileError?.message ?? null,
      adminProfile: adminProfile ?? null,
      adminProfileError: adminErrorMsg ?? null,
    })
  } catch (e: any) {
    return NextResponse.json({ status: 'EXCEPTION', error: e.message }, { status: 500 })
  }
}
