import React, { ComponentType, ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { UserRole } from '@/lib/permissions'
import { Loader2, Shield, AlertTriangle } from 'lucide-react'

export interface ProtectionOptions {
  redirectTo?: string
  fallback?: ReactNode
  loadingFallback?: ReactNode
  requireAuth?: boolean
  showAccessDenied?: boolean
}

export interface WithRoleProtectionProps {
  userRole?: UserRole
  isLoading?: boolean
}

/**
 * HOC для защиты компонентов на основе ролей пользователей
 * @param WrappedComponent - Компонент для защиты
 * @param requiredRoles - Массив требуемых ролей (достаточно одной)
 * @param options - Дополнительные опции защиты
 */
export function withRoleProtection<T extends object>(
  WrappedComponent: ComponentType<T & WithRoleProtectionProps>,
  requiredRoles: UserRole[],
  options: ProtectionOptions = {}
) {
  const {
    redirectTo = '/access-denied',
    fallback = <DefaultAccessDenied />,
    loadingFallback = <DefaultLoading />,
    requireAuth = true,
    showAccessDenied = true
  } = options

  function ProtectedComponent(props: T) {
    const { data: session, status } = useSession()
    const router = useRouter()

    // Показываем загрузку пока проверяем сессию
    if (status === 'loading') {
      return <>{loadingFallback}</>
    }

    // Если требуется авторизация и пользователь не авторизован
    if (requireAuth && !session?.user) {
      router.push('/login')
      return null
    }

    // Если пользователь авторизован, но у него нет нужной роли
    if (session?.user && requiredRoles.length > 0) {
      const userRole = session.user.role as UserRole
      const hasRequiredRole = requiredRoles.includes(userRole)

      if (!hasRequiredRole) {
        if (showAccessDenied) {
          return <>{fallback}</>
        } else {
          router.push(redirectTo)
          return null
        }
      }
    }

    // Если все проверки пройдены, рендерим защищенный компонент
    return (
      <WrappedComponent
        {...props}
        userRole={session?.user?.role as UserRole}
        isLoading={status === 'loading'}
      />
    )
  }

  // Устанавливаем displayName для удобства отладки
  ProtectedComponent.displayName = `withRoleProtection(${WrappedComponent.displayName || WrappedComponent.name})`

  return ProtectedComponent
}

/**
 * HOC для защиты только администраторов
 */
export function withAdminProtection<T extends object>(
  WrappedComponent: ComponentType<T & WithRoleProtectionProps>,
  options?: ProtectionOptions
) {
  return withRoleProtection(WrappedComponent, ['ADMIN'], options)
}

/**
 * HOC для защиты преподавателей и администраторов
 */
export function withStaffProtection<T extends object>(
  WrappedComponent: ComponentType<T & WithRoleProtectionProps>,
  options?: ProtectionOptions
) {
  return withRoleProtection(WrappedComponent, ['TEACHER', 'ADMIN'], options)
}

/**
 * HOC для защиты только студентов
 */
export function withStudentProtection<T extends object>(
  WrappedComponent: ComponentType<T & WithRoleProtectionProps>,
  options?: ProtectionOptions
) {
  return withRoleProtection(WrappedComponent, ['STUDENT'], options)
}

/**
 * HOC для защиты только преподавателей
 */
export function withTeacherProtection<T extends object>(
  WrappedComponent: ComponentType<T & WithRoleProtectionProps>,
  options?: ProtectionOptions
) {
  return withRoleProtection(WrappedComponent, ['TEACHER'], options)
}

// Компоненты по умолчанию

function DefaultLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          Проверка доступа...
        </h2>
        <p className="text-gray-500">
          Загружаем информацию о ваших правах доступа
        </p>
      </div>
    </div>
  )
}

function DefaultAccessDenied() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
      <div className="max-w-md mx-auto text-center p-8">
        <div className="mb-6">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Доступ запрещен
          </h1>
          <p className="text-gray-600 mb-6">
            У вас недостаточно прав для просмотра этой страницы. 
            Обратитесь к администратору для получения доступа.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Перейти в дашборд
          </button>
          
          <button
            onClick={() => router.push('/courses')}
            className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Просмотреть курсы
          </button>
          
          <button
            onClick={() => router.back()}
            className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Вернуться назад
          </button>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center text-yellow-800">
            <AlertTriangle className="w-5 h-5 mr-2" />
            <span className="text-sm font-medium">
              Нужна помощь? Обратитесь к администратору
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
