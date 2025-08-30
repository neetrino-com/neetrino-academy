'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  BookOpen, 
  CreditCard, 
  Users, 
  User, 
  Calendar, 
  Trophy, 
  Settings, 
  HelpCircle, 
  Home,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  FileText,
  Star,
  MessageSquare,
  Target,
  BarChart3,
  Clock,
  Award
} from 'lucide-react'

interface StudentSidebarProps {
  isCollapsed?: boolean
  onToggle?: () => void
}

export default function StudentSidebar({ isCollapsed = false, onToggle }: StudentSidebarProps) {
  const pathname = usePathname()
  const [isHovered, setIsHovered] = useState(false)

  const navigationItems = [
    {
      name: 'Главная',
      href: '/dashboard',
      icon: Home,
      color: 'from-blue-500 to-indigo-600',
      iconColor: 'text-blue-600'
    },
    {
      name: 'Мои курсы',
      href: '/dashboard/courses',
      icon: BookOpen,
      color: 'from-emerald-500 to-teal-600',
      iconColor: 'text-emerald-600'
    },
    {
      name: 'Обучение',
      href: '/dashboard/learning',
      icon: GraduationCap,
      color: 'from-purple-500 to-pink-600',
      iconColor: 'text-purple-600'
    },
    {
      name: 'Задания',
      href: '/dashboard/assignments',
      icon: FileText,
      color: 'from-amber-500 to-orange-600',
      iconColor: 'text-amber-600'
    },
    {
      name: 'Тесты',
      href: '/dashboard/quizzes',
      icon: Star,
      color: 'from-rose-500 to-red-600',
      iconColor: 'text-rose-600'
    },
    {
      name: 'Мои группы',
      href: '/dashboard/groups',
      icon: Users,
      color: 'from-cyan-500 to-blue-600',
      iconColor: 'text-cyan-600'
    },
    {
      name: 'Платежи',
      href: '/dashboard/payments',
      icon: CreditCard,
      color: 'from-green-500 to-emerald-600',
      iconColor: 'text-green-600'
    },
    {
      name: 'Календарь',
      href: '/dashboard/calendar',
      icon: Calendar,
      color: 'from-violet-500 to-purple-600',
      iconColor: 'text-violet-600'
    },
    {
      name: 'Достижения',
      href: '/dashboard/achievements',
      icon: Trophy,
      color: 'from-yellow-500 to-amber-600',
      iconColor: 'text-yellow-600'
    },
    {
      name: 'Сообщения',
      href: '/dashboard/messages',
      icon: MessageSquare,
      color: 'from-indigo-500 to-blue-600',
      iconColor: 'text-indigo-600'
    },
    {
      name: 'Профиль',
      href: '/dashboard/profile',
      icon: User,
      color: 'from-slate-500 to-gray-600',
      iconColor: 'text-slate-600'
    },
    {
      name: 'Настройки',
      href: '/dashboard/settings',
      icon: Settings,
      color: 'from-zinc-500 to-neutral-600',
      iconColor: 'text-zinc-600'
    },
    {
      name: 'Поддержка',
      href: '/dashboard/support',
      icon: HelpCircle,
      color: 'from-red-500 to-pink-600',
      iconColor: 'text-red-600'
    }
  ]

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  const renderIcon = (Icon: React.ComponentType<{ className?: string }>, isActive: boolean, color: string, iconColor: string) => (
    <div className={`p-2 rounded-lg ${isActive ? `bg-gradient-to-r ${color}` : 'bg-gray-100 group-hover:bg-gray-200'}`}>
      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : iconColor}`} />
    </div>
  )

  const renderCollapsedIcon = (Icon: React.ComponentType<{ className?: string }>, isActive: boolean, color: string, iconColor: string) => (
    <div className={`p-2 rounded-lg ${isActive ? `bg-gradient-to-r ${color}` : 'bg-gray-100 group-hover:bg-gray-200'}`}>
      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : iconColor}`} />
    </div>
  )

  return (
    <div 
      className={`bg-gradient-to-b from-white to-gray-50 border-r border-gray-200 shadow-lg transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-68'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Заголовок */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        {!isCollapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Студент</h2>
                <p className="text-xs text-blue-100">Панель управления</p>
              </div>
            </div>
            <button
              onClick={onToggle}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors backdrop-blur-sm"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={onToggle}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors backdrop-blur-sm"
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </div>
        )}
      </div>

      {/* Навигация */}
      <nav className="p-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const active = isActive(item.href)
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`group flex items-center px-3 py-3 rounded-xl transition-all duration-200 ${
                    active 
                      ? `bg-gradient-to-r ${item.color} text-white shadow-lg transform scale-105` 
                      : 'text-gray-700 hover:bg-white hover:text-gray-900 hover:shadow-md hover:transform hover:scale-102'
                  }`}
                >
                                      {isCollapsed ? (
                      <div className="flex justify-center w-full">
                        {renderCollapsedIcon(item.icon, active, item.color, item.iconColor)}
                      </div>
                    ) : (
                      <>
                        <div className="mr-3">
                          {renderIcon(item.icon, active, item.color, item.iconColor)}
                        </div>
                        <div className="flex-1">
                          <span className="text-sm font-semibold">{item.name}</span>
                        </div>
                      </>
                    )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Дополнительная информация */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200 mt-auto">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="text-sm font-semibold text-blue-900">Быстрая помощь</h3>
            </div>
            <p className="text-xs text-blue-700 mb-3">
              Нужна помощь с курсом или есть вопросы?
            </p>
            <Link
              href="/dashboard/support"
              className="inline-flex items-center text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              <HelpCircle className="w-3 h-3 mr-1" />
              Обратиться в поддержку
            </Link>
          </div>
          
          {/* Статистика */}
          <div className="mt-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="text-sm font-semibold text-emerald-900">Ваш прогресс</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-700">Курсов</span>
                <span className="font-semibold text-emerald-900">3</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-700">Уроков</span>
                <span className="font-semibold text-emerald-900">24</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-700">Заданий</span>
                <span className="font-semibold text-emerald-900">12</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
