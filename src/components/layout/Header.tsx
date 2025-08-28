'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import NotificationDropdown from './NotificationDropdown'

export function Header() {
  const { data: session, status } = useSession()

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">N</span>
              </div>
              <span className="text-xl font-bold text-blue-900">Neetrino Academy</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link 
              href="/courses" 
              className="text-blue-600 hover:text-blue-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Курсы
            </Link>
            <Link 
              href="/about" 
              className="text-blue-600 hover:text-blue-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              О нас
            </Link>
            <Link 
              href="/contact" 
              className="text-blue-600 hover:text-blue-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Контакты
            </Link>
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {status === 'loading' ? (
                             <div className="text-blue-500 font-medium">Загрузка...</div>
            ) : session?.user ? (
              <div className="flex items-center space-x-4">
                <Link
                  href="/dashboard"
                  className="text-blue-600 hover:text-blue-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Дашборд
                </Link>
                <Link
                  href="/assignments"
                  className="text-indigo-600 hover:text-indigo-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Задания
                </Link>
                {(session.user.role === 'ADMIN' || session.user.role === 'TEACHER') && (
                  <Link
                    href="/admin"
                    className="text-red-600 hover:text-red-700 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Админ-панель
                  </Link>
                )}
                <NotificationDropdown />
                <div className="relative">
                                     <button 
                     onClick={() => signOut()}
                     className="flex items-center space-x-2 text-blue-600 hover:text-blue-900"
                   >
                     <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                       <span className="text-sm font-medium text-blue-700">
                         {session.user.name?.charAt(0) || session.user.email?.charAt(0)}
                       </span>
                     </div>
                     <span className="text-sm font-medium">{session.user.name || session.user.email}</span>
                   </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  href="/login" 
                  className="text-blue-600 hover:text-blue-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Войти
                </Link>
                <Link 
                  href="/register" 
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Регистрация
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
