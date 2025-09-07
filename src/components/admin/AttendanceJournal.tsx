'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  RefreshCw,
  Download,
  Search,
  BarChart3,
  FileText,
  UserCheck,
  UserX,
  CalendarDays,
  MapPin,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Settings
} from 'lucide-react'

interface Group {
  id: string
  name: string
  description?: string
  type: string
}

interface Student {
  id: string
  name: string
  email: string
  status: string
  joinedAt: string
}

interface Event {
  id: string
  title: string
  description?: string
  startDate: string
  endDate: string
  location?: string
  attendanceDeadline?: string
  attendees: Attendee[]
}

interface Attendee {
  userId: string
  status: 'PENDING' | 'ATTENDING' | 'NOT_ATTENDING' | 'MAYBE' | 'ATTENDED' | 'ABSENT'
  response?: string
  updatedAt: string
}

interface AttendanceData {
  group: Group
  students: Student[]
  events: Event[]
}

interface AttendanceJournalProps {
  groupId: string
}

export default function AttendanceJournal({ groupId }: AttendanceJournalProps) {
  const [data, setData] = useState<AttendanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showOnlyRecent, setShowOnlyRecent] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set())
  const [bulkSelection, setBulkSelection] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [dateRange, setDateRange] = useState('week') // week, month, all
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'calendar'>('table')
  const [currentDate, setCurrentDate] = useState(new Date())

  // Загружаем данные при изменении группы, режима или даты
  useEffect(() => {
    fetchAttendanceData()
  }, [groupId, viewMode, currentDate])

  const fetchAttendanceData = async () => {
    try {
      console.log(`🔄 Загрузка данных для режима: ${viewMode}`, {
        groupId,
        currentDate: currentDate.toISOString(),
        hasExistingData: !!data
      })
      setLoading(true)
      
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1
      let url = `/api/admin/groups/${groupId}/attendance?view=calendar&year=${year}&month=${month}`
      
      console.log(`📅 Запрос данных за ${year}-${month.toString().padStart(2, '0')} для режима: ${viewMode}`)
      
      const response = await fetch(url)
      if (response.ok) {
        const attendanceData = await response.json()
        setData(attendanceData)
        console.log(`✅ Данные для режима ${viewMode} загружены`, {
          eventsCount: attendanceData.events?.length || 0,
          studentsCount: attendanceData.students?.length || 0
        })
      } else {
        console.error('Ошибка загрузки данных посещаемости')
      }
    } catch (error) {
      console.error('Ошибка загрузки данных посещаемости:', error)
    } finally {
      setLoading(false)
    }
  }

  // Функции для календарного режима
  const formatCalendarDate = (date: Date) => {
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long'
    })
  }

  const formatDay = (day: number) => {
    return day.toString().padStart(2, '0')
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

  const generateDaysWithLessons = () => {
    if (!data || !data.daysWithLessons) return []
    return data.daysWithLessons.map((dateString: string) => {
      const date = new Date(dateString)
      return {
        dateString,
        day: date.getDate(),
        month: date.getMonth() + 1,
        year: date.getFullYear()
      }
    })
  }

  const getMonthlyAttendanceStatus = (userId: string, date: string) => {
    if (!data || !data.attendanceRecords) return 'PENDING'
    const record = data.attendanceRecords.find(
      (record) => record.userId === userId && record.date === date
    )
    return record?.status || 'PENDING'
  }

  const updateMonthlyAttendance = async (userId: string, date: string, status: 'ATTENDED' | 'ABSENT') => {
    try {
      setSaving(true)
      const response = await fetch(`/api/admin/groups/${groupId}/attendance`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          date,
          status
        })
      })

      if (response.ok) {
        // Обновляем локальное состояние
        if (data) {
          const updatedData = { ...data }
          const existingRecord = updatedData.attendanceRecords?.find(
            (record) => record.userId === userId && record.date === date
          )
          
          if (existingRecord) {
            existingRecord.status = status
          } else if (updatedData.attendanceRecords) {
            updatedData.attendanceRecords.push({
              id: `temp-${Date.now()}`,
              userId,
              eventId: `daily-${date}`,
              status,
              date,
              eventTitle: 'Ежедневная отметка'
            })
          }
          
          setData(updatedData)
        }
      } else {
        alert('Ошибка при обновлении посещаемости')
      }
    } catch (error) {
      console.error('Ошибка обновления посещаемости:', error)
      alert('Ошибка при обновлении посещаемости')
    } finally {
      setSaving(false)
    }
  }

  const updateAttendance = async (eventId: string, userId: string, status: string, responseText?: string) => {
    try {
      setSaving(true)
      const apiResponse = await fetch(`/api/admin/groups/${groupId}/attendance`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          eventId,
          userId,
          status,
          response: responseText
        })
      })

      if (apiResponse.ok) {
        if (data) {
          const updatedData = { ...data }
          const event = updatedData.events.find(e => e.id === eventId)
          if (event) {
            const attendee = event.attendees.find(a => a.userId === userId)
            if (attendee) {
              attendee.status = status as 'ATTENDED' | 'ABSENT' | 'PENDING' | 'ATTENDING' | 'NOT_ATTENDING' | 'MAYBE'
              attendee.response = responseText
              attendee.updatedAt = new Date().toISOString()
            } else {
              event.attendees.push({
                userId,
                status: status as 'ATTENDED' | 'ABSENT' | 'PENDING' | 'ATTENDING' | 'NOT_ATTENDING' | 'MAYBE',
                response: responseText,
                updatedAt: new Date().toISOString()
              })
            }
          }
          setData(updatedData)
        }
      } else {
        alert('Ошибка при обновлении посещаемости')
      }
    } catch (error) {
      console.error('Ошибка обновления посещаемости:', error)
      alert('Ошибка при обновлении посещаемости')
    } finally {
      setSaving(false)
    }
  }

  const bulkUpdateAttendance = async (status: 'ATTENDED' | 'ABSENT') => {
    if (!selectedEvent || bulkSelection.size === 0) return
    
    try {
      setSaving(true)
      const promises = Array.from(bulkSelection).map(userId =>
        updateAttendance(selectedEvent, userId, status)
      )
      await Promise.all(promises)
      setBulkSelection(new Set())
      setShowBulkActions(false)
    } catch (error) {
      console.error('Ошибка массового обновления:', error)
    } finally {
      setSaving(false)
    }
  }

  const exportAttendanceData = async (format: 'csv' | 'pdf') => {
    if (!data) return
    
    try {
      const response = await fetch(`/api/admin/groups/${groupId}/attendance/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          dateRange,
          events: filteredEvents.map(e => e.id)
        })
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `attendance_${data.group.name}_${new Date().toISOString().split('T')[0]}.${format}`
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Ошибка экспорта:', error)
      alert('Ошибка при экспорте данных')
    }
  }

  const getAttendanceStatus = (eventId: string, userId: string) => {
    if (!data) return 'PENDING'
    const event = data.events.find(e => e.id === eventId)
    if (!event) return 'PENDING'
    const attendee = event.attendees.find(a => a.userId === userId)
    return attendee?.status || 'PENDING'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ATTENDED':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'ABSENT':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'ATTENDING':
        return <Clock className="w-4 h-4 text-blue-600" />
      case 'NOT_ATTENDING':
        return <XCircle className="w-4 h-4 text-gray-600" />
      case 'MAYBE':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ATTENDED':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'ABSENT':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'ATTENDING':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'NOT_ATTENDING':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'MAYBE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ATTENDED':
        return 'Присутствовал'
      case 'ABSENT':
        return 'Отсутствовал'
      case 'ATTENDING':
        return 'Планирует присутствовать'
      case 'NOT_ATTENDING':
        return 'Не планирует присутствовать'
      case 'MAYBE':
        return 'Возможно'
      default:
        return 'Не отмечено'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const calculateAttendanceStats = (studentId: string) => {
    if (!data) return { total: 0, attended: 0, absent: 0, rate: 0 }
    
    const total = data.events.length
    let attended = 0
    let absent = 0

    data.events.forEach(event => {
      const status = getAttendanceStatus(event.id, studentId)
      if (status === 'ATTENDED') attended++
      else if (status === 'ABSENT') absent++
    })

    const rate = total > 0 ? Math.round((attended / total) * 100) : 0

    return { total, attended, absent, rate }
  }

  const toggleEventExpansion = (eventId: string) => {
    const newExpanded = new Set(expandedEvents)
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId)
    } else {
      newExpanded.add(eventId)
    }
    setExpandedEvents(newExpanded)
  }

  const toggleBulkSelection = (userId: string) => {
    const newSelection = new Set(bulkSelection)
    if (newSelection.has(userId)) {
      newSelection.delete(userId)
    } else {
      newSelection.add(userId)
    }
    setBulkSelection(newSelection)
    setShowBulkActions(newSelection.size > 0)
  }

  const selectAllStudents = () => {
    if (!data) return
    const allUserIds = data.students.map(s => s.id)
    setBulkSelection(new Set(allUserIds))
    setShowBulkActions(true)
  }

  const clearBulkSelection = () => {
    setBulkSelection(new Set())
    setShowBulkActions(false)
  }

  // Фильтрация событий
  const filteredEvents = data?.events.filter(event => {
    if (showOnlyRecent) {
      const eventDate = new Date(event.startDate)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return eventDate >= weekAgo
    }
    return true
  }) || []

  const totalSessions = data?.events.length || 0
  const totalStudents = data?.students.length || 0
  const attendedCount = data?.events.reduce((acc, e) => acc + e.attendees.filter(a => a.status === 'ATTENDED').length, 0) || 0
  const absentCount = data?.events.reduce((acc, e) => acc + e.attendees.filter(a => a.status === 'ABSENT').length, 0) || 0

  // Фильтрация студентов
  const filteredStudents = data?.students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (statusFilter === 'all') return matchesSearch
    
    const stats = calculateAttendanceStats(student.id)
    switch (statusFilter) {
      case 'good':
        return matchesSearch && stats.rate >= 80
      case 'average':
        return matchesSearch && stats.rate >= 50 && stats.rate < 80
      case 'poor':
        return matchesSearch && stats.rate < 50
      default:
        return matchesSearch
    }
  }) || []

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка журнала посещаемости...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
          <AlertCircle className="w-10 h-10 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Ошибка загрузки данных</p>
        </div>
      </div>
    )
  }


  return (
    <div className="bg-white min-h-[calc(100vh-100px)]">
      {/* Хедер */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Users className="w-8 h-8" />
              Журнал посещаемости
            </h2>
            <p className="text-emerald-100 mt-1 flex items-center gap-2">
              <span>{data.group.name}</span>
              <span className="text-emerald-200">•</span>
              <span>{totalStudents} студентов</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => exportAttendanceData('csv')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              Экспорт CSV
            </button>
            <button
              onClick={() => exportAttendanceData('pdf')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg flex items-center gap-2 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Экспорт PDF
            </button>
          </div>
        </div>
      </div>

      {/* Summary + Фильтры */}
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Событий</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalSessions}</p>
              </div>
              <Calendar className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Студентов</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalStudents}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Присутствий</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{attendedCount}</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Отсутствий</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{absentCount}</p>
              </div>
              <UserX className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Фильтры */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Поиск студентов..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="all">Все студенты</option>
              <option value="good">Хорошая посещаемость (≥80%)</option>
              <option value="average">Средняя посещаемость (50-79%)</option>
              <option value="poor">Низкая посещаемость (&lt;50%)</option>
            </select>

            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="week">Последняя неделя</option>
              <option value="month">Последний месяц</option>
              <option value="all">Все время</option>
            </select>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  viewMode === 'table' 
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Таблица
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  viewMode === 'cards' 
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                <Users className="w-4 h-4" />
                Карточки
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  viewMode === 'calendar' 
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                <Calendar className="w-4 h-4" />
                Календарь
              </button>
            </div>

            {/* Навигация по месяцам */}
            <div className="flex items-center gap-2">
              <button
                onClick={goToPreviousMonth}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Предыдущий месяц"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <span className="px-3 py-2 text-sm font-medium text-gray-700 min-w-[120px] text-center">
                {formatCalendarDate(currentDate)}
              </span>
              <button
                onClick={goToNextMonth}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Следующий месяц"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={goToCurrentMonth}
                className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
                title="Текущий месяц"
              >
                Сегодня
              </button>
            </div>

            <button
              onClick={fetchAttendanceData}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Обновить
            </button>
          </div>
        </div>
      </div>

      {/* Массовые действия */}
      {showBulkActions && (
        <div className="bg-blue-50 border-b border-blue-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-blue-700">
                Выбрано: {bulkSelection.size} студентов
              </span>
              <button
                onClick={selectAllStudents}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Выбрать всех
              </button>
              <button
                onClick={clearBulkSelection}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Снять выбор
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => bulkUpdateAttendance('ATTENDED')}
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                <UserCheck className="w-4 h-4" />
                Отметить присутствующими
              </button>
              <button
                onClick={() => bulkUpdateAttendance('ABSENT')}
                disabled={saving}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                <UserX className="w-4 h-4" />
                Отметить отсутствующими
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Содержимое */}
      <div className="p-6">
        {viewMode === 'calendar' ? (
          <div>
            {data ? (
              <div>
                {/* Навигация по месяцам */}
                <div className="bg-white border-b border-gray-200 p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={goToPreviousMonth}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                      </button>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {formatCalendarDate(currentDate)}
                      </h3>
                      <button
                        onClick={goToNextMonth}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <ChevronRight className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                    <button
                      onClick={goToCurrentMonth}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      Текущий месяц
                    </button>
                  </div>
                </div>

                              {/* Календарная таблица */}
                              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                {generateDaysWithLessons().length === 0 ? (
                                  <div className="text-center py-12">
                                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">В этом месяце нет занятий с обязательной посещаемостью</p>
                                  </div>
                                ) : (
                                  <div className="overflow-x-auto">
                                    <table className="w-full">
                                      <thead className="bg-gray-50">
                                        <tr>
                                          <th className="text-left py-4 px-4 font-medium text-gray-700 min-w-[200px]">
                                            Студент
                                          </th>
                                          {generateDaysWithLessons().map((dayInfo, index) => (
                                            <th key={dayInfo.dateString} className={`text-center py-4 px-2 font-medium min-w-[80px] ${
                                              index % 2 === 0 
                                                ? 'bg-white text-gray-800 border-l-2 border-gray-200' 
                                                : 'bg-gray-100 text-gray-800 border-l-2 border-gray-300'
                                            }`}>
                                              {formatDay(dayInfo.day)}
                                            </th>
                                          ))}
                                        </tr>
                                      </thead>
                      <tbody>
                        {data.students.map((student) => (
                          <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-4 px-4">
                              <div>
                                <p className="font-medium text-gray-900">{student.name}</p>
                                <p className="text-sm text-gray-500">{student.email}</p>
                              </div>
                            </td>
                            {generateDaysWithLessons().map((dayInfo, index) => {
                              const status = getMonthlyAttendanceStatus(student.id, dayInfo.dateString)
                              
                              return (
                                <td key={dayInfo.dateString} className={`py-4 px-2 text-center ${
                                  index % 2 === 0 
                                    ? 'bg-white border-l-2 border-gray-200' 
                                    : 'bg-gray-50 border-l-2 border-gray-300'
                                }`}>
                                  <div className="flex flex-col items-center gap-2">
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => updateMonthlyAttendance(student.id, dayInfo.dateString, 'ATTENDED')}
                                        disabled={saving}
                                        className={`flex items-center justify-center w-12 h-12 rounded-lg text-sm font-medium transition-all duration-200 ${
                                          status === 'ATTENDED'
                                            ? 'bg-green-500 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-700 hover:shadow-sm'
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                        title="Присутствовал"
                                      >
                                        <UserCheck className="w-5 h-5" />
                                      </button>
                                      <button
                                        onClick={() => updateMonthlyAttendance(student.id, dayInfo.dateString, 'ABSENT')}
                                        disabled={saving}
                                        className={`flex items-center justify-center w-12 h-12 rounded-lg text-sm font-medium transition-all duration-200 ${
                                          status === 'ABSENT'
                                            ? 'bg-red-500 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-700 hover:shadow-sm'
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                        title="Отсутствовал"
                                      >
                                        <UserX className="w-5 h-5" />
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Нет данных для отображения календаря</p>
              </div>
            )}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Нет событий с обязательной посещаемостью</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredEvents.map(event => {
              const isExpanded = expandedEvents.has(event.id)
              const eventAttended = filteredStudents.filter(s => 
                getAttendanceStatus(event.id, s.id) === 'ATTENDED'
              ).length
              const eventAbsent = filteredStudents.filter(s => 
                getAttendanceStatus(event.id, s.id) === 'ABSENT'
              ).length
              const eventPending = filteredStudents.filter(s => 
                getAttendanceStatus(event.id, s.id) === 'PENDING'
              ).length
              
              return (
                <div key={event.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  {/* Заголовок события */}
                  <div 
                    className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleEventExpansion(event.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              {eventAttended} присутствовали
                            </span>
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                              {eventAbsent} отсутствовали
                            </span>
                            {eventPending > 0 && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                {eventPending} не отмечены
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <CalendarDays className="w-4 h-4" />
                            {formatDate(event.startDate)} - {formatDate(event.endDate)}
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {event.location}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedEvent(event.id)
                            setBulkSelection(new Set())
                            setShowBulkActions(false)
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Детали события */}
                  {isExpanded && (
                    <div className="border-t border-gray-100">
                      {viewMode === 'table' ? (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="text-left py-3 px-4 font-medium text-gray-700">
                                  <input
                                    type="checkbox"
                                    checked={bulkSelection.size === filteredStudents.length && bulkSelection.size > 0}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        selectAllStudents()
                                      } else {
                                        clearBulkSelection()
                                      }
                                    }}
                                    className="rounded border-gray-300"
                                  />
                                </th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700">Студент</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700">Статус</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700">Посещаемость</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700">Действия</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredStudents.map(student => {
                                const currentStatus = getAttendanceStatus(event.id, student.id)
                                const stats = calculateAttendanceStats(student.id)
                                const isSelected = bulkSelection.has(student.id)
                                
                                return (
                                  <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-3 px-4">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => toggleBulkSelection(student.id)}
                                        className="rounded border-gray-300"
                                      />
                                    </td>
                                    <td className="py-3 px-4">
                                      <div>
                                        <p className="font-medium text-gray-900">{student.name}</p>
                                        <p className="text-sm text-gray-500">{student.email}</p>
                                      </div>
                                    </td>
                                    <td className="py-3 px-4">
                                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(currentStatus)}`}>
                                        {getStatusIcon(currentStatus)}
                                        {getStatusLabel(currentStatus)}
                                      </div>
                                    </td>
                                    <td className="py-3 px-4">
                                      <div className="flex items-center gap-2">
                                        <div className="w-16 bg-gray-200 rounded-full h-2">
                                          <div 
                                            className="bg-emerald-500 h-2 rounded-full transition-all"
                                            style={{ width: `${stats.rate}%` }}
                                          ></div>
                                        </div>
                                        <span className="text-sm text-gray-600">{stats.rate}%</span>
                                      </div>
                                    </td>
                                    <td className="py-3 px-4">
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => updateAttendance(event.id, student.id, 'ATTENDED')}
                                          disabled={saving}
                                          className={`flex items-center justify-center w-12 h-12 text-sm font-medium rounded-lg transition-all duration-200 ${
                                            currentStatus === 'ATTENDED'
                                              ? 'bg-green-500 text-white shadow-md'
                                              : 'bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-700 hover:shadow-sm'
                                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                                          title="Присутствовал"
                                        >
                                          <Check className="w-5 h-5" />
                                        </button>
                                        <button
                                          onClick={() => updateAttendance(event.id, student.id, 'ABSENT')}
                                          disabled={saving}
                                          className={`flex items-center justify-center w-12 h-12 text-sm font-medium rounded-lg transition-all duration-200 ${
                                            currentStatus === 'ABSENT'
                                              ? 'bg-red-500 text-white shadow-md'
                                              : 'bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-700 hover:shadow-sm'
                                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                                          title="Отсутствовал"
                                        >
                                          <X className="w-5 h-5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredStudents.map(student => {
                              const currentStatus = getAttendanceStatus(event.id, student.id)
                              const stats = calculateAttendanceStats(student.id)
                              const isSelected = bulkSelection.has(student.id)
                              
                              return (
                                <div 
                                  key={student.id} 
                                  className={`border rounded-lg p-4 transition-all ${
                                    isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                      <h4 className="font-medium text-gray-900">{student.name}</h4>
                                      <p className="text-sm text-gray-500">{student.email}</p>
                                    </div>
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => toggleBulkSelection(student.id)}
                                      className="rounded border-gray-300"
                                    />
                                  </div>
                                  
                                  <div className="space-y-3">
                                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(currentStatus)}`}>
                                      {getStatusIcon(currentStatus)}
                                      {getStatusLabel(currentStatus)}
                                    </div>
                                    
                                    <div>
                                      <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                                        <span>Посещаемость</span>
                                        <span>{stats.rate}%</span>
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                          className="bg-emerald-500 h-2 rounded-full transition-all"
                                          style={{ width: `${stats.rate}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => updateAttendance(event.id, student.id, 'ATTENDED')}
                                        disabled={saving}
                                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                                          currentStatus === 'ATTENDED'
                                            ? 'bg-green-500 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-700 hover:shadow-sm'
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                        title="Присутствовал"
                                      >
                                        <Check className="w-5 h-5" />
                                        Присутствовал
                                      </button>
                                      <button
                                        onClick={() => updateAttendance(event.id, student.id, 'ABSENT')}
                                        disabled={saving}
                                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                                          currentStatus === 'ABSENT'
                                            ? 'bg-red-500 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-700 hover:shadow-sm'
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                        title="Отсутствовал"
                                      >
                                        <X className="w-5 h-5" />
                                        Отсутствовал
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

