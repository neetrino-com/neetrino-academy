'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
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

interface ScheduleStats {
  totalEvents: number
  totalSchedules: number
  totalGroups: number
  upcomingEvents: number
  pastEvents: number
}

export default function OptimizedScheduleDashboard() {
  const [groups, setGroups] = useState<Group[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
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
  const [stats, setStats] = useState<ScheduleStats>({
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

  // Кэш для данных
  const [cache, setCache] = useState<Map<string, any>>(new Map())
  const CACHE_DURATION = 5 * 60 * 1000 // 5 минут
  
  // Отслеживание загруженных месяцев для ленивой загрузки
  const [loadedMonths, setLoadedMonths] = useState<Set<string>>(new Set())

  useEffect(() => {
    setMounted(true)
    fetchScheduleData().catch(console.error)
  }, [])

  // Функция для получения данных из кэша или API
  const getCachedData = useCallback(async (key: string, fetcher: () => Promise<any>) => {
    const cached = cache.get(key)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`📦 [Cache] Используем кэшированные данные для ${key}`)
      return cached.data
    }

    console.log(`🌐 [API] Загружаем данные для ${key}`)
    const data = await fetcher()
    setCache(prev => new Map(prev.set(key, { data, timestamp: Date.now() })))
    return data
  }, [cache])

  // Оптимизированная загрузка данных - ТОЛЬКО ТЕКУЩИЙ МЕСЯЦ
  const fetchScheduleData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Загружаем ТОЛЬКО текущий месяц (1-30/31 число)
      const now = new Date()
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1) // 1 число текущего месяца
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0) // Последний день текущего месяца
      
      console.log(`📅 [Schedule] Текущая дата: ${now.toISOString()}`)
      console.log(`📅 [Schedule] Начало месяца: ${startDate.toISOString()}`)
      console.log(`📅 [Schedule] Конец месяца: ${endDate.toISOString()}`)
      
      // Очищаем кэш для принудительной загрузки
      const cacheKey = `schedule-${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}`
      setCache(new Map()) // Очищаем кэш
      
      console.log(`📅 [Schedule] Загружаем ТОЛЬКО текущий месяц: ${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]}`)
      
      const data = await getCachedData(cacheKey, async () => {
        const response = await fetch(`/api/admin/schedule/all?start=${startDate.toISOString().split('T')[0]}&end=${endDate.toISOString().split('T')[0]}&page=1&limit=50&force=true`)
        if (!response.ok) throw new Error('Ошибка загрузки данных')
        return response.json()
      })

      if (data.success) {
        setGroups(data.groups || [])
        setTeachers(data.teachers || [])
        // Заменяем события при основной загрузке
        setCalendarEvents(data.events || [])
        setStats(data.stats || stats)
        
        // Отмечаем текущий месяц как загруженный
        const currentMonthKey = `${now.getFullYear()}-${now.getMonth() + 1}`
        setLoadedMonths(new Set([currentMonthKey]))
        
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
      console.error('Ошибка загрузки данных расписания:', error)
    } finally {
      setLoading(false)
    }
  }, [getCachedData, stats])

  // Удалена функция loadNextMonth - загружаем только по кнопке

  // Загрузка следующего месяца для списка
  const loadMoreMonths = useCallback(async () => {
    console.log('🔄 [Load More] Функция loadMoreMonths вызвана!')
    if (loadingMore) {
      console.log('🔄 [Load More] Уже загружается, пропускаем')
      return
    }
    
    setLoadingMore(true)
    try {
      // Определяем следующий месяц для загрузки на основе последнего загруженного события
      const lastEvent = calendarEvents[calendarEvents.length - 1]
      let nextMonth: Date
      
      if (lastEvent) {
        // Если есть события, загружаем месяц после последнего события
        const lastEventDate = new Date(lastEvent.startDate)
        nextMonth = new Date(lastEventDate.getFullYear(), lastEventDate.getMonth() + 1, 1)
      } else {
        // Если нет событий, загружаем следующий месяц после текущего
        const now = new Date()
        nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      }
      
      const nextMonthEnd = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0) // Последний день следующего месяца
      
      console.log(`📅 [Load More] Загружаем следующий месяц: ${nextMonth.toISOString().split('T')[0]} - ${nextMonthEnd.toISOString().split('T')[0]}`)
      
      const cacheKey = `schedule-${nextMonth.toISOString().split('T')[0]}-${nextMonthEnd.toISOString().split('T')[0]}`
      
      const data = await getCachedData(cacheKey, async () => {
        const response = await fetch(`/api/admin/schedule/all?start=${nextMonth.toISOString().split('T')[0]}&end=${nextMonthEnd.toISOString().split('T')[0]}&page=1&limit=50&force=true`)
        if (!response.ok) throw new Error('Ошибка загрузки данных')
        return response.json()
      })

      if (data.success && data.events) {
        setCalendarEvents(prev => {
          // Дедупликация по ID
          const existingIds = new Set(prev.map(event => event.id))
          const newEvents = data.events.filter((event: CalendarEvent) => !existingIds.has(event.id))
          console.log(`✅ [Load More] Загружено ${newEvents.length} новых событий для следующего месяца`)
          return [...prev, ...newEvents]
        })
        
        // Отмечаем следующий месяц как загруженный
        const nextMonthKey = `${nextMonth.getFullYear()}-${nextMonth.getMonth() + 1}`
        setLoadedMonths(prev => new Set([...prev, nextMonthKey]))
      }
    } catch (error) {
      console.error('Ошибка загрузки дополнительных месяцев:', error)
    } finally {
      setLoadingMore(false)
    }
  }, [calendarEvents, loadingMore, getCachedData])

  // Убрана автоматическая предзагрузка - загружаем только по кнопке

  // Мемоизированные вычисления
  const filteredEntries = useMemo(() => {
    return calendarEvents.filter(event => {
      const matchesTeacher = selectedTeacher === 'all' || event.teacherId === selectedTeacher
      const matchesGroup = selectedGroup === 'all' || event.groupId === selectedGroup
      const matchesSearch = event.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           event.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (event.location && event.location.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesActive = showInactive || event.isActive
      
      return matchesTeacher && matchesGroup && matchesSearch && matchesActive
    })
  }, [calendarEvents, selectedTeacher, selectedGroup, searchTerm, showInactive])

  // Фильтр для календаря - только текущий месяц
  const calendarEventsFiltered = useMemo(() => {
    const now = new Date()
    return calendarEvents.filter(event => {
      const eventDate = new Date(event.startDate)
      const isCurrentMonth = eventDate.getMonth() === now.getMonth() && 
                            eventDate.getFullYear() === now.getFullYear()
      
      const matchesTeacher = selectedTeacher === 'all' || event.teacherId === selectedTeacher
      const matchesGroup = selectedGroup === 'all' || event.groupId === selectedGroup
      const matchesSearch = event.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           event.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (event.location && event.location.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesActive = showInactive || event.isActive
      
      return isCurrentMonth && matchesTeacher && matchesGroup && matchesSearch && matchesActive
    })
  }, [calendarEvents, selectedTeacher, selectedGroup, searchTerm, showInactive])

  // Фильтр для недели - только текущий месяц
  const weekEventsFiltered = useMemo(() => {
    const now = new Date()
    return calendarEvents.filter(event => {
      const eventDate = new Date(event.startDate)
      const isCurrentMonth = eventDate.getMonth() === now.getMonth() && 
                            eventDate.getFullYear() === now.getFullYear()
      
      const matchesTeacher = selectedTeacher === 'all' || event.teacherId === selectedTeacher
      const matchesGroup = selectedGroup === 'all' || event.groupId === selectedGroup
      const matchesSearch = event.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           event.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (event.location && event.location.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesActive = showInactive || event.isActive
      
      return isCurrentMonth && matchesTeacher && matchesGroup && matchesSearch && matchesActive
    })
  }, [calendarEvents, selectedTeacher, selectedGroup, searchTerm, showInactive])

  const getTeacherWorkload = useCallback((teacherId: string) => {
    const teacherEntries = calendarEvents.filter(event => 
      event.teacherId === teacherId && event.isActive
    )
    
    const workloadByDay: { [key: number]: number } = {}
    teacherEntries.forEach(event => {
      const dayOfWeek = new Date(event.start).getDay()
      workloadByDay[dayOfWeek] = (workloadByDay[dayOfWeek] || 0) + 1
    })
    
    return {
      totalGroups: teacherEntries.length,
      workloadByDay,
      maxGroupsPerDay: Math.max(...Object.values(workloadByDay), 0)
    }
  }, [calendarEvents])

  // Обработчики событий
  const handleEventClick = useCallback((event: CalendarEvent) => {
    console.log('Event clicked:', event)
  }, [])

  const handleEditEvent = useCallback((event: CalendarEvent) => {
    console.log('Edit event:', event)
  }, [])

  const handleDeleteEvent = useCallback((eventId: string) => {
    if (confirm('Вы уверены, что хотите удалить это занятие?')) {
      // Логика удаления
      console.log('Delete event:', eventId)
    }
  }, [])

  const generateAdvancedSchedule = useCallback(async (data: {
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
        // Очищаем кэш и перезагружаем данные
        setCache(new Map())
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
  }, [fetchScheduleData])

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
              Расписание всех групп
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
              onClick={() => {
                setCache(new Map())
                fetchScheduleData()
              }}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg flex items-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Обновить
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
                <p className="text-2xl font-bold text-gray-900 mt-1">{teachers.length}</p>
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
              {teachers.map(teacher => (
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
              {groups.map(group => (
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
            {loadingMore && (
              <div className="flex items-center gap-2 text-blue-600">
                <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                <span className="text-sm">Загрузка следующего месяца...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Содержимое */}
      <div className="p-6">
        {viewMode === 'calendar' && (
          <ScheduleCalendar
            events={calendarEventsFiltered}
            onEditEvent={handleEditEvent}
            onDeleteEvent={handleDeleteEvent}
            onEventClick={handleEventClick}
          />
        )}

        {viewMode === 'week' && (
          <ScheduleWeekView
            events={weekEventsFiltered}
            onEditEvent={handleEditEvent}
            onDeleteEvent={handleDeleteEvent}
            onEventClick={handleEventClick}
            onAddEvent={(date, time) => {
              console.log('Add event at:', date, time)
            }}
          />
        )}

        {viewMode === 'list' && (
          <ScheduleListView
            events={filteredEntries}
            onEditEvent={handleEditEvent}
            onDeleteEvent={handleDeleteEvent}
            onBulkAction={(action, eventIds) => {
              console.log('Bulk action:', action, eventIds)
            }}
            onEventClick={handleEventClick}
            pagination={{
              hasMore: true, // Всегда показываем кнопку "Загрузить еще месяц"
              total: calendarEvents.length, // Количество загруженных событий
              currentPage: 1,
              totalPages: 1
            }}
            onLoadMore={loadMoreMonths}
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
