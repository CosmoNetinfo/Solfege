import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Database } from '@/types/database.types'

export default async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: use getUser() not getSession() — getSession() reads only
  // the local token without server-side validation, causing the redirect loop.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    if (
      request.nextUrl.pathname.startsWith('/admin') ||
      request.nextUrl.pathname.startsWith('/teacher') ||
      request.nextUrl.pathname.startsWith('/superadmin')
    ) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return supabaseResponse
  }

  // 2. Resolve Role
  let role = user.user_metadata?.role

  // If role is missing in metadata, try to fetch from profile
  if (!role) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    role = profile?.role
  }

  const path = request.nextUrl.pathname

  // 3. Superadmin protection
  if (path.startsWith('/superadmin')) {
    if (role !== 'superadmin') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }
  }

  // 4. RBAC Enforcement for /admin
  if (path.startsWith('/admin')) {
    if (role === 'superadmin') {
      // Superadmin accessing /admin — redirect to superadmin panel
      return NextResponse.redirect(new URL('/superadmin', request.url))
    }
    if (role !== 'admin' && role !== 'segreteria') {
      return NextResponse.redirect(new URL(role === 'insegnante' ? '/teacher/home' : '/login', request.url))
    }
  }

  if (path.startsWith('/teacher')) {
    if (role !== 'insegnante' && role !== 'admin') {
      // Non-teacher, non-admin users cannot access teacher routes
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/admin/:path*', '/teacher/:path*', '/superadmin/:path*'],
}

