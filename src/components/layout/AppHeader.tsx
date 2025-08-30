'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState, useRef, useEffect } from 'react'
import { 
  ChevronDown, 
  User, 
  Settings, 
  LogOut, 
  Home, 
  ArrowLeft, 
  CreditCard,
  Bell,
  Search,
  Menu,
  X,
  BarChart3,
  BookOpen,
  Users,
  FileText,
  Calendar,
  MessageSquare
} from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'
import { CanAccess, StudentOnly, StaffOnly, AdminOnly } from '@/components/auth/CanAccess'
import NotificationDropdown from './NotificationDropdown'

export function AppHeader() {
  const { data: session, status } = useSession()
  const { can, isStudent, isStaff, userRole } = usePermissions()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
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
    <header className="bg-gradient-to-r from-white via-slate-50 to-white shadow-xl border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Левая часть - Логотип и навигация */}
          <div className="flex items-center space-x-6">
            
            {/* Кнопка на главную */}
            <Link 
              href="/"
              className="flex items-center space-x-2 text-slate-600 hover:text-blue-600 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:bg-blue-50 hover:shadow-md group"
              title="Перейти на главную страницу сайта"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center group-hover:from-blue-200 group-hover:to-purple-200 transition-all duration-300">
                <Home className="w-4 h-4 text-blue-600" />
              </div>
              <span className="hidden sm:inline">На сайт</span>
            </Link>

            {/* Разделитель */}
            <div className="h-8 w-px bg-gradient-to-b from-slate-200 to-slate-300"></div>

            {/* Логотип */}
            <Link 
              href={isStudent ? '/dashboard' : '/admin'} 
              className="flex items-center space-x-4 group" 
              title={isStudent ? 'Перейти в дашборд' : 'Перейти в админ-панель'}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg ${
                isStudent 
                  ? 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 group-hover:from-blue-700 group-hover:via-indigo-700 group-hover:to-purple-700' 
                  : 'bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 group-hover:from-emerald-700 group-hover:via-teal-700 group-hover:to-cyan-700'
              }`}>
                <span className="text-white font-bold text-xl">N</span>
              </div>
              <div>
                <span className={`text-2xl font-bold group-hover:text-opacity-80 transition-all duration-300 ${
                  isStudent ? 'text-blue-900' : 'text-emerald-700'
                }`}>
                  Neetrino Academy
                </span>
                <div className="text-sm text-slate-500 font-medium">
                  {isStudent ? 'Студенческий дашборд' : 'Административная панель'}
                </div>
              </div>
            </Link>
          </div>

          {/* Центральная навигация */}
          {session?.user && (
            <nav className="hidden xl:flex items-center space-x-2">
              
              {/* Для студентов */}
              <StudentOnly>
                <Link 
                  href="/dashboard/courses" 
                  className="flex items-center space-x-2 text-slate-700 hover:text-blue-600 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:bg-blue-50 hover:shadow-md group"
                >
                  <BookOpen className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                  <span>Мои курсы</span>
                </Link>
                <Link 
                  href="/dashboard/assignments" 
                  className="flex items-center space-x-2 text-slate-700 hover:text-green-600 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:bg-green-50 hover:shadow-md group"
                >
                  <FileText className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                  <span>Задания</span>
                </Link>
                <Link 
                  href="/dashboard/groups" 
                  className="flex items-center space-x-2 text-slate-700 hover:text-purple-600 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:bg-purple-50 hover:shadow-md group"
                >
                  <Users className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                  <span>Группы</span>
                </Link>
              </StudentOnly>

              {/* Для преподавателей */}
              <StaffOnly>
                <Link 
                  href="/admin/groups" 
                  className="flex items-center space-x-2 text-slate-700 hover:text-emerald-600 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:bg-emerald-50 hover:shadow-md group"
                >
                  <Users className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                  <span>Группы</span>
                </Link>
                <Link 
                  href="/admin/courses" 
                  className="flex items-center space-x-2 text-slate-700 hover:text-blue-600 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:bg-blue-50 hover:shadow-md group"
                >
                  <BookOpen className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                  <span>Курсы</span>
                </Link>
                <Link 
                  href="/admin/tests" 
                  className="flex items-center space-x-2 text-slate-700 hover:text-purple-600 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:bg-purple-50 hover:shadow-md group"
                >
                  <FileText className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                  <span>Тесты</span>
                </Link>
                <Link 
                  href="/admin/lectures" 
                  className="flex items-center space-x-2 text-slate-700 hover:text-orange-600 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:bg-orange-50 hover:shadow-md group"
                >
                  <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                  <span>Лекции</span>
                </Link>
              </StaffOnly>

              {/* Только для админов */}
              <AdminOnly>
                <Link 
                  href="/admin/analytics" 
                  className="flex items-center space-x-2 text-slate-700 hover:text-orange-600 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:bg-orange-50 hover:shadow-md group"
                >
                  <BarChart3 className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                  <span>Аналитика</span>
                </Link>
                <Link 
                  href="/admin/users" 
                  className="flex items-center space-x-2 text-slate-700 hover:text-red-600 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:bg-red-50 hover:shadow-md group"
                >
                  <Users className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                  <span>Пользователи</span>
                </Link>
                <Link 
                  href="/admin/payments" 
                  className="flex items-center space-x-2 text-slate-700 hover:text-green-600 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:bg-green-50 hover:shadow-md group"
                >
                  <CreditCard className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                  <span>Платежи</span>
                </Link>
              </AdminOnly>
            </nav>
          )}

          {/* Правая часть */}
          <div className="flex items-center space-x-4">
            
            {/* Поиск */}
            <div className="hidden lg:flex items-center relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3" />
              <input
                type="text"
                placeholder="Поиск..."
                className="pl-10 pr-4 py-2 w-64 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
              />
            </div>

            {/* Уведомления */}
            <CanAccess permission="notifications.view">
              <NotificationDropdown />
            </CanAccess>

            {/* Пользовательское меню */}
            {status === 'loading' ? (
              <div className="flex items-center space-x-3 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-200 to-purple-200 rounded-xl animate-pulse"></div>
                <div className="text-sm text-blue-600 font-medium">Загрузка...</div>
              </div>
            ) : session?.user ? (
              <div className="relative" ref={userMenuRef}>
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 p-2 bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 rounded-2xl border border-slate-200 transition-all duration-200 hover:shadow-lg group"
                >
                  <div className={`w-10 h-10 bg-gradient-to-br rounded-2xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200 ${
                    isStudent 
                      ? 'from-blue-500 via-indigo-500 to-purple-500' 
                      : 'from-emerald-500 via-teal-500 to-cyan-500'
                  }`}>
                    <span className="text-white font-bold text-sm">
                      {session.user.name?.charAt(0) || session.user.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-semibold text-slate-800">{session.user.name || 'Пользователь'}</div>
                    <div className="text-xs text-slate-500">
                      {userRole === 'ADMIN' ? 'Администратор' : 
                       userRole === 'TEACHER' ? 'Преподаватель' : 'Студент'}
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Выпадающее меню */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
                    {/* Информация о пользователе */}
                    <div className="px-6 py-5 bg-gradient-to-br from-slate-50 to-slate-100 border-b border-slate-200">
                      <div className="flex items-center space-x-4">
                        <div className={`w-16 h-16 bg-gradient-to-br rounded-2xl flex items-center justify-center shadow-lg ${
                          isStudent 
                            ? 'from-blue-500 via-indigo-500 to-purple-500' 
                            : 'from-emerald-500 via-teal-500 to-cyan-500'
                        }`}>
                          <span className="text-white font-bold text-2xl">
                            {session.user.name?.charAt(0) || session.user.email?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="text-xl font-bold text-slate-900 mb-1">
                            {session.user.name || 'Пользователь'}
                          </div>
                          <div className="text-sm text-slate-600 mb-2">
                            {session.user.email}
                          </div>
                          <div className={`inline-flex items-center px-3 py-1 rounded-full ${
                            isStudent 
                              ? 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700' 
                              : 'bg-gradient-to-r from-emerald-100 to-cyan-100 text-emerald-700'
                          }`}>
                            <span className="text-xs font-semibold">
                              {userRole === 'ADMIN' ? 'Администратор' : 
                               userRole === 'TEACHER' ? 'Преподаватель' : 'Студент'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Пункты меню */}
                    <div className="py-4">
                      <Link
                        href="/dashboard/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center space-x-4 px-6 py-4 text-sm text-slate-700 hover:bg-slate-50 transition-all duration-200 mx-3 rounded-2xl group"
                      >
                        <div className="w-6 h-6 bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl flex items-center justify-center group-hover:from-slate-200 group-hover:to-slate-300 transition-all duration-200">
                          <User className="w-4 h-4 text-slate-700" />
                        </div>
                        <span>Мой профиль</span>
                      </Link>

                      {/* Показываем платежи только студентам */}
                      {session?.user.role === 'STUDENT' && (
                        <Link
                          href="/dashboard/payments"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center space-x-4 px-6 py-4 text-sm text-slate-700 hover:bg-slate-50 transition-all duration-200 mx-3 rounded-2xl group"
                        >
                          <div className="w-6 h-6 bg-gradient-to-r from-green-100 to-green-200 rounded-xl flex items-center justify-center group-hover:from-green-200 group-hover:to-green-300 transition-all duration-200">
                            <CreditCard className="w-4 h-4 text-green-700" />
                          </div>
                          <span>Платежи</span>
                        </Link>
                      )}

                      <Link
                        href="/profile/settings"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center space-x-4 px-6 py-4 text-sm text-slate-700 hover:bg-slate-50 transition-all duration-200 mx-3 rounded-2xl group"
                      >
                        <div className="w-6 h-6 bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl flex items-center justify-center group-hover:from-blue-200 group-hover:to-blue-300 transition-all duration-200">
                          <Settings className="w-4 h-4 text-blue-700" />
                        </div>
                        <span>Настройки</span>
                      </Link>

                      <hr className="my-4 mx-6 border-slate-200" />

                      <button
                        onClick={() => {
                          setShowUserMenu(false)
                          signOut()
                        }}
                        className="w-full flex items-center space-x-4 px-6 py-4 text-sm text-red-600 hover:bg-red-50 transition-all duration-200 mx-3 rounded-2xl group"
                      >
                        <div className="w-6 h-6 bg-gradient-to-r from-red-100 to-red-200 rounded-xl flex items-center justify-center group-hover:from-red-200 group-hover:to-red-300 transition-all duration-200">
                          <LogOut className="w-4 h-4 text-red-600" />
                        </div>
                        <span>Выйти из системы</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link 
                  href="/login" 
                  className="text-blue-600 hover:text-blue-700 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-blue-50 hover:shadow-md"
                >
                  Войти
                </Link>
                <Link 
                  href="/register" 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Регистрация
                </Link>
              </div>
            )}

            {/* Мобильное меню */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="xl:hidden p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
            >
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Мобильное меню */}
        {showMobileMenu && (
          <div className="xl:hidden py-4 border-t border-slate-200 bg-white/90 backdrop-blur-sm">
            <div className="space-y-2">
              
              {/* Для студентов */}
              <StudentOnly>
                <Link 
                  href="/dashboard/courses" 
                  className="block px-4 py-3 text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl text-sm font-medium transition-all duration-200"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <div className="flex items-center space-x-3">
                    <BookOpen className="w-4 h-4" />
                    <span>Мои курсы</span>
                  </div>
                </Link>
                <Link 
                  href="/dashboard/assignments" 
                  className="block px-4 py-3 text-slate-700 hover:text-green-600 hover:bg-green-50 rounded-xl text-sm font-medium transition-all duration-200"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="w-4 h-4" />
                    <span>Задания</span>
                  </div>
                </Link>
                <Link 
                  href="/dashboard/groups" 
                  className="block px-4 py-3 text-slate-700 hover:text-purple-600 hover:bg-purple-50 rounded-xl text-sm font-medium transition-all duration-200"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <div className="flex items-center space-x-3">
                    <Users className="w-4 h-4" />
                    <span>Группы</span>
                  </div>
                </Link>
              </StudentOnly>

              {/* Для преподавателей */}
              <StaffOnly>
                <Link 
                  href="/admin/groups" 
                  className="block px-4 py-3 text-slate-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl text-sm font-medium transition-all duration-200"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <div className="flex items-center space-x-3">
                    <Users className="w-4 h-4" />
                    <span>Группы</span>
                  </div>
                </Link>
                <Link 
                  href="/admin/courses" 
                  className="block px-4 py-3 text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl text-sm font-medium transition-all duration-200"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <div className="flex items-center space-x-3">
                    <BookOpen className="w-4 h-4" />
                    <span>Курсы</span>
                  </div>
                </Link>
                <Link 
                  href="/admin/tests" 
                  className="block px-4 py-3 text-slate-700 hover:text-purple-600 hover:bg-purple-50 rounded-xl text-sm font-medium transition-all duration-200"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="w-4 h-4" />
                    <span>Тесты</span>
                  </div>
                </Link>
              </StaffOnly>

              {/* Только для админов */}
              <AdminOnly>
                <Link 
                  href="/admin/analytics" 
                  className="block px-4 py-3 text-slate-700 hover:text-orange-600 hover:bg-orange-50 rounded-xl text-sm font-medium transition-all duration-200"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <div className="flex items-center space-x-3">
                    <BarChart3 className="w-4 h-4" />
                    <span>Аналитика</span>
                  </div>
                </Link>
                <Link 
                  href="/admin/users" 
                  className="block px-4 py-3 text-slate-700 hover:text-red-600 hover:bg-red-50 rounded-xl text-sm font-medium transition-all duration-200"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <div className="flex items-center space-x-3">
                    <Users className="w-4 h-4" />
                    <span>Пользователи</span>
                  </div>
                </Link>
              </AdminOnly>
              
              {/* Мобильный поиск */}
              <div className="px-4 py-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Поиск..."
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
