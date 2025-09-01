'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  ArrowLeft,
  Plus, 
  Edit, 
  Eye, 
  Trash2,
  Users, 
  Calendar,
  BookOpen,
  Settings,
  Loader2,
  Search,
  Filter,
  UserPlus,
  UserMinus,
  GraduationCap,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  ClipboardList
} from 'lucide-react'
import AttendanceJournal from '@/components/admin/AttendanceJournal'
import GroupScheduleManager from '@/components/admin/GroupScheduleManager'

interface Group {
  id: string
  name: string
  description: string
  type: 'ONLINE' | 'OFFLINE' | 'HYBRID'
  maxStudents: number
  startDate: string
  endDate: string | null
  isActive: boolean
  createdAt: string
  _count?: {
    students: number
    teachers: number
    courses: number
  }
}

interface GroupStats {
  total: number
  active: number
  inactive: number
  totalStudents: number
}

export default function GroupsManagement() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all') // all, active, inactive, online, offline, hybrid
  const [stats, setStats] = useState<GroupStats>({
    total: 0,
    active: 0,
    inactive: 0,
    totalStudents: 0
  })
  const [showAttendanceJournal, setShowAttendanceJournal] = useState(false)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [showScheduleManager, setShowScheduleManager] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
      return
    }

    fetchGroups()
  }, [session, status, router])

  const fetchGroups = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/groups')
      if (response.ok) {
        const data = await response.json()
        setGroups(data)
        
        // Подсчёт статистики
        setStats({
          total: data.length,
          active: data.filter((g: Group) => g.isActive).length,
          inactive: data.filter((g: Group) => !g.isActive).length,
          totalStudents: data.reduce((acc: number, g: Group) => acc + (g._count?.students || 0), 0)
        })
      }
    } catch (error) {
      console.error('Ошибка загрузки групп:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteGroup = async (groupId: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту группу? Это действие нельзя отменить.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/groups/${groupId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await fetchGroups()
      } else {
        alert('Ошибка при удалении группы')
      }
    } catch (error) {
      console.error('Ошибка удаления группы:', error)
      alert('Ошибка при удалении группы')
    }
  }

  const toggleGroupStatus = async (groupId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/groups/${groupId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isActive: !currentStatus
        })
      })
      
      if (response.ok) {
        await fetchGroups()
      } else {
        alert('Ошибка при изменении статуса группы')
      }
    } catch (error) {
      console.error('Ошибка изменения статуса группы:', error)
      alert('Ошибка при изменении статуса группы')
    }
  }

  const openAttendanceJournal = (groupId: string) => {
    setSelectedGroupId(groupId)
    setShowAttendanceJournal(true)
  }

  const closeAttendanceJournal = () => {
    setShowAttendanceJournal(false)
    setSelectedGroupId(null)
  }

  const openScheduleManager = (groupId: string) => {
    setSelectedGroupId(groupId)
    setShowScheduleManager(true)
  }

  const closeScheduleManager = () => {
    setShowScheduleManager(false)
    setSelectedGroupId(null)
  }

  // Фильтрация групп
  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filter === 'all' || 
                         (filter === 'active' && group.isActive) ||
                         (filter === 'inactive' && !group.isActive) ||
                         (filter === 'online' && group.type === 'ONLINE') ||
                         (filter === 'offline' && group.type === 'OFFLINE') ||
                         (filter === 'hybrid' && group.type === 'HYBRID')
    
    return matchesSearch && matchesFilter
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'ONLINE': return 'Онлайн'
      case 'OFFLINE': return 'Оффлайн'
      case 'HYBRID': return 'Гибрид'
      default: return type
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ONLINE': return 'bg-blue-100 text-blue-800'
      case 'OFFLINE': return 'bg-green-100 text-green-800'
      case 'HYBRID': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Загрузка групп...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Хедер */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Управление группами
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Создавайте и управляйте учебными группами
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push('/admin/groups/create')}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-4 h-4" />
              Создать группу
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Статистика */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600 font-semibold">Всего групп</p>
                <p className="text-3xl font-bold mt-1 text-gray-900">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-emerald-600" />
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-semibold">Активных</p>
                <p className="text-3xl font-bold mt-1 text-gray-900">{stats.active}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 font-semibold">Неактивных</p>
                <p className="text-3xl font-bold mt-1 text-gray-900">{stats.inactive}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-amber-600" />
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-indigo-600 font-semibold">Всего студентов</p>
                <p className="text-3xl font-bold mt-1 text-gray-900">{stats.totalStudents}</p>
              </div>
              <GraduationCap className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
        </div>

        {/* Поиск и фильтры */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Поиск групп по названию или описанию..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="all">Все группы</option>
              <option value="active">Активные</option>
              <option value="inactive">Неактивные</option>
              <option value="online">Онлайн</option>
              <option value="offline">Оффлайн</option>
              <option value="hybrid">Гибридные</option>
            </select>
          </div>
        </div>

        {/* Список групп */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">
              Группы ({filteredGroups.length})
            </h2>
          </div>

          <div className="divide-y divide-gray-100">
            {filteredGroups.map(group => (
              <div key={group.id} className="group bg-white/60 hover:bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 hover:border-emerald-200 relative overflow-hidden">
                {/* Декоративный элемент */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-lg group-hover:text-emerald-700 transition-colors">{group.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {group.isActive ? (
                            <span className="px-3 py-1 text-xs bg-emerald-100 text-emerald-800 rounded-full font-medium shadow-sm">
                              Активна
                            </span>
                          ) : (
                            <span className="px-3 py-1 text-xs bg-amber-100 text-amber-800 rounded-full font-medium shadow-sm">
                              Неактивна
                            </span>
                          )}
                          <span className={`px-3 py-1 text-xs rounded-full font-medium shadow-sm ${getTypeColor(group.type)}`}>
                            {getTypeLabel(group.type)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {group.description && (
                      <p className="text-gray-600 mb-4 group-hover:text-gray-700 transition-colors leading-relaxed">{group.description}</p>
                    )}
                    
                    {/* Характеристики группы */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-cyan-50 px-3 py-2 rounded-lg group-hover:from-blue-100 group-hover:to-cyan-100 transition-colors">
                        <Users className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">{group._count?.students || 0} / {group.maxStudents} студентов</span>
                      </div>
                      <div className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-pink-50 px-3 py-2 rounded-lg group-hover:from-purple-100 group-hover:to-pink-100 transition-colors">
                        <BookOpen className="w-4 h-4 text-purple-500" />
                        <span className="font-medium">{group._count?.courses || 0} курсов</span>
                      </div>
                      <div className="flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 px-3 py-2 rounded-lg group-hover:from-green-100 group-hover:to-emerald-100 transition-colors">
                        <Calendar className="w-4 h-4 text-green-500" />
                        <span className="font-medium">Начало: {formatDate(group.startDate)}</span>
                      </div>
                      {group.endDate && (
                        <div className="flex items-center gap-2 bg-gradient-to-r from-orange-50 to-yellow-50 px-3 py-2 rounded-lg group-hover:from-orange-100 group-hover:to-yellow-100 transition-colors">
                          <Clock className="w-4 h-4 text-orange-500" />
                          <span className="font-medium">Конец: {formatDate(group.endDate)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Действия */}
                  <div className="flex gap-3 ml-6 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => router.push(`/admin/groups/${group.id}/edit`)}
                      className="w-12 h-12 flex items-center justify-center text-indigo-600 hover:text-white hover:bg-indigo-600 rounded-xl transition-all duration-200 hover:scale-110 shadow-md hover:shadow-lg border-2 border-indigo-200 hover:border-indigo-600 backdrop-blur-sm"
                      title="Редактировать"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    
                    <button
                      onClick={() => router.push(`/admin/groups/${group.id}`)}
                      className="w-12 h-12 flex items-center justify-center text-emerald-600 hover:text-white hover:bg-emerald-600 rounded-xl transition-all duration-200 hover:scale-110 shadow-md hover:shadow-lg border-2 border-emerald-200 hover:border-emerald-600 backdrop-blur-sm"
                      title="Просмотр группы"
                    >
                      <Eye className="w-5 h-5" />
                    </button>

                    <button
                      onClick={() => router.push(`/admin/groups/${group.id}/schedule`)}
                      className="w-12 h-12 flex items-center justify-center text-blue-600 hover:text-white hover:bg-blue-600 rounded-xl transition-all duration-200 hover:scale-110 shadow-md hover:shadow-lg border-2 border-blue-200 hover:border-blue-600 backdrop-blur-sm"
                      title="Расписание"
                    >
                      <Calendar className="w-5 h-5" />
                    </button>

                    <button
                      onClick={() => router.push(`/admin/groups/${group.id}/attendance`)}
                      className="w-12 h-12 flex items-center justify-center text-purple-600 hover:text-white hover:bg-purple-600 rounded-xl transition-all duration-200 hover:scale-110 shadow-md hover:shadow-lg border-2 border-purple-200 hover:border-purple-600 backdrop-blur-sm"
                      title="Журнал посещаемости"
                    >
                      <ClipboardList className="w-5 h-5" />
                    </button>

                    <button
                      onClick={() => toggleGroupStatus(group.id, group.isActive)}
                      className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-200 hover:scale-110 shadow-md hover:shadow-lg border-2 backdrop-blur-sm ${
                        group.isActive 
                          ? 'text-amber-600 hover:text-white hover:bg-amber-600 border-amber-200 hover:border-amber-600' 
                          : 'text-emerald-600 hover:text-white hover:bg-emerald-600 border-emerald-200 hover:border-emerald-600'
                      }`}
                      title={group.isActive ? 'Деактивировать' : 'Активировать'}
                    >
                      {group.isActive ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                    </button>
                    
                    <button
                      onClick={() => deleteGroup(group.id)}
                      className="w-12 h-12 flex items-center justify-center text-red-600 hover:text-white hover:bg-red-600 rounded-xl transition-all duration-200 hover:scale-110 shadow-md hover:shadow-lg border-2 border-red-200 hover:border-red-600 backdrop-blur-sm"
                      title="Удалить"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredGroups.length === 0 && (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || filter !== 'all' ? 'Группы не найдены' : 'Пока нет групп'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || filter !== 'all' 
                    ? 'Попробуйте изменить критерии поиска или фильтрации'
                    : 'Создайте свою первую группу для начала работы'
                  }
                </p>
                {!searchTerm && filter === 'all' && (
                  <button
                    onClick={() => router.push('/admin/groups/create')}
                    className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-emerald-400 hover:bg-emerald-50 transition-colors"
                  >
                    Создать первую группу
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Журнал посещаемости */}
      {showAttendanceJournal && selectedGroupId && (
        <AttendanceJournal
          groupId={selectedGroupId}
          onClose={closeAttendanceJournal}
        />
      )}

      {showScheduleManager && selectedGroupId && (
        <GroupScheduleManager
          groupId={selectedGroupId}
          onClose={closeScheduleManager}
        />
      )}
    </div>
  )
}
