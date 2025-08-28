'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState, useRef, useEffect } from 'react'
import { ChevronDown, User, Settings, LogOut, Home, ArrowLeft } from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'
import { CanAccess, StudentOnly, StaffOnly, AdminOnly } from '@/components/auth/CanAccess'
import NotificationDropdown from './NotificationDropdown'

export function AppHeader() {
  const { data: session, status } = useSession()
  const { can, isStudent, isStaff, userRole } = usePermissions()
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
    <header className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo и навигация назад */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform ${
                isStudent ? 'bg-blue-600' : 'bg-red-600'
              }`}>
                <span className="text-white font-bold text-sm">N</span>
              </div>
              <span className={`text-xl font-bold group-hover:scale-105 transition-transform ${
                isStudent ? 'text-blue-900' : 'text-red-900'
              }`}>
                Neetrino Academy
              </span>
            </Link>
            
            {/* Разделитель */}
            <div className="h-6 w-px bg-gray-300"></div>
            
            {/* Навигация назад */}
            <div className="flex items-center space-x-2">
              <Link 
                href="/"
                className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 px-2 py-1 rounded-md text-sm font-medium transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>На сайт</span>
              </Link>
            </div>
          </div>

          {/* App Navigation with Permissions */}
          {session?.user && (
            <nav className="hidden lg:flex space-x-4">
              {/* Для студентов */}
              <StudentOnly>
                <Link 
                  href="/app/dashboard" 
                  className="text-indigo-600 hover:text-indigo-900 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-indigo-50"
                >
                  Дашборд
                </Link>
                <Link 
                  href="/app/assignments" 
                  className="text-green-600 hover:text-green-900 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-green-50"
                >
                  Задания
                </Link>
                <Link 
                  href="/app/calendar" 
                  className="text-purple-600 hover:text-purple-900 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-purple-50"
                >
                  Календарь
                </Link>
              </StudentOnly>

              {/* Для всех авторизованных */}
              <CanAccess permission="courses.view">
                <Link 
                  href="/courses" 
                  className="text-blue-600 hover:text-blue-900 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-blue-50"
                >
                  Курсы
                </Link>
              </CanAccess>

              {/* Для преподавателей и админов */}
              <StaffOnly>
                <CanAccess permission="groups.view">
                  <Link 
                    href="/app/admin/groups" 
                    className="text-emerald-600 hover:text-emerald-900 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-emerald-50"
                  >
                    Группы
                  </Link>
                </CanAccess>
                <CanAccess permission="tests.create">
                  <Link 
                    href="/app/admin/tests" 
                    className="text-purple-600 hover:text-purple-900 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-purple-50"
                  >
                    Тесты
                  </Link>
                </CanAccess>
                <CanAccess permission="courses.create">
                  <Link 
                    href="/app/admin/courses" 
                    className="text-indigo-600 hover:text-indigo-900 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-indigo-50"
                  >
                    Управление курсами
                  </Link>
                </CanAccess>
              </StaffOnly>

              {/* Только для админов */}
              <AdminOnly>
                <Link 
                  href="/app/admin/users" 
                  className="text-red-600 hover:text-red-900 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-red-50"
                >
                  Пользователи
                </Link>
                <Link 
                  href="/app/admin/analytics" 
                  className="text-orange-600 hover:text-orange-900 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-orange-50"
                >
                  Аналитика
                </Link>
              </AdminOnly>
            </nav>
          )}

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {status === 'loading' ? (
              <div className="text-blue-500 font-medium">Загрузка...</div>
            ) : session?.user ? (
              <div className="flex items-center space-x-4">
                {/* Быстрые действия для разных ролей */}
                <div className="hidden md:flex items-center space-x-2">
                  <CanAccess permission="courses.create">
                    <Link
                      href="/app/admin/builder"
                      className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-sm"
                    >
                      Создать курс
                    </Link>
                  </CanAccess>
                  
                  <CanAccess permission="tests.create">
                    <Link
                      href="/app/admin/tests"
                      className="bg-gradient-to-r from-purple-600 to-violet-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:from-purple-700 hover:to-violet-700 transition-all duration-200 shadow-sm"
                    >
                      Создать тест
                    </Link>
                  </CanAccess>
                </div>

                {/* Уведомления */}
                <CanAccess permission="notifications.view">
                  <NotificationDropdown />
                </CanAccess>

                {/* Пользовательское меню */}
                <div className="relative" ref={userMenuRef}>
                  <button 
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg px-3 py-2 transition-colors"
                  >
                    <div className={`w-8 h-8 bg-gradient-to-br rounded-full flex items-center justify-center ${
                      isStudent 
                        ? 'from-blue-500 to-purple-600' 
                        : 'from-red-500 to-orange-600'
                    }`}>
                      <span className="text-sm font-medium text-white">
                        {session.user.name?.charAt(0) || session.user.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="hidden sm:block text-left">
                      <div className="text-sm font-medium">{session.user.name || 'Пользователь'}</div>
                      <div className="text-xs text-gray-500">
                        {userRole === 'ADMIN' ? 'Администратор' : 
                         userRole === 'TEACHER' ? 'Преподаватель' : 'Студент'}
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Выпадающее меню */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                      {/* Информация о пользователе */}
                      <div className="px-4 py-3 border-b border-gray-200">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 bg-gradient-to-br rounded-full flex items-center justify-center ${
                            isStudent 
                              ? 'from-blue-500 to-purple-600' 
                              : 'from-red-500 to-orange-600'
                          }`}>
                            <span className="text-sm font-medium text-white">
                              {session.user.name?.charAt(0) || session.user.email?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{session.user.name || 'Пользователь'}</div>
                            <div className="text-sm text-gray-500">{session.user.email}</div>
                            <div className={`text-xs font-medium ${
                              isStudent ? 'text-blue-600' : 'text-red-600'
                            }`}>
                              {userRole === 'ADMIN' ? 'Администратор' : 
                               userRole === 'TEACHER' ? 'Преподаватель' : 'Студент'}
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
