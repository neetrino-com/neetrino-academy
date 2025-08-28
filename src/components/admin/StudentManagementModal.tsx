'use client'

import { useState, useEffect } from 'react'
import { 
  X,
  Search,
  Users,
  Check,
  Loader2,
  AlertCircle,
  Filter,
  UserPlus,
  Mail,
  Calendar,
  Award,
  BookOpen
} from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'STUDENT' | 'TEACHER' | 'ADMIN'
  createdAt: string
}

interface StudentManagementModalProps {
  isOpen: boolean
  onClose: () => void
  groupId: string
  groupName: string
  assignedStudentIds: string[]
  onAddSuccess: () => void
}

export default function StudentManagementModal({
  isOpen,
  onClose,
  groupId,
  groupName,
  assignedStudentIds,
  onAddSuccess
}: StudentManagementModalProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('students') // students, all, available
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchUsers()
      setSelectedUsers([])
      setSearchTerm('')
      setFilter('students')
      setError('')
    }
  }, [isOpen])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/users')
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      } else {
        setError('Ошибка загрузки пользователей')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      setError('Ошибка загрузки пользователей')
    } finally {
      setLoading(false)
    }
  }

  const handleAddStudents = async () => {
    if (selectedUsers.length === 0) {
      setError('Выберите хотя бы одного студента для добавления')
      return
    }

    try {
      setAdding(true)
      const response = await fetch(`/api/admin/groups/${groupId}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studentIds: selectedUsers
        })
      })

      if (response.ok) {
        onAddSuccess()
        onClose()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Ошибка добавления студентов')
      }
    } catch (error) {
      console.error('Error adding students:', error)
      setError('Ошибка добавления студентов')
    } finally {
      setAdding(false)
    }
  }

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  // Фильтрация пользователей
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const isAssigned = assignedStudentIds.includes(user.id)
    
    const matchesFilter = filter === 'all' || 
                         (filter === 'students' && user.role === 'STUDENT') ||
                         (filter === 'available' && user.role === 'STUDENT' && !isAssigned)
    
    return matchesSearch && matchesFilter
  })

  const availableStudents = filteredUsers.filter(user => 
    user.role === 'STUDENT' && !assignedStudentIds.includes(user.id)
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'STUDENT': return 'Студент'
      case 'TEACHER': return 'Преподаватель'
      case 'ADMIN': return 'Администратор'
      default: return role
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'STUDENT': return 'bg-blue-100 text-blue-800'
      case 'TEACHER': return 'bg-green-100 text-green-800'
      case 'ADMIN': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Хедер */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Добавить студентов в группу</h2>
            <p className="text-sm text-gray-600 mt-1">
              Группа: <span className="font-semibold">{groupName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Фильтры и поиск */}
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Поиск пользователей по имени или email..."
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
              <option value="students">Только студенты</option>
              <option value="available">Не в группе</option>
              <option value="all">Все пользователи</option>
            </select>
          </div>

          {/* Статистика */}
          <div className="mt-4 flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              <span className="text-gray-700 font-medium">Всего найдено: <strong className="text-gray-900">{filteredUsers.length}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-700 font-medium">Доступно студентов: <strong className="text-gray-900">{availableStudents.length}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
              <span className="text-gray-700 font-medium">Выбрано: <strong className="text-teal-600">{selectedUsers.length}</strong></span>
            </div>
          </div>
        </div>

        {/* Список пользователей */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <span className="ml-3 text-gray-600">Загрузка пользователей...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12 text-red-600">
              <AlertCircle className="w-8 h-8 mr-3" />
              <span>{error}</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Users className="w-12 h-12 mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">Пользователи не найдены</p>
              <p className="text-sm">Попробуйте изменить критерии поиска или фильтрации</p>
            </div>
          ) : (
            <div className="p-6 space-y-3">
              {filteredUsers.map(user => {
                const isAssigned = assignedStudentIds.includes(user.id)
                const isSelected = selectedUsers.includes(user.id)
                const isStudent = user.role === 'STUDENT'
                
                return (
                  <div
                    key={user.id}
                    className={`p-4 border rounded-lg transition-all duration-200 ${
                      isAssigned 
                        ? 'border-gray-200 bg-gray-50 opacity-60' 
                        : isSelected
                          ? 'border-emerald-300 bg-emerald-50'
                          : 'border-gray-200 hover:border-emerald-200 hover:bg-emerald-25'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center">
                          <span className="text-emerald-700 font-bold text-lg">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{user.name}</h3>
                            
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${getRoleColor(user.role)}`}>
                              {getRoleLabel(user.role)}
                            </span>
                            
                            {isAssigned && (
                              <span className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded-full font-medium">
                                В группе
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              <span>{user.email}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>Зарегистрирован {formatDate(user.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Чекбокс */}
                      <div className="ml-4">
                        {isAssigned ? (
                          <div className="w-6 h-6 bg-gray-200 rounded border flex items-center justify-center">
                            <Check className="w-4 h-4 text-gray-500" />
                          </div>
                        ) : !isStudent ? (
                          <div className="w-6 h-6 bg-gray-100 rounded border border-gray-300 flex items-center justify-center opacity-50">
                            <X className="w-4 h-4 text-gray-400" />
                          </div>
                        ) : (
                          <button
                            onClick={() => toggleUserSelection(user.id)}
                            className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                              isSelected
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-gray-300 hover:border-emerald-400'
                            }`}
                          >
                            {isSelected && <Check className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Футер с кнопками */}
        <div className="sticky bottom-0 p-6 border-t border-gray-200 bg-white shadow-lg">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="text-sm">
              {selectedUsers.length > 0 && (
                <span className="text-gray-700 font-medium">Выбрано студентов: <strong className="text-emerald-600">{selectedUsers.length}</strong></span>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium"
                disabled={adding}
              >
                Отмена
              </button>
              <button
                onClick={handleAddStudents}
                disabled={selectedUsers.length === 0 || adding}
                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg"
              >
                {adding ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Добавление...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Добавить студентов ({selectedUsers.length})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
