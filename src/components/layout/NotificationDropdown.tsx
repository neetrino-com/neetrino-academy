'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Bell, 
  X, 
  Check, 
  FileText, 
  Target, 
  Star, 
  AlertCircle, 
  BookOpen,
  Users,
  Calendar,
  MessageCircle
} from 'lucide-react'

interface Notification {
  id: string
  type: 'NEW_ASSIGNMENT' | 'ASSIGNMENT_SUBMITTED' | 'ASSIGNMENT_GRADED' | 'DEADLINE_REMINDER' | 'COURSE_ASSIGNED' | 'GROUP_ADDED' | 'NEW_MESSAGE' | 'EVENT_REMINDER' | 'EVENT_CANCELLED' | 'EVENT_UPDATED'
  title: string
  message: string | null
  isRead: boolean
  data: string | null
  createdAt: string
}

export default function NotificationDropdown() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchUnreadCount()
    
    // Обновляем каждые 30 секунд
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications/unread-count')
      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.count)
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/notifications?limit=10')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/mark-read`, {
        method: 'PATCH'
      })
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH'
      })
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id)
    }

    // Навигация в зависимости от типа уведомления
    if (notification.data) {
      try {
        const data = JSON.parse(notification.data)
        
        switch (notification.type) {
          case 'NEW_ASSIGNMENT':
            router.push(`/assignments/${data.assignmentId}`)
            break
          case 'ASSIGNMENT_SUBMITTED':
            router.push(`/admin/submissions`)
            break
          case 'ASSIGNMENT_GRADED':
            router.push(`/assignments/${data.assignmentId}`)
            break
          case 'DEADLINE_REMINDER':
            router.push(`/assignments/${data.assignmentId}`)
            break
          case 'NEW_MESSAGE':
            router.push(`/admin/groups/${data.groupId}`)
            break
          case 'EVENT_REMINDER':
          case 'EVENT_CANCELLED':
          case 'EVENT_UPDATED':
            router.push(`/calendar?event=${data.eventId}`)
            break
          default:
            router.push('/notifications')
        }
      } catch (error) {
        router.push('/notifications')
      }
    } else {
      router.push('/notifications')
    }
    
    setIsOpen(false)
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'NEW_ASSIGNMENT':
        return <Target className="w-4 h-4 text-blue-600" />
      case 'ASSIGNMENT_SUBMITTED':
        return <FileText className="w-4 h-4 text-green-600" />
      case 'ASSIGNMENT_GRADED':
        return <Star className="w-4 h-4 text-yellow-600" />
      case 'DEADLINE_REMINDER':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      case 'COURSE_ASSIGNED':
        return <BookOpen className="w-4 h-4 text-purple-600" />
      case 'GROUP_ADDED':
        return <Users className="w-4 h-4 text-indigo-600" />
      case 'NEW_MESSAGE':
        return <MessageCircle className="w-4 h-4 text-blue-600" />
      case 'EVENT_REMINDER':
        return <Calendar className="w-4 h-4 text-green-600" />
      case 'EVENT_CANCELLED':
        return <Calendar className="w-4 h-4 text-red-600" />
      case 'EVENT_UPDATED':
        return <Calendar className="w-4 h-4 text-orange-600" />
      default:
        return <Bell className="w-4 h-4 text-gray-600" />
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'только что'
    if (diffInMinutes < 60) return `${diffInMinutes} мин назад`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours} ч назад`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays} д назад`
    
    return date.toLocaleDateString('ru-RU')
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Кнопка уведомлений */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Выпадающее меню */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Заголовок */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Уведомления</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Отметить все
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Список уведомлений */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Загрузка...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-600 font-medium mb-1">Нет уведомлений</p>
                <p className="text-sm text-gray-500">Новые уведомления появятся здесь</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <p className={`text-sm font-medium ${
                          !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 ml-2 mt-1"></div>
                        )}
                      </div>
                      {notification.message && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Футер */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  router.push('/notifications')
                  setIsOpen(false)
                }}
                className="w-full text-center text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Показать все уведомления
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
