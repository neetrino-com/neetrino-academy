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
  MessageSquare
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
      description: 'Обзор обучения'
    },
    {
      name: 'Мои курсы',
      href: '/dashboard/courses',
      icon: BookOpen,
      description: 'Активные курсы'
    },
    {
      name: 'Обучение',
      href: '/dashboard/learning',
      icon: GraduationCap,
      description: 'Продолжить обучение'
    },
    {
      name: 'Задания',
      href: '/dashboard/assignments',
      icon: FileText,
      description: 'Домашние задания'
    },
    {
      name: 'Тесты',
      href: '/dashboard/quizzes',
      icon: Star,
      description: 'Проверка знаний'
    },
    {
      name: 'Мои группы',
      href: '/dashboard/groups',
      icon: Users,
      description: 'Учебные группы'
    },
    {
      name: 'Платежи',
      href: '/payments',
      icon: CreditCard,
      description: 'Управление оплатой'
    },
    {
      name: 'Календарь',
      href: '/dashboard/calendar',
      icon: Calendar,
      description: 'Расписание занятий'
    },
    {
      name: 'Достижения',
      href: '/dashboard/achievements',
      icon: Trophy,
      description: 'Ваши успехи'
    },
    {
      name: 'Сообщения',
      href: '/dashboard/messages',
      icon: MessageSquare,
      description: 'Общение с преподавателями'
    },
    {
      name: 'Профиль',
      href: '/dashboard/profile',
      icon: User,
      description: 'Настройки аккаунта'
    },
    {
      name: 'Настройки',
      href: '/dashboard/settings',
      icon: Settings,
      description: 'Персональные настройки'
    },
    {
      name: 'Поддержка',
      href: '/dashboard/support',
      icon: HelpCircle,
      description: 'Помощь и контакты'
    }
  ]

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  const renderIcon = (Icon: any, isActive: boolean) => (
    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-600'}`} />
  )

  const renderCollapsedIcon = (Icon: any, isActive: boolean) => (
    <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-gray-600'}`} />
  )

  return (
    <div 
      className={`bg-white border-r border-gray-200 transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Заголовок */}
      <div className="p-4 border-b border-gray-200">
        {!isCollapsed ? (
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Студент</h2>
            <button
              onClick={onToggle}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={onToggle}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        )}
      </div>

      {/* Навигация */}
      <nav className="p-2">
        <ul className="space-y-1">
          {navigationItems.map((item) => {
            const active = isActive(item.href)
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`group flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${
                    active 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {isCollapsed ? (
                    <div className="flex justify-center w-full">
                      {renderCollapsedIcon(item.icon, active)}
                    </div>
                  ) : (
                    <>
                      <div className="mr-3">
                        {renderIcon(item.icon, active)}
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-medium">{item.name}</span>
                        <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
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
          <div className="bg-blue-50 rounded-lg p-3">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Быстрая помощь</h3>
            <p className="text-xs text-blue-700 mb-3">
              Нужна помощь с курсом или есть вопросы?
            </p>
            <Link
              href="/dashboard/support"
              className="inline-flex items-center text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              <HelpCircle className="w-3 h-3 mr-1" />
              Обратиться в поддержку
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
