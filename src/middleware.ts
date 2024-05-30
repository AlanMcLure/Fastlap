import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const token = await getToken({ req })

  if (!token) {
    return NextResponse.redirect(new URL('/sign-in', req.nextUrl))
  }

  // Verificar si el usuario tiene acceso a las rutas del F1 Dashboard
  const { pathname } = req.nextUrl
  const isF1DashboardRoute = pathname.startsWith('/f1-dashboard')
  
  if (isF1DashboardRoute && token.role !== 'ADMIN' && token.role !== 'PREMIUM') {
    return NextResponse.redirect(new URL('/not-authorized', req.nextUrl))
  }
  
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/r/:path*/submit', '/r/create', '/settings', '/f1-dashboard', '/f1-dashboard/:path*'],
}
