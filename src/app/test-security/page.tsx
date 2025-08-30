'use client'

import { withRoleProtection, type WithRoleProtectionProps } from '@/components/auth/withRoleProtection'

interface TestSecurityProps extends WithRoleProtectionProps {
  testData?: string
}

function TestSecurityComponent({ userRole, isLoading, testData }: TestSecurityProps) {
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p>Загрузка тестовой страницы...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            🧪 Тестовая страница безопасности
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-green-50 rounded-xl p-6 border border-green-200">
              <h3 className="text-lg font-semibold text-green-800 mb-3">
                ✅ Доступ разрешен
              </h3>
              <p className="text-green-700 mb-4">
                Эта страница защищена системой безопасности. 
                Если вы видите этот контент, значит проверка ролей работает корректно.
              </p>
              <div className="bg-green-100 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  <strong>Ваша роль:</strong> {userRole}
                </p>
                <p className="text-sm text-green-800">
                  <strong>Статус загрузки:</strong> {isLoading ? 'Загрузка...' : 'Загружено'}
                </p>
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">
                🔒 Система безопасности
              </h3>
              <p className="text-blue-700 mb-4">
                Эта страница доступна только пользователям с определенными ролями.
                Попробуйте зайти с другой учетной записи для тестирования.
              </p>
              <div className="bg-blue-100 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Тестовые данные:</strong> {testData || 'Нет данных'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
            <h3 className="text-lg font-semibold text-yellow-800 mb-3">
              📋 Информация о тестировании
            </h3>
            <p className="text-yellow-700 mb-4">
              Для полного тестирования системы безопасности:
            </p>
            <ul className="list-disc list-inside text-yellow-700 space-y-2">
              <li>Попробуйте зайти с учетной записи студента</li>
              <li>Проверьте работу с разными ролями</li>
              <li>Убедитесь, что страница "Доступ запрещен" работает</li>
              <li>Проверьте перенаправления при отсутствии прав</li>
            </ul>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600 text-sm">
              Эта страница создана для тестирования системы безопасности академии.
              В продакшене она должна быть удалена.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Экспортируем защищенный компонент с разными уровнями доступа для тестирования
export default withRoleProtection(TestSecurityComponent, ['ADMIN', 'TEACHER'], {
  fallback: null,
  showAccessDenied: true
})
