'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Save,
  RefreshCw,
  Download,
  Filter,
  Search,
  Eye,
  EyeOff
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
  onClose: () => void
}

export default function AttendanceJournal({ groupId, onClose }: AttendanceJournalProps) {
  const [data, setData] = useState<AttendanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showOnlyRecent, setShowOnlyRecent] = useState(true)

  useEffect(() => {
    fetchAttendanceData()
  }, [groupId])

  const fetchAttendanceData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/groups/${groupId}/attendance`)
      if (response.ok) {
        const attendanceData = await response.json()
        setData(attendanceData)
      } else {
        console.error('Ошибка загрузки данных посещаемости')
      }
    } catch (error) {
      console.error('Ошибка загрузки данных посещаемости:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateAttendance = async (eventId: string, userId: string, status: string, response?: string) => {
    try {
      setSaving(true)
      const response = await fetch(`/api/admin/groups/${groupId}/attendance`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          eventId,
          userId,
          status,
          response
        })
      })

      if (response.ok) {
        // Обновляем локальные данные
        if (data) {
          const updatedData = { ...data }
          const event = updatedData.events.find(e => e.id === eventId)
          if (event) {
            const attendee = event.attendees.find(a => a.userId === userId)
            if (attendee) {
              attendee.status = status as any
              attendee.response = response
              attendee.updatedAt = new Date().toISOString()
            } else {
              event.attendees.push({
                userId,
                status: status as any,
                response,
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
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'ABSENT':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'ATTENDING':
        return <Clock className="w-5 h-5 text-blue-600" />
      case 'NOT_ATTENDING':
        return <XCircle className="w-5 h-5 text-gray-600" />
      case 'MAYBE':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
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
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-4" />
            <p className="text-gray-600">Загрузка журнала посещаемости...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
            <p className="text-gray-600">Ошибка загрузки данных</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        {/* Хедер */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Журнал посещаемости</h2>
              <p className="text-emerald-100 mt-1">{data.group.name}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Фильтры и поиск */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex gap-4 items-center mb-4">
            <div className="flex-1 relative">
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

            <button
              onClick={() => setShowOnlyRecent(!showOnlyRecent)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                showOnlyRecent 
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                  : 'bg-gray-100 text-gray-700 border border-gray-200'
              }`}
            >
              {showOnlyRecent ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              Только последняя неделя
            </button>

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

        {/* Содержимое */}
        <div className="p-6 overflow-auto max-h-[60vh]">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Нет событий с обязательной посещаемостью</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredEvents.map(event => (
                <div key={event.id} className="bg-gray-50 rounded-xl p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatDate(event.startDate)} - {formatDate(event.endDate)}
                      </p>
                      {event.location && (
                        <p className="text-sm text-gray-500 mt-1">📍 {event.location}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        Студентов: {filteredStudents.length}
                      </p>
                      <p className="text-sm text-gray-500">
                        Отмечено: {filteredStudents.filter(s => 
                          getAttendanceStatus(event.id, s.id) !== 'PENDING'
                        ).length}
                      </p>
                    </div>
                  </div>

                  {/* Таблица посещаемости */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Студент</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Статус</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Действия</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map(student => {
                          const currentStatus = getAttendanceStatus(event.id, student.id)
                          const stats = calculateAttendanceStats(student.id)
                          
                          return (
                            <tr key={student.id} className="border-b border-gray-100 hover:bg-white/50">
                              <td className="py-3 px-4">
                                <div>
                                  <p className="font-medium text-gray-900">{student.name}</p>
                                  <p className="text-sm text-gray-500">{student.email}</p>
                                  <p className="text-xs text-gray-400">
                                    Посещаемость: {stats.rate}% ({stats.attended}/{stats.total})
                                  </p>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(currentStatus)}`}>
                                  {getStatusIcon(currentStatus)}
                                  {getStatusLabel(currentStatus)}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => updateAttendance(event.id, student.id, 'ATTENDED')}
                                    disabled={saving}
                                    className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                                      currentStatus === 'ATTENDED'
                                        ? 'bg-green-100 text-green-700 border border-green-200'
                                        : 'bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-700'
                                    }`}
                                  >
                                    Присутствовал
                                  </button>
                                  <button
                                    onClick={() => updateAttendance(event.id, student.id, 'ABSENT')}
                                    disabled={saving}
                                    className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                                      currentStatus === 'ABSENT'
                                        ? 'bg-red-100 text-red-700 border border-red-200'
                                        : 'bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-700'
                                    }`}
                                  >
                                    Отсутствовал
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
