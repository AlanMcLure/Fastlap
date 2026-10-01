import { NextResponse } from 'next/server'

import { auth } from '@/lib/auth'

export default auth((req) => {
  if (!req.auth) {
    return NextResponse.redirect(new URL('/sign-in', req.nextUrl))
  }

  // Verificar si el usuario tiene acceso a las rutas del F1 Dashboard
  const { pathname } = req.nextUrl
  const isF1DashboardRoute = pathname.startsWith('/f1-dashboard')
  const role = req.auth.user?.role

  if (isF1DashboardRoute && role !== 'ADMIN' && role !== 'PREMIUM') {
    return NextResponse.redirect(new URL('/not-authorized', req.nextUrl))
  }
})

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/r/:path*/submit', '/r/create', '/settings', '/f1-dashboard', '/f1-dashboard/:path*'],
}
