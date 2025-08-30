'use client'

import { withStaffProtection, type WithRoleProtectionProps } from '@/components/auth/withRoleProtection'
import SecurityLogs from '@/components/admin/SecurityLogs'

function SecurityPageComponent({ userRole, isLoading }: WithRoleProtectionProps) {
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Загрузка страницы безопасности...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Заголовок страницы */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-lg p-3">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Безопасность системы</h1>
              <p className="text-gray-600">
                Мониторинг и управление безопасностью образовательной платформы
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div className="container mx-auto px-4 py-8">
        <SecurityLogs userRole={userRole} />
      </div>
    </div>
  )
}

// Экспортируем защищенный компонент
export default withStaffProtection(SecurityPageComponent, {
  fallback: null,
  showAccessDenied: true
})
