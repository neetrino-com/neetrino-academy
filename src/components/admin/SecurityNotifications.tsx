'use client'

import { useState, useEffect } from 'react'
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  XCircle,
  Filter,
  RefreshCw,
  Trash2,
  Eye,
  Clock,
  User,
  Shield,
  Settings,
  Plus
} from 'lucide-react'
import { SecurityNotification, NotificationRule } from '@/lib/security-notifications'

interface SecurityNotificationsProps {
  userRole?: string
}

export default function SecurityNotifications({ userRole }: SecurityNotificationsProps) {
  const [notifications, setNotifications] = useState<SecurityNotification[]>([])
  const [rules, setRules] = useState<NotificationRule[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Фильтры
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [riskLevelFilter, setRiskLevelFilter] = useState<string>('')
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [limit, setLimit] = useState(50)

  // Модальные окна
  const [showRulesModal, setShowRulesModal] = useState(false)
  const [showAddRuleModal, setShowAddRuleModal] = useState(false)

  useEffect(() => {
    fetchNotifications()
    fetchRules()
  }, [typeFilter, riskLevelFilter, unreadOnly, limit])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      setError('')

      const params = new URLSearchParams()
      if (typeFilter) params.append('type', typeFilter)
      if (riskLevelFilter) params.append('riskLevel', riskLevelFilter)
      if (unreadOnly) params.append('unreadOnly', 'true')
      params.append('limit', limit.toString())

      const response = await fetch(`/api/admin/security-notifications?${params}`)
      
      if (!response.ok) {
        throw new Error('Ошибка при получении уведомлений о безопасности')
      }

      const data = await response.json()
      setNotifications(data.notifications)
      setStats(data.stats)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Неизвестная ошибка')
    } finally {
      setLoading(false)
    }
  }

  const fetchRules = async () => {
    try {
      // Получаем правила из менеджера уведомлений
      const response = await fetch('/api/admin/security-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getRules' })
      })
      
      if (response.ok) {
        const data = await response.json()
        setRules(data.rules || [])
      }
    } catch (error) {
      console.error('Error fetching rules:', error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/admin/security-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAsRead', notificationId })
      })

      if (response.ok) {
        fetchNotifications()
      }
    } catch (error) {
      setError('Ошибка при отметке уведомления как прочитанного')
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/admin/security-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllAsRead' })
      })

      if (response.ok) {
        fetchNotifications()
      }
    } catch (error) {
      setError('Ошибка при отметке всех уведомлений как прочитанных')
    }
  }

  const deleteNotification = async (notificationId: string) => {
    if (!confirm('Вы уверены, что хотите удалить это уведомление?')) {
      return
    }

    try {
      const response = await fetch('/api/admin/security-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteNotification', notificationId })
      })

      if (response.ok) {
        fetchNotifications()
      }
    } catch (error) {
      setError('Ошибка при удалении уведомления')
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'SECURITY_ALERT':
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      case 'SECURITY_WARNING':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />
      case 'SECURITY_INFO':
        return <Info className="w-5 h-5 text-blue-500" />
      default:
        return <Bell className="w-5 h-5 text-gray-500" />
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
          <span className="ml-3 text-gray-600">Загрузка уведомлений о безопасности...</span>
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
            <Bell className="w-8 h-8 text-red-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Уведомления о безопасности</h2>
              <p className="text-gray-600">Автоматические уведомления о подозрительной активности</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchNotifications}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Обновить</span>
            </button>
            
            <button
              onClick={markAllAsRead}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Все прочитано</span>
            </button>
            
            {userRole === 'ADMIN' && (
              <button
                onClick={() => setShowRulesModal(true)}
                className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Правила</span>
              </button>
            )}
          </div>
        </div>

        {/* Статистика */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <Bell className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-600">Всего</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <div>
                  <p className="text-sm text-red-600">Алерты</p>
                  <p className="text-2xl font-bold text-red-900">{stats.alerts}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
                <div>
                  <p className="text-sm text-orange-600">Предупреждения</p>
                  <p className="text-2xl font-bold text-orange-900">{stats.warnings}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <Info className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-600">Информация</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.info}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <p className="text-sm text-green-600">Прочитано</p>
                  <p className="text-2xl font-bold text-green-900">{stats.readRate}%</p>
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
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Все типы</option>
            <option value="SECURITY_ALERT">Алерты</option>
            <option value="SECURITY_WARNING">Предупреждения</option>
            <option value="SECURITY_INFO">Информация</option>
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
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">Только непрочитанные</span>
          </label>
          
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={25}>25 уведомлений</option>
            <option value={50}>50 уведомлений</option>
            <option value={100}>100 уведомлений</option>
          </select>
        </div>
      </div>

      {/* Ошибка */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Уведомления */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Уведомления о безопасности ({notifications.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Тип
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Заголовок
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Пользователь
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Уровень риска
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Время
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {notifications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Уведомления о безопасности не найдены</p>
                  </td>
                </tr>
              ) : (
                notifications.map((notification) => (
                  <tr key={notification.id} className={`hover:bg-gray-50 ${!notification.isRead ? 'bg-blue-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        {getNotificationIcon(notification.type)}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {notification.type.replace('SECURITY_', '')}
                          </p>
                          {!notification.isRead && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Новое
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {notification.message}
                        </p>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-900">
                            {notification.userEmail || 'Неизвестно'}
                          </p>
                          {notification.userRole && (
                            <p className="text-xs text-gray-500">
                              {notification.userRole}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskLevelColor(notification.riskLevel)}`}>
                        {notification.riskLevel}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {formatTimestamp(notification.timestamp)}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Отметить как прочитанное"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Удалить уведомление"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
