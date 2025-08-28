import { ReactNode } from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import { Permission, UserRole } from '@/lib/permissions'

interface CanAccessProps {
  children: ReactNode
  permission?: Permission
  permissions?: Permission[]
  requireAll?: boolean
  role?: UserRole
  roles?: UserRole[]
  fallback?: ReactNode
}

export function CanAccess({ 
  children, 
  permission, 
  permissions = [], 
  requireAll = false,
  role,
  roles = [],
  fallback = null 
}: CanAccessProps) {
  const { can, canAny, canAll, userRole } = usePermissions()

  // Проверка по роли
  if (role && userRole !== role) {
    return <>{fallback}</>
  }

  if (roles.length > 0 && !roles.includes(userRole)) {
    return <>{fallback}</>
  }

  // Проверка по разрешению
  if (permission && !can(permission)) {
    return <>{fallback}</>
  }

  // Проверка по множественным разрешениям
  if (permissions.length > 0) {
    const hasAccess = requireAll ? canAll(permissions) : canAny(permissions)
    if (!hasAccess) {
      return <>{fallback}</>
    }
  }

  return <>{children}</>
}

// Удобные компоненты для часто используемых проверок
export function StudentOnly({ children, fallback }: { children: ReactNode, fallback?: ReactNode }) {
  return <CanAccess role="STUDENT" fallback={fallback}>{children}</CanAccess>
}

export function TeacherOnly({ children, fallback }: { children: ReactNode, fallback?: ReactNode }) {
  return <CanAccess role="TEACHER" fallback={fallback}>{children}</CanAccess>
}

export function AdminOnly({ children, fallback }: { children: ReactNode, fallback?: ReactNode }) {
  return <CanAccess role="ADMIN" fallback={fallback}>{children}</CanAccess>
}

export function StaffOnly({ children, fallback }: { children: ReactNode, fallback?: ReactNode }) {
  return <CanAccess roles={['TEACHER', 'ADMIN']} fallback={fallback}>{children}</CanAccess>
}
