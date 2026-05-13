import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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

    return NextResponse.json({
      status: 'OK',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      profile: profile ?? null,
      profileError: profileError?.message ?? null,
    })
  } catch (e: any) {
    return NextResponse.json({ status: 'EXCEPTION', error: e.message }, { status: 500 })
  }
}
