'use client'

import { ReactNode } from 'react'
import { withStaffProtection } from '@/components/auth/withRoleProtection'

interface AdminLayoutProps {
  children: ReactNode
  userRole?: string
  isLoading?: boolean
}

function AdminLayoutComponent({ children, userRole, isLoading }: AdminLayoutProps) {
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Загрузка административной панели...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Основной контент */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Футер с информацией о безопасности */}
      <footer className="bg-gray-800 text-white py-6 mt-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-sm text-gray-300">
                Защищенная административная зона
              </span>
            </div>
            
            <div className="text-sm text-gray-400">
              Последний вход: {new Date().toLocaleDateString('ru-RU')}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Экспортируем защищенный компонент
export const AdminLayout = withStaffProtection(AdminLayoutComponent, {
  fallback: null, // Используем fallback из HOC
  showAccessDenied: true
})
