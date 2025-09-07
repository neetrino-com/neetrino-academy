'use client'

import { useState } from 'react'
import { withStaffProtection, type WithRoleProtectionProps } from '@/components/auth/withRoleProtection'
import SecurityDashboard from '@/components/admin/SecurityDashboard'
import SecurityLogs from '@/components/admin/SecurityLogs'
import SecurityNotifications from '@/components/admin/SecurityNotifications'
import TelegramSettings from '@/components/admin/TelegramSettings'

function SecurityPageComponent({ userRole, isLoading }: WithRoleProtectionProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'logs' | 'notifications' | 'telegram'>('dashboard')

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-50">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Загрузка страницы безопасности...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Заголовок страницы */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white py-8 rounded-b-2xl mx-6 mt-6">
        <div className="w-full px-4">
          <div className="flex items-center space-x-4">
            <div className="bg-white/10 rounded-full p-3">
              <span className="text-3xl">🛡️</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold">Центр безопасности</h1>
              <p className="text-slate-200 text-lg mt-1">
                Мониторинг, логирование и уведомления о безопасности системы
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Улучшенные табы */}
        <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50">
            <nav className="flex space-x-1 px-6">
              <button 
                onClick={() => setActiveTab('dashboard')} 
                className={`py-4 px-6 border-b-2 font-semibold text-base transition-all duration-200 rounded-t-lg relative ${
                  activeTab === 'dashboard' 
                    ? 'border-slate-500 text-slate-700 bg-white shadow-sm' 
                    : 'border-transparent text-slate-600 hover:text-slate-800 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-xl">🛡️</span>
                  <span>Дашборд безопасности</span>
                </div>
                {activeTab === 'dashboard' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-500 rounded-t-full"></div>
                )}
              </button>
              
              <button 
                onClick={() => setActiveTab('logs')} 
                className={`py-4 px-6 border-b-2 font-semibold text-base transition-all duration-200 rounded-t-lg relative ${
                  activeTab === 'logs' 
                    ? 'border-slate-500 text-slate-700 bg-white shadow-sm' 
                    : 'border-transparent text-slate-600 hover:text-slate-700 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-xl">📊</span>
                  <span>Логи безопасности</span>
                </div>
                {activeTab === 'logs' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-500 rounded-t-full"></div>
                )}
              </button>
              
              <button 
                onClick={() => setActiveTab('notifications')} 
                className={`py-4 px-6 border-b-2 font-semibold text-base transition-all duration-200 rounded-t-lg relative ${
                  activeTab === 'notifications' 
                    ? 'border-slate-500 text-slate-700 bg-white shadow-sm' 
                    : 'border-transparent text-slate-600 hover:text-slate-700 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-xl">🔔</span>
                  <span>Уведомления о безопасности</span>
                </div>
                {activeTab === 'notifications' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-500 rounded-t-full"></div>
                )}
              </button>
              
              <button 
                onClick={() => setActiveTab('telegram')} 
                className={`py-4 px-6 border-b-2 font-semibold text-base transition-all duration-200 rounded-t-lg relative ${
                  activeTab === 'telegram' 
                    ? 'border-slate-500 text-slate-700 bg-white shadow-sm' 
                    : 'border-transparent text-slate-600 hover:text-slate-700 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-xl">📱</span>
                  <span>Настройки Telegram</span>
                </div>
                {activeTab === 'telegram' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-500 rounded-t-full"></div>
                )}
              </button>
            </nav>
          </div>
        </div>

        {/* Основной контент */}
        <div className="py-4">
          {activeTab === 'dashboard' && <SecurityDashboard userRole={userRole} />}
          {activeTab === 'logs' && <SecurityLogs userRole={userRole} />}
          {activeTab === 'notifications' && <SecurityNotifications userRole={userRole} />}
          {activeTab === 'telegram' && <TelegramSettings userRole={userRole} />}
        </div>
      </div>
    </div>
  )
}

// Экспортируем защищенный компонент
export default withStaffProtection(SecurityPageComponent, {
  fallback: null,
  showAccessDenied: true
})
