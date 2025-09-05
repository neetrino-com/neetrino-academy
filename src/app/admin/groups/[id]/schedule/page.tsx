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
  CalendarDays,
  AlertCircle,
  CheckCircle,
  Users,
  Settings,
  List,
  Grid3X3,
  Sparkles,
  Filter,
  Download
} from 'lucide-react'
import GroupScheduleGenerator from '@/components/admin/GroupScheduleGenerator'
import GroupScheduleListView from '@/components/admin/GroupScheduleListView'
import GroupScheduleWeekView from '@/components/admin/GroupScheduleWeekView'
import GroupScheduleMonthView from '@/components/admin/GroupScheduleMonthView'

interface ScheduleEntry {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
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
  
  // Форма нового расписания
  const [newSchedule, setNewSchedule] = useState({
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '10:30'
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

  const fetchGroupEvents = async () => {
    try {
      const response = await fetch(`/api/admin/groups/${groupId}/schedule/events?limit=100`)
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events || [])
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
          endTime: '10:30'
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
    isAttendanceRequired?: boolean
  }) => {
    setGenerating(true)
    try {
      const response = await fetch(`/api/admin/groups/${groupId}/schedule/generate-advanced`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (response.ok) {
        const result = await response.json()
        alert(`Создано ${result.eventsCreated} занятий для группы ${result.group.name}`)
        await fetchGroupEvents()
        setShowGenerator(false)
      } else {
        const errorData = await response.json()
        console.error('Ошибка сервера:', errorData)
        alert(`Ошибка: ${errorData.error || 'Неизвестная ошибка'}`)
      }
    } catch (error) {
      console.error('Ошибка сети:', error)
      alert('Ошибка сети при генерации расписания')
    } finally {
      setGenerating(false)
    }
  }

  const generateEvents = async () => {
    setGenerating(true)
    try {
      const response = await fetch(`/api/admin/groups/${groupId}/schedule/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: new Date().toISOString().split('T')[0],
          weeks: 8
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        alert('События успешно сгенерированы!')
        await fetchGroupEvents()
      } else {
        const errorData = await response.json()
        console.error('Ошибка сервера:', errorData)
        alert(`Ошибка: ${errorData.error || 'Неизвестная ошибка'}`)
      }
    } catch (error) {
      console.error('Ошибка сети:', error)
      alert('Ошибка сети при генерации событий')
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

  const handleEditEvent = (event: GroupScheduleEvent) => {
    // TODO: Реализовать редактирование события
    console.log('Edit event:', event)
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
                  Расписание группы
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
              <button 
                onClick={generateEvents}
                disabled={generating || activeScheduleEntries.length === 0}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
              >
                <CalendarDays className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                Быстрая генерация
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
          />
        )}

        {viewMode === 'week' && (
          <GroupScheduleWeekView
            events={events}
            onEditEvent={handleEditEvent}
            onDeleteEvent={handleDeleteEvent}
            onEventClick={handleEventClick}
          />
        )}

        {viewMode === 'month' && (
          <GroupScheduleMonthView
            events={events}
            onEditEvent={handleEditEvent}
            onDeleteEvent={handleDeleteEvent}
            onEventClick={handleEventClick}
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
                                <Clock className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium">
                                  {entry.startTime} - {entry.endTime}
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
    </div>
  )
}


