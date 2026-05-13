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

  const role = user?.user_metadata?.role

  // 1. Unauthenticated users
  if (!user) {
    if (request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/teacher')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return supabaseResponse
  }

  // 2. Role-based Access Control
  if (role === 'insegnante' && request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/teacher/home', request.url))
  }

  if (role === 'admin' && request.nextUrl.pathname.startsWith('/teacher')) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/admin/:path*', '/teacher/:path*'],
}
