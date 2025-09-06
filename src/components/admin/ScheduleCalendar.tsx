'use client'

import { useState, useEffect } from 'react'
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Users,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'

interface CalendarEvent {
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

interface ScheduleCalendarProps {
  events: CalendarEvent[]
  onEditEvent?: (event: CalendarEvent) => void
  onDeleteEvent?: (eventId: string) => void
  onEventClick?: (event: CalendarEvent) => void
}

export default function ScheduleCalendar({ 
  events, 
  onEditEvent, 
  onDeleteEvent, 
  onEventClick 
}: ScheduleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')

  const today = new Date()
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Получаем первый день месяца и количество дней
  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const daysInMonth = lastDayOfMonth.getDate()
  const startingDayOfWeek = firstDayOfMonth.getDay()

  // Создаем массив дней для отображения
  const days = []
  
  // Добавляем пустые ячейки для начала месяца
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null)
  }
  
  // Добавляем дни месяца
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month, day))
  }

  // Получаем события для конкретной даты
  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return events.filter(event => {
      const eventDate = new Date(event.start).toISOString().split('T')[0]
      return eventDate === dateStr
    })
  }

  // Получаем события для недели
  const getWeekEvents = () => {
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
    
    const weekEvents = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      const dayEvents = getEventsForDate(date)
      weekEvents.push({
        date,
        events: dayEvents
      })
    }
    return weekEvents
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      const days = direction === 'prev' ? -7 : 7
      newDate.setDate(newDate.getDate() + days)
      return newDate
    })
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ru-RU', { 
      year: 'numeric', 
      month: 'long' 
    })
  }

  const formatWeekDate = (date: Date) => {
    return date.toLocaleDateString('ru-RU', { 
      day: 'numeric',
      month: 'short'
    })
  }

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString()
  }

  const isPastDate = (date: Date) => {
    return date < today && !isToday(date)
  }

  const getEventStyle = (event: CalendarEvent) => {
    return {
      backgroundColor: event.color,
      borderLeft: `4px solid ${event.color}`,
      color: '#fff'
    }
  }

  const weekDays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

  if (viewMode === 'week') {
    const weekEvents = getWeekEvents()
    
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Недельный вид
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('month')}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  Месяц
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded"
                >
                  Неделя
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateWeek('prev')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={goToToday}
                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
              >
                Сегодня
              </button>
              <button
                onClick={() => navigateWeek('next')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Week View */}
        <div className="p-6">
          <div className="grid grid-cols-7 gap-4">
            {weekEvents.map(({ date, events }, index) => (
              <div key={index} className="min-h-[200px]">
                <div className={`text-center p-2 mb-2 rounded ${
                  isToday(date) 
                    ? 'bg-blue-100 text-blue-900 font-semibold' 
                    : isPastDate(date)
                    ? 'text-gray-400'
                    : 'text-gray-900'
                }`}>
                  <div className="text-sm font-medium">{weekDays[index]}</div>
                  <div className="text-lg">{date.getDate()}</div>
                </div>
                
                <div className="space-y-1">
                  {events.map((event, eventIndex) => (
                    <div
                      key={`${event.id}-${event.start}-${eventIndex}`}
                      onClick={() => onEventClick?.(event)}
                      className="p-2 text-xs rounded cursor-pointer hover:opacity-80 transition-opacity"
                      style={getEventStyle(event)}
                    >
                      <div className="font-medium truncate">{event.title}</div>
                      <div className="opacity-90 truncate">{event.groupName}</div>
                      <div className="opacity-75 flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        {new Date(event.start).toLocaleTimeString('ru-RU', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {formatDate(currentDate)}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('month')}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded"
              >
                Месяц
              </button>
              <button
                onClick={() => setViewMode('week')}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                Неделя
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              Сегодня
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Month View */}
      <div className="p-6">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {weekDays.map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((date, index) => {
            if (!date) {
              return <div key={index} className="h-24" />
            }

            const dayEvents = getEventsForDate(date)
            const isCurrentDay = isToday(date)
            const isPast = isPastDate(date)

            return (
              <div
                key={index}
                className={`min-h-24 p-2 border border-gray-100 ${
                  isCurrentDay 
                    ? 'bg-blue-50 border-blue-200' 
                    : isPast
                    ? 'bg-gray-50'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className={`text-sm font-medium mb-1 ${
                  isCurrentDay 
                    ? 'text-blue-900' 
                    : isPast
                    ? 'text-gray-400'
                    : 'text-gray-900'
                }`}>
                  {date.getDate()}
                </div>
                
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event, eventIndex) => (
                    <div
                      key={`${event.id}-${event.start}-${eventIndex}`}
                      onClick={() => onEventClick?.(event)}
                      className="p-1 text-xs rounded cursor-pointer hover:opacity-80 transition-opacity"
                      style={getEventStyle(event)}
                    >
                      <div className="truncate font-medium">{event.title}</div>
                      <div className="opacity-90 truncate">{event.groupName}</div>
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{dayEvents.length - 3} еще
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedEvent.title}
                </h3>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{selectedEvent.groupName}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>
                    {new Date(selectedEvent.start).toLocaleString('ru-RU', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                
                {selectedEvent.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}
                
                {selectedEvent.isAttendanceRequired && (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>Обязательная посещаемость</span>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => {
                    onEditEvent?.(selectedEvent)
                    setSelectedEvent(null)
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Редактировать
                </button>
                <button
                  onClick={() => {
                    onDeleteEvent?.(selectedEvent.id)
                    setSelectedEvent(null)
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
