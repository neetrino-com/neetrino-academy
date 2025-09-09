'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState, useRef, useEffect } from 'react'
import { ChevronDown, User, Settings, LogOut, Home, ArrowLeft, CreditCard, Menu, X } from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'
import { CanAccess, StudentOnly, StaffOnly } from '@/components/auth/CanAccess'
import NotificationDropdown from './NotificationDropdown'

export function AppHeader() {
  const { data: session, status } = useSession()
  const { can, isStudent, isStaff, userRole } = usePermissions()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Умный логотип и навигация */}
          <div className="flex items-center space-x-4">
            {/* Кнопка на сайт - в самом левом краю */}
            <Link 
              href="/"
              className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 px-2 py-1 rounded-lg text-sm font-medium transition-all duration-300 hover:bg-blue-50"
              title="Перейти на главную страницу сайта"
            >
              <span className="hidden sm:inline text-xs">На сайт</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>

            {/* Разделитель */}
            <div className="h-6 w-px bg-gray-300"></div>

            {/* Логотип ведет в дашборд/админ в зависимости от роли */}
            <Link 
              href={isStudent ? '/dashboard' : '/admin'} 
              className="flex items-center space-x-3 group" 
              title={isStudent ? 'Перейти в дашборд' : 'Перейти в админ-панель'}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-sm ${
                isStudent 
                  ? 'bg-gradient-to-br from-blue-600 to-indigo-600 group-hover:from-blue-700 group-hover:to-indigo-700'
                  : 'bg-gradient-to-br from-emerald-600 to-teal-600 group-hover:from-emerald-700 group-hover:to-teal-700'
              }`}>
                <span className="text-white font-bold text-lg">N</span>
              </div>
              <div>
                <span className={`text-xl font-bold group-hover:text-opacity-80 transition-all duration-300 ${
                  isStudent ? 'text-blue-900' : 'text-emerald-600'
                }`}>
                  Neetrino Academy
                </span>
                <div className="text-xs text-gray-500 font-medium">
                  {isStudent ? 'Студент' : userRole === 'TEACHER' ? 'Преподаватель' : 'Администратор'}
                </div>
              </div>
            </Link>
          </div>

          {/* Расширенная App Navigation */}
          {session?.user && (
            <>
              {/* Десктопная навигация */}
              <nav className="hidden lg:flex items-center justify-center space-x-2 flex-1">
                 {/* Переключение между админкой и дашбордом для админов и учителей */}
                 <StaffOnly>
                   <Link 
                     href="/dashboard" 
                     className="relative bg-blue-600 text-white hover:bg-blue-700 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 hover:shadow-md min-w-[80px] text-center"
                   >
                     Дашборд
                   </Link>
                   <Link 
                     href="/admin" 
                     className="relative bg-emerald-600 text-white hover:bg-emerald-700 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 hover:shadow-md min-w-[80px] text-center"
                   >
                     Админка
                   </Link>
                 </StaffOnly>

                {/* Для преподавателей и админов - основное меню админки */}
                <StaffOnly>
                  <Link 
                    href="/admin/groups" 
                    className="relative text-emerald-600 hover:text-emerald-800 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-emerald-100 hover:shadow-md min-w-[80px] text-center"
                  >
                    Группы
                  </Link>
                  <Link 
                    href="/admin/courses" 
                    className="relative text-blue-600 hover:text-blue-800 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:shadow-md min-w-[80px] text-center"
                  >
                    Курсы
                  </Link>
                  <Link 
                    href="/admin/tests" 
                    className="relative text-purple-600 hover:text-purple-800 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 hover:shadow-md min-w-[80px] text-center"
                  >
                    Тесты
                  </Link>
                </StaffOnly>

              </nav>

              {/* Мобильная кнопка меню */}
              <div className="lg:hidden">
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </>
          )}

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {status === 'loading' ? (
              <div className="text-blue-500 font-medium">Загрузка...</div>
            ) : session?.user ? (
              <div className="flex items-center space-x-4">

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
                        : 'from-emerald-500 to-teal-600'
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
                          href="/dashboard/profile"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center space-x-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <User className="w-4 h-4" />
                          <span>Мой профиль</span>
                        </Link>

                        {/* Показываем платежи только студентам */}
                        {session?.user.role === 'STUDENT' && (
                          <Link
                            href="/dashboard/payments"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <CreditCard className="w-4 h-4" />
                            <span>Платежи</span>
                          </Link>
                        )}

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

        {/* Мобильное меню */}
        {showMobileMenu && session?.user && (
          <div ref={mobileMenuRef} className="lg:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-4 space-y-3">
               {/* Переключение между админкой и дашбордом для админов и учителей */}
               <StaffOnly>
                 <Link 
                   href="/dashboard" 
                   onClick={() => setShowMobileMenu(false)}
                   className="block bg-blue-600 text-white hover:bg-blue-700 px-4 py-3 rounded-lg text-base font-semibold transition-all duration-300 hover:shadow-md"
                 >
                   📊 Дашборд
                 </Link>
                 <Link 
                   href="/admin" 
                   onClick={() => setShowMobileMenu(false)}
                   className="block bg-emerald-600 text-white hover:bg-emerald-700 px-4 py-3 rounded-lg text-base font-semibold transition-all duration-300 hover:shadow-md"
                 >
                   ⚙️ Админка
                 </Link>
               </StaffOnly>

              {/* Для преподавателей и админов - основное меню админки */}
              <StaffOnly>
                <Link 
                  href="/admin/groups" 
                  onClick={() => setShowMobileMenu(false)}
                  className="block text-emerald-600 hover:text-emerald-800 px-4 py-3 rounded-lg text-base font-semibold transition-all duration-300 hover:bg-emerald-50 hover:shadow-md"
                >
                  👥 Группы
                </Link>
                <Link 
                  href="/admin/courses" 
                  onClick={() => setShowMobileMenu(false)}
                  className="block text-blue-600 hover:text-blue-800 px-4 py-3 rounded-lg text-base font-semibold transition-all duration-300 hover:bg-blue-50 hover:shadow-md"
                >
                  📚 Курсы
                </Link>
                <Link 
                  href="/admin/tests" 
                  onClick={() => setShowMobileMenu(false)}
                  className="block text-purple-600 hover:text-purple-800 px-4 py-3 rounded-lg text-base font-semibold transition-all duration-300 hover:bg-purple-50 hover:shadow-md"
                >
                  🧪 Тесты
                </Link>
              </StaffOnly>

            </div>
          </div>
        )}
      </div>
    </header>
  )
}
