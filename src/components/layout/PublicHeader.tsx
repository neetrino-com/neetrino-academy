'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { 
  User, 
  CreditCard, 
  LogOut, 
  ChevronDown, 
  Menu, 
  X,
  Bell,
  Search
} from 'lucide-react'

export function PublicHeader() {
  const { data: session } = useSession()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  return (
    <header className="bg-gradient-to-r from-white via-blue-50 to-white shadow-lg border-b border-blue-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Логотип */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
                <span className="text-white font-bold text-xl">N</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Neetrino Academy
                </span>
                <p className="text-xs text-gray-500 -mt-1">Профессиональное обучение</p>
              </div>
            </Link>
          </div>

          {/* Навигация для десктопа */}
          <nav className="hidden lg:flex items-center space-x-8">
            <Link 
              href="/courses" 
              className="text-gray-700 hover:text-blue-600 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-blue-50 hover:shadow-md"
            >
              Курсы
            </Link>
            <Link 
              href="/about" 
              className="text-gray-700 hover:text-blue-600 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-blue-50 hover:shadow-md"
            >
              О нас
            </Link>
            <Link 
              href="/contact" 
              className="text-gray-700 hover:text-blue-600 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-blue-50 hover:shadow-md"
            >
              Контакты
            </Link>
          </nav>

          {/* Правая часть */}
          <div className="flex items-center space-x-4">
            
            {/* Поиск */}
            <div className="hidden md:flex items-center relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3" />
              <input
                type="text"
                placeholder="Поиск курсов..."
                className="pl-10 pr-4 py-2 w-64 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* Уведомления */}
            <button className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>

            {/* Пользователь или кнопки входа */}
            {session ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 p-2 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 rounded-2xl border border-blue-200 transition-all duration-200 hover:shadow-lg"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                    <span className="text-white font-bold text-sm">
                      {session.user.name?.charAt(0) || session.user.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700">
                    {session.user.name || 'Пользователь'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Выпадающее меню */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                    {/* Информация о пользователе */}
                    <div className="px-6 py-5 bg-gradient-to-br from-blue-50 to-purple-50 border-b border-gray-100">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-2xl">
                            {session.user.name?.charAt(0) || session.user.email?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="text-xl font-bold text-gray-900 mb-1">
                            {session.user.name || 'Пользователь'}
                          </div>
                          <div className="text-sm text-gray-600 mb-2">
                            {session.user.email}
                          </div>
                          <div className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full">
                            <span className="text-xs font-semibold text-blue-700">
                              {session.user.role === 'ADMIN' ? 'Администратор' : 
                               session.user.role === 'TEACHER' ? 'Преподаватель' : 'Студент'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Пункты меню */}
                    <div className="py-4">
                      <Link
                        href="/dashboard"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center space-x-4 px-6 py-4 text-sm text-blue-700 hover:bg-blue-50 transition-all duration-200 font-medium mx-3 rounded-2xl group"
                      >
                        <div className="w-6 h-6 bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl flex items-center justify-center group-hover:from-blue-200 group-hover:to-blue-300 transition-all duration-200">
                          <span className="text-blue-600 text-lg">🚀</span>
                        </div>
                        <span>Открыть Dashboard</span>
                      </Link>

                      <Link
                        href="/dashboard/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center space-x-4 px-6 py-4 text-sm text-gray-700 hover:bg-gray-50 transition-all duration-200 mx-3 rounded-2xl group"
                      >
                        <div className="w-6 h-6 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl flex items-center justify-center group-hover:from-gray-200 group-hover:to-gray-300 transition-all duration-200">
                          <User className="w-4 h-4 text-gray-700" />
                        </div>
                        <span>Мой профиль</span>
                      </Link>

                      <Link
                        href="/dashboard/payments"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center space-x-4 px-6 py-4 text-sm text-gray-700 hover:bg-gray-50 transition-all duration-200 mx-3 rounded-2xl group"
                      >
                        <div className="w-6 h-6 bg-gradient-to-r from-green-100 to-green-200 rounded-xl flex items-center justify-center group-hover:from-green-200 group-hover:to-green-300 transition-all duration-200">
                          <CreditCard className="w-4 h-4 text-green-700" />
                        </div>
                        <span>Платежи</span>
                      </Link>

                      <hr className="my-4 mx-6 border-gray-100" />

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
              className="lg:hidden p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
            >
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Мобильное меню */}
        {showMobileMenu && (
          <div className="lg:hidden py-4 border-t border-gray-100 bg-white/80 backdrop-blur-sm">
            <div className="space-y-2">
              <Link 
                href="/courses" 
                className="block px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl text-sm font-medium transition-all duration-200"
                onClick={() => setShowMobileMenu(false)}
              >
                Курсы
              </Link>
              <Link 
                href="/about" 
                className="block px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl text-sm font-medium transition-all duration-200"
                onClick={() => setShowMobileMenu(false)}
              >
                О нас
              </Link>
              <Link 
                href="/contact" 
                className="block px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl text-sm font-medium transition-all duration-200"
                onClick={() => setShowMobileMenu(false)}
              >
                Контакты
              </Link>
              
              {/* Мобильный поиск */}
              <div className="px-4 py-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Поиск курсов..."
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
