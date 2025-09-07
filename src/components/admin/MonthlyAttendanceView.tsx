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
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  CalendarDays
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

interface AttendanceRecord {
  id: string
  userId: string
  eventId: string
  status: 'ATTENDED' | 'ABSENT' | 'PENDING' | 'ATTENDING' | 'NOT_ATTENDING' | 'MAYBE'
  date: string
  eventTitle: string
}

interface MonthlyAttendanceData {
  group: Group
  students: Student[]
  attendanceRecords: AttendanceRecord[]
  currentMonth: string
  daysWithLessons: string[]
  monthStartDate: string
  monthEndDate: string
}

interface MonthlyAttendanceViewProps {
  groupId: string
}

export default function MonthlyAttendanceView({ groupId }: MonthlyAttendanceViewProps) {
  const [data, setData] = useState<MonthlyAttendanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchMonthlyAttendanceData()
  }, [groupId, currentDate])

  const fetchMonthlyAttendanceData = async () => {
    try {
      setLoading(true)
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1
      
      console.log('Fetching monthly attendance for group:', groupId, 'year:', year, 'month:', month)
      const response = await fetch(`/api/admin/groups/${groupId}/attendance/monthly?year=${year}&month=${month}`)
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const attendanceData = await response.json()
        console.log('Attendance data received:', attendanceData)
        setData(attendanceData)
      } else {
        const errorText = await response.text()
        console.error('Ошибка загрузки данных посещаемости за месяц:', response.status, errorText)
      }
    } catch (error) {
      console.error('Ошибка загрузки данных посещаемости за месяц:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateAttendance = async (userId: string, date: string, status: 'ATTENDED' | 'ABSENT') => {
    try {
      setSaving(true)
      const response = await fetch(`/api/admin/groups/${groupId}/attendance/monthly`, {
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
          const existingRecord = updatedData.attendanceRecords.find(
            record => record.userId === userId && record.date === date
          )
          
          if (existingRecord) {
            existingRecord.status = status
          } else {
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

  const getAttendanceStatus = (userId: string, date: string) => {
    if (!data) return 'PENDING'
    const record = data.attendanceRecords.find(
      record => record.userId === userId && record.date === date
    )
    return record?.status || 'PENDING'
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
        return <AlertCircle className="w-4 h-4 text-gray-400" />
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

  const formatDate = (date: Date) => {
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
    if (!data) return []
    return data.daysWithLessons.map(dateString => {
      const date = new Date(dateString)
      return {
        dateString,
        day: date.getDate(),
        month: date.getMonth() + 1,
        year: date.getFullYear()
      }
    })
  }

  const filteredStudents = data?.students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  }) || []

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка данных посещаемости за месяц...</p>
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

  const daysWithLessons = generateDaysWithLessons()

  return (
    <div>

      {/* Навигация по месяцам */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={goToPreviousMonth}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h3 className="text-xl font-semibold text-gray-900">
              {formatDate(currentDate)}
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

      {/* Поиск */}
      <div className="bg-gray-50 p-4 border-b border-gray-200">
        <div className="max-w-md">
          <input
            type="text"
            placeholder="Поиск студентов..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Таблица посещаемости */}
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-4 px-4 font-medium text-gray-700 min-w-[200px]">
                    Студент
                  </th>
                  {daysWithLessons.map(dayInfo => (
                    <th key={dayInfo.dateString} className="text-center py-4 px-2 font-medium text-gray-700 min-w-[80px]">
                      {formatDay(dayInfo.day)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => (
                  <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-500">{student.email}</p>
                      </div>
                    </td>
                    {daysWithLessons.map(dayInfo => {
                      const status = getAttendanceStatus(student.id, dayInfo.dateString)
                      
                      return (
                        <td key={dayInfo.dateString} className="py-4 px-2 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
                              {getStatusIcon(status)}
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => updateAttendance(student.id, dayInfo.dateString, 'ATTENDED')}
                                disabled={saving}
                                className={`p-1 rounded transition-colors ${
                                  status === 'ATTENDED'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-700'
                                } disabled:opacity-50`}
                                title="Присутствовал"
                              >
                                <UserCheck className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => updateAttendance(student.id, dayInfo.dateString, 'ABSENT')}
                                disabled={saving}
                                className={`p-1 rounded transition-colors ${
                                  status === 'ABSENT'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-700'
                                } disabled:opacity-50`}
                                title="Отсутствовал"
                              >
                                <UserX className="w-3 h-3" />
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
        </div>
      </div>
    </div>
  )
}
