'use client'

import { useState } from 'react'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  CheckCircle, 
  XCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  MoreHorizontal
} from 'lucide-react'

interface GroupScheduleEvent {
  id: string
  title: string
  start: string
  end: string
  startDate: string
  endDate: string
  groupId: string
  groupName: string
  teacherId: string
  teacherName: string
  location?: string
  type: string
  isActive: boolean
  isAttendanceRequired: boolean
  color: string
}

interface GroupScheduleMonthViewProps {
  events: GroupScheduleEvent[]
  onEditEvent?: (event: GroupScheduleEvent) => void
  onDeleteEvent?: (eventId: string) => void
  onEventClick?: (event: GroupScheduleEvent) => void
  // Пагинация
  pagination?: {
    hasMore: boolean
    total: number
    currentPage: number
    totalPages: number
  }
  onLoadMore?: () => void
  loadingMore?: boolean
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Воскресенье', short: 'Вс' },
  { value: 1, label: 'Понедельник', short: 'Пн' },
  { value: 2, label: 'Вторник', short: 'Вт' },
  { value: 3, label: 'Среда', short: 'Ср' },
  { value: 4, label: 'Четверг', short: 'Чт' },
  { value: 5, label: 'Пятница', short: 'Пт' },
  { value: 6, label: 'Суббота', short: 'Сб' }
]

export default function GroupScheduleMonthView({ 
  events, 
  onEditEvent, 
  onDeleteEvent, 
  onEventClick,
  pagination,
  onLoadMore,
  loadingMore = false
}: GroupScheduleMonthViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Получаем первый день месяца и количество дней
  const getMonthStart = (date: Date) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1)
    start.setHours(0, 0, 0, 0)
    return start
  }

  const getMonthEnd = (date: Date) => {
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)
    end.setHours(23, 59, 59, 999)
    return end
  }

  const monthStart = getMonthStart(currentMonth)
  const monthEnd = getMonthEnd(currentMonth)

  // Получаем первый день недели для отображения календаря
  const getCalendarStart = (date: Date) => {
    const start = getMonthStart(date)
    const dayOfWeek = start.getDay()
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // Понедельник как начало недели
    start.setDate(start.getDate() + diff)
    return start
  }

  const calendarStart = getCalendarStart(currentMonth)

  // Фильтруем события для текущего месяца
  const monthEvents = events.filter(event => {
    const eventDate = new Date(event.startDate)
    return eventDate >= monthStart && eventDate <= monthEnd
  })

  // Группируем события по дням
  const eventsByDay = monthEvents.reduce((acc, event) => {
    const eventDate = new Date(event.startDate)
    const dayKey = eventDate.toISOString().split('T')[0]
    if (!acc[dayKey]) {
      acc[dayKey] = []
    }
    acc[dayKey].push(event)
    return acc
  }, {} as Record<string, GroupScheduleEvent[]>)

  // Сортируем события по времени
  Object.keys(eventsByDay).forEach(day => {
    eventsByDay[day].sort((a, b) => a.start.localeCompare(b.start))
  })

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth)
    newMonth.setMonth(newMonth.getMonth() + (direction === 'next' ? 1 : -1))
    setCurrentMonth(newMonth)
  }

  const goToCurrentMonth = () => {
    setCurrentMonth(new Date())
  }

  // Генерируем дни календаря
  const generateCalendarDays = () => {
    const days = []
    const current = new Date(calendarStart)
    const endDate = new Date(calendarStart)
    endDate.setDate(endDate.getDate() + 41) // 6 недель

    while (current <= endDate) {
      const dayKey = current.toISOString().split('T')[0]
      const dayEvents = eventsByDay[dayKey] || []
      
      days.push({
        date: new Date(current),
        events: dayEvents,
        isCurrentMonth: current.getMonth() === currentMonth.getMonth(),
        isToday: current.toDateString() === new Date().toDateString()
      })
      
      current.setDate(current.getDate() + 1)
    }

    return days
  }

  const calendarDays = generateCalendarDays()

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5)
  }

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'LESSON': 'bg-blue-100 text-blue-800 border-blue-200',
      'LECTURE': 'bg-purple-100 text-purple-800 border-purple-200',
      'PRACTICE': 'bg-green-100 text-green-800 border-green-200',
      'EXAM': 'bg-red-100 text-red-800 border-red-200',
      'OTHER': 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return colors[type] || colors['OTHER']
  }

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'LESSON': 'Урок',
      'LECTURE': 'Лекция',
      'PRACTICE': 'Практика',
      'EXAM': 'Экзамен',
      'OTHER': 'Другое'
    }
    return labels[type] || type
  }

  const monthName = currentMonth.toLocaleDateString('ru-RU', { 
    month: 'long', 
    year: 'numeric' 
  })

  return (
    <div className="space-y-4">
      {/* Навигация по месяцам */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 capitalize">
              {monthName}
            </h3>
          </div>
          
          <button
            onClick={goToCurrentMonth}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Текущий месяц
          </button>
        </div>
      </div>

      {/* Календарь */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Заголовки дней недели */}
        <div className="grid grid-cols-7 gap-0">
          {DAYS_OF_WEEK.map((day) => (
            <div 
              key={day.value} 
              className="p-3 bg-gray-50 border-r border-gray-200 last:border-r-0 text-center"
            >
              <div className="text-sm font-medium text-gray-900">{day.short}</div>
            </div>
          ))}
        </div>

        {/* Дни календаря */}
        <div className="grid grid-cols-7 gap-0">
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={`min-h-[120px] border-r border-b border-gray-200 last:border-r-0 p-2 ${
                day.isCurrentMonth 
                  ? 'bg-white' 
                  : 'bg-gray-50'
              } ${day.isToday ? 'bg-blue-50 border-blue-200' : ''}`}
            >
              {/* Номер дня */}
              <div className={`text-sm font-medium mb-1 ${
                day.isCurrentMonth 
                  ? day.isToday 
                    ? 'text-blue-900' 
                    : 'text-gray-900'
                  : 'text-gray-400'
              }`}>
                {day.date.getDate()}
              </div>

              {/* События дня */}
              <div className="space-y-1">
                {day.events.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    onClick={() => onEventClick?.(event)}
                    className={`p-1 rounded text-xs cursor-pointer hover:shadow-sm transition-all ${
                      getEventTypeColor(event.type)
                    } ${!event.isActive ? 'opacity-50' : ''}`}
                    style={{ 
                      borderLeft: `2px solid ${event.color}`,
                      backgroundColor: event.color + '20'
                    }}
                  >
                    <div className="font-medium truncate">{event.title}</div>
                    <div className="text-xs opacity-75">
                      {formatTime(event.start)}
                    </div>
                  </div>
                ))}
                
                {/* Показать "+N еще" если событий больше 3 */}
                {day.events.length > 3 && (
                  <div className="text-xs text-gray-500 text-center py-1">
                    +{day.events.length - 3} еще
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Пагинация - Загрузить еще */}
      {pagination && pagination.hasMore && (
        <div className="flex justify-center py-6">
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {loadingMore ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Загрузка...
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4" />
                Загрузить еще
              </>
            )}
          </button>
        </div>
      )}

      {/* Информация о пагинации */}
      {pagination && (
        <div className="text-center text-sm text-gray-500 py-2">
          Показано {events.length} из {pagination.total} занятий
          {pagination.totalPages > 1 && (
            <span> • Страница {pagination.currentPage} из {pagination.totalPages}</span>
          )}
        </div>
      )}

      {/* Статистика месяца */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="font-semibold text-gray-900">{monthEvents.length}</div>
            <div className="text-gray-500">Занятий в месяце</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-green-600">
              {monthEvents.filter(e => e.isActive).length}
            </div>
            <div className="text-gray-500">Активных</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-blue-600">
              {monthEvents.filter(e => new Date(e.startDate) >= new Date()).length}
            </div>
            <div className="text-gray-500">Будущих</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-purple-600">
              {new Set(monthEvents.map(e => e.teacherName)).size}
            </div>
            <div className="text-gray-500">Учителей</div>
          </div>
        </div>
      </div>

      {/* Легенда */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Типы занятий</h4>
        <div className="flex flex-wrap gap-3">
          {['LESSON', 'LECTURE', 'PRACTICE', 'EXAM', 'OTHER'].map(type => (
            <div key={type} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded ${getEventTypeColor(type).split(' ')[0]}`} />
              <span className="text-sm text-gray-600">{getEventTypeLabel(type)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
