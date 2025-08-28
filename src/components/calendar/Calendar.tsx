'use client'

import { useState, useEffect } from 'react'
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  User
} from 'lucide-react'

interface Event {
  id: string
  title: string
  description?: string
  type: 'LESSON' | 'EXAM' | 'DEADLINE' | 'MEETING' | 'WORKSHOP' | 'SEMINAR' | 'CONSULTATION' | 'ANNOUNCEMENT' | 'OTHER'
  startDate: string
  endDate: string
  location?: string
  isRecurring: boolean
  createdBy: {
    id: string
    name: string
    role: string
  }
  group?: {
    id: string
    name: string
  }
  course?: {
    id: string
    title: string
  }
  assignment?: {
    id: string
    title: string
  }
  attendees: Array<{
    id: string
    userId: string
    status: 'PENDING' | 'ATTENDING' | 'NOT_ATTENDING' | 'MAYBE' | 'ATTENDED' | 'ABSENT'
    user: {
      id: string
      name: string
      role: string
    }
  }>
}

interface CalendarProps {
  groupId?: string
  canCreateEvents?: boolean
  onEventCreate?: () => void
  onEventEdit?: (eventId: string) => void
}

export default function Calendar({ groupId, canCreateEvents = false, onEventCreate, onEventEdit }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'month' | 'week' | 'day'>('month')

  useEffect(() => {
    fetchEvents()
  }, [currentDate, groupId])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      
      // Определяем диапазон дат для загрузки
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      })
      
      if (groupId) {
        params.append('groupId', groupId)
      }

      const response = await fetch(`/api/events?${params}`)
      if (response.ok) {
        const data = await response.json()
        setEvents(data)
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  const getEventTypeColor = (type: Event['type']) => {
    switch (type) {
      case 'LESSON':
        return 'bg-blue-500'
      case 'EXAM':
        return 'bg-red-500'
      case 'DEADLINE':
        return 'bg-orange-500'
      case 'MEETING':
        return 'bg-purple-500'
      case 'WORKSHOP':
        return 'bg-green-500'
      case 'SEMINAR':
        return 'bg-indigo-500'
      case 'CONSULTATION':
        return 'bg-yellow-500'
      case 'ANNOUNCEMENT':
        return 'bg-pink-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getEventTypeLabel = (type: Event['type']) => {
    switch (type) {
      case 'LESSON':
        return 'Занятие'
      case 'EXAM':
        return 'Экзамен'
      case 'DEADLINE':
        return 'Дедлайн'
      case 'MEETING':
        return 'Встреча'
      case 'WORKSHOP':
        return 'Мастер-класс'
      case 'SEMINAR':
        return 'Семинар'
      case 'CONSULTATION':
        return 'Консультация'
      case 'ANNOUNCEMENT':
        return 'Объявление'
      default:
        return 'Событие'
    }
  }

  const getAttendanceStatusIcon = (status: string) => {
    switch (status) {
      case 'ATTENDING':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'NOT_ATTENDING':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'MAYBE':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />
      case 'ATTENDED':
        return <CheckCircle className="w-4 h-4 text-blue-600" />
      case 'ABSENT':
        return <XCircle className="w-4 h-4 text-gray-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const updateAttendance = async (eventId: string, status: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/attendance`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        await fetchEvents() // Обновляем события
        // Обновляем выбранное событие, если оно открыто
        if (selectedEvent && selectedEvent.id === eventId) {
          const updatedEvent = events.find(e => e.id === eventId)
          if (updatedEvent) {
            setSelectedEvent(updatedEvent)
          }
        }
      } else {
        const error = await response.json()
        alert(`Ошибка: ${error.error}`)
      }
    } catch (error) {
      console.error('Error updating attendance:', error)
      alert('Ошибка обновления статуса участия')
    }
  }

  const deleteEvent = async (eventId: string) => {
    if (!confirm('Вы уверены, что хотите удалить это событие?')) return

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchEvents()
        setSelectedEvent(null)
      } else {
        const error = await response.json()
        alert(`Ошибка: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting event:', error)
      alert('Ошибка удаления события')
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days: Array<{ date: number; isCurrentMonth: boolean; events: Event[] }> = []

    // Добавляем пустые дни из предыдущего месяца
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevMonthDate = new Date(year, month, -startingDayOfWeek + i + 1)
      days.push({
        date: prevMonthDate.getDate(),
        isCurrentMonth: false,
        events: []
      })
    }

    // Добавляем дни текущего месяца
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.startDate)
        return eventDate.getDate() === day && 
               eventDate.getMonth() === month && 
               eventDate.getFullYear() === year
      })

      days.push({
        date: day,
        isCurrentMonth: true,
        events: dayEvents
      })
    }

    return days
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border">
      {/* Заголовок календаря */}
      <div className="p-4 border-b bg-gray-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-200 rounded"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold">
              {currentDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-200 rounded"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            {canCreateEvents && (
              <button
                onClick={onEventCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Создать событие
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Сетка календаря */}
      <div className="p-4">
        {/* Заголовки дней недели */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Дни месяца */}
        <div className="grid grid-cols-7 gap-1">
          {getDaysInMonth().map((day, index) => (
            <div
              key={index}
              className={`min-h-[120px] p-1 border border-gray-200 ${
                day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'
              }`}
            >
              <div className={`text-sm ${
                day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
              }`}>
                {day.date}
              </div>
              
              {/* События дня */}
              <div className="mt-1 space-y-1">
                {day.events.slice(0, 3).map(event => (
                  <div
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className={`text-xs p-1 rounded cursor-pointer text-white truncate ${getEventTypeColor(event.type)}`}
                    title={event.title}
                  >
                    {formatTime(event.startDate)} {event.title}
                  </div>
                ))}
                {day.events.length > 3 && (
                  <div className="text-xs text-gray-500 px-1">
                    +{day.events.length - 3} еще
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Модальное окно события */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Заголовок модального окна */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${getEventTypeColor(selectedEvent.type)}`}></div>
                    <span className="text-sm text-gray-600">{getEventTypeLabel(selectedEvent.type)}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{selectedEvent.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Детали события */}
              <div className="space-y-4">
                {/* Время и дата */}
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>
                    {formatDate(selectedEvent.startDate)} 
                    {' '}
                    {formatTime(selectedEvent.startDate)} - {formatTime(selectedEvent.endDate)}
                  </span>
                </div>

                {/* Место */}
                {selectedEvent.location && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}

                {/* Группа */}
                {selectedEvent.group && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>Группа: {selectedEvent.group.name}</span>
                  </div>
                )}

                {/* Курс */}
                {selectedEvent.course && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <CalendarIcon className="w-4 h-4" />
                    <span>Курс: {selectedEvent.course.title}</span>
                  </div>
                )}

                {/* Задание */}
                {selectedEvent.assignment && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <CalendarIcon className="w-4 h-4" />
                    <span>Задание: {selectedEvent.assignment.title}</span>
                  </div>
                )}

                {/* Создатель */}
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="w-4 h-4" />
                  <span>Создатель: {selectedEvent.createdBy.name}</span>
                </div>

                {/* Описание */}
                {selectedEvent.description && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Описание</h4>
                    <p className="text-gray-600 whitespace-pre-wrap">{selectedEvent.description}</p>
                  </div>
                )}

                {/* Участники */}
                {selectedEvent.attendees.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Участники ({selectedEvent.attendees.length})
                    </h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {selectedEvent.attendees.map(attendee => (
                        <div key={attendee.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            {getAttendanceStatusIcon(attendee.status)}
                            <span>{attendee.user.name}</span>
                            {attendee.user.role === 'TEACHER' && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                Преподаватель
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Действия с участием */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Ваше участие</h4>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => updateAttendance(selectedEvent.id, 'ATTENDING')}
                      className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm hover:bg-green-200"
                    >
                      Буду участвовать
                    </button>
                    <button
                      onClick={() => updateAttendance(selectedEvent.id, 'NOT_ATTENDING')}
                      className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200"
                    >
                      Не смогу участвовать
                    </button>
                    <button
                      onClick={() => updateAttendance(selectedEvent.id, 'MAYBE')}
                      className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-sm hover:bg-yellow-200"
                    >
                      Возможно
                    </button>
                  </div>
                </div>

                {/* Действия с событием */}
                {canCreateEvents && (
                  <div className="border-t pt-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onEventEdit?.(selectedEvent.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Редактировать
                      </button>
                      <button
                        onClick={() => deleteEvent(selectedEvent.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Удалить
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
