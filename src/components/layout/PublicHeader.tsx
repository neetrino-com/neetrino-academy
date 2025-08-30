'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState, useRef, useEffect } from 'react'
import { ChevronDown, User, Settings, LogOut, CreditCard } from 'lucide-react'

export function PublicHeader() {
  const { data: session, status } = useSession()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

          {/* Public Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link 
              href="/courses" 
              className="text-blue-600 hover:text-blue-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Курсы
            </Link>
            <Link 
              href="/about" 
              className="text-blue-600 hover:text-blue-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              О нас
            </Link>
            <Link 
              href="/contact" 
              className="text-blue-600 hover:text-blue-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
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
                {/* Кнопка входа в приложение */}
                <Link
                  href="/dashboard"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-sm"
                >
                  Войти в приложение
                </Link>

                {/* Пользовательское меню */}
                <div className="relative" ref={userMenuRef}>
                  <button 
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg px-3 py-2 transition-colors"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {session.user.name?.charAt(0) || session.user.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Выпадающее меню */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-72 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl border border-gray-100 z-50">
                      {/* Информация о пользователе */}
                      <div className="px-6 py-4 border-b border-gray-100">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <span className="text-lg font-bold text-white">
                              {session.user.name?.charAt(0) || session.user.email?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-gray-900">{session.user.name || 'Пользователь'}</div>
                            <div className="text-sm text-gray-600">{session.user.email}</div>
                            <div className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                              {session.user.role === 'ADMIN' ? 'Администратор' : 
                               session.user.role === 'TEACHER' ? 'Преподаватель' : 'Студент'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Пункты меню */}
                      <div className="py-3">
                        <Link
                          href="/dashboard"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center space-x-4 px-6 py-3 text-sm text-blue-700 hover:bg-blue-50 transition-all duration-200 font-medium mx-2 rounded-xl"
                        >
                          <div className="w-5 h-5 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                            <span className="text-blue-600 text-sm">🚀</span>
                          </div>
                          <span>Открыть Dashboard</span>
                        </Link>

                        <Link
                          href="/dashboard/profile"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center space-x-4 px-6 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-all duration-200 mx-2 rounded-xl"
                        >
                          <div className="w-5 h-5 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-700" />
                          </div>
                          <span>Мой профиль</span>
                        </Link>

                        <Link
                          href="/dashboard/payments"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center space-x-4 px-6 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-all duration-200 mx-2 rounded-xl"
                        >
                          <div className="w-5 h-5 bg-gradient-to-r from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                            <CreditCard className="w-4 h-4 text-green-700" />
                          </div>
                          <span>Платежи</span>
                        </Link>

                        <hr className="my-3 mx-6 border-gray-100" />

                        <button
                          onClick={() => {
                            setShowUserMenu(false)
                            signOut()
                          }}
                          className="w-full flex items-center space-x-4 px-6 py-3 text-sm text-red-600 hover:bg-red-50 transition-all duration-200 mx-2 rounded-xl"
                        >
                          <div className="w-5 h-5 bg-gradient-to-r from-red-100 to-red-200 rounded-lg flex items-center justify-center">
                            <LogOut className="w-4 h-4 text-red-600" />
                          </div>
                          <span>Выйти из системы</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  href="/login" 
                  className="text-blue-600 hover:text-blue-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Войти
                </Link>
                <Link 
                  href="/register" 
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
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
