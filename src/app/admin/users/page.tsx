'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  Users, 
  Search,
  Filter,
  Download,
  Trash2,
  UserCheck,
  UserX,
  Settings,
  Mail,
  Shield,
  MoreHorizontal,
  Check,
  X,
  Loader2,
  AlertTriangle,
  Eye,
  Edit3,
  UserPlus
} from 'lucide-react'

interface User {
  id: string
  name: string | null
  email: string
  role: 'STUDENT' | 'TEACHER' | 'ADMIN'
  avatar: string | null
  createdAt: string
  updatedAt: string
  isActive?: boolean
  lastLoginAt?: string | null
  _count?: {
    enrollments: number
    assignments: number
    submissions: number
  }
}

interface UserStats {
  total: number
  students: number
  teachers: number
  admins: number
  active: number
  inactive: number
}

export default function UsersManagement() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState('')
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    students: 0,
    teachers: 0,
    admins: 0,
    active: 0,
    inactive: 0
  })

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
      return
    }

    if (session.user.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }

    fetchUsers()
  }, [session, status, router])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
        
        // Подсчёт статистики
        setStats({
          total: data.length,
          students: data.filter((u: User) => u.role === 'STUDENT').length,
          teachers: data.filter((u: User) => u.role === 'TEACHER').length,
          admins: data.filter((u: User) => u.role === 'ADMIN').length,
          active: data.filter((u: User) => u.isActive !== false).length,
          inactive: data.filter((u: User) => u.isActive === false).length
        })
      }
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && user.isActive !== false) ||
                         (statusFilter === 'inactive' && user.isActive === false)
    
    return matchesSearch && matchesRole && matchesStatus
  })

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const selectAllUsers = () => {
    setSelectedUsers(
      selectedUsers.length === filteredUsers.length 
        ? [] 
        : filteredUsers.map(u => u.id)
    )
  }

  const handleBulkAction = async () => {
    if (!bulkAction || selectedUsers.length === 0) return

    try {
      const response = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: bulkAction,
          userIds: selectedUsers
        })
      })

      if (response.ok) {
        await fetchUsers()
        setSelectedUsers([])
        setBulkAction('')
        setShowBulkModal(false)
      }
    } catch (error) {
      console.error('Ошибка выполнения массового действия:', error)
    }
  }

  const exportUsers = async () => {
    try {
      const response = await fetch('/api/admin/users/export')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Ошибка экспорта пользователей:', error)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800'
      case 'TEACHER': return 'bg-blue-100 text-blue-800'
      case 'STUDENT': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Администратор'
      case 'TEACHER': return 'Преподаватель'
      case 'STUDENT': return 'Студент'
      default: return role
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Загрузка пользователей...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Заголовок */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-100 rounded-lg p-3">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Управление пользователями</h1>
              <p className="text-gray-600">Просмотр, редактирование и массовые операции с пользователями</p>
            </div>
          </div>

          {/* Статистика */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Всего пользователей</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-2xl font-bold text-green-600">{stats.students}</div>
              <div className="text-sm text-gray-600">Студентов</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-2xl font-bold text-blue-600">{stats.teachers}</div>
              <div className="text-sm text-gray-600">Преподавателей</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-2xl font-bold text-red-600">{stats.admins}</div>
              <div className="text-sm text-gray-600">Администраторов</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-2xl font-bold text-emerald-600">{stats.active}</div>
              <div className="text-sm text-gray-600">Активных</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-2xl font-bold text-orange-600">{stats.inactive}</div>
              <div className="text-sm text-gray-600">Неактивных</div>
            </div>
          </div>
        </div>

        {/* Панель управления */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              
              {/* Поиск и фильтры */}
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                {/* Поиск */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Поиск по имени или email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Фильтр по роли */}
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Все роли</option>
                  <option value="STUDENT">Студенты</option>
                  <option value="TEACHER">Преподаватели</option>
                  <option value="ADMIN">Администраторы</option>
                </select>

                {/* Фильтр по статусу */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Все статусы</option>
                  <option value="active">Активные</option>
                  <option value="inactive">Неактивные</option>
                </select>
              </div>

              {/* Действия */}
              <div className="flex flex-wrap gap-3">
                
                {/* Массовые операции */}
                {selectedUsers.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                    <span className="text-sm text-blue-700 font-medium">
                      Выбрано: {selectedUsers.length}
                    </span>
                    <select
                      value={bulkAction}
                      onChange={(e) => setBulkAction(e.target.value)}
                      className="text-sm border-0 bg-transparent text-blue-700 focus:ring-0"
                    >
                      <option value="">Выберите действие...</option>
                      <option value="activate">Активировать</option>
                      <option value="deactivate">Деактивировать</option>
                      <option value="promote_teacher">Сделать преподавателем</option>
                      <option value="demote_student">Сделать студентом</option>
                      <option value="send_notification">Отправить уведомление</option>
                      <option value="export_selected">Экспорт выбранных</option>
                    </select>
                    {bulkAction && (
                      <button
                        onClick={() => setShowBulkModal(true)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                      >
                        Применить
                      </button>
                    )}
                  </div>
                )}

                {/* Кнопка экспорта */}
                <button
                  onClick={exportUsers}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Экспорт
                </button>

                {/* Кнопка добавления пользователя */}
                <button
                  onClick={() => router.push('/admin/users/create')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Добавить
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Таблица пользователей */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="p-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                      onChange={selectAllUsers}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="p-4 text-left font-semibold text-gray-900">Пользователь</th>
                  <th className="p-4 text-left font-semibold text-gray-900">Роль</th>
                  <th className="p-4 text-left font-semibold text-gray-900">Статус</th>
                  <th className="p-4 text-left font-semibold text-gray-900">Активность</th>
                  <th className="p-4 text-left font-semibold text-gray-900">Зарегистрирован</th>
                  <th className="p-4 text-left font-semibold text-gray-900">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="group hover:bg-gradient-to-r hover:from-violet-50/50 hover:via-purple-50/30 hover:to-pink-50/50 transition-all duration-300 hover:shadow-md border-l-4 border-transparent hover:border-purple-400">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        className="rounded-md border-gray-300 text-purple-600 focus:ring-purple-500 transform group-hover:scale-110 transition-transform"
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                            {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                            <div className={`w-3 h-3 rounded-full ${user.isActive !== false ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors truncate">{user.name || 'Без имени'}</div>
                          <div className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors truncate">{user.email}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium shadow-sm ${getRoleColor(user.role)}`}>
                              {getRoleLabel(user.role)}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium shadow-sm ${
                              user.isActive !== false 
                                ? 'bg-emerald-100 text-emerald-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {user.isActive !== false ? 'Активен' : 'Неактивен'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        {user._count ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-blue-600">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                              </svg>
                              <span className="font-medium">{user._count.enrollments || 0} курсов</span>
                            </div>
                            <div className="flex items-center gap-2 text-green-600">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              <span className="font-medium">{user._count.submissions || 0} заданий</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">Нет данных</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-gray-900 group-hover:text-gray-600 transition-colors">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="font-medium">{formatDate(user.createdAt)}</span>
                        </div>
                        {user.lastLoginAt && (
                          <div className="text-xs text-gray-500 mt-1">
                            Последний вход: {formatDate(user.lastLoginAt)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => router.push(`/admin/users/${user.id}`)}
                          className="p-2.5 text-blue-600 hover:text-white hover:bg-blue-600 rounded-xl transition-all duration-200 hover:scale-110 shadow-sm hover:shadow-md border border-blue-200 hover:border-blue-600"
                          title="Просмотр"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => router.push(`/admin/users/${user.id}/edit`)}
                          className="p-2.5 text-indigo-600 hover:text-white hover:bg-indigo-600 rounded-xl transition-all duration-200 hover:scale-110 shadow-sm hover:shadow-md border border-indigo-200 hover:border-indigo-600"
                          title="Редактировать"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2.5 text-gray-600 hover:text-white hover:bg-gray-600 rounded-xl transition-all duration-200 hover:scale-110 shadow-sm hover:shadow-md border border-gray-200 hover:border-gray-600"
                          title="Еще действия"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Пользователи не найдены</h3>
              <p className="text-gray-500">Попробуйте изменить фильтры или поисковый запрос</p>
            </div>
          )}
        </div>

        {/* Модальное окно подтверждения массового действия */}
        {showBulkModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
                <h3 className="text-lg font-semibold text-gray-900">Подтверждение действия</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Вы уверены, что хотите выполнить действие "{bulkAction}" для {selectedUsers.length} пользователей?
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={handleBulkAction}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Подтвердить
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
