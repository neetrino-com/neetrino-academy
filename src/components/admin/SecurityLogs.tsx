'use client'

import { useState, useEffect } from 'react'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Filter,
  RefreshCw,
  Trash2,
  Eye,
  Clock,
  User,
  Activity
} from 'lucide-react'
import { SecurityEvent, SecurityEventType, SecurityMetrics } from '@/lib/security-logger'

interface SecurityLogsProps {
  userRole?: string
}

export default function SecurityLogs({ userRole }: SecurityLogsProps) {
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Фильтры
  const [eventTypeFilter, setEventTypeFilter] = useState<SecurityEventType | ''>('')
  const [riskLevelFilter, setRiskLevelFilter] = useState<string>('')
  const [limit, setLimit] = useState(50)

  useEffect(() => {
    fetchSecurityLogs()
  }, [eventTypeFilter, riskLevelFilter, limit])

  const fetchSecurityLogs = async () => {
    try {
      setLoading(true)
      setError('')

      const params = new URLSearchParams()
      if (eventTypeFilter) params.append('eventType', eventTypeFilter)
      if (riskLevelFilter) params.append('riskLevel', riskLevelFilter)
      params.append('limit', limit.toString())

      const response = await fetch(`/api/admin/security-logs?${params}`)
      
      if (!response.ok) {
        throw new Error('Ошибка при получении логов безопасности')
      }

      const data = await response.json()
      setEvents(data.events)
      setMetrics(data.metrics)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Неизвестная ошибка')
    } finally {
      setLoading(false)
    }
  }

  const cleanupLogs = async () => {
    if (!confirm('Вы уверены, что хотите очистить старые логи безопасности?')) {
      return
    }

    try {
      const response = await fetch('/api/admin/security-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cleanup' })
      })

      if (response.ok) {
        alert('Логи безопасности очищены')
        fetchSecurityLogs()
      } else {
        throw new Error('Ошибка при очистке логов')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Неизвестная ошибка')
    }
  }

  const getEventIcon = (eventType: SecurityEventType) => {
    switch (eventType) {
      case 'LOGIN_SUCCESS':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'LOGIN_FAILED':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'ACCESS_DENIED':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />
      case 'SUSPICIOUS_ACTIVITY':
        return <Shield className="w-5 h-5 text-purple-500" />
      default:
        return <Activity className="w-5 h-5 text-blue-500" />
    }
  }

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW':
        return 'bg-green-100 text-green-800'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800'
      case 'HIGH':
        return 'bg-orange-100 text-orange-800'
      case 'CRITICAL':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTimestamp = (timestamp: string | Date) => {
    const date = new Date(timestamp)
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">Загрузка логов безопасности...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и статистика */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Логи безопасности</h2>
              <p className="text-gray-600">Мониторинг всех событий безопасности системы</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchSecurityLogs}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Обновить</span>
            </button>
            
            {userRole === 'ADMIN' && (
              <button
                onClick={cleanupLogs}
                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Очистить</span>
              </button>
            )}
          </div>
        </div>

        {/* Метрики */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <Activity className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-600">Всего событий</p>
                  <p className="text-2xl font-bold text-blue-900">{metrics.totalEvents}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <XCircle className="w-6 h-6 text-red-600" />
                <div>
                  <p className="text-sm text-red-600">Неудачные входы</p>
                  <p className="text-2xl font-bold text-red-900">{metrics.failedLogins}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
                <div>
                  <p className="text-sm text-orange-600">Отказы в доступе</p>
                  <p className="text-2xl font-bold text-orange-900">{metrics.accessDenied}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <Shield className="w-6 h-6 text-purple-600" />
                <div>
                  <p className="text-sm text-purple-600">Высокий риск</p>
                  <p className="text-2xl font-bold text-purple-900">{metrics.highRiskEvents}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Фильтры */}
        <div className="flex flex-wrap items-center space-x-4 mb-6">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Фильтры:</span>
          </div>
          
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value as SecurityEventType | '')}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Все типы событий</option>
            <option value="LOGIN_SUCCESS">Успешные входы</option>
            <option value="LOGIN_FAILED">Неудачные входы</option>
            <option value="ACCESS_DENIED">Отказы в доступе</option>
            <option value="SUSPICIOUS_ACTIVITY">Подозрительная активность</option>
            <option value="LOGOUT">Выходы из системы</option>
          </select>
          
          <select
            value={riskLevelFilter}
            onChange={(e) => setRiskLevelFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Все уровни риска</option>
            <option value="LOW">Низкий</option>
            <option value="MEDIUM">Средний</option>
            <option value="HIGH">Высокий</option>
            <option value="CRITICAL">Критический</option>
          </select>
          
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={25}>25 событий</option>
            <option value={50}>50 событий</option>
            <option value={100}>100 событий</option>
          </select>
        </div>
      </div>

      {/* Ошибка */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* События безопасности */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            События безопасности ({events.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Событие
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Пользователь
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Роль
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Уровень риска
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Время
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Детали
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>События безопасности не найдены</p>
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        {getEventIcon(event.eventType)}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {event.eventType.replace('_', ' ')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {event.status}
                          </p>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-900">
                            {event.userEmail || 'Неизвестно'}
                          </p>
                          {event.userId && (
                            <p className="text-xs text-gray-500">
                              ID: {event.userId.slice(0, 8)}...
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {event.userRole || 'Неизвестно'}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskLevelColor(event.riskLevel)}`}>
                        {event.riskLevel}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {formatTimestamp(event.timestamp)}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Eye className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900 max-w-xs truncate">
                          {event.details}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
