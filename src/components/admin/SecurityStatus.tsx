'use client'

import { useState, useEffect } from 'react'
import { Shield, CheckCircle, AlertTriangle, Lock, Users, Activity } from 'lucide-react'

interface SecurityStatusProps {
  userRole?: string
}

interface SecurityEvent {
  id: string
  type: 'ACCESS_GRANTED' | 'ACCESS_DENIED' | 'LOGIN_SUCCESS' | 'LOGIN_FAILED'
  userRole: string
  path: string
  timestamp: string
  ip?: string
}

export default function SecurityStatus({ userRole }: SecurityStatusProps) {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([])
  const [isExpanded, setIsExpanded] = useState(false)

  // Имитация получения событий безопасности (в реальном приложении это будет API)
  useEffect(() => {
    const mockEvents: SecurityEvent[] = [
      {
        id: '1',
        type: 'ACCESS_GRANTED',
        userRole: 'ADMIN',
        path: '/admin/dashboard',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 минут назад
        ip: '192.168.1.100'
      },
      {
        id: '2',
        type: 'ACCESS_GRANTED',
        userRole: 'TEACHER',
        path: '/admin/courses',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 минут назад
        ip: '192.168.1.101'
      },
      {
        id: '3',
        type: 'ACCESS_DENIED',
        userRole: 'STUDENT',
        path: '/admin/users',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 минут назад
        ip: '192.168.1.102'
      }
    ]
    
    setSecurityEvents(mockEvents)
  }, [])

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'ACCESS_GRANTED':
      case 'LOGIN_SUCCESS':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'ACCESS_DENIED':
      case 'LOGIN_FAILED':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      default:
        return <Activity className="w-4 h-4 text-blue-500" />
    }
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'ACCESS_GRANTED':
      case 'LOGIN_SUCCESS':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'ACCESS_DENIED':
      case 'LOGIN_FAILED':
        return 'bg-red-50 border-red-200 text-red-800'
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800'
    }
  }

  const getEventText = (type: string) => {
    switch (type) {
      case 'ACCESS_GRANTED':
        return 'Доступ разрешен'
      case 'ACCESS_DENIED':
        return 'Доступ запрещен'
      case 'LOGIN_SUCCESS':
        return 'Успешный вход'
      case 'LOGIN_FAILED':
        return 'Неудачный вход'
      default:
        return 'Событие безопасности'
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Заголовок */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 rounded-full p-2">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Статус безопасности
              </h3>
              <p className="text-indigo-100 text-sm">
                Мониторинг доступа и событий
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="bg-white/20 rounded-full px-3 py-1">
              <span className="text-white text-sm font-medium">
                {userRole === 'ADMIN' ? 'Полный доступ' : 'Ограниченный доступ'}
              </span>
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
            >
              <Activity className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Основная информация */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-800">
                  {securityEvents.filter(e => e.type === 'ACCESS_GRANTED').length}
                </p>
                <p className="text-sm text-green-600">Успешных доступов</p>
              </div>
            </div>
          </div>
          
          <div className="bg-red-50 rounded-xl p-4 border border-red-200">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-red-800">
                  {securityEvents.filter(e => e.type === 'ACCESS_DENIED').length}
                </p>
                <p className="text-sm text-red-600">Отклоненных попыток</p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-800">
                  {new Set(securityEvents.map(e => e.userRole)).size}
                </p>
                <p className="text-sm text-blue-600">Активных ролей</p>
              </div>
            </div>
          </div>
        </div>

        {/* Индикатор безопасности */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Lock className="w-6 h-6 text-emerald-600" />
              <div>
                <h4 className="font-semibold text-emerald-800">Система безопасности активна</h4>
                <p className="text-sm text-emerald-600">
                  Все админские страницы защищены HOC и middleware
                </p>
              </div>
            </div>
            <div className="bg-emerald-100 rounded-full px-3 py-1">
              <span className="text-emerald-800 text-sm font-medium">Защищено</span>
            </div>
          </div>
        </div>

        {/* События безопасности */}
        {isExpanded && (
          <div className="border-t border-gray-200 pt-6">
            <h4 className="font-semibold text-gray-800 mb-4 flex items-center space-x-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              <span>Последние события безопасности</span>
            </h4>
            
            <div className="space-y-3">
              {securityEvents.map((event) => (
                <div
                  key={event.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${getEventColor(event.type)}`}
                >
                  <div className="flex items-center space-x-3">
                    {getEventIcon(event.type)}
                    <div>
                      <p className="font-medium">{getEventText(event.type)}</p>
                      <p className="text-sm opacity-80">
                        {event.userRole} → {event.path}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {new Date(event.timestamp).toLocaleTimeString('ru-RU')}
                    </p>
                    {event.ip && (
                      <p className="text-xs opacity-60">{event.ip}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
