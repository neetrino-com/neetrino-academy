import { useSession } from 'next-auth/react'
import { 
  hasPermission, 
  hasAnyPermission, 
  hasAllPermissions, 
  getUserPermissions,
  getPermissionsBySection,
  type Permission,
  type UserRole 
} from '@/lib/permissions'

export function usePermissions() {
  const { data: session } = useSession()
  const userRole = (session?.user?.role as UserRole) || 'STUDENT'

  return {
    userRole,
    
    // Проверка одного разрешения
    can: (permission: Permission) => {
      return hasPermission(userRole, permission)
    },
    
    // Проверка любого из разрешений
    canAny: (permissions: Permission[]) => {
      return hasAnyPermission(userRole, permissions)
    },
    
    // Проверка всех разрешений
    canAll: (permissions: Permission[]) => {
      return hasAllPermissions(userRole, permissions)
    },
    
    // Получение всех разрешений
    permissions: getUserPermissions(userRole),
    
    // Разрешения по разделам
    sections: getPermissionsBySection(userRole),
    
    // Быстрые проверки для UI
    isStudent: userRole === 'STUDENT',
    isTeacher: userRole === 'TEACHER', 
    isAdmin: userRole === 'ADMIN',
    isStaff: userRole === 'TEACHER' || userRole === 'ADMIN'
  }
}
