// Система разрешений для профессионального управления доступом

export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN'

export type Permission = 
  // Курсы
  | 'courses.view'
  | 'courses.create' 
  | 'courses.edit'
  | 'courses.delete'
  | 'courses.enroll'
  
  // Задания
  | 'assignments.view'
  | 'assignments.create'
  | 'assignments.submit'
  | 'assignments.grade'
  
  // Группы
  | 'groups.view'
  | 'groups.create'
  | 'groups.manage'
  | 'groups.join'
  
  // Тесты
  | 'tests.view'
  | 'tests.create'
  | 'tests.take'
  | 'tests.grade'
  
  // Пользователи
  | 'users.view'
  | 'users.manage'
  | 'users.create'
  
  // Аналитика
  | 'analytics.view'
  | 'analytics.export'
  
  // Уведомления
  | 'notifications.view'
  | 'notifications.send'
  
  // Календарь
  | 'calendar.view'
  | 'calendar.create'
  | 'calendar.manage'

// Матрица разрешений по ролям
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  STUDENT: [
    'courses.view',
    'courses.enroll',
    'assignments.view', 
    'assignments.submit',
    'tests.view',
    'tests.take',
    'groups.view',
    'groups.join',
    'notifications.view',
    'calendar.view'
  ],
  
  TEACHER: [
    'courses.view',
    'courses.create',
    'courses.edit',
    'assignments.view',
    'assignments.create',
    'assignments.grade',
    'tests.view',
    'tests.create',
    'tests.grade',
    'groups.view',
    'groups.create',
    'groups.manage',
    'users.view',
    'analytics.view',
    'notifications.view',
    'notifications.send',
    'calendar.view',
    'calendar.create',
    'calendar.manage'
  ],
  
  ADMIN: [
    // Все разрешения
    'courses.view',
    'courses.create',
    'courses.edit', 
    'courses.delete',
    'assignments.view',
    'assignments.create',
    'assignments.grade',
    'tests.view',
    'tests.create',
    'tests.grade',
    'groups.view',
    'groups.create',
    'groups.manage',
    'users.view',
    'users.manage',
    'users.create',
    'analytics.view',
    'analytics.export',
    'notifications.view',
    'notifications.send',
    'calendar.view',
    'calendar.create',
    'calendar.manage'
  ]
}

// Проверка разрешения для пользователя
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[userRole].includes(permission)
}

// Проверка множественных разрешений
export function hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission))
}

export function hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission))
}

// Получение всех разрешений пользователя
export function getUserPermissions(userRole: UserRole): Permission[] {
  return ROLE_PERMISSIONS[userRole]
}

// Группировка разрешений по разделам для UI
export function getPermissionsBySection(userRole: UserRole) {
  const userPermissions = getUserPermissions(userRole)
  
  return {
    courses: userPermissions.filter(p => p.startsWith('courses.')),
    assignments: userPermissions.filter(p => p.startsWith('assignments.')),
    tests: userPermissions.filter(p => p.startsWith('tests.')),
    groups: userPermissions.filter(p => p.startsWith('groups.')),
    users: userPermissions.filter(p => p.startsWith('users.')),
    analytics: userPermissions.filter(p => p.startsWith('analytics.')),
    notifications: userPermissions.filter(p => p.startsWith('notifications.')),
    calendar: userPermissions.filter(p => p.startsWith('calendar.'))
  }
}
