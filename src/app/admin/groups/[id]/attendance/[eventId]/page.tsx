'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock,
  Calendar,
  Save,
  User,
  Mail,
  Search
} from 'lucide-react'

interface Student {
  id: string
  name: string
  email: string
  status?: 'ATTENDED' | 'ABSENT' | 'LATE'
}

interface EventData {
  id: string
  title: string
  startDate: string
  endDate: string
  group: {
    id: string
    name: string
    students: Student[]
  }
  attendees: {
    userId: string
    status: 'ATTENDED' | 'ABSENT' | 'LATE'
    user: {
      id: string
      name: string
      email: string
    }
  }[]
}

export default function EventAttendancePage() {
  const params = useParams<{ id: string; eventId: string }>()
  const router = useRouter()
  const groupId = params?.id
  const eventId = params?.eventId
  
  const [event, setEvent] = useState<EventData | null>(null)
  const [attendance, setAttendance] = useState<Record<string, 'ATTENDED' | 'ABSENT' | 'LATE'>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (groupId && eventId) {
      fetchEventData()
    }
  }, [groupId, eventId])

  const fetchEventData = async () => {
    try {
      const response = await fetch(`/api/admin/groups/${groupId}/attendance`)
      if (response.ok) {
        const data = await response.json()
        const eventData = data.events.find((e: any) => e.id === eventId)
        
        if (eventData) {
          setEvent({
            ...eventData,
            group: data.group
          })
          
          // Инициализировать состояние посещаемости
          const initialAttendance: Record<string, 'ATTENDED' | 'ABSENT' | 'LATE'> = {}
          
          // Добавить всех студентов группы
          if (data.group?.students && Array.isArray(data.group.students)) {
            data.group.students.forEach((student: Student) => {
              const attendee = eventData.attendees?.find((a: any) => a.userId === student.id)
              initialAttendance[student.id] = attendee?.status || 'ABSENT'
            })
          }
          
          setAttendance(initialAttendance)
        }
      }
    } catch (error) {
      console.error('Error fetching event data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateAttendance = (studentId: string, status: 'ATTENDED' | 'ABSENT' | 'LATE') => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }))
  }

  const saveAttendance = async () => {
    setSaving(true)
    try {
      const updates = Object.entries(attendance).map(([userId, status]) => ({
        userId,
        status
      }))

      for (const update of updates) {
        await fetch(`/api/admin/groups/${groupId}/attendance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId,
            userId: update.userId,
            status: update.status
          })
        })
      }

      alert('Посещаемость сохранена!')
    } catch (error) {
      console.error('Error saving attendance:', error)
      alert('Ошибка при сохранении')
    } finally {
      setSaving(false)
    }
  }

  const markAllAs = (status: 'ATTENDED' | 'ABSENT') => {
    if (!event || !event.group?.students || !Array.isArray(event.group.students)) return
    
    const newAttendance: Record<string, 'ATTENDED' | 'ABSENT' | 'LATE'> = {}
    event.group.students.forEach(student => {
      newAttendance[student.id] = status
    })
    setAttendance(newAttendance)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка данных события...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
          <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Событие не найдено</p>
        </div>
      </div>
    )
  }

  const filteredStudents = event.group?.students && Array.isArray(event.group.students) ? event.group.students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) : []

  const attendedCount = Object.values(attendance).filter(status => status === 'ATTENDED').length
  const absentCount = Object.values(attendance).filter(status => status === 'ABSENT').length
  const lateCount = Object.values(attendance).filter(status => status === 'LATE').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/admin/groups/${groupId}/attendance`)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
                <p className="text-gray-600 mt-1">
                  {event.group.name} • {new Date(event.startDate).toLocaleDateString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => markAllAs('ATTENDED')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Все присутствуют
              </button>
              <button
                onClick={() => markAllAs('ABSENT')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Все отсутствуют
              </button>
              <button
                onClick={saveAttendance}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Сохранение...' : 'Сохранить'}
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
                <p className="text-sm text-gray-600">Всего студентов</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{event.group?.students?.length || 0}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Присутствуют</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{attendedCount}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Отсутствуют</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{absentCount}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Опоздали</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{lateCount}</p>
              </div>
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
          </div>
        </div>

        {/* Поиск студентов */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Поиск студентов по имени или email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Список студентов */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Список студентов</h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredStudents.map((student) => (
              <div key={student.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{student.name}</h4>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {student.email}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateAttendance(student.id, 'ATTENDED')}
                      className={`px-3 py-1 rounded-lg flex items-center gap-1 transition-colors ${
                        attendance[student.id] === 'ATTENDED'
                          ? 'bg-green-100 text-green-800 border border-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-green-50'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Присутствует
                    </button>
                    <button
                      onClick={() => updateAttendance(student.id, 'LATE')}
                      className={`px-3 py-1 rounded-lg flex items-center gap-1 transition-colors ${
                        attendance[student.id] === 'LATE'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-amber-50'
                      }`}
                    >
                      <Clock className="w-4 h-4" />
                      Опоздал
                    </button>
                    <button
                      onClick={() => updateAttendance(student.id, 'ABSENT')}
                      className={`px-3 py-1 rounded-lg flex items-center gap-1 transition-colors ${
                        attendance[student.id] === 'ABSENT'
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-red-50'
                      }`}
                    >
                      <XCircle className="w-4 h-4" />
                      Отсутствует
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
