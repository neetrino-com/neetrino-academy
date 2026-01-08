'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
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
import EditEventModal from '@/components/admin/EditEventModal'
import EventDetailsModal from '@/components/admin/EventDetailsModal'
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal'

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
  const [timeFilter, setTimeFilter] = useState<'current' | 'past'>('current')
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [viewingEvent, setViewingEvent] = useState<CalendarEvent | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [deletingEvent, setDeletingEvent] = useState<CalendarEvent | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
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
  const [cache, setCache] = useState<Map<string, { data: unknown; timestamp: number }>>(new Map())
  const CACHE_DURATION = 5 * 60 * 1000 // 5 минут
  
  // Отслеживание загруженных месяцев для ленивой загрузки
  const [loadedMonths, setLoadedMonths] = useState<Set<string>>(new Set())

  // Ref для хранения актуальной функции загрузки данных
  const fetchScheduleDataRef = useRef<() => Promise<void>>()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Функция для получения данных из кэша или API
  const getCachedData = useCallback(async <T,>(key: string, fetcher: () => Promise<T>): Promise<T> => {
    const cached = cache.get(key)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`📦 [Cache] Используем кэшированные данные для ${key}`)
      return cached.data as T.data
    }

    console.log(`🌐 [API] Загружаем данные для ${key}`)
    const data = await fetcher()
    setCache(prev => new Map(prev.set(key, { data: data as unknown, timestamp: Date.now() })))
    return data
  }, [cache])

  // Оптимизированная загрузка данных - ТОЛЬКО ТЕКУЩИЙ МЕСЯЦ
  const fetchScheduleData = useCallback(async () => {
    try {
      console.log(`🚀 [Schedule] fetchScheduleData вызвана с timeFilter: ${timeFilter}`)
      setLoading(true)
      
      // Рассчитываем даты в зависимости от фильтра
      const now = new Date()
      let startDate: Date, endDate: Date
      
      if (timeFilter === 'past') {
        // Прошедшие события: с начала предыдущего месяца до вчера
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59)
      } else {
        // Текущие события: с сегодняшнего дня до конца текущего месяца
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      }
      
      console.log(`📅 [Schedule] Текущая дата: ${now.toISOString()}`)
      console.log(`📅 [Schedule] Начало месяца: ${startDate.toISOString()}`)
      console.log(`📅 [Schedule] Конец месяца: ${endDate.toISOString()}`)
      
      // Очищаем кэш для принудительной загрузки
      const cacheKey = `schedule-${timeFilter}-${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}`
      setCache(new Map()) // Очищаем кэш
      
      console.log(`📅 [Schedule] Загружаем ${timeFilter === 'past' ? 'прошедшие' : 'текущие'} события: ${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]}`)
      
      const data = await getCachedData(cacheKey, async () => {
        const response = await fetch(`/api/admin/schedule/all?page=1&limit=50&force=true&timeFilter=${timeFilter}`)
        if (!response.ok) throw new Error('Ошибка загрузки данных')
        return response.json()
      })

      if (data.success) {
        console.log(`✅ [Schedule] Получены данные: ${data.events?.length || 0} событий`)
        console.log(`✅ [Schedule] События:`, data.events?.map((e: CalendarEvent) => ({ id: e.id, title: e.title, startDate: e.startDate })))
        setGroups(data.groups || [])
        setTeachers(data.teachers || [])
        // Заменяем события при основной загрузке
        setCalendarEvents(data.events || [])
        setStats(data.stats || {
          totalEvents: 0,
          totalSchedules: 0,
          totalGroups: 0,
          upcomingEvents: 0,
          pastEvents: 0
        })
        
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
  }, [getCachedData, timeFilter])

  // Обновляем ref при изменении fetchScheduleData
  useEffect(() => {
    fetchScheduleDataRef.current = fetchScheduleData
  }, [fetchScheduleData])

  // Принудительная перезагрузка при смене фильтра
  useEffect(() => {
    console.log(`🔄 [Schedule] useEffect сработал. mounted: ${mounted}, timeFilter: ${timeFilter}`)
    if (mounted) {
      console.log(`🔄 [Schedule] Фильтр изменен на: ${timeFilter}`)
      setCache(new Map()) // Очищаем кэш
      setCalendarEvents([]) // Очищаем события
      fetchScheduleDataRef.current?.().catch(console.error)
    }
  }, [timeFilter, mounted])

  // Удалена функция loadNextMonth - загружаем только по кнопке

  // Загрузка следующего/предыдущего месяца для списка
  const loadMoreMonths = useCallback(async () => {
    console.log('🔄 [Load More] Функция loadMoreMonths вызвана!')
    if (loadingMore) {
      console.log('🔄 [Load More] Уже загружается, пропускаем')
      return
    }
    
    setLoadingMore(true)
    try {
      let targetMonth: Date
      
      if (timeFilter === 'past') {
        // Для прошедших событий загружаем предыдущий месяц
        const firstEvent = calendarEvents[0]
        
        if (firstEvent) {
          // Если есть события, загружаем месяц перед первым событием
          const firstEventDate = new Date(firstEvent.startDate)
          targetMonth = new Date(firstEventDate.getFullYear(), firstEventDate.getMonth() - 1, 1)
        } else {
          // Если нет событий, загружаем предыдущий месяц от текущего
          const now = new Date()
          targetMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        }
        
        console.log(`📅 [Load More] Загружаем предыдущий месяц: ${targetMonth.toISOString().split('T')[0]}`)
      } else {
        // Для текущих событий загружаем следующий месяц
        const lastEvent = calendarEvents[calendarEvents.length - 1]
        
        if (lastEvent) {
          // Если есть события, загружаем месяц после последнего события
          const lastEventDate = new Date(lastEvent.startDate)
          targetMonth = new Date(lastEventDate.getFullYear(), lastEventDate.getMonth() + 1, 1)
        } else {
          // Если нет событий, загружаем следующий месяц после текущего
          const now = new Date()
          targetMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
        }
        
        console.log(`📅 [Load More] Загружаем следующий месяц: ${targetMonth.toISOString().split('T')[0]}`)
      }
      
      const targetMonthEnd = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0) // Последний день месяца
      
      const cacheKey = `schedule-${targetMonth.toISOString().split('T')[0]}-${targetMonthEnd.toISOString().split('T')[0]}`
      
      const data = await getCachedData(cacheKey, async () => {
        const response = await fetch(`/api/admin/schedule/all?start=${targetMonth.toISOString().split('T')[0]}&end=${targetMonthEnd.toISOString().split('T')[0]}&page=1&limit=50&force=true&timeFilter=${timeFilter}`)
        if (!response.ok) throw new Error('Ошибка загрузки данных')
        return response.json()
      })

      if (data.success && data.events) {
        setCalendarEvents(prev => {
          // Дедупликация по ID
          const existingIds = new Set(prev.map(event => event.id))
          const newEvents = data.events.filter((event: CalendarEvent) => !existingIds.has(event.id))
          console.log(`✅ [Load More] Загружено ${newEvents.length} новых событий`)
          
          if (timeFilter === 'past') {
            // Для прошедших событий добавляем в начало списка
            return [...newEvents, ...prev]
          } else {
            // Для текущих событий добавляем в конец списка
            return [...prev, ...newEvents]
          }
        })
        
        // Отмечаем месяц как загруженный
        const monthKey = `${targetMonth.getFullYear()}-${targetMonth.getMonth() + 1}`
        setLoadedMonths(prev => new Set([...prev, monthKey]))
      }
    } catch (error) {
      console.error('Ошибка загрузки дополнительных месяцев:', error)
    } finally {
      setLoadingMore(false)
    }
  }, [calendarEvents, loadingMore, getCachedData, timeFilter])

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
    console.log('👁️ [EventClick] Кнопка "просмотр" нажата!')
    console.log('👁️ [EventClick] Событие:', event)
    
    try {
      // Устанавливаем событие для просмотра и открываем модальное окно
      setViewingEvent(event)
      setShowDetailsModal(true)
      console.log('👁️ [EventClick] Модальное окно деталей открыто')
      
    } catch (error) {
      console.error('❌ [EventClick] Ошибка при показе информации:', error)
      alert('Ошибка при загрузке информации о событии')
    }
  }, [])

  const handleEditEvent = useCallback(async (event: CalendarEvent) => {
    try {
      console.log('Редактирование события:', event)
      
      // Получаем полные данные события для редактирования
      // Сначала попробуем использовать admin API
      let response = await fetch(`/api/admin/schedule/event/${event.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })
      
      // Если admin API не работает, попробуем обычный events API
      if (!response.ok && response.status === 404) {
        console.log('Admin API не найден, пробуем обычный events API')
        response = await fetch(`/api/events/${event.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        })
      }
      
      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error Response:', errorText)
        
        if (response.status === 401) {
          throw new Error('Ошибка авторизации. Пожалуйста, войдите в систему заново.')
        } else if (response.status === 404) {
          throw new Error('Событие не найдено или у вас нет прав на его редактирование.')
        } else {
          throw new Error(`Ошибка загрузки данных события (${response.status}): ${errorText}`)
        }
      }
      
      const eventData = await response.json()
      console.log('Данные события для редактирования:', eventData)
      
      // Преобразуем данные события в формат, ожидаемый модальным окном
      const eventForEdit = {
        id: eventData.id,
        title: eventData.title,
        description: eventData.description || '',
        type: eventData.type,
        startDate: eventData.startDate,
        endDate: eventData.endDate,
        location: eventData.location || '',
        isAttendanceRequired: eventData.isAttendanceRequired || false,
        groupId: eventData.groupId,
        groupName: eventData.group?.name || '',
        teacherId: eventData.createdBy?.id || '',
        teacherName: eventData.createdBy?.name || ''
      }
      
      // Устанавливаем событие для редактирования и открываем модальное окно
      setEditingEvent(eventForEdit)
      setShowEditModal(true)
      
    } catch (error) {
      console.error('Ошибка при редактировании события:', error)
      alert(`Ошибка при загрузке данных события: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
    }
  }, [])

  const handleDeleteEvent = useCallback((eventId: string) => {
    console.log('🗑️ [DeleteEvent] Начало удаления события:', eventId)
    
    const event = calendarEvents.find(e => e.id === eventId)
    if (!event) {
      console.error('🗑️ [DeleteEvent] Событие не найдено в списке')
      alert('Событие не найдено')
      return
    }

    console.log('🗑️ [DeleteEvent] Найдено событие:', event.title)
    
    // Устанавливаем событие для удаления и открываем модальное окно
    setDeletingEvent(event)
    setShowDeleteModal(true)
    console.log('🗑️ [DeleteEvent] Модальное окно удаления открыто')
  }, [calendarEvents])

  const confirmDeleteEvent = useCallback(async () => {
    if (!deletingEvent) return

    try {
      setIsDeleting(true)
      console.log('🗑️ [DeleteEvent] Пользователь подтвердил удаление')
      console.log('🗑️ [DeleteEvent] Отправляем запрос на удаление...')
      
      const response = await fetch(`/api/admin/schedule/event/${deletingEvent.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })

      console.log('🗑️ [DeleteEvent] Ответ сервера:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('🗑️ [DeleteEvent] Ошибка сервера:', errorText)
        throw new Error(`Ошибка удаления события (${response.status}): ${errorText}`)
      }

      console.log('🗑️ [DeleteEvent] Событие успешно удалено на сервере')
      
      // Обновляем список событий
      setCalendarEvents(prev => {
        const newList = prev.filter(e => e.id !== deletingEvent.id)
        console.log('🗑️ [DeleteEvent] Обновлен список событий, осталось:', newList.length)
        return newList
      })
      
      // Обновляем статистику
      setStats(prev => {
        const newStats = {
          ...prev,
          totalEvents: prev.totalEvents - 1,
          upcomingEvents: prev.upcomingEvents - (new Date(deletingEvent.startDate) > new Date() ? 1 : 0),
          pastEvents: prev.pastEvents - (new Date(deletingEvent.startDate) <= new Date() ? 1 : 0)
        }
        console.log('🗑️ [DeleteEvent] Обновлена статистика:', newStats)
        return newStats
      })

      console.log('🗑️ [DeleteEvent] Показываем уведомление об успехе')
      alert(`✅ Успешно удалено!\n\nЗанятие "${deletingEvent.title}" было удалено из расписания.`)
      
      // Закрываем модальное окно
      setShowDeleteModal(false)
      setDeletingEvent(null)
      
    } catch (error) {
      console.error('❌ [DeleteEvent] Ошибка при удалении события:', error)
      alert(`Ошибка при удалении: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
    } finally {
      setIsDeleting(false)
    }
  }, [deletingEvent])

  const handleSaveEvent = useCallback(async (eventData: Partial<CalendarEvent> & { title: string; startDate: string; endDate: string; groupId: string }) => {
    try {
      console.log('Сохранение события:', eventData)
      
      const response = await fetch(`/api/admin/schedule/event/${eventData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: eventData.title,
          description: eventData.description,
          type: eventData.type,
          startDate: eventData.startDate,
          endDate: eventData.endDate,
          location: eventData.location,
          isAttendanceRequired: eventData.isAttendanceRequired,
          groupId: eventData.groupId
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Ошибка сохранения события')
      }

      console.log('Событие успешно сохранено')
      
      // Обновляем событие в локальном состоянии
      setCalendarEvents(prev => prev.map(e => 
        e.id === eventData.id 
          ? {
              ...e,
              title: eventData.title,
              type: eventData.type,
              startDate: eventData.startDate,
              endDate: eventData.endDate,
              location: eventData.location,
              isAttendanceRequired: eventData.isAttendanceRequired,
              groupId: eventData.groupId,
              groupName: eventData.groupName,
              teacherId: eventData.teacherId,
              teacherName: eventData.teacherName
            }
          : e
      ))

      alert('Событие успешно сохранено')
      
    } catch (error) {
      console.error('Ошибка при сохранении события:', error)
      alert(`Ошибка при сохранении: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
      throw error
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
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-b-2xl">
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
            onBulkAction={async (action, eventIds) => {
              try {
                console.log('Массовое действие:', action, eventIds)
                
                if (action === 'delete') {
                  // Обновляем локальное состояние
                  setCalendarEvents(prev => prev.filter(e => !eventIds.includes(e.id)))
                  
                  // Обновляем статистику
                  const deletedEvents = calendarEvents.filter(e => eventIds.includes(e.id))
                  setStats(prev => ({
                    ...prev,
                    totalEvents: prev.totalEvents - deletedEvents.length,
                    upcomingEvents: prev.upcomingEvents - deletedEvents.filter(e => new Date(e.startDate) > new Date()).length,
                    pastEvents: prev.pastEvents - deletedEvents.filter(e => new Date(e.startDate) <= new Date()).length
                  }))
                } else if (action === 'activate' || action === 'deactivate') {
                  // Обновляем статус событий в локальном состоянии
                  setCalendarEvents(prev => prev.map(e => 
                    eventIds.includes(e.id) 
                      ? { ...e, isActive: action === 'activate' }
                      : e
                  ))
                }
                
                // Очищаем кэш для принудительной перезагрузки
                setCache(new Map())
                
              } catch (error) {
                console.error('Ошибка при массовом действии:', error)
                alert('Ошибка при выполнении массового действия')
              }
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
            timeFilter={timeFilter}
            onTimeFilterChange={(filter) => {
              console.log(`🔄 [Schedule] onTimeFilterChange вызван с фильтром: ${filter}`)
              setTimeFilter(filter)
            }}
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

      {/* Модальное окно редактирования события */}
      <EditEventModal
        event={editingEvent}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingEvent(null)
        }}
        onSave={handleSaveEvent}
        groups={groups}
        teachers={teachers}
      />

      {/* Модальное окно деталей события */}
      <EventDetailsModal
        event={viewingEvent}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false)
          setViewingEvent(null)
        }}
      />

      {/* Модальное окно подтверждения удаления */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setDeletingEvent(null)
        }}
        onConfirm={confirmDeleteEvent}
        eventTitle={deletingEvent?.title || ''}
        loading={isDeleting}
      />
    </div>
  )
}
