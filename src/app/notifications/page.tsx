'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  ArrowLeft,
  Bell, 
  Check, 
  FileText, 
  Target, 
  Star, 
  AlertCircle, 
  BookOpen,
  Users,
  Calendar,
  CheckCircle,
  Filter,
  Search,
  Trash2,
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

export default function NotificationsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, unread, read
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
      return
    }

    fetchNotifications()
  }, [session, status, router])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/notifications?limit=100')
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
            // Остаемся на странице уведомлений
        }
      } catch (error) {
        console.error('Error parsing notification data:', error)
      }
    }
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'NEW_ASSIGNMENT':
        return <Target className="w-5 h-5 text-blue-600" />
      case 'ASSIGNMENT_SUBMITTED':
        return <FileText className="w-5 h-5 text-green-600" />
      case 'ASSIGNMENT_GRADED':
        return <Star className="w-5 h-5 text-yellow-600" />
      case 'DEADLINE_REMINDER':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      case 'COURSE_ASSIGNED':
        return <BookOpen className="w-5 h-5 text-purple-600" />
      case 'GROUP_ADDED':
        return <Users className="w-5 h-5 text-indigo-600" />
      case 'NEW_MESSAGE':
        return <MessageCircle className="w-5 h-5 text-blue-600" />
      case 'EVENT_REMINDER':
        return <Calendar className="w-5 h-5 text-green-600" />
      case 'EVENT_CANCELLED':
        return <Calendar className="w-5 h-5 text-red-600" />
      case 'EVENT_UPDATED':
        return <Calendar className="w-5 h-5 text-orange-600" />
      default:
        return <Bell className="w-5 h-5 text-gray-600" />
    }
  }

  const getTypeLabel = (type: Notification['type']) => {
    switch (type) {
      case 'NEW_ASSIGNMENT':
        return 'Новое задание'
      case 'ASSIGNMENT_SUBMITTED':
        return 'Сдача задания'
      case 'ASSIGNMENT_GRADED':
        return 'Оценка выставлена'
      case 'DEADLINE_REMINDER':
        return 'Напоминание'
      case 'COURSE_ASSIGNED':
        return 'Курс назначен'
      case 'GROUP_ADDED':
        return 'Добавлен в группу'
      case 'NEW_MESSAGE':
        return 'Новое сообщение'
      case 'EVENT_REMINDER':
        return 'Событие'
      case 'EVENT_CANCELLED':
        return 'Событие отменено'
      case 'EVENT_UPDATED':
        return 'Событие изменено'
      default:
        return 'Уведомление'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'all' || 
                         (filter === 'unread' && !notification.isRead) ||
                         (filter === 'read' && notification.isRead)
    
    const matchesSearch = searchTerm === '' ||
                         notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getTypeLabel(notification.type).toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  const unreadCount = notifications.filter(n => !n.isRead).length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка уведомлений...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Заголовок */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Уведомления
                </h1>
                <p className="text-gray-600">
                  {unreadCount > 0 ? `${unreadCount} непрочитанных уведомлений` : 'Все уведомления прочитаны'}
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Отметить все как прочитанные
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Фильтры и поиск */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Поиск уведомлений..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">Все ({notifications.length})</option>
                <option value="unread">Непрочитанные ({unreadCount})</option>
                <option value="read">Прочитанные ({notifications.length - unreadCount})</option>
              </select>
            </div>
          </div>
        </div>

        {/* Список уведомлений */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
              <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm || filter !== 'all' 
                  ? 'Уведомления не найдены' 
                  : 'Нет уведомлений'}
              </h3>
              <p className="text-gray-600">
                {searchTerm || filter !== 'all' 
                  ? 'Попробуйте изменить фильтры поиска' 
                  : 'Новые уведомления появятся здесь'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`bg-white rounded-xl shadow-sm border hover:shadow-md transition-all cursor-pointer ${
                  !notification.isRead ? 'ring-2 ring-blue-100 bg-blue-50/30' : ''
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        !notification.isRead ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              !notification.isRead 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {getTypeLabel(notification.type)}
                            </span>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            )}
                          </div>
                          <h3 className={`text-lg font-semibold ${
                            !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </h3>
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (!notification.isRead) {
                              markAsRead(notification.id)
                            }
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          title={notification.isRead ? "Прочитано" : "Отметить как прочитанное"}
                        >
                          {notification.isRead ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <Check className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      
                      {notification.message && (
                        <p className="text-gray-600 mb-4">
                          {notification.message}
                        </p>
                      )}
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(notification.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
