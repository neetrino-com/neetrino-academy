'use client'

import { useState, useEffect } from 'react'
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  RefreshCw,
  Loader2,
  Play,
  Shield,
  Users
} from 'lucide-react'

interface PaymentNotification {
  id: string
  type: 'PAYMENT_REMINDER' | 'PAYMENT_OVERDUE' | 'PAYMENT_SUCCESSFUL'
  title: string
  description: string
  createdAt: string
  isRead: boolean
  user: {
    name: string
    email: string
  }
  course: {
    title: string
    direction: string
  }
}

interface AccessControlResult {
  checkedPayments: number
  suspendedEnrollments: number
  restoredEnrollments: number
  sentReminders: number
  details: any[]
}

export default function PaymentNotifications() {
  const [notifications, setNotifications] = useState<PaymentNotification[]>([])
  const [loading, setLoading] = useState(false)
  const [accessControlResult, setAccessControlResult] = useState<AccessControlResult | null>(null)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

  useEffect(() => {
    fetchPaymentNotifications()
  }, [])

  const fetchPaymentNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/notifications/payment?type=PAYMENT_REMINDER,PAYMENT_OVERDUE,PAYMENT_SUCCESSFUL')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
      }
    } catch (error) {
      console.error('Ошибка загрузки уведомлений о платежах:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAccessControl = async (action: string) => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/payments/access-control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      })

      if (response.ok) {
        const data = await response.json()
        setAccessControlResult(data.result)
        setMessage({ type: 'success', text: data.message })
        
        // Обновляем уведомления после выполнения операции
        setTimeout(() => {
          fetchPaymentNotifications()
        }, 1000)
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Ошибка выполнения операции' })
      }
    } catch (error) {
      console.error('Ошибка выполнения операции:', error)
      setMessage({ type: 'error', text: 'Ошибка выполнения операции' })
    } finally {
      setLoading(false)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'PAYMENT_REMINDER':
        return <Clock className="w-5 h-5 text-blue-600" />
      case 'PAYMENT_OVERDUE':
        return <AlertTriangle className="w-5 h-5 text-red-600" />
      case 'PAYMENT_SUCCESSFUL':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      default:
        return <Bell className="w-5 h-5 text-gray-600" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'PAYMENT_REMINDER':
        return 'border-blue-200 bg-blue-50'
      case 'PAYMENT_OVERDUE':
        return 'border-red-200 bg-red-50'
      case 'PAYMENT_SUCCESSFUL':
        return 'border-green-200 bg-green-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getNotificationCount = (type: string) => {
    return notifications.filter(n => n.type === type).length
  }

  return (
    <div className="space-y-6">
      {/* Сообщения */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? 
            <CheckCircle className="w-5 h-5" /> : 
            <AlertTriangle className="w-5 h-5" />
          }
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="ml-auto p-1 hover:bg-white/50 rounded"
          >
            ×
          </button>
        </div>
      )}

      {/* Статистика уведомлений */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Напоминания</p>
              <p className="text-2xl font-semibold text-gray-900">
                {getNotificationCount('PAYMENT_REMINDER')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Просрочено</p>
              <p className="text-2xl font-semibold text-gray-900">
                {getNotificationCount('PAYMENT_OVERDUE')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Успешно</p>
              <p className="text-2xl font-semibold text-gray-900">
                {getNotificationCount('PAYMENT_SUCCESSFUL')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Управление доступом */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Автоматическое управление доступом</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => handleAccessControl('check_overdue_payments')}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            Проверить просроченные
          </button>

          <button
            onClick={() => handleAccessControl('restore_access_after_payment')}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
            Восстановить доступ
          </button>

          <button
            onClick={() => handleAccessControl('send_payment_reminders')}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
            Отправить напоминания
          </button>
        </div>

        {/* Результаты операций */}
        {accessControlResult && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Результаты последней операции:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Проверено платежей:</span>
                <span className="ml-2 font-medium">{accessControlResult.checkedPayments}</span>
              </div>
              <div>
                <span className="text-gray-600">Приостановлено:</span>
                <span className="ml-2 font-medium text-red-600">{accessControlResult.suspendedEnrollments}</span>
              </div>
              <div>
                <span className="text-gray-600">Восстановлено:</span>
                <span className="ml-2 font-medium text-green-600">{accessControlResult.restoredEnrollments}</span>
              </div>
              <div>
                <span className="text-gray-600">Напоминаний:</span>
                <span className="ml-2 font-medium text-blue-600">{accessControlResult.sentReminders}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Список уведомлений */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Уведомления о платежах</h3>
          <button
            onClick={fetchPaymentNotifications}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Обновить
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Загрузка уведомлений...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Уведомления о платежах отсутствуют</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.slice(0, 10).map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border ${getNotificationColor(notification.type)}`}
              >
                <div className="flex items-start gap-3">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-gray-900">{notification.title}</h4>
                      <span className="text-xs text-gray-500">
                        {formatDate(notification.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{notification.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Студент: {notification.user.name}</span>
                      <span>Курс: {notification.course.title}</span>
                      <span className={`px-2 py-1 rounded-full ${
                        notification.isRead 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {notification.isRead ? 'Прочитано' : 'Новое'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {notifications.length > 10 && (
              <div className="text-center py-4">
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Показать все ({notifications.length})
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
