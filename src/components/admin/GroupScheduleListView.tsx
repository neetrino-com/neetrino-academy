'use client'

import { useState } from 'react'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  CheckCircle, 
  XCircle, 
  Edit, 
  Trash2,
  Filter,
  Search,
  ChevronDown,
  MoreVertical
} from 'lucide-react'
import { getEventTypeLabel, getEventTypeGradientClass } from '@/lib/event-types'

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

interface GroupScheduleListViewProps {
  events: GroupScheduleEvent[]
  onEditEvent?: (event: GroupScheduleEvent) => void
  onDeleteEvent?: (eventId: string) => void
  onBulkAction?: (action: 'activate' | 'deactivate' | 'delete', eventIds: string[]) => void
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

export default function GroupScheduleListView({ 
  events, 
  onEditEvent, 
  onDeleteEvent, 
  onBulkAction,
  onEventClick,
  pagination,
  onLoadMore,
  loadingMore = false
}: GroupScheduleListViewProps) {
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [dateFilter, setDateFilter] = useState<'all' | 'past' | 'future' | 'today'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'time' | 'title'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Фильтрация и сортировка
  const filteredEvents = events
    .filter(event => {
      // Поиск
      if (searchTerm && !event.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !event.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !(event.location || '').toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }

      // Статус
      if (statusFilter === 'active' && !event.isActive) return false
      if (statusFilter === 'inactive' && event.isActive) return false

      // Дата
      const eventDate = new Date(event.startDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (dateFilter === 'past' && eventDate >= today) return false
      if (dateFilter === 'future' && eventDate < today) return false
      if (dateFilter === 'today') {
        const eventDay = eventDate.toDateString()
        const todayStr = today.toDateString()
        if (eventDay !== todayStr) return false
      }

      return true
    })
    .sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'date':
          comparison = new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
          break
        case 'time':
          comparison = a.startTime.localeCompare(b.startTime)
          break
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

  const handleSelectEvent = (eventId: string) => {
    setSelectedEvents(prev => 
      prev.includes(eventId) 
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    )
  }

  const handleSelectAll = () => {
    if (selectedEvents.length === filteredEvents.length) {
      setSelectedEvents([])
    } else {
      setSelectedEvents(filteredEvents.map(event => event.id))
    }
  }

  const handleBulkAction = (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedEvents.length === 0) return
    onBulkAction?.(action, selectedEvents)
    setSelectedEvents([])
  }

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'LESSON': 'bg-blue-100 text-blue-800',
      'EXAM': 'bg-red-100 text-red-800',
      'DEADLINE': 'bg-orange-100 text-orange-800',
      'MEETING': 'bg-green-100 text-green-800',
      'WORKSHOP': 'bg-purple-100 text-purple-800',
      'SEMINAR': 'bg-indigo-100 text-indigo-800',
      'CONSULTATION': 'bg-yellow-100 text-yellow-800',
      'ANNOUNCEMENT': 'bg-pink-100 text-pink-800',
      'OTHER': 'bg-gray-100 text-gray-800'
    }
    return colors[type] || colors['OTHER']
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      weekday: 'short'
    })
  }

  const formatTime = (timeString: string) => {
    // Если это ISO строка даты, извлекаем время
    if (timeString.includes('T')) {
      const date = new Date(timeString)
      return date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    // Если это уже время в формате HH:MM, возвращаем как есть
    return timeString.slice(0, 5)
  }

  return (
    <div className="space-y-4">
      {/* Фильтры и поиск */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Поиск */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск занятий..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Фильтр по статусу */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Все статусы</option>
            <option value="active">Активные</option>
            <option value="inactive">Неактивные</option>
          </select>

          {/* Фильтр по дате */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Все даты</option>
            <option value="past">Прошедшие</option>
            <option value="future">Будущие</option>
            <option value="today">Сегодня</option>
          </select>

          {/* Сортировка */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-')
              setSortBy(field as any)
              setSortOrder(order as any)
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="date-asc">Дата ↑</option>
            <option value="date-desc">Дата ↓</option>
            <option value="time-asc">Время ↑</option>
            <option value="time-desc">Время ↓</option>
            <option value="title-asc">Название ↑</option>
            <option value="title-desc">Название ↓</option>
          </select>
        </div>
      </div>

      {/* Массовые действия */}
      {selectedEvents.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              Выбрано: {selectedEvents.length} занятий
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction('activate')}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
              >
                Активировать
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
                className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
              >
                Деактивировать
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Список занятий */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedEvents.length === filteredEvents.length && filteredEvents.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Занятие
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дата и время
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Учитель
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Место
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredEvents.map((event) => (
                <tr 
                  key={event.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => onEventClick?.(event)}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedEvents.includes(event.id)}
                      onChange={() => handleSelectEvent(event.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: event.color }} />
                      <div>
                        <div className="font-medium text-gray-900">{event.title}</div>
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEventTypeColor(event.type)}`}>
                          {getEventTypeLabel(event.type as any)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-gray-900">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{formatDate(event.startDate)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{formatTime(event.start)} - {formatTime(event.end)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-gray-900">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>{event.teacherName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {event.location ? (
                      <div className="flex items-center gap-2 text-sm text-gray-900">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{event.location}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Не указано</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {event.isActive ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className={`text-sm font-medium ${event.isActive ? 'text-green-600' : 'text-red-600'}`}>
                        {event.isActive ? 'Активно' : 'Неактивно'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onEditEvent?.(event)}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                        title="Редактировать"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteEvent?.(event.id)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Занятия не найдены</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' 
                ? 'Попробуйте изменить фильтры поиска'
                : 'Создайте первое занятие для группы'
              }
            </p>
          </div>
        )}
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

      {/* Статистика */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="font-semibold text-gray-900">{filteredEvents.length}</div>
            <div className="text-gray-500">Всего занятий</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-green-600">
              {filteredEvents.filter(e => e.isActive).length}
            </div>
            <div className="text-gray-500">Активных</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-red-600">
              {filteredEvents.filter(e => !e.isActive).length}
            </div>
            <div className="text-gray-500">Неактивных</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-blue-600">
              {filteredEvents.filter(e => new Date(e.startDate) >= new Date()).length}
            </div>
            <div className="text-gray-500">Будущих</div>
          </div>
        </div>
      </div>
    </div>
  )
}
