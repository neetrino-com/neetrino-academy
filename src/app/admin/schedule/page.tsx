'use client'

import { useState, useEffect } from 'react'
import { 
  Calendar, 
  Users, 
  Clock, 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  CalendarDays,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Settings,
  BarChart3,
  Grid3X3,
  List,
  Download,
  Upload,
  RefreshCw,
  Eye,
  EyeOff,
  User,
  Building,
  CalendarRange,
  Clock4,
  Zap,
  Target,
  TrendingUp,
  AlertCircle,
  Info,
  MoreHorizontal,
  Copy,
  RotateCcw,
  Play,
  Pause,
  Sparkles
} from 'lucide-react'
import React from 'react'
import ScheduleGenerator from '@/components/admin/ScheduleGenerator'
import ScheduleCalendar from '@/components/admin/ScheduleCalendar'
import ScheduleListView from '@/components/admin/ScheduleListView'
import ScheduleWeekView from '@/components/admin/ScheduleWeekView'

interface Group {
  id: string
  name: string
  description?: string
  type: string
  teacher?: {
    id: string
    name: string
    email: string
  }
  students: {
    id: string
    user: {
      name: string
      email: string
    }
  }[]
}

interface Teacher {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
}

interface ScheduleEntry {
  id: string
  groupId: string
  groupName: string
  teacherId: string
  teacherName: string
  dayOfWeek: number
  startTime: string
  endTime: string
  location?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

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


export default function ScheduleDashboard() {
  const [groups, setGroups] = useState<Group[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([])
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all')
  const [selectedGroup, setSelectedGroup] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'week'>('calendar')
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month')
  const [showInactive, setShowInactive] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [bulkMode, setBulkMode] = useState(false)
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set())
  const [mounted, setMounted] = useState(false)
  const [showGenerator, setShowGenerator] = useState(false)
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalSchedules: 0,
    totalGroups: 0,
    upcomingEvents: 0,
    pastEvents: 0
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

  useEffect(() => {
    setMounted(true)
    fetchScheduleData().catch(console.error)
  }, [])


  const loadMoreEvents = async () => {
    if (loadingMore || !pagination.hasMore) return
    
    setLoadingMore(true)
    try {
      const response = await fetch(`/api/admin/schedule/calendar?page=${pagination.page + 1}&limit=${pagination.limit}`)
      if (response.ok) {
        const data = await response.json()
        
        // Добавляем к существующим событиям
        setCalendarEvents(prev => [...prev, ...(data.events || [])])
        
        // Обновляем пагинацию
        if (data.pagination) {
          setPagination({
            page: data.pagination.page,
            limit: data.pagination.limit,
            total: data.pagination.total,
            pages: data.pagination.pages,
            hasMore: data.pagination.hasMore
          })
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки дополнительных событий:', error)
    } finally {
      setLoadingMore(false)
    }
  }

  const fetchScheduleData = async () => {
    try {
      setLoading(true)
      
      // Получаем группы
      const groupsResponse = await fetch('/api/admin/groups')
      let groupsData = []
      if (groupsResponse.ok) {
        const groupsDataResponse = await groupsResponse.json()
        groupsData = Array.isArray(groupsDataResponse) ? groupsDataResponse : []
        
        // Получаем учителей для каждой группы
        for (const group of groupsData) {
          const teachersResponse = await fetch(`/api/admin/groups/${group.id}/teachers`)
          if (teachersResponse.ok) {
            const teachersData = await teachersResponse.json()
            if (teachersData && teachersData.length > 0) {
              group.teacher = teachersData[0] // Берем первого учителя как основного
            }
          }
        }
        
        setGroups(groupsData)
      } else {
        console.error('Ошибка загрузки групп:', groupsResponse.status)
        setGroups([])
      }

      // Получаем учителей
      const teachersResponse = await fetch('/api/admin/teachers')
      if (teachersResponse.ok) {
        const teachersData = await teachersResponse.json()
        setTeachers(Array.isArray(teachersData) ? teachersData : [])
      } else {
        console.error('Ошибка загрузки учителей:', teachersResponse.status)
        setTeachers([])
      }

      // Получаем календарные данные с пагинацией
      const calendarResponse = await fetch(`/api/admin/schedule/calendar?page=1&limit=${pagination.limit}`)
      if (calendarResponse.ok) {
        const calendarData = await calendarResponse.json()
        setCalendarEvents(calendarData.events || [])
        setStats(calendarData.stats || stats)
        
        // Обновляем пагинацию
        if (calendarData.pagination) {
          setPagination({
            page: calendarData.pagination.page,
            limit: calendarData.pagination.limit,
            total: calendarData.pagination.total,
            pages: calendarData.pagination.pages,
            hasMore: calendarData.pagination.hasMore
          })
        }
      } else {
        console.error('Ошибка загрузки календарных данных:', calendarResponse.status)
        setCalendarEvents([])
      }

      // Получаем расписание всех групп (для совместимости)
      if (groupsData.length > 0) {
        try {
          const schedulePromises = groupsData.map((group: Group) =>
            fetch(`/api/admin/groups/${group.id}/schedule`)
              .then(res => res.ok ? res.json() : null)
              .catch((error) => {
                console.error(`Ошибка загрузки расписания группы ${group.name}:`, error)
                return null
              })
          )
          
          const schedulesData = await Promise.all(schedulePromises)
          const allEntries: ScheduleEntry[] = []
          
          schedulesData.forEach((schedule, index) => {
            if (schedule && schedule.schedule) {
              schedule.schedule.forEach((entry: {
                id: string
                dayOfWeek: number
                startTime: string
                endTime: string
                isActive: boolean
              }) => {
                allEntries.push({
                  ...entry,
                  groupId: groupsData[index].id,
                  groupName: groupsData[index].name,
                  teacherId: groupsData[index].teacher?.id || '',
                  teacherName: groupsData[index].teacher?.name || 'Не назначен',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                })
              })
            }
          })
          
          setScheduleEntries(allEntries)
        } catch (error) {
          console.error('Ошибка загрузки расписания групп:', error)
          setScheduleEntries([])
        }
      } else {
        setScheduleEntries([])
      }
    } catch (error) {
      console.error('Ошибка загрузки данных расписания:', error)
    } finally {
      setLoading(false)
    }
  }


  const getDayName = (dayOfWeek: number) => {
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']
    return days[dayOfWeek]
  }

  const getShortDayName = (dayOfWeek: number) => {
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
    return days[dayOfWeek]
  }

  const formatTime = (time: string) => {
    return time.substring(0, 5)
  }

  const getTeacherWorkload = (teacherId: string) => {
    const teacherEntries = scheduleEntries.filter(entry => 
      entry.teacherId === teacherId && entry.isActive
    )
    
    const workloadByDay: { [key: number]: number } = {}
    teacherEntries.forEach(entry => {
      workloadByDay[entry.dayOfWeek] = (workloadByDay[entry.dayOfWeek] || 0) + 1
    })
    
    return {
      totalGroups: teacherEntries.length,
      workloadByDay,
      maxGroupsPerDay: Math.max(...Object.values(workloadByDay), 0)
    }
  }

  const filteredEntries = scheduleEntries.filter(entry => {
    const matchesTeacher = selectedTeacher === 'all' || entry.teacherId === selectedTeacher
    const matchesGroup = selectedGroup === 'all' || entry.groupId === selectedGroup
    const matchesSearch = entry.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (entry.location && entry.location.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesActive = showInactive || entry.isActive
    
    return matchesTeacher && matchesGroup && matchesSearch && matchesActive
  })

  const generateAdvancedSchedule = async (data: {
    groupIds: string[]
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
    try {
      const response = await fetch('/api/admin/schedule/generate-advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (response.ok) {
        const result = await response.json()
        await fetchScheduleData()
        alert(`Создано ${result.summary.eventsCount} занятий для ${result.summary.groupsCount} групп!`)
        setShowGenerator(false)
      } else {
        const error = await response.json()
        alert(`Ошибка: ${error.error}`)
      }
    } catch (error) {
      console.error('Ошибка генерации расписания:', error)
      alert('Ошибка при генерации расписания')
    }
  }

  const generateScheduleForPeriod = async (months: number) => {
    try {
      const response = await fetch('/api/admin/schedule/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          months,
          groups: Array.isArray(groups) ? groups.map(g => g.id) : []
        })
      })
      
      if (response.ok) {
        await fetchScheduleData()
        alert(`Расписание сгенерировано на ${months} месяцев вперед!`)
      }
    } catch (error) {
      console.error('Ошибка генерации расписания:', error)
      alert('Ошибка при генерации расписания')
    }
  }

  const bulkUpdateSchedule = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedEntries.size === 0) return
    
    try {
      const response = await fetch('/api/admin/schedule/bulk-update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          entryIds: Array.from(selectedEntries)
        })
      })
      
      if (response.ok) {
        await fetchScheduleData()
        setSelectedEntries(new Set())
        setBulkMode(false)
      }
    } catch (error) {
      console.error('Ошибка массового обновления:', error)
    }
  }

  const bulkDeleteFutureEvents = async (eventIds: string[]) => {
    try {
      const response = await fetch('/api/admin/schedule/bulk-delete-future', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventIds,
          confirmDelete: true
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        await fetchScheduleData()
        alert(`Удалено ${result.deleted.events} событий и ${result.deleted.schedules} записей расписания`)
      } else {
        const error = await response.json()
        alert(`Ошибка: ${error.error}`)
      }
    } catch (error) {
      console.error('Ошибка массового удаления:', error)
      alert('Ошибка при удалении занятий')
    }
  }

  const handleEventClick = (event: CalendarEvent) => {
    console.log('Event clicked:', event)
  }

  const handleEditEvent = (event: CalendarEvent) => {
    console.log('Edit event:', event)
  }

  const handleDeleteEvent = (eventId: string) => {
    if (confirm('Вы уверены, что хотите удалить это занятие?')) {
      bulkDeleteFutureEvents([eventId])
    }
  }

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка расписания...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white min-h-[calc(100vh-100px)]">
      {/* Хедер */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Calendar className="w-8 h-8" />
              Расписание групп
            </h2>
            <p className="text-blue-100 mt-1 flex items-center gap-2">
              <span>{stats.totalGroups} групп</span>
              <span className="text-blue-200">•</span>
              <span>{stats.totalEvents} событий</span>
              <span className="text-blue-200">•</span>
              <span>{stats.upcomingEvents} предстоящих</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowGenerator(true)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Создать расписание
            </button>
            <button
              onClick={() => generateScheduleForPeriod(3)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg flex items-center gap-2 transition-colors"
            >
              <CalendarRange className="w-4 h-4" />
              Быстрая генерация
            </button>
          </div>
        </div>
      </div>

      {/* Статистика */}
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Всего групп</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalGroups}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Учителей</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{Array.isArray(teachers) ? teachers.length : 0}</p>
              </div>
              <User className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Всего событий</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.totalEvents}</p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Предстоящих</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{stats.upcomingEvents}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Прошедших</p>
                <p className="text-2xl font-bold text-gray-600 mt-1">{stats.pastEvents}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-gray-600" />
            </div>
          </div>
        </div>

        {/* Фильтры и управление */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Поиск по группе, учителю, аудитории..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
                         <select
               value={selectedTeacher}
               onChange={(e) => setSelectedTeacher(e.target.value)}
               className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
             >
               <option value="all">Все учителя</option>
               {Array.isArray(teachers) && teachers.map(teacher => (
                 <option key={teacher.id} value={teacher.id}>
                   {teacher.name} ({getTeacherWorkload(teacher.id).totalGroups} групп)
                 </option>
               ))}
             </select>

                         <select
               value={selectedGroup}
               onChange={(e) => setSelectedGroup(e.target.value)}
               className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
             >
               <option value="all">Все группы</option>
               {Array.isArray(groups) && groups.map(group => (
                 <option key={group.id} value={group.id}>{group.name}</option>
               ))}
             </select>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  viewMode === 'calendar' 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                <Calendar className="w-4 h-4" />
                Календарь
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  viewMode === 'week' 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                <CalendarDays className="w-4 h-4" />
                Неделя
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                <List className="w-4 h-4" />
                Список
              </button>
            </div>

            <button
              onClick={fetchScheduleData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Обновить
            </button>
          </div>

          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-600">Показывать неактивные</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={bulkMode}
                onChange={(e) => setBulkMode(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-600">Режим массового редактирования</span>
            </label>
          </div>
        </div>
      </div>


      {/* Массовые действия */}
      {bulkMode && (
        <div className="bg-blue-50 border-b border-blue-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-blue-700">
                Выбрано: {selectedEntries.size} занятий
              </span>
              <button
                onClick={() => setSelectedEntries(new Set(filteredEntries.map(e => e.id)))}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Выбрать все
              </button>
              <button
                onClick={() => setSelectedEntries(new Set())}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Снять выбор
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => bulkUpdateSchedule('activate')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Активировать
              </button>
              <button
                onClick={() => bulkUpdateSchedule('deactivate')}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center gap-2"
              >
                <Pause className="w-4 h-4" />
                Деактивировать
              </button>
              <button
                onClick={() => bulkUpdateSchedule('delete')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Содержимое */}
      <div className="p-6">
        {viewMode === 'calendar' && (
          <ScheduleCalendar
            events={calendarEvents}
            onEditEvent={handleEditEvent}
            onDeleteEvent={handleDeleteEvent}
            onEventClick={handleEventClick}
          />
        )}

        {viewMode === 'week' && (
          <ScheduleWeekView
            events={calendarEvents}
            onEditEvent={handleEditEvent}
            onDeleteEvent={handleDeleteEvent}
            onEventClick={handleEventClick}
            onAddEvent={(date, time) => {
              console.log('Add event at:', date, time)
              // Здесь можно открыть модальное окно для создания события
            }}
          />
        )}

        {viewMode === 'list' && (
          <ScheduleListView
            events={calendarEvents}
            onEditEvent={handleEditEvent}
            onDeleteEvent={handleDeleteEvent}
            onBulkAction={(action, eventIds) => {
              if (action === 'delete') {
                bulkDeleteFutureEvents(eventIds)
              } else {
                console.log('Bulk action:', action, eventIds)
              }
            }}
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
      </div>

      {/* Генератор расписания */}
      {showGenerator && (
        <ScheduleGenerator
          groups={groups}
          onGenerate={generateAdvancedSchedule}
          onClose={() => setShowGenerator(false)}
        />
      )}
    </div>
  )
}
