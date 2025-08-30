'use client'

import { useState, useEffect } from 'react'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Activity,
  TrendingUp,
  TrendingDown,
  Users,
  Globe,
  Clock,
  Zap
} from 'lucide-react'
import { securityLogger } from '@/lib/security-logger'
import { securityNotificationManager } from '@/lib/security-notifications'

interface SecurityDashboardProps {
  userRole?: string
}

interface SecurityStatus {
  overallStatus: 'SECURE' | 'WARNING' | 'DANGER'
  activeThreats: number
  blockedIPs: number
  suspiciousUsers: number
  lastIncident: string
  uptime: string
  securityScore: number
}

export default function SecurityDashboard({ userRole }: SecurityDashboardProps) {
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus>({
    overallStatus: 'SECURE',
    activeThreats: 0,
    blockedIPs: 0,
    suspiciousUsers: 0,
    lastIncident: 'Нет',
    uptime: '0 дней',
    securityScore: 100
  })
  
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSecurityStatus()
    const interval = setInterval(fetchSecurityStatus, 30000) // Обновляем каждые 30 секунд
    
    return () => clearInterval(interval)
  }, [])

  const fetchSecurityStatus = async () => {
    try {
      // Получаем метрики безопасности
      const metrics = securityLogger.getMetrics()
      const notificationStats = securityNotificationManager.getNotificationStats()
      
      // Вычисляем общий статус безопасности
      const securityScore = calculateSecurityScore(metrics, notificationStats)
      const overallStatus = getOverallStatus(securityScore)
      
      // Получаем последние события
      const events = securityLogger.getEvents(10)
      
      setSecurityStatus({
        overallStatus,
        activeThreats: metrics.highRiskEvents,
        blockedIPs: 0, // Это можно расширить
        suspiciousUsers: metrics.suspiciousActivity,
        lastIncident: events.length > 0 ? formatTimeAgo(events[0].timestamp) : 'Нет',
        uptime: calculateUptime(),
        securityScore
      })
      
      setRecentActivity(events)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching security status:', error)
      setLoading(false)
    }
  }

  const calculateSecurityScore = (metrics: any, notificationStats: any): number => {
    let score = 100
    
    // Снижаем балл за неудачные попытки входа
    if (metrics.failedLogins > 0) {
      score -= Math.min(metrics.failedLogins * 2, 20)
    }
    
    // Снижаем балл за отказы в доступе
    if (metrics.accessDenied > 0) {
      score -= Math.min(metrics.accessDenied * 1, 15)
    }
    
    // Снижаем балл за подозрительную активность
    if (metrics.suspiciousActivity > 0) {
      score -= Math.min(metrics.suspiciousActivity * 3, 25)
    }
    
    // Снижаем балл за непрочитанные уведомления
    if (notificationStats.unread > 0) {
      score -= Math.min(notificationStats.unread, 10)
    }
    
    return Math.max(score, 0)
  }

  const getOverallStatus = (score: number): 'SECURE' | 'WARNING' | 'DANGER' => {
    if (score >= 80) return 'SECURE'
    if (score >= 50) return 'WARNING'
    return 'DANGER'
  }

  const calculateUptime = (): string => {
    // Простая реализация - можно расширить
    const startTime = new Date('2024-08-30T00:00:00Z')
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - startTime.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return `${diffDays} дней`
  }

  const formatTimeAgo = (timestamp: Date): string => {
    const now = new Date()
    const diffMs = now.getTime() - timestamp.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffDays > 0) return `${diffDays} дней назад`
    if (diffHours > 0) return `${diffHours} часов назад`
    if (diffMins > 0) return `${diffMins} минут назад`
    return 'Только что'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SECURE':
        return 'text-green-600 bg-green-100'
      case 'WARNING':
        return 'text-yellow-600 bg-yellow-100'
      case 'DANGER':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SECURE':
        return <CheckCircle className="w-6 h-6 text-green-600" />
      case 'WARNING':
        return <AlertTriangle className="w-6 h-6 text-yellow-600" />
      case 'DANGER':
        return <AlertTriangle className="w-6 h-6 text-red-600" />
      default:
        return <Shield className="w-6 h-6 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-8">
          <Activity className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">Загрузка статуса безопасности...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Основной статус безопасности */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Статус безопасности</h2>
              <p className="text-gray-600">Текущее состояние системы безопасности</p>
            </div>
          </div>
          
          <div className={`px-4 py-2 rounded-full font-medium ${getStatusColor(securityStatus.overallStatus)}`}>
            <div className="flex items-center space-x-2">
              {getStatusIcon(securityStatus.overallStatus)}
              <span className="capitalize">
                {securityStatus.overallStatus === 'SECURE' ? 'Безопасно' : 
                 securityStatus.overallStatus === 'WARNING' ? 'Внимание' : 'Опасность'}
              </span>
            </div>
          </div>
        </div>

        {/* Балл безопасности */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Балл безопасности</span>
            <span className="text-sm font-medium text-gray-700">{securityStatus.securityScore}/100</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${
                securityStatus.securityScore >= 80 ? 'bg-green-500' :
                securityStatus.securityScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${securityStatus.securityScore}%` }}
            ></div>
          </div>
        </div>

        {/* Ключевые метрики */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <div>
                <p className="text-sm text-red-600">Активные угрозы</p>
                <p className="text-2xl font-bold text-red-900">{securityStatus.activeThreats}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <Globe className="w-6 h-6 text-orange-600" />
              <div>
                <p className="text-sm text-orange-600">Заблокированные IP</p>
                <p className="text-2xl font-bold text-orange-900">{securityStatus.blockedIPs}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <Users className="w-6 h-6 text-yellow-600" />
              <div>
                <p className="text-sm text-yellow-600">Подозрительные пользователи</p>
                <p className="text-2xl font-bold text-yellow-900">{securityStatus.suspiciousUsers}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <Clock className="w-6 h-6 text-green-600" />
              <div>
                <p className="text-sm text-green-600">Время работы</p>
                <p className="text-2xl font-bold text-green-900">{securityStatus.uptime}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Последняя активность */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Последняя активность</h3>
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-500">Обновляется в реальном времени</span>
            </div>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {recentActivity.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Активность не найдена</p>
            </div>
          ) : (
            recentActivity.map((event, index) => (
              <div key={event.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      event.riskLevel === 'CRITICAL' ? 'bg-red-500' :
                      event.riskLevel === 'HIGH' ? 'bg-orange-500' :
                      event.riskLevel === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {event.eventType.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {event.userEmail || 'Неизвестный пользователь'} • {event.details}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-gray-900">
                      {formatTimeAgo(event.timestamp)}
                    </p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      event.riskLevel === 'LOW' ? 'bg-green-100 text-green-800' :
                      event.riskLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                      event.riskLevel === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {event.riskLevel}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Рекомендации по безопасности */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Рекомендации по безопасности</h3>
        
        <div className="space-y-3">
          {securityStatus.securityScore < 80 && (
            <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Требуется внимание к безопасности
                </p>
                <p className="text-sm text-yellow-700">
                  Рекомендуется проверить логи безопасности и настроить дополнительные правила уведомлений.
                </p>
              </div>
            </div>
          )}
          
          {securityStatus.activeThreats > 0 && (
            <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  Обнаружены активные угрозы
                </p>
                <p className="text-sm text-red-700">
                  Немедленно проверьте уведомления о безопасности и примите необходимые меры.
                </p>
              </div>
            </div>
          )}
          
          {securityStatus.securityScore >= 80 && (
            <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  Система безопасности работает отлично
                </p>
                <p className="text-sm text-green-700">
                  Продолжайте мониторить активность и регулярно проверяйте настройки безопасности.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
