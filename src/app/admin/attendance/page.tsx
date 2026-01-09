'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock,
  Search, 
  Filter,
  Download,
  ArrowLeft,
  Plus,
  Eye,
  BarChart3,
  CalendarDays,
  UserCheck,
  UserX,
  TrendingUp,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Settings,
  FileText,
  MapPin,
  AlertCircle,
  Check,
  X,
  Activity,
  PieChart,
  Target,
  Award,
  Clock3
} from 'lucide-react'

interface Group {
  id: string
  name: string
  description?: string
  type: 'ONLINE' | 'OFFLINE' | 'HYBRID'
  students: {
    id: string
    name: string
    email: string
    status: string
    joinedAt: string
  }[]
  _count: {
    students: number
  }
}

interface AttendanceEvent {
  id: string
  title: string
  description?: string
  startDate: string
  endDate: string
  location?: string
  type: 'LESSON' | 'EXAM' | 'DEADLINE' | 'MEETING' | 'WORKSHOP' | 'SEMINAR' | 'CONSULTATION' | 'ANNOUNCEMENT' | 'OTHER'
  isAttendanceRequired: boolean
  attendanceDeadline?: string
  attendees: {
    userId: string
    status: 'PENDING' | 'ATTENDING' | 'NOT_ATTENDING' | 'MAYBE' | 'ATTENDED' | 'ABSENT' | 'LATE'
    response?: string
    updatedAt: string
    user: {
      id: string
      name: string
      email: string
    }
  }[]
}

interface GroupAttendanceData {
  group: Group
  events: AttendanceEvent[]
  totalEvents: number
  totalStudents: number
  totalAttended: number
  totalAbsent: number
  totalLate: number
  attendanceRate: number
  lastEventDate?: string
}

interface AttendanceStats {
  totalGroups: number
  totalEvents: number
  totalStudents: number
  totalAttended: number
  totalAbsent: number
  totalLate: number
  overallAttendanceRate: number
  bestPerformingGroup: string
  worstPerformingGroup: string
}

interface CalendarEvent {
  id: string
  title: string
  date: Date
  groupName: string
  groupId: string
  startTime: Date
  endTime: Date
  location?: string | null
  attended: number
  total: number
  attendanceRate: number
  type: string
  color?: string
  description?: string | null
}

export default function AttendancePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [groups, setGroups] = useState<Group[]>([])
  const [groupAttendanceData, setGroupAttendanceData] = useState<GroupAttendanceData[]>([])
  const [stats, setStats] = useState<AttendanceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateRange, setDateRange] = useState('month')
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'calendar' | 'analytics'>('table')
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set())
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [showExportDropdown, setShowExportDropdown] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'attendance' | 'students' | 'events'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [showEventModal, setShowEventModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  useEffect(() => {
    fetchAllAttendanceData()
  }, [dateRange])

  useEffect(() => {
    setCalendarEvents(generateCalendarEvents())
  }, [groupAttendanceData, currentDate])

  const fetchAllAttendanceData = async () => {
    try {
      setLoading(true)
      console.log('🔄 Загрузка данных посещаемости для всех групп...')
      
      // Загружаем все группы
      const groupsResponse = await fetch('/api/admin/groups')
      if (!groupsResponse.ok) {
        throw new Error('Ошибка загрузки групп')
      }
      const groupsData = await groupsResponse.json()
      setGroups(groupsData)
      
      // Загружаем данные посещаемости для каждой группы
      const attendancePromises = groupsData.map(async (group: Group) => {
        try {
          const year = new Date().getFullYear()
          const month = new Date().getMonth() + 1
          const response = await fetch(`/api/admin/groups/${group.id}/attendance?view=calendar&year=${year}&month=${month}`)
          if (response.ok) {
            const data = await response.json()
            return {
              group: data.group,
              events: data.events || [],
              totalEvents: data.events?.length || 0,
              totalStudents: data.students?.length || 0,
              totalAttended: data.events?.reduce((sum: number, event: AttendanceEvent) => 
                sum + (event.attendees?.filter(a => a.status === 'ATTENDED').length || 0), 0) || 0,
              totalAbsent: data.events?.reduce((sum: number, event: AttendanceEvent) => 
                sum + (event.attendees?.filter(a => a.status === 'ABSENT').length || 0), 0) || 0,
              totalLate: data.events?.reduce((sum: number, event: AttendanceEvent) => 
                sum + (event.attendees?.filter(a => a.status === 'LATE').length || 0), 0) || 0,
              attendanceRate: 0, // Будет вычислено ниже
              lastEventDate: data.events?.[data.events.length - 1]?.startDate
            }
          }
          return null
        } catch (error) {
          console.error(`Ошибка загрузки данных для группы ${group.name}:`, error)
          return null
        }
      })
      
      const attendanceResults = await Promise.all(attendancePromises)
      const validResults = attendanceResults.filter(Boolean) as GroupAttendanceData[]
      
      // Вычисляем процент посещаемости для каждой группы
      const processedResults = validResults.map(result => ({
        ...result,
        attendanceRate: result.totalEvents > 0 && result.totalStudents > 0 
          ? Math.round((result.totalAttended / (result.totalEvents * result.totalStudents)) * 100)
          : 0
      }))
      
      setGroupAttendanceData(processedResults)
      
      // Вычисляем общую статистику
      const totalStats = processedResults.reduce((acc, group) => ({
        totalGroups: acc.totalGroups + 1,
        totalEvents: acc.totalEvents + group.totalEvents,
        totalStudents: acc.totalStudents + group.totalStudents,
        totalAttended: acc.totalAttended + group.totalAttended,
        totalAbsent: acc.totalAbsent + group.totalAbsent,
        totalLate: acc.totalLate + group.totalLate,
        overallAttendanceRate: 0, // Будет вычислено ниже
        bestPerformingGroup: '',
        worstPerformingGroup: ''
      }), {
        totalGroups: 0,
        totalEvents: 0,
        totalStudents: 0,
        totalAttended: 0,
        totalAbsent: 0,
        totalLate: 0,
        overallAttendanceRate: 0,
        bestPerformingGroup: '',
        worstPerformingGroup: ''
      })
      
      totalStats.overallAttendanceRate = totalStats.totalEvents > 0 && totalStats.totalStudents > 0
        ? Math.round((totalStats.totalAttended / (totalStats.totalEvents * totalStats.totalStudents)) * 100)
        : 0
      
      // Находим лучшую и худшую группы
      if (processedResults.length > 0) {
        const sortedByAttendance = [...processedResults].sort((a, b) => b.attendanceRate - a.attendanceRate)
        totalStats.bestPerformingGroup = sortedByAttendance[0].group.name
        totalStats.worstPerformingGroup = sortedByAttendance[sortedByAttendance.length - 1].group.name
      }
      
      setStats(totalStats)
      console.log('✅ Данные посещаемости загружены', {
        groupsCount: processedResults.length,
        totalEvents: totalStats.totalEvents,
        totalStudents: totalStats.totalStudents
      })
      
    } catch (error) {
      console.error('Ошибка загрузки данных посещаемости:', error)
    } finally {
      setLoading(false)
    }
  }

  // Вспомогательные функции
  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'LESSON': 'Занятие',
      'EXAM': 'Экзамен',
      'DEADLINE': 'Дедлайн',
      'MEETING': 'Встреча',
      'WORKSHOP': 'Мастер-класс',
      'SEMINAR': 'Семинар',
      'CONSULTATION': 'Консультация',
      'ANNOUNCEMENT': 'Объявление',
      'OTHER': 'Другое'
    }
    return labels[type] || 'Неизвестно'
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
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const getGroupTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'ONLINE': 'Онлайн',
      'OFFLINE': 'Офлайн',
      'HYBRID': 'Гибридная'
    }
    return labels[type] || 'Неизвестно'
  }

  const getGroupTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'ONLINE': 'bg-blue-100 text-blue-800',
      'OFFLINE': 'bg-green-100 text-green-800',
      'HYBRID': 'bg-purple-100 text-purple-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const formatDate = (dateInput: string | Date) => {
    const dateString = dateInput instanceof Date ? dateInput.toISOString() : dateInput
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getAttendanceStatusColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600 bg-green-100'
    if (rate >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const toggleGroupExpansion = (groupId: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId)
    } else {
      newExpanded.add(groupId)
    }
    setExpandedGroups(newExpanded)
  }

  const toggleGroupSelection = (groupId: string) => {
    const newSelection = new Set(selectedGroups)
    if (newSelection.has(groupId)) {
      newSelection.delete(groupId)
    } else {
      newSelection.add(groupId)
    }
    setSelectedGroups(newSelection)
  }

  const selectAllGroups = () => {
    const allGroupIds = groupAttendanceData.map(g => g.group.id)
    setSelectedGroups(new Set(allGroupIds))
  }

  const clearGroupSelection = () => {
    setSelectedGroups(new Set())
  }

  // Функции для календарного режима
  const generateCalendarEvents = (): CalendarEvent[] => {
    const events: CalendarEvent[] = []
    
    groupAttendanceData.forEach(groupData => {
      groupData.events.forEach(event => {
        const eventDate = new Date(event.startDate)
        const isCurrentMonth = eventDate.getMonth() === currentDate.getMonth() && 
                              eventDate.getFullYear() === currentDate.getFullYear()
        
        if (isCurrentMonth) {
          const attended = event.attendees?.filter(a => a.status === 'ATTENDED').length || 0
          const total = groupData.totalStudents
          const attendanceRate = total > 0 ? Math.round((attended / total) * 100) : 0
          
          events.push({
            id: event.id,
            title: event.title,
            groupName: groupData.group.name,
            groupId: groupData.group.id,
            date: eventDate,
            startTime: new Date(event.startDate),
            endTime: new Date(event.endDate),
            type: event.type,
            location: event.location,
            attended,
            total,
            attendanceRate,
            color: getEventTypeColor(event.type).split(' ')[0].replace('bg-', ''),
            description: event.description
          })
        }
      })
    })
    
    return events.sort((a, b) => a.date.getTime() - b.date.getTime())
  }

  const goToPreviousMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() - 1)
      return newDate
    })
  }

  const goToNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() + 1)
      return newDate
    })
  }

  const goToCurrentMonth = () => {
    setCurrentDate(new Date())
  }

  const formatCalendarDate = (date: Date) => {
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long'
    })
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days = []
    
    // Добавляем пустые ячейки для начала месяца
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Добавляем дни месяца
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  const getEventsForDate = (date: Date) => {
    return calendarEvents.filter(event => {
      const eventDate = new Date(event.date)
      return eventDate.toDateString() === date.toDateString()
    })
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isSelectedDate = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString()
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    const events = getEventsForDate(date)
    if (events.length > 0) {
      setSelectedEvent(events[0])
      setShowEventModal(true)
    }
  }

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setShowEventModal(true)
  }

  // Фильтрация и сортировка данных
  const filteredAndSortedData = groupAttendanceData
    .filter(groupData => {
      const matchesSearch = groupData.group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          groupData.group.description?.toLowerCase().includes(searchTerm.toLowerCase())
      
      if (statusFilter === 'all') return matchesSearch
      
      switch (statusFilter) {
        case 'excellent':
          return matchesSearch && groupData.attendanceRate >= 90
        case 'good':
          return matchesSearch && groupData.attendanceRate >= 70 && groupData.attendanceRate < 90
        case 'average':
          return matchesSearch && groupData.attendanceRate >= 50 && groupData.attendanceRate < 70
        case 'poor':
          return matchesSearch && groupData.attendanceRate < 50
        default:
          return matchesSearch
      }
    })
    .sort((a, b) => {
      let aValue: string | number, bValue: string | number
      
      switch (sortBy) {
        case 'name':
          aValue = a.group.name
          bValue = b.group.name
          break
        case 'attendance':
          aValue = a.attendanceRate
          bValue = b.attendanceRate
          break
        case 'students':
          aValue = a.totalStudents
          bValue = b.totalStudents
          break
        case 'events':
          aValue = a.totalEvents
          bValue = b.totalEvents
          break
        default:
          aValue = a.group.name
          bValue = b.group.name
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка данных посещаемости...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl mx-6 mt-6">
        <div className="w-full px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin/groups')}
                className="p-2 rounded-xl hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <Users className="w-8 h-8" />
                  Общая посещаемость
                </h1>
                <p className="text-emerald-100 mt-1">Управление посещаемостью всех групп</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Выпадающее меню экспорта */}
              <div className="relative">
                <button
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl flex items-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Экспорт
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {showExportDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                    <div className="py-1">
                      <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        CSV
                      </button>
                      <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        PDF
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={fetchAllAttendanceData}
                disabled={loading}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Обновить
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-6 py-6">
        {/* Общая статистика */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Групп</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalGroups}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Событий</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalEvents}</p>
                </div>
                <Calendar className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Студентов</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalStudents}</p>
                </div>
                <UserCheck className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Общая посещаемость</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.overallAttendanceRate}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
          </div>
        )}

        {/* Детальная статистика */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Присутствий</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{stats.totalAttended}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Отсутствий</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{stats.totalAbsent}</p>
                </div>
                <UserX className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Опозданий</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.totalLate}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </div>
        )}

        {/* Фильтры и управление */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Левая часть - фильтры */}
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Поиск */}
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Поиск групп..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50 transition-all duration-300"
                />
              </div>
              
              {/* Фильтр по посещаемости */}
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50 min-w-[200px] font-medium"
                >
                  <option value="all">Все группы</option>
                  <option value="excellent">Отличная посещаемость (≥90%)</option>
                  <option value="good">Хорошая посещаемость (70-89%)</option>
                  <option value="average">Средняя посещаемость (50-69%)</option>
                  <option value="poor">Низкая посещаемость (&lt;50%)</option>
                </select>
              </div>

              {/* Фильтр по времени */}
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-500" />
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="px-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50 min-w-[160px] font-medium"
                >
                  <option value="today">Сегодня</option>
                  <option value="week">Неделя</option>
                  <option value="month">Месяц</option>
                  <option value="all">Все время</option>
                </select>
              </div>
            </div>

            {/* Правая часть - переключатели режимов */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-3 rounded-lg flex items-center gap-2 transition-all duration-200 text-sm font-medium ${
                  viewMode === 'table' 
                    ? 'bg-white text-emerald-700 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                <span className="hidden lg:inline">Таблица</span>
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-4 py-3 rounded-lg flex items-center gap-2 transition-all duration-200 text-sm font-medium ${
                  viewMode === 'cards' 
                    ? 'bg-white text-emerald-700 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Users className="w-5 h-5" />
                <span className="hidden lg:inline">Карточки</span>
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-3 rounded-lg flex items-center gap-2 transition-all duration-200 text-sm font-medium ${
                  viewMode === 'calendar' 
                    ? 'bg-white text-emerald-700 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Calendar className="w-5 h-5" />
                <span className="hidden lg:inline">Календарь</span>
              </button>
              <button
                onClick={() => setViewMode('analytics')}
                className={`px-4 py-3 rounded-lg flex items-center gap-2 transition-all duration-200 text-sm font-medium ${
                  viewMode === 'analytics' 
                    ? 'bg-white text-emerald-700 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <PieChart className="w-5 h-5" />
                <span className="hidden lg:inline">Аналитика</span>
              </button>
            </div>
          </div>
        </div>

        {/* Основное содержимое */}
        {viewMode === 'table' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Группы и посещаемость</h3>
                <div className="flex items-center gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'name' | 'attendance' | 'students' | 'events')}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="name">По названию</option>
                    <option value="attendance">По посещаемости</option>
                    <option value="students">По количеству студентов</option>
                    <option value="events">По количеству событий</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            
            {filteredAndSortedData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Группа
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Тип
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Студенты
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        События
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Посещаемость
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Статистика
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAndSortedData.map((groupData) => (
                      <tr key={groupData.group.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{groupData.group.name}</div>
                            {groupData.group.description && (
                              <div className="text-sm text-gray-500">{groupData.group.description}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGroupTypeColor(groupData.group.type)}`}>
                            {getGroupTypeLabel(groupData.group.type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{groupData.totalStudents}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{groupData.totalEvents}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-emerald-500 h-2 rounded-full transition-all"
                                style={{ width: `${groupData.attendanceRate}%` }}
                              ></div>
                            </div>
                            <span className={`text-sm font-medium ${getAttendanceStatusColor(groupData.attendanceRate)}`}>
                              {groupData.attendanceRate}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-4 text-xs">
                            <span className="inline-flex items-center text-green-600">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              {groupData.totalAttended}
                            </span>
                            <span className="inline-flex items-center text-red-600">
                              <XCircle className="w-3 h-3 mr-1" />
                              {groupData.totalAbsent}
                            </span>
                            <span className="inline-flex items-center text-yellow-600">
                              <Clock className="w-3 h-3 mr-1" />
                              {groupData.totalLate}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => router.push(`/admin/groups/${groupData.group.id}/attendance`)}
                            className="text-emerald-600 hover:text-emerald-900 flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            Детали
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Нет групп для отображения</p>
                <p className="text-sm text-gray-400 mt-1">
                  Создайте группы в системе управления
                </p>
              </div>
            )}
          </div>
        )}

        {viewMode === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedData.map((groupData) => (
              <div key={groupData.group.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{groupData.group.name}</h3>
                    {groupData.group.description && (
                      <p className="text-sm text-gray-500 mb-2">{groupData.group.description}</p>
                    )}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGroupTypeColor(groupData.group.type)}`}>
                      {getGroupTypeLabel(groupData.group.type)}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleGroupExpansion(groupData.group.id)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    {expandedGroups.has(groupData.group.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Статистика */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{groupData.totalStudents}</div>
                      <div className="text-xs text-gray-500">Студентов</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{groupData.totalEvents}</div>
                      <div className="text-xs text-gray-500">Событий</div>
                    </div>
                  </div>

                  {/* Посещаемость */}
                  <div>
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span>Посещаемость</span>
                      <span className={`font-medium ${getAttendanceStatusColor(groupData.attendanceRate)}`}>
                        {groupData.attendanceRate}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-emerald-500 h-2 rounded-full transition-all"
                        style={{ width: `${groupData.attendanceRate}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Детальная статистика */}
                  <div className="flex justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      {groupData.totalAttended}
                    </span>
                    <span className="flex items-center gap-1">
                      <XCircle className="w-3 h-3 text-red-600" />
                      {groupData.totalAbsent}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-yellow-600" />
                      {groupData.totalLate}
                    </span>
                  </div>

                  {/* Кнопка действий */}
                  <button
                    onClick={() => router.push(`/admin/groups/${groupData.group.id}/attendance`)}
                    className="w-full mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Подробнее
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === 'analytics' && stats && (
          <div className="space-y-6">
            {/* Аналитические карточки */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Лучшая группа</p>
                    <p className="text-xl font-bold mt-1">{stats.bestPerformingGroup}</p>
                  </div>
                  <Award className="w-8 h-8 text-blue-200" />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm">Требует внимания</p>
                    <p className="text-xl font-bold mt-1">{stats.worstPerformingGroup}</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-red-200" />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Общая эффективность</p>
                    <p className="text-xl font-bold mt-1">{stats.overallAttendanceRate}%</p>
                  </div>
                  <Target className="w-8 h-8 text-green-200" />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Активность</p>
                    <p className="text-xl font-bold mt-1">{stats.totalEvents}</p>
                  </div>
                  <Activity className="w-8 h-8 text-purple-200" />
                </div>
              </div>
            </div>

            {/* Графики и диаграммы */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Распределение посещаемости</h3>
                <div className="space-y-3">
                  {filteredAndSortedData.map((groupData) => (
                    <div key={groupData.group.id} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{groupData.group.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-emerald-500 h-2 rounded-full"
                            style={{ width: `${groupData.attendanceRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-12 text-right">
                          {groupData.attendanceRate}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Статистика по типам групп</h3>
                <div className="space-y-4">
                  {['ONLINE', 'OFFLINE', 'HYBRID'].map(type => {
                    const groupsOfType = filteredAndSortedData.filter(g => g.group.type === type)
                    const avgAttendance = groupsOfType.length > 0 
                      ? Math.round(groupsOfType.reduce((sum, g) => sum + g.attendanceRate, 0) / groupsOfType.length)
                      : 0
                    
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{getGroupTypeLabel(type)}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">{groupsOfType.length} групп</span>
                          <span className="text-sm font-medium text-gray-900">{avgAttendance}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'calendar' && (
          <div className="space-y-6">
            {/* Навигация по месяцам */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={goToPreviousMonth}
                    className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {formatCalendarDate(currentDate)}
                  </h3>
                  <button
                    onClick={goToNextMonth}
                    className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
                <button
                  onClick={goToCurrentMonth}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
                >
                  Текущий месяц
                </button>
              </div>
            </div>

            {/* Календарная сетка */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="grid grid-cols-7 gap-px bg-gray-200">
                {/* Заголовки дней недели */}
                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => (
                  <div key={day} className="bg-gray-50 p-4 text-center text-sm font-medium text-gray-700">
                    {day}
                  </div>
                ))}
                
                {/* Дни месяца */}
                {getDaysInMonth(currentDate).map((day, index) => {
                  if (!day) {
                    return <div key={index} className="bg-white p-4 min-h-[120px]" />
                  }
                  
                  const events = getEventsForDate(day)
                  const isCurrentDay = isToday(day)
                  const isSelected = isSelectedDate(day)
                  
                  return (
                    <div
                      key={day.getTime()}
                      className={`bg-white p-2 min-h-[120px] border-r border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                        isCurrentDay ? 'bg-blue-50 border-blue-200' : ''
                      } ${isSelected ? 'bg-emerald-50 border-emerald-200' : ''}`}
                      onClick={() => handleDateClick(day)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${
                          isCurrentDay ? 'text-blue-600' : isSelected ? 'text-emerald-600' : 'text-gray-900'
                        }`}>
                          {day.getDate()}
                        </span>
                        {events.length > 0 && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {events.length}
                          </span>
                        )}
                      </div>
                      
                      {/* События дня */}
                      <div className="space-y-1">
                        {events.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEventClick(event)
                            }}
                            className={`text-xs p-1 rounded cursor-pointer hover:shadow-sm transition-all ${
                              event.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                              event.color === 'red' ? 'bg-red-100 text-red-800' :
                              event.color === 'green' ? 'bg-green-100 text-green-800' :
                              event.color === 'purple' ? 'bg-purple-100 text-purple-800' :
                              event.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}
                          >
                            <div className="font-medium truncate">{event.title}</div>
                            <div className="text-xs opacity-75">{event.groupName}</div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs">
                                {event.attended}/{event.total}
                              </span>
                              <span className={`text-xs font-medium ${
                                event.attendanceRate >= 80 ? 'text-green-600' :
                                event.attendanceRate >= 60 ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {event.attendanceRate}%
                              </span>
                            </div>
                          </div>
                        ))}
                        {events.length > 3 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{events.length - 3} еще
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Легенда */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h4 className="text-sm font-medium text-gray-900 mb-4">Типы событий</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { type: 'LESSON', label: 'Занятие', color: 'blue' },
                  { type: 'EXAM', label: 'Экзамен', color: 'red' },
                  { type: 'MEETING', label: 'Встреча', color: 'green' },
                  { type: 'WORKSHOP', label: 'Мастер-класс', color: 'purple' }
                ].map(({ type, label, color }) => (
                  <div key={type} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded ${
                      color === 'blue' ? 'bg-blue-100' :
                      color === 'red' ? 'bg-red-100' :
                      color === 'green' ? 'bg-green-100' :
                      'bg-purple-100'
                    }`}></div>
                    <span className="text-sm text-gray-600">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Модальное окно события */}
        {showEventModal && selectedEvent && (
          <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{selectedEvent.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{selectedEvent.groupName}</p>
                  </div>
                  <button
                    onClick={() => setShowEventModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Дата и время</label>
                      <p className="text-sm text-gray-900">
                        {formatDate(selectedEvent.startTime)} - {formatDate(selectedEvent.endTime)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Тип события</label>
                      <p className="text-sm text-gray-900">{getEventTypeLabel(selectedEvent.type)}</p>
                    </div>
                  </div>

                  {selectedEvent.location && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Место проведения</label>
                      <p className="text-sm text-gray-900 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {selectedEvent.location}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-700">Посещаемость</label>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                        <span>Присутствовало: {selectedEvent.attended} из {selectedEvent.total}</span>
                        <span className={`font-medium ${
                          selectedEvent.attendanceRate >= 80 ? 'text-green-600' :
                          selectedEvent.attendanceRate >= 60 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {selectedEvent.attendanceRate}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            selectedEvent.attendanceRate >= 80 ? 'bg-green-500' :
                            selectedEvent.attendanceRate >= 60 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${selectedEvent.attendanceRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {selectedEvent.description && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Описание</label>
                      <p className="text-sm text-gray-900 mt-1">{selectedEvent.description}</p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => router.push(`/admin/groups/${selectedEvent.groupId}/attendance`)}
                      className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Подробнее
                    </button>
                    <button
                      onClick={() => setShowEventModal(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Закрыть
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
