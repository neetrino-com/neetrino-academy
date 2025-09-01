'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Search, 
  Filter,
  Download,
  ArrowLeft,
  Plus,
  Eye,
  BarChart3
} from 'lucide-react'

interface Group {
  id: string
  name: string
  students: {
    id: string
    name: string
    email: string
  }[]
  _count: {
    students: number
  }
}

interface AttendanceEvent {
  id: string
  title: string
  startDate: string
  endDate: string
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

export default function AttendancePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroup, setSelectedGroup] = useState<string>('')
  const [events, setEvents] = useState<AttendanceEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchGroups()
  }, [])

  useEffect(() => {
    if (selectedGroup) {
      fetchGroupEvents()
    }
  }, [selectedGroup])

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/admin/groups')
      if (response.ok) {
        const data = await response.json()
        setGroups(data)
        if (data.length > 0) {
          setSelectedGroup(data[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching groups:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchGroupEvents = async () => {
    if (!selectedGroup) return
    
    try {
      const response = await fetch(`/api/admin/groups/${selectedGroup}/attendance`)
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events || [])
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    }
  }

  const updateAttendance = async (eventId: string, userId: string, status: 'ATTENDED' | 'ABSENT' | 'LATE') => {
    try {
      const response = await fetch(`/api/admin/groups/${selectedGroup}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, userId, status })
      })
      
      if (response.ok) {
        fetchGroupEvents() // Обновить данные
      }
    } catch (error) {
      console.error('Error updating attendance:', error)
    }
  }

  const selectedGroupData = groups.find(g => g.id === selectedGroup)
  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Статистика
  const totalEvents = events.length
  const totalStudents = selectedGroupData?.students.length || 0
  const totalAttended = events.reduce((sum, event) => 
    sum + event.attendees.filter(a => a.status === 'ATTENDED').length, 0
  )
  const totalAbsent = events.reduce((sum, event) => 
    sum + event.attendees.filter(a => a.status === 'ABSENT').length, 0
  )
  const attendanceRate = totalEvents > 0 ? (totalAttended / (totalEvents * totalStudents) * 100) : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка журнала посещаемости...</p>
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
                  <Users className="w-8 h-8 text-blue-600" />
                  Журнал посещаемости
                </h1>
                <p className="text-gray-600 mt-1">Управление посещаемостью студентов</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                <Download className="w-4 h-4" />
                Экспорт
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Добавить событие
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
                <p className="text-sm text-gray-600">Всего событий</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalEvents}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Студентов</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalStudents}</p>
              </div>
              <Users className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Присутствий</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{totalAttended}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Посещаемость</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{attendanceRate.toFixed(1)}%</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Фильтры и выбор группы */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Группа</label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name} ({group._count.students} студентов)
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Поиск событий</label>
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Поиск по названию события..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Таблица посещаемости */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">События и посещаемость</h3>
          </div>
          
          {filteredEvents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Событие
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дата и время
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Присутствовало
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Отсутствовало
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEvents.map((event) => {
                    const attended = event.attendees.filter(a => a.status === 'ATTENDED').length
                    const absent = event.attendees.filter(a => a.status === 'ABSENT').length
                    
                    return (
                      <tr key={event.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{event.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(event.startDate).toLocaleDateString('ru-RU', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {attended}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <XCircle className="w-3 h-3 mr-1" />
                            {absent}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => router.push(`/admin/groups/${selectedGroup}/attendance/${event.id}`)}
                            className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            Детали
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Нет событий для отображения</p>
              <p className="text-sm text-gray-400 mt-1">
                Создайте события в расписании группы
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
