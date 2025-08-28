'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, User, Settings, LogOut, Shield } from 'lucide-react'
import NotificationDropdown from './NotificationDropdown'

export function Header() {
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
                <Link
                  href="/calendar"
                  className="text-green-600 hover:text-green-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Календарь
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
                    <div className="hidden sm:block text-left">
                      <div className="text-sm font-medium">{session.user.name || 'Пользователь'}</div>
                      <div className="text-xs text-gray-500">{session.user.email}</div>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Выпадающее меню */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                      {/* Информация о пользователе */}
                      <div className="px-4 py-3 border-b border-gray-200">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {session.user.name?.charAt(0) || session.user.email?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{session.user.name || 'Пользователь'}</div>
                            <div className="text-sm text-gray-500">{session.user.email}</div>
                            <div className="text-xs text-blue-600 font-medium">
                              {session.user.role === 'ADMIN' ? 'Администратор' : 
                               session.user.role === 'TEACHER' ? 'Преподаватель' : 'Студент'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Пункты меню */}
                      <div className="py-2">
                        <Link
                          href="/profile"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <User className="w-4 h-4" />
                          <span>Мой профиль</span>
                        </Link>

                        <Link
                          href="/profile/settings"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          <span>Настройки</span>
                        </Link>

                        {(session.user.role === 'ADMIN' || session.user.role === 'TEACHER') && (
                          <Link
                            href="/admin"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Shield className="w-4 h-4" />
                            <span>Панель управления</span>
                          </Link>
                        )}

                        <hr className="my-2" />

                        <button
                          onClick={() => {
                            setShowUserMenu(false)
                            signOut()
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Выйти</span>
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
