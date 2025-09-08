import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { UserRole } from '@/lib/permissions'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Защита API маршрутов (кроме публичных)
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/') && !pathname.startsWith('/api/test-')) {
    try {
      const session = await auth()

      if (!session?.user) {
        console.log(`[SECURITY] Unauthorized API access attempt to ${pathname}`)
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const userRole = session.user.role as UserRole

      // Для админских API требуются права администратора или преподавателя
      if (pathname.startsWith('/api/admin')) {
        if (!['ADMIN', 'TEACHER'].includes(userRole)) {
          console.log(`[SECURITY] Access denied to admin API ${pathname} for role ${userRole}`)
          return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }
      }
      // Для остальных API достаточно быть авторизованным пользователем

      // Логируем успешный доступ к API
      console.log(`[SECURITY] API access granted to ${userRole} for ${pathname}`)

      return NextResponse.next()
    } catch (error) {
      console.error('[SECURITY] Middleware error for API:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }

  // Защита админских страниц на уровне middleware
  if (pathname.startsWith('/admin') && !pathname.startsWith('/api')) {
    try {
      const session = await auth()
      console.log(`[DEBUG] Session for ${pathname}:`, session?.user ? `User ID: ${session.user.id}, Role: ${session.user.role}` : 'No session')

      if (!session?.user) {
        console.log(`[SECURITY] Unauthorized admin page access attempt to ${pathname}`)
        return NextResponse.redirect(new URL('/login', request.url))
      }

      const userRole = session.user.role as UserRole
      console.log(`[DEBUG] User role: ${userRole}, checking against ADMIN/TEACHER`)

      // Проверяем, что у пользователя есть права администратора или преподавателя
      if (!['ADMIN', 'TEACHER'].includes(userRole)) {
        console.log(`[SECURITY] Admin access denied to ${pathname} for role ${userRole}`)
        return NextResponse.redirect(new URL('/access-denied', request.url))
      }

      // Логируем успешный доступ к админским страницам
      console.log(`[SECURITY] Admin access granted to ${userRole} for ${pathname}`)

      return NextResponse.next()
    } catch (error) {
      console.error('[SECURITY] Middleware error for admin page:', error)
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Защита студенческих страниц
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/assignments') || pathname.startsWith('/calendar')) {
    try {
      const session = await auth()

      if (!session?.user) {
        console.log(`[SECURITY] Unauthorized student page access attempt to ${pathname}`)
        return NextResponse.redirect(new URL('/login', request.url))
      }

      const userRole = session.user.role as UserRole

      // Проверяем, что у пользователя есть права студента или выше
      if (!['STUDENT', 'TEACHER', 'ADMIN'].includes(userRole)) {
        console.log(`[SECURITY] Student page access denied to ${pathname} for role ${userRole}`)
        return NextResponse.redirect(new URL('/access-denied', request.url))
      }

      // Логируем успешный доступ к студенческим страницам
      console.log(`[SECURITY] Student page access granted to ${userRole} for ${pathname}`)

      return NextResponse.next()
    } catch (error) {
      console.error('[SECURITY] Middleware error for student page:', error)
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Логируем все остальные запросы для мониторинга
  console.log(`[SECURITY] Page access: ${pathname}`)

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/:path*',
    '/admin/:path*',
    '/dashboard/:path*',
    '/assignments/:path*',
    '/calendar/:path*'
  ]
}
