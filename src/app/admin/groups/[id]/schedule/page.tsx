'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  Calendar, 
  Clock, 
  Plus, 
  Save,
  Trash2,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Users,
  Settings,
  List,
  Grid3X3,
  Sparkles,
  Filter,
  Download,
  X
} from 'lucide-react'
import GroupScheduleGenerator from '@/components/admin/GroupScheduleGenerator'
import GroupScheduleListView from '@/components/admin/GroupScheduleListView'
import GroupScheduleWeekView from '@/components/admin/GroupScheduleWeekView'
import GroupScheduleMonthView from '@/components/admin/GroupScheduleMonthView'
import { getEventTypeOptions, EVENT_TYPES, getEventTypeLabel, getEventTypeGradientClass } from '@/lib/event-types'

interface ScheduleEntry {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  type: string
  isActive: boolean
}

interface Group {
  id: string
  name: string
  students: {
    id: string
    name: string
  }[]
  teacher?: {
    id: string
    name: string
  }
}

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

const DAYS_OF_WEEK = [
  { value: 1, label: 'Понедельник' },
  { value: 2, label: 'Вторник' },
  { value: 3, label: 'Среда' },
  { value: 4, label: 'Четверг' },
  { value: 5, label: 'Пятница' },
  { value: 6, label: 'Суббота' },
  { value: 0, label: 'Воскресенье' }
]

export default function GroupSchedulePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const groupId = params?.id as string
  
  const [group, setGroup] = useState<Group | null>(null)
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([])
  const [events, setEvents] = useState<GroupScheduleEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [showGenerator, setShowGenerator] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'week' | 'month'>('list')
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    upcoming: 0
  })
  
  // Состояние пагинации
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
    hasMore: false
  })
  const [loadingMore, setLoadingMore] = useState(false)
  
  // Форма нового расписания
  const [newSchedule, setNewSchedule] = useState({
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '10:30',
    type: EVENT_TYPES.LESSON
  })

  useEffect(() => {
    if (groupId) {
      fetchGroup()
      fetchGroupSchedule()
      fetchGroupEvents()
    }
  }, [groupId])

  const fetchGroup = async () => {
    try {
      const response = await fetch(`/api/admin/groups/${groupId}`)
      if (response.ok) {
        const data = await response.json()
        setGroup(data)
      } else {
        console.error('Ошибка загрузки группы:', response.status)
      }
    } catch (error) {
      console.error('Ошибка сети при загрузке группы:', error)
    }
  }

  const fetchGroupEvents = async (page = 1, append = false) => {
    try {
      const response = await fetch(`/api/admin/groups/${groupId}/schedule/events?page=${page}&limit=${pagination.limit}`)
      if (response.ok) {
        const data = await response.json()
        
        if (append) {
          // Добавляем к существующим событиям
          setEvents(prev => [...prev, ...(data.events || [])])
        } else {
          // Заменяем события (первая загрузка)
          setEvents(data.events || [])
        }
        
        // Обновляем пагинацию
        setPagination({
          page: data.pagination?.page || page,
          limit: data.pagination?.limit || pagination.limit,
          total: data.pagination?.total || 0,
          pages: data.pagination?.pages || 0,
          hasMore: (data.pagination?.page || page) < (data.pagination?.pages || 0)
        })
        
        setStats({
          total: data.stats?.total || 0,
          active: data.stats?.active || 0,
          inactive: data.stats?.inactive || 0,
          upcoming: data.events?.filter((e: GroupScheduleEvent) => new Date(e.startDate) >= new Date()).length || 0
        })
      } else {
        console.error('Ошибка загрузки событий:', response.status)
      }
    } catch (error) {
      console.error('Ошибка сети при загрузке событий:', error)
    }
  }

  const loadMoreEvents = async () => {
    if (loadingMore || !pagination.hasMore) return
    
    setLoadingMore(true)
    try {
      await fetchGroupEvents(pagination.page + 1, true)
    } catch (error) {
      console.error('Ошибка загрузки дополнительных событий:', error)
    } finally {
      setLoadingMore(false)
    }
  }

  const fetchGroupSchedule = async () => {
    try {
      const response = await fetch(`/api/admin/groups/${groupId}/schedule`)
      if (response.ok) {
        const data = await response.json()
        setSchedule(data.schedule || [])
      } else {
        console.error('Ошибка загрузки расписания:', response.status)
        setSchedule([])
      }
    } catch (error) {
      console.error('Ошибка сети при загрузке расписания:', error)
      setSchedule([])
    } finally {
      setLoading(false)
    }
  }

  const addScheduleEntry = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/groups/${groupId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSchedule)
      })
      
      if (response.ok) {
        const data = await response.json()
        await fetchGroupSchedule()
        setNewSchedule({
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '10:30',
          type: EVENT_TYPES.LESSON
        })
      } else {
        const errorData = await response.json()
        console.error('Ошибка сервера:', errorData)
        alert(`Ошибка: ${errorData.error || 'Неизвестная ошибка'}`)
      }
    } catch (error) {
      console.error('Ошибка сети:', error)
      alert('Ошибка сети при добавлении расписания')
    } finally {
      setSaving(false)
    }
  }

  const deleteScheduleEntry = async (scheduleId: string) => {
    try {
      const response = await fetch(`/api/admin/groups/${groupId}/schedule`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduleId })
      })
      
      if (response.ok) {
        const data = await response.json()
        await fetchGroupSchedule()
      } else {
        const errorData = await response.json()
        console.error('Ошибка сервера:', errorData)
        alert(`Ошибка: ${errorData.error || 'Неизвестная ошибка'}`)
      }
    } catch (error) {
      console.error('Ошибка сети:', error)
      alert('Ошибка сети при удалении расписания')
    }
  }

  const generateAdvancedSchedule = async (data: {
    startDate: string
    endDate: string
    scheduleDays: Array<{
      dayOfWeek: number
      startTime: string
      endTime: string
    }>
    title?: string
    location?: string
    type?: string
    isAttendanceRequired?: boolean
  }) => {
    setGenerating(true)
    try {
      console.log('🔄 Генерация расписания для группы:', groupId, data)
      
      const response = await fetch(`/api/admin/groups/${groupId}/schedule/generate-advanced`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Расписание успешно создано:', result)
        alert(`Создано ${result.eventsCreated} занятий для группы ${result.group.name}`)
        await fetchGroupEvents()
        setShowGenerator(false)
      } else {
        const errorData = await response.json()
        console.error('❌ Ошибка сервера:', errorData)
        
        // Более информативное сообщение об ошибке
        let errorMessage = errorData.error || 'Неизвестная ошибка'
        
        if (errorData.details) {
          console.error('🔍 Детали ошибки:', errorData.details)
          errorMessage += ` (${errorData.details.message})`
        }
        
        alert(`Ошибка: ${errorMessage}`)
      }
    } catch (error) {
      console.error('❌ Ошибка сети:', error)
      
      let errorMessage = 'Ошибка сети при генерации расписания'
      if (error instanceof Error) {
        errorMessage = `Ошибка сети: ${error.message}`
      }
      
      alert(errorMessage)
    } finally {
      setGenerating(false)
    }
  }


  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete', eventIds: string[]) => {
    if (eventIds.length === 0) return

    try {
      if (action === 'delete') {
        // Удаляем только будущие события
        const response = await fetch(`/api/admin/groups/${groupId}/schedule/bulk-delete-future`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventIds })
        })
        
        if (response.ok) {
          const result = await response.json()
          alert(`Удалено ${result.deletedCount} будущих занятий`)
          await fetchGroupEvents()
        } else {
          const errorData = await response.json()
          alert(`Ошибка: ${errorData.error || 'Неизвестная ошибка'}`)
        }
      } else {
        // Активация/деактивация
        const response = await fetch(`/api/admin/schedule/bulk-update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventIds,
            updates: { isActive: action === 'activate' }
          })
        })
        
        if (response.ok) {
          alert(`Обновлено ${eventIds.length} занятий`)
          await fetchGroupEvents()
        } else {
          const errorData = await response.json()
          alert(`Ошибка: ${errorData.error || 'Неизвестная ошибка'}`)
        }
      }
    } catch (error) {
      console.error('Ошибка при массовой операции:', error)
      alert('Ошибка при выполнении операции')
    }
  }

  const [editingEvent, setEditingEvent] = useState<GroupScheduleEvent | null>(null)
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    type: EVENT_TYPES.LESSON,
    location: '',
    eventDate: '',      // Одна дата для события
    startTime: '',      // Время начала
    endTime: '',        // Время окончания
    isAttendanceRequired: false
  })

  const handleEditEvent = (event: GroupScheduleEvent) => {
    setEditingEvent(event)
    
    // Парсим даты и время из события
    const startDate = new Date(event.startDate)
    const endDate = new Date(event.endDate)
    
    // Проверяем, что события в один день
    const isSameDay = startDate.toDateString() === endDate.toDateString()
    
    setEditFormData({
      title: event.title,
      description: event.description || '',
      type: event.type,
      location: event.location || '',
      eventDate: startDate.toISOString().split('T')[0], // YYYY-MM-DD (дата начала)
      startTime: startDate.toTimeString().slice(0, 5), // HH:MM
      endTime: endDate.toTimeString().slice(0, 5), // HH:MM
      isAttendanceRequired: event.isAttendanceRequired
    })
  }

  const handleUpdateEvent = async () => {
    if (!editingEvent) return

    // Валидация
    if (!editFormData.title.trim()) {
      alert('Название события обязательно')
      return
    }
    
    if (!editFormData.eventDate || !editFormData.startTime || !editFormData.endTime) {
      alert('Все поля даты и времени обязательны')
      return
    }

    try {
      // Формируем полные даты с временем (используем одну дату)
      const startDateTime = new Date(`${editFormData.eventDate}T${editFormData.startTime}:00`)
      const endDateTime = new Date(`${editFormData.eventDate}T${editFormData.endTime}:00`)
      
      // Проверяем, что время окончания после времени начала
      if (endDateTime <= startDateTime) {
        alert('Время окончания должно быть после времени начала')
        return
      }
      
      const updateData = {
        title: editFormData.title,
        description: editFormData.description,
        type: editFormData.type,
        location: editFormData.location,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        isAttendanceRequired: editFormData.isAttendanceRequired
      }

      const response = await fetch(`/api/events/${editingEvent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        await fetchGroupEvents()
        setEditingEvent(null)
        alert('Событие обновлено успешно')
      } else {
        const error = await response.json()
        alert(`Ошибка: ${error.error}`)
      }
    } catch (error) {
      console.error('Error updating event:', error)
      alert('Ошибка обновления события')
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (confirm('Вы уверены, что хотите удалить это занятие?')) {
      try {
        const response = await fetch(`/api/admin/schedule/${eventId}`, {
          method: 'DELETE'
        })
        
        if (response.ok) {
          await fetchGroupEvents()
        } else {
          alert('Ошибка при удалении занятия')
        }
      } catch (error) {
        console.error('Ошибка при удалении:', error)
        alert('Ошибка при удалении занятия')
      }
    }
  }

  const handleEventClick = (event: GroupScheduleEvent) => {
    // TODO: Реализовать просмотр деталей события
    console.log('Event clicked:', event)
  }

  const activeScheduleEntries = schedule.filter(s => s.isActive !== false)
  const totalWeeklyHours = activeScheduleEntries.reduce((sum, entry) => {
    const start = new Date(`1970-01-01T${entry.startTime}:00`)
    const end = new Date(`1970-01-01T${entry.endTime}:00`)
    return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60)
  }, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка расписания...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin/groups')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <Calendar className="w-8 h-8 text-blue-600" />
                  Расписание этой группы
                </h1>
                <p className="text-gray-600 mt-1">{group?.name || 'Загрузка...'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowGenerator(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Создать расписание
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Всего занятий</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Активных</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Будущих</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{stats.upcoming}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Студентов</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{group?.students.length || 0}</p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Переключатель видов */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Вид отображения:</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="w-4 h-4 inline mr-1" />
                  Список
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'week' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4 inline mr-1" />
                  Неделя
                </button>
                <button
                  onClick={() => setViewMode('month')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'month' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Месяц
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 text-gray-600 hover:text-gray-900 text-sm">
                <Download className="w-4 h-4 inline mr-1" />
                Экспорт
              </button>
            </div>
          </div>
        </div>

        {/* Отображение событий */}
        {viewMode === 'list' && (
          <GroupScheduleListView
            events={events}
            onEditEvent={handleEditEvent}
            onDeleteEvent={handleDeleteEvent}
            onBulkAction={handleBulkAction}
            onEventClick={handleEventClick}
            pagination={{
              hasMore: pagination.hasMore,
              total: pagination.total,
              currentPage: pagination.page,
              totalPages: pagination.pages
            }}
            onLoadMore={loadMoreEvents}
            loadingMore={loadingMore}
          />
        )}

        {viewMode === 'week' && (
          <GroupScheduleWeekView
            events={events}
            onEditEvent={handleEditEvent}
            onDeleteEvent={handleDeleteEvent}
            onEventClick={handleEventClick}
            pagination={{
              hasMore: pagination.hasMore,
              total: pagination.total,
              currentPage: pagination.page,
              totalPages: pagination.pages
            }}
            onLoadMore={loadMoreEvents}
            loadingMore={loadingMore}
          />
        )}

        {viewMode === 'month' && (
          <GroupScheduleMonthView
            events={events}
            onEditEvent={handleEditEvent}
            onDeleteEvent={handleDeleteEvent}
            onEventClick={handleEventClick}
            pagination={{
              hasMore: pagination.hasMore,
              total: pagination.total,
              currentPage: pagination.page,
              totalPages: pagination.pages
            }}
            onLoadMore={loadMoreEvents}
            loadingMore={loadingMore}
          />
        )}

        {/* Старое расписание (скрыто по умолчанию) */}
        <details className="mt-8">
          <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">
            Показать настройки недельного расписания
          </summary>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
            {/* Добавить новое расписание */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                Добавить расписание
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">День недели</label>
                  <select
                    value={newSchedule.dayOfWeek}
                    onChange={(e) => setNewSchedule({...newSchedule, dayOfWeek: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {DAYS_OF_WEEK.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Тип занятия</label>
                  <select
                    value={newSchedule.type}
                    onChange={(e) => setNewSchedule({...newSchedule, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {getEventTypeOptions().map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Время начала</label>
                    <input
                      type="time"
                      value={newSchedule.startTime}
                      onChange={(e) => setNewSchedule({...newSchedule, startTime: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Время окончания</label>
                    <input
                      type="time"
                      value={newSchedule.endTime}
                      onChange={(e) => setNewSchedule({...newSchedule, endTime: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <button
                  onClick={addScheduleEntry}
                  disabled={saving}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Сохранение...' : 'Добавить слот'}
                </button>
              </div>
            </div>

            {/* Текущее расписание */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                Текущее расписание
              </h3>
              
              {activeScheduleEntries.length > 0 ? (
                <div className="space-y-3">
                  {DAYS_OF_WEEK.map((day) => {
                    const daySchedule = activeScheduleEntries.filter(s => s.dayOfWeek === day.value)
                    
                    if (daySchedule.length === 0) return null
                    
                    return (
                      <div key={day.value} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">{day.label}</h4>
                        <div className="space-y-2">
                          {daySchedule.map((entry) => (
                            <div key={entry.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${getEventTypeGradientClass(entry.type as any)}`}></div>
                                <Clock className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium">
                                  {entry.startTime} - {entry.endTime}
                                </span>
                                <span className="text-xs text-gray-600 bg-gray-200 px-2 py-1 rounded">
                                  {getEventTypeLabel(entry.type as any)}
                                </span>
                              </div>
                              <button
                                onClick={() => deleteScheduleEntry(entry.id)}
                                className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Расписание не настроено</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Добавьте временные слоты для генерации событий
                  </p>
                </div>
              )}
            </div>
          </div>
        </details>

        {/* Информация о генерации */}
        {activeScheduleEntries.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Автогенерация событий</h4>
                <p className="text-sm text-blue-700 mt-1">
                  На основе текущего расписания будет создано {activeScheduleEntries.length * 8} событий на 8 недель вперед. 
                  События автоматически появятся в календаре студентов и будут доступны для отметки посещаемости.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Генератор расписания */}
      {showGenerator && group && (
        <GroupScheduleGenerator
          group={group}
          onGenerate={generateAdvancedSchedule}
          onClose={() => setShowGenerator(false)}
        />
      )}

      {/* Модальное окно редактирования события */}
      {editingEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Редактировать событие</h3>
                <button
                  onClick={() => setEditingEvent(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Название события
                  </label>
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Описание
                  </label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Тип события
                  </label>
                  <select
                    value={editFormData.type}
                    onChange={(e) => setEditFormData({...editFormData, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {getEventTypeOptions().map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Дата события
                  </label>
                  <input
                    type="date"
                    value={editFormData.eventDate}
                    onChange={(e) => setEditFormData({...editFormData, eventDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Время начала
                    </label>
                    <input
                      type="time"
                      value={editFormData.startTime}
                      onChange={(e) => setEditFormData({...editFormData, startTime: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Время окончания
                    </label>
                    <input
                      type="time"
                      value={editFormData.endTime}
                      onChange={(e) => setEditFormData({...editFormData, endTime: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Место проведения
                  </label>
                  <input
                    type="text"
                    value={editFormData.location}
                    onChange={(e) => setEditFormData({...editFormData, location: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={editFormData.isAttendanceRequired}
                    onChange={(e) => setEditFormData({...editFormData, isAttendanceRequired: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Обязательная посещаемость</span>
                </label>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEditingEvent(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Отмена
                </button>
                <button
                  onClick={handleUpdateEvent}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Сохранить изменения
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


