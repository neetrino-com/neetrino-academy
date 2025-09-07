'use client'

import { useState } from 'react'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Search, 
  Filter,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MoreHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface ScheduleEvent {
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

interface ScheduleListViewProps {
  events: ScheduleEvent[]
  onEditEvent?: (event: ScheduleEvent) => void
  onDeleteEvent?: (eventId: string) => void
  onBulkAction?: (action: 'activate' | 'deactivate' | 'delete', eventIds: string[]) => void
  onEventClick?: (event: ScheduleEvent) => void
  // Пагинация
  pagination?: {
    hasMore: boolean
    total: number
    currentPage: number
    totalPages: number
  }
  onLoadMore?: () => void
  loadingMore?: boolean
  // Фильтр по времени
  timeFilter?: 'current' | 'past'
  onTimeFilterChange?: (filter: 'current' | 'past') => void
}

export default function ScheduleListView({ 
  events, 
  onEditEvent, 
  onDeleteEvent, 
  onBulkAction,
  onEventClick,
  pagination,
  onLoadMore,
  loadingMore = false,
  timeFilter = 'current',
  onTimeFilterChange
}: ScheduleListViewProps) {
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [groupFilter, setGroupFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'group' | 'teacher'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [showFilters, setShowFilters] = useState(false)

  // Получаем уникальные группы и типы для фильтров
  const groups = Array.from(new Set(events.map(e => e.groupName)))
  const types = Array.from(new Set(events.map(e => e.type)))

  // Фильтрация и сортировка событий
  const filteredAndSortedEvents = events
    .filter(event => {
      const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           event.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           event.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (event.location && event.location.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && event.isActive) ||
                           (statusFilter === 'inactive' && !event.isActive)
      
      const matchesType = typeFilter === 'all' || event.type === typeFilter
      const matchesGroup = groupFilter === 'all' || event.groupName === groupFilter
      
      return matchesSearch && matchesStatus && matchesType && matchesGroup
    })
    .sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
          break
        case 'group':
          comparison = a.groupName.localeCompare(b.groupName)
          break
        case 'teacher':
          comparison = a.teacherName.localeCompare(b.teacherName)
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

  const toggleEventSelection = (eventId: string) => {
    setSelectedEvents(prev => {
      const newSet = new Set(prev)
      if (newSet.has(eventId)) {
        newSet.delete(eventId)
      } else {
        newSet.add(eventId)
      }
      return newSet
    })
  }

  const selectAllEvents = () => {
    setSelectedEvents(new Set(filteredAndSortedEvents.map(e => e.id)))
  }

  const deselectAllEvents = () => {
    setSelectedEvents(new Set())
  }

  const handleBulkAction = (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedEvents.size === 0) return
    onBulkAction?.(action, Array.from(selectedEvents))
    setSelectedEvents(new Set())
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isPastEvent = (event: ScheduleEvent) => {
    return new Date(event.startDate) < new Date()
  }

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'LESSON': 'bg-blue-100 text-blue-800',
      'EXAM': 'bg-red-100 text-red-800',
      'MEETING': 'bg-green-100 text-green-800',
      'WORKSHOP': 'bg-orange-100 text-orange-800',
      'SEMINAR': 'bg-purple-100 text-purple-800',
      'CONSULTATION': 'bg-cyan-100 text-cyan-800',
      'ANNOUNCEMENT': 'bg-gray-100 text-gray-800',
      'OTHER': 'bg-gray-100 text-gray-800'
    }
    return colors[type] || colors['OTHER']
  }

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'LESSON': 'Занятие',
      'EXAM': 'Экзамен',
      'MEETING': 'Встреча',
      'WORKSHOP': 'Мастер-класс',
      'SEMINAR': 'Семинар',
      'CONSULTATION': 'Консультация',
      'ANNOUNCEMENT': 'Объявление',
      'OTHER': 'Другое'
    }
    return labels[type] || type
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Список занятий
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {filteredAndSortedEvents.length} из {events.length} занятий
            </span>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Фильтры
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Search and basic filters */}
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Поиск по названию, группе, учителю..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Все статусы</option>
            <option value="active">Активные</option>
            <option value="inactive">Неактивные</option>
          </select>
          
          <select
            value={timeFilter}
            onChange={(e) => onTimeFilterChange?.(e.target.value as 'current' | 'past')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="current">Текущие</option>
            <option value="past">Прошедшие</option>
          </select>
        </div>

        {/* Advanced filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Тип события
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Все типы</option>
                  {types.map(type => (
                    <option key={type} value={type}>
                      {getEventTypeLabel(type)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Группа
                </label>
                <select
                  value={groupFilter}
                  onChange={(e) => setGroupFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Все группы</option>
                  {groups.map(group => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Сортировка
                </label>
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="date">По дате</option>
                    <option value="group">По группе</option>
                    <option value="teacher">По учителю</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bulk actions */}
      {selectedEvents.size > 0 && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-blue-700">
                Выбрано: {selectedEvents.size} занятий
              </span>
              <button
                onClick={selectAllEvents}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Выбрать все
              </button>
              <button
                onClick={deselectAllEvents}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Снять выбор
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkAction('activate')}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
              >
                <CheckCircle className="w-4 h-4" />
                Активировать
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
                className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700 flex items-center gap-1"
              >
                <XCircle className="w-4 h-4" />
                Деактивировать
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Events list */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={selectedEvents.size === filteredAndSortedEvents.length && filteredAndSortedEvents.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      selectAllEvents()
                    } else {
                      deselectAllEvents()
                    }
                  }}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Событие</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Группа</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Учитель</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Дата и время</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Место</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Статус</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedEvents.map(event => {
              const isSelected = selectedEvents.has(event.id)
              const isPast = isPastEvent(event)
              
              return (
                <tr 
                  key={event.id} 
                  className={`border-b border-gray-100 hover:bg-gray-50 ${
                    isSelected ? 'bg-blue-50' : ''
                  } ${isPast ? 'opacity-60' : ''}`}
                >
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleEventSelection(event.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: event.color }}
                      />
                      <div>
                        <div className="font-medium text-gray-900">{event.title}</div>
                        <div className={`text-xs px-2 py-1 rounded-full inline-block ${getEventTypeColor(event.type)}`}>
                          {getEventTypeLabel(event.type)}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{event.groupName}</span>
                    </div>
                  </td>
                  
                  <td className="py-3 px-4">
                    <span className="text-gray-900">{event.teacherName}</span>
                  </td>
                  
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-900">{formatDate(event.startDate)}</div>
                        <div className="text-xs text-gray-500">
                          {formatTime(event.startDate)} - {formatTime(event.endDate)}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="py-3 px-4">
                    {event.location ? (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">{event.location}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        event.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {event.isActive ? 'Активно' : 'Неактивно'}
                      </div>
                      {event.isAttendanceRequired && (
                        <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          Посещаемость
                        </div>
                      )}
                      {isPast && (
                        <div className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                          Прошло
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onEventClick?.(event)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Просмотр"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEditEvent?.(event)}
                        className="p-1 text-blue-400 hover:text-blue-600"
                        title="Редактировать"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {!isPast && (
                        <button
                          onClick={() => onDeleteEvent?.(event.id)}
                          className="p-1 text-red-400 hover:text-red-600"
                          title="Удалить"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        
        {filteredAndSortedEvents.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Занятия не найдены</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || groupFilter !== 'all'
                ? 'Попробуйте изменить фильтры поиска'
                : 'Создайте первое расписание для групп'
              }
            </p>
          </div>
        )}
      </div>

      {/* Пагинация - Загрузить еще */}
      {pagination && pagination.hasMore && (
        <div className="flex justify-center py-6">
          <button
            onClick={() => {
              console.log('🔄 [Load More] Кнопка нажата!')
              onLoadMore?.()
            }}
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
                {timeFilter === 'past' ? 'Загрузить предыдущий месяц' : 'Загрузить еще месяц'}
              </>
            )}
          </button>
        </div>
      )}

      {/* Информация о пагинации */}
      {pagination && (
        <div className="text-center text-sm text-gray-500 py-2">
          Показано {filteredAndSortedEvents.length} из {events.length} занятий
          {pagination.totalPages > 1 && (
            <span> • Страница {pagination.currentPage} из {pagination.totalPages}</span>
          )}
        </div>
      )}
    </div>
  )
}
