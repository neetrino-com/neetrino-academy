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
  Plus
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

interface GroupScheduleWeekViewProps {
  events: GroupScheduleEvent[]
  onEditEvent?: (event: GroupScheduleEvent) => void
  onDeleteEvent?: (eventId: string) => void
  onEventClick?: (event: GroupScheduleEvent) => void
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

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00'
]

export default function GroupScheduleWeekView({ 
  events, 
  onEditEvent, 
  onDeleteEvent, 
  onEventClick 
}: GroupScheduleWeekViewProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date())

  // Получаем начало и конец текущей недели
  const getWeekStart = (date: Date) => {
    const start = new Date(date)
    const day = start.getDay()
    const diff = start.getDate() - day + (day === 0 ? -6 : 1) // Понедельник как начало недели
    start.setDate(diff)
    start.setHours(0, 0, 0, 0)
    return start
  }

  const getWeekEnd = (date: Date) => {
    const end = new Date(date)
    const day = end.getDay()
    const diff = end.getDate() - day + (day === 0 ? 0 : 7) // Воскресенье как конец недели
    end.setDate(diff)
    end.setHours(23, 59, 59, 999)
    return end
  }

  const weekStart = getWeekStart(currentWeek)
  const weekEnd = getWeekEnd(currentWeek)

  // Фильтруем события для текущей недели
  const weekEvents = events.filter(event => {
    const eventDate = new Date(event.startDate)
    return eventDate >= weekStart && eventDate <= weekEnd
  })

  // Группируем события по дням недели
  const eventsByDay = weekEvents.reduce((acc, event) => {
    const eventDate = new Date(event.startDate)
    const dayOfWeek = eventDate.getDay()
    if (!acc[dayOfWeek]) {
      acc[dayOfWeek] = []
    }
    acc[dayOfWeek].push(event)
    return acc
  }, {} as Record<number, GroupScheduleEvent[]>)

  // Сортируем события по времени
  Object.keys(eventsByDay).forEach(day => {
    eventsByDay[parseInt(day)].sort((a, b) => a.start.localeCompare(b.start))
  })

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek)
    newWeek.setDate(newWeek.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentWeek(newWeek)
  }

  const goToCurrentWeek = () => {
    setCurrentWeek(new Date())
  }

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

  const isToday = (dayOfWeek: number) => {
    const today = new Date()
    return today.getDay() === dayOfWeek
  }

  const isPast = (dayOfWeek: number) => {
    const today = new Date()
    const dayDate = new Date(weekStart)
    dayDate.setDate(dayDate.getDate() + dayOfWeek)
    return dayDate < today
  }

  return (
    <div className="space-y-4">
      {/* Навигация по неделям */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">
              {weekStart.toLocaleDateString('ru-RU', { 
                day: 'numeric', 
                month: 'long' 
              })} - {weekEnd.toLocaleDateString('ru-RU', { 
                day: 'numeric', 
                month: 'long',
                year: 'numeric'
              })}
            </h3>
            <p className="text-sm text-gray-500">
              Неделя {Math.ceil((weekStart.getTime() - new Date(weekStart.getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24 * 7)) + 1}
            </p>
          </div>
          
          <button
            onClick={goToCurrentWeek}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Текущая неделя
          </button>
        </div>
      </div>

      {/* Сетка недели */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-8 gap-0">
          {/* Заголовок времени */}
          <div className="bg-gray-50 p-3 border-r border-gray-200">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Время
            </div>
          </div>
          
          {/* Заголовки дней недели */}
          {DAYS_OF_WEEK.map((day) => (
            <div 
              key={day.value} 
              className={`p-3 border-r border-gray-200 last:border-r-0 ${
                isToday(day.value) 
                  ? 'bg-blue-50 border-blue-200' 
                  : 'bg-gray-50'
              }`}
            >
              <div className={`text-center ${
                isToday(day.value) 
                  ? 'text-blue-900 font-semibold' 
                  : 'text-gray-900'
              }`}>
                <div className="text-sm font-medium">{day.short}</div>
                <div className="text-xs text-gray-500">
                  {new Date(weekStart.getTime() + day.value * 24 * 60 * 60 * 1000).getDate()}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Временные слоты */}
        <div className="max-h-96 overflow-y-auto">
          {TIME_SLOTS.map((timeSlot) => (
            <div key={timeSlot} className="grid grid-cols-8 gap-0 border-b border-gray-100">
              {/* Время */}
              <div className="p-2 bg-gray-50 border-r border-gray-200 text-xs text-gray-500 text-center">
                {timeSlot}
              </div>
              
              {/* Ячейки дней */}
              {DAYS_OF_WEEK.map((day) => {
                const dayEvents = eventsByDay[day.value] || []
                const slotEvents = dayEvents.filter(event => {
                  const eventTime = formatTime(event.start)
                  return eventTime === timeSlot
                })
                
                return (
                  <div 
                    key={day.value}
                    className={`p-1 border-r border-gray-100 last:border-r-0 min-h-[40px] ${
                      isToday(day.value) 
                        ? 'bg-blue-25' 
                        : isPast(day.value)
                        ? 'bg-gray-25'
                        : 'bg-white'
                    }`}
                  >
                    {slotEvents.map((event) => (
                      <div
                        key={event.id}
                        onClick={() => onEventClick?.(event)}
                        className={`p-2 rounded text-xs cursor-pointer hover:shadow-sm transition-all ${
                          getEventTypeColor(event.type)
                        } ${!event.isActive ? 'opacity-50' : ''}`}
                        style={{ 
                          borderLeft: `3px solid ${event.color}`,
                          backgroundColor: event.color + '20'
                        }}
                      >
                        <div className="font-medium truncate">{event.title}</div>
                        <div className="text-xs opacity-75 truncate">
                          {formatTime(event.start)} - {formatTime(event.end)}
                        </div>
                        {event.location && (
                          <div className="text-xs opacity-75 truncate flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {event.location}
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center gap-1">
                            {event.isActive ? (
                              <CheckCircle className="w-3 h-3 text-green-600" />
                            ) : (
                              <XCircle className="w-3 h-3 text-red-600" />
                            )}
                            <span className="text-xs">
                              {getEventTypeLabel(event.type)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Статистика недели */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="font-semibold text-gray-900">{weekEvents.length}</div>
            <div className="text-gray-500">Занятий на неделе</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-green-600">
              {weekEvents.filter(e => e.isActive).length}
            </div>
            <div className="text-gray-500">Активных</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-blue-600">
              {weekEvents.filter(e => new Date(e.startDate) >= new Date()).length}
            </div>
            <div className="text-gray-500">Будущих</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-purple-600">
              {new Set(weekEvents.map(e => e.teacherName)).size}
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
