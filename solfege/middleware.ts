import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Database } from '@/types/database.types'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Se l'utente non è loggato e cerca di accedere a rotte protette
  if (!user && (request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/teacher'))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Se l'utente è loggato, gestiamo i redirect basati sul ruolo solo alla root o alla login
  if (user && (request.nextUrl.pathname === '/' || request.nextUrl.pathname === '/login')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'admin' || profile?.role === 'segreteria') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    } else if (profile?.role === 'insegnante') {
      return NextResponse.redirect(new URL('/teacher/home', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
