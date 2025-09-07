'use client'

import { X, Calendar, Clock, MapPin, Users, User, AlertCircle, CheckCircle, XCircle } from 'lucide-react'

interface EventData {
  id: string
  title: string
  startDate: string
  endDate: string
  groupName: string
  teacherName: string
  location?: string
  type: string
  isActive: boolean
  isAttendanceRequired: boolean
  description?: string
}

interface EventDetailsModalProps {
  event: EventData | null
  isOpen: boolean
  onClose: () => void
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  'LESSON': 'Занятие',
  'EXAM': 'Экзамен',
  'MEETING': 'Встреча',
  'WORKSHOP': 'Мастер-класс',
  'SEMINAR': 'Семинар',
  'CONSULTATION': 'Консультация',
  'ANNOUNCEMENT': 'Объявление',
  'OTHER': 'Другое'
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  'LESSON': 'bg-blue-100 text-blue-800',
  'EXAM': 'bg-red-100 text-red-800',
  'MEETING': 'bg-green-100 text-green-800',
  'WORKSHOP': 'bg-orange-100 text-orange-800',
  'SEMINAR': 'bg-purple-100 text-purple-800',
  'CONSULTATION': 'bg-cyan-100 text-cyan-800',
  'ANNOUNCEMENT': 'bg-gray-100 text-gray-800',
  'OTHER': 'bg-gray-100 text-gray-800'
}

export default function EventDetailsModal({ event, isOpen, onClose }: EventDetailsModalProps) {
  if (!isOpen || !event) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getEventTypeLabel = (type: string) => {
    return EVENT_TYPE_LABELS[type] || type
  }

  const getEventTypeColor = (type: string) => {
    return EVENT_TYPE_COLORS[type] || EVENT_TYPE_COLORS['OTHER']
  }

  const isPastEvent = new Date(event.startDate) < new Date()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Информация о событии
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title and Type */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{event.title}</h3>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEventTypeColor(event.type)}`}>
                {getEventTypeLabel(event.type)}
              </span>
              {isPastEvent && (
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                  Прошло
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Описание</h4>
              <p className="text-gray-600 text-sm leading-relaxed">{event.description}</p>
            </div>
          )}

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Дата</h4>
                <p className="text-gray-900">{formatDate(event.startDate)}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Время</h4>
                <p className="text-gray-900">
                  {formatTime(event.startDate)} - {formatTime(event.endDate)}
                </p>
              </div>
            </div>
          </div>

          {/* Group and Teacher */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Группа</h4>
                <p className="text-gray-900">{event.groupName}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Преподаватель</h4>
                <p className="text-gray-900">{event.teacherName}</p>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Место проведения</h4>
              <p className="text-gray-900">{event.location || 'Не указано'}</p>
            </div>
          </div>

          {/* Status and Requirements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {event.isActive ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-400" />
                )}
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Статус</h4>
                  <p className={`text-sm ${event.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                    {event.isActive ? 'Активно' : 'Неактивно'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {event.isAttendanceRequired ? (
                  <AlertCircle className="w-5 h-5 text-blue-500" />
                ) : (
                  <div className="w-5 h-5" />
                )}
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Посещаемость</h4>
                  <p className={`text-sm ${event.isAttendanceRequired ? 'text-blue-600' : 'text-gray-500'}`}>
                    {event.isAttendanceRequired ? 'Обязательна' : 'Не обязательна'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  )
}
