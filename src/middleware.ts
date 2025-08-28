import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { hasPermission, type Permission, type UserRole } from '@/lib/permissions'

// Определяем требуемые разрешения для API маршрутов
const API_PERMISSIONS: Record<string, Permission> = {
  // Курсы
  'GET /api/courses': 'courses.view',
  'POST /api/courses': 'courses.create',
  'PUT /api/courses': 'courses.edit',
  'DELETE /api/courses': 'courses.delete',
  
  // Админ курсы
  'GET /api/admin/courses': 'courses.view',
  'POST /api/admin/courses': 'courses.create',
  'PUT /api/admin/courses': 'courses.edit',
  'DELETE /api/admin/courses': 'courses.delete',
  
  // Задания
  'GET /api/assignments': 'assignments.view',
  'POST /api/assignments': 'assignments.create',
  'PUT /api/assignments': 'assignments.grade',
  
  // Студенческие задания
  'GET /api/student/assignments': 'assignments.view',
  'POST /api/student/assignments': 'assignments.submit',
  
  // Группы
  'GET /api/admin/groups': 'groups.view',
  'POST /api/admin/groups': 'groups.create',
  'PUT /api/admin/groups': 'groups.manage',
  'DELETE /api/admin/groups': 'groups.manage',
  
  // Тесты
  'GET /api/admin/tests': 'tests.view',
  'POST /api/admin/tests': 'tests.create',
  'PUT /api/admin/tests': 'tests.create',
  'DELETE /api/admin/tests': 'tests.create',
  
  // Пользователи
  'GET /api/admin/users': 'users.view',
  'POST /api/admin/users': 'users.create',
  'PUT /api/admin/users': 'users.manage',
  'DELETE /api/admin/users': 'users.manage',
  
  // Аналитика
  'GET /api/analytics': 'analytics.view',
  'GET /api/admin/analytics': 'analytics.view',
  
  // Уведомления
  'GET /api/notifications': 'notifications.view',
  'POST /api/notifications': 'notifications.send',
  
  // Календарь
  'GET /api/events': 'calendar.view',
  'POST /api/events': 'calendar.create',
  'PUT /api/events': 'calendar.manage',
  'DELETE /api/events': 'calendar.manage'
}

// Открытые маршруты (не требуют авторизации)
const PUBLIC_ROUTES = [
  '/api/auth',
  '/api/upload'
]

// Маршруты только для определенных ролей
const ROLE_RESTRICTED_ROUTES: Record<string, UserRole[]> = {
  '/api/admin': ['ADMIN', 'TEACHER'],
  '/api/teacher': ['TEACHER', 'ADMIN'],
  '/api/student': ['STUDENT']
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const method = request.method

  // Пропускаем не-API маршруты
  if (!pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // Пропускаем открытые маршруты
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  try {
    // Получаем сессию
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userRole = session.user.role as UserRole

    // Проверяем ограничения по ролям
    for (const [routePrefix, allowedRoles] of Object.entries(ROLE_RESTRICTED_ROUTES)) {
      if (pathname.startsWith(routePrefix)) {
        if (!allowedRoles.includes(userRole)) {
          return NextResponse.json(
            { error: 'Forbidden: Insufficient role permissions' },
            { status: 403 }
          )
        }
      }
    }

    // Проверяем разрешения для конкретных API маршрутов
    const routeKey = `${method} ${pathname}`
    const requiredPermission = API_PERMISSIONS[routeKey]

    if (requiredPermission) {
      if (!hasPermission(userRole, requiredPermission)) {
        return NextResponse.json(
          { error: 'Forbidden: Insufficient permissions' },
          { status: 403 }
        )
      }
    }

    // Проверяем общие паттерны маршрутов
    if (pathname.startsWith('/api/admin/') && userRole === 'STUDENT') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    if (pathname.startsWith('/api/student/') && userRole !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Forbidden: Student access required' },
        { status: 403 }
      )
    }

    return NextResponse.next()
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const config = {
  matcher: [
    '/api/:path*'
  ]
}
