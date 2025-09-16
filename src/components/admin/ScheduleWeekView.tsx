'use client'

import { useState, useEffect } from 'react'
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Users,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal
} from 'lucide-react'

interface WeekEvent {
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

interface ScheduleWeekViewProps {
  events: WeekEvent[]
  onEditEvent?: (event: WeekEvent) => void
  onDeleteEvent?: (eventId: string) => void
  onEventClick?: (event: WeekEvent) => void
  onAddEvent?: (date: Date, time: string) => void
}

export default function ScheduleWeekView({ 
  events, 
  onEditEvent, 
  onDeleteEvent, 
  onEventClick,
  onAddEvent 
}: ScheduleWeekViewProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<WeekEvent | null>(null)
  const [hoveredSlot, setHoveredSlot] = useState<{ date: Date; time: string } | null>(null)

  const weekDays = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']
  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
    '20:00', '20:30', '21:00'
  ]

  // Получаем даты недели
  const getWeekDates = (date: Date) => {
    const startOfWeek = new Date(date)
    startOfWeek.setDate(date.getDate() - date.getDay())
    
    const weekDates = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      weekDates.push(day)
    }
    return weekDates
  }

  const weekDates = getWeekDates(currentWeek)

  // Получаем события для конкретной даты и времени
  const getEventsForDateTime = (date: Date, time: string) => {
    const dateStr = date.toISOString().split('T')[0]
    return events.filter(event => {
      const eventDate = new Date(event.start).toISOString().split('T')[0]
      const eventTime = new Date(event.start).toTimeString().slice(0, 5)
      return eventDate === dateStr && eventTime === time
    })
  }

  // Получаем события для конкретной даты
  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return events.filter(event => {
      const eventDate = new Date(event.start).toISOString().split('T')[0]
      return eventDate === dateStr
    })
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(prev => {
      const newWeek = new Date(prev)
      newWeek.setDate(prev.getDate() + (direction === 'next' ? 7 : -7))
      return newWeek
    })
  }

  const goToToday = () => {
    setCurrentWeek(new Date())
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ru-RU', { 
      day: 'numeric',
      month: 'short'
    })
  }

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isPastDate = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  const getEventStyle = (event: WeekEvent) => {
    return {
      backgroundColor: event.color,
      borderLeft: `4px solid ${event.color}`,
      color: '#fff'
    }
  }

  const handleSlotClick = (date: Date, time: string) => {
    if (onAddEvent) {
      onAddEvent(date, time)
    }
  }

  const handleEventClick = (event: WeekEvent) => {
    setSelectedEvent(event)
    onEventClick?.(event)
  }

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
            <div className="text-sm text-gray-600">
              {weekDates[0].toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} - {' '}
              {weekDates[6].toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
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

      {/* Week Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Days header */}
          <div className="grid grid-cols-8 border-b border-gray-200">
            <div className="p-3 text-sm font-medium text-gray-500 border-r border-gray-200">
              Время
            </div>
            {weekDates.map((date, index) => (
              <div 
                key={index} 
                className={`p-3 text-center border-r border-gray-200 ${
                  isToday(date) 
                    ? 'bg-blue-50 text-blue-900 font-semibold' 
                    : isPastDate(date)
                    ? 'text-gray-400'
                    : 'text-gray-900'
                }`}
              >
                <div className="text-sm font-medium">{weekDays[index].slice(0, 3)}</div>
                <div className="text-lg">{date.getDate()}</div>
              </div>
            ))}
          </div>

          {/* Time slots */}
          {timeSlots.map(time => (
            <div key={time} className="grid grid-cols-8 border-b border-gray-100">
              {/* Time column */}
              <div className="p-2 text-xs text-gray-500 border-r border-gray-200 bg-gray-50">
                {time}
              </div>
              
              {/* Day columns */}
              {weekDates.map((date, dayIndex) => {
                const dayEvents = getEventsForDateTime(date, time)
                const isPast = isPastDate(date)
                const isCurrentDay = isToday(date)
                
                return (
                  <div 
                    key={dayIndex}
                    className={`min-h-[60px] p-1 border-r border-gray-200 relative ${
                      isPast 
                        ? 'bg-gray-50' 
                        : isCurrentDay
                        ? 'bg-blue-50'
                        : 'hover:bg-gray-50'
                    }`}
                    onMouseEnter={() => setHoveredSlot({ date, time })}
                    onMouseLeave={() => setHoveredSlot(null)}
                    onClick={() => handleSlotClick(date, time)}
                  >
                    {dayEvents.map(event => (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEventClick(event)
                        }}
                        className="p-2 text-xs rounded cursor-pointer hover:opacity-80 transition-opacity mb-1"
                        style={getEventStyle(event)}
                      >
                        <div className="font-medium truncate">{event.title}</div>
                        <div className="opacity-90 truncate">{event.groupName}</div>
                        {event.location && (
                          <div className="opacity-75 flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {/* Add event button on hover */}
                    {hoveredSlot?.date === date && hoveredSlot?.time === time && !isPast && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSlotClick(date, time)
                        }}
                        className="absolute inset-0 flex items-center justify-center bg-blue-100 bg-opacity-50 hover:bg-opacity-70 transition-colors rounded"
                      >
                        <Plus className="w-4 h-4 text-blue-600" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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
                    <Users className="w-4 h-4" />
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
