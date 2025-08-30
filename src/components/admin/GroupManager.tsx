'use client'

import { useState, useEffect } from 'react'
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  Users,
  UserPlus,
  BookOpen,
  Calendar,
  X,
  CheckCircle,
  Clock
} from 'lucide-react'

interface Group {
  id: string
  name: string
  description?: string
  type: 'ONLINE' | 'OFFLINE' | 'HYBRID'
  maxStudents: number
  startDate: string
  endDate?: string
  isActive: boolean
  students: GroupStudent[]
  teachers: GroupTeacher[]
  courses: GroupCourse[]
}

interface GroupStudent {
  id: string
  userId: string
  user: {
    id: string
    name: string
    email: string
  }
  joinedAt: string
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
}

interface GroupTeacher {
  id: string
  userId: string
  user: {
    id: string
    name: string
    email: string
  }
  role: 'MAIN' | 'ASSISTANT' | 'GUEST'
  joinedAt: string
}

interface GroupCourse {
  id: string
  courseId: string
  course: {
    id: string
    title: string
    description?: string
  }
  assignedAt: string
}

interface User {
  id: string
  name: string
  email: string
  role: 'STUDENT' | 'TEACHER' | 'ADMIN'
}

interface Course {
  id: string
  title: string
  description?: string
}

interface GroupManagerProps {
  onClose: () => void
}

export default function GroupManager({ onClose }: GroupManagerProps) {
  const [groups, setGroups] = useState<Group[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [showAddTeacher, setShowAddTeacher] = useState(false)
  const [showAddCourse, setShowAddCourse] = useState(false)

  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    type: 'ONLINE' as const,
    maxStudents: 30,
    startDate: '',
    endDate: '',
    isActive: true
  })

  // Загрузить данные
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [groupsRes, usersRes, coursesRes] = await Promise.all([
        fetch('/api/admin/groups'),
        fetch('/api/admin/users'),
        fetch('/api/admin/courses')
      ])

      if (groupsRes.ok) {
        const groupsData = await groupsRes.json()
        setGroups(groupsData)
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData)
      }

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json()
        setCourses(coursesData)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Создать группу
  const createGroup = async () => {
    try {
      const response = await fetch('/api/admin/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newGroup)
      })

      if (response.ok) {
        const createdGroup = await response.json()
        setGroups([...groups, createdGroup])
        setShowCreateForm(false)
        setNewGroup({
          name: '',
          description: '',
          type: 'ONLINE',
          maxStudents: 30,
          startDate: '',
          endDate: '',
          isActive: true
        })
      }
    } catch (error) {
      console.error('Error creating group:', error)
    }
  }

  // Добавить студента в группу
  const addStudentToGroup = async (groupId: string, userId: string) => {
    try {
      const response = await fetch(`/api/admin/groups/${groupId}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      })

      if (response.ok) {
        await loadData() // Перезагружаем данные
        setShowAddStudent(false)
      }
    } catch (error) {
      console.error('Error adding student:', error)
    }
  }

  // Добавить учителя в группу
  const addTeacherToGroup = async (groupId: string, userId: string, role: string) => {
    try {
      const response = await fetch(`/api/admin/groups/${groupId}/teachers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, role })
      })

      if (response.ok) {
        await loadData()
        setShowAddTeacher(false)
      }
    } catch (error) {
      console.error('Error adding teacher:', error)
    }
  }

  // Добавить курс в группу
  const addCourseToGroup = async (groupId: string, courseId: string) => {
    try {
      const response = await fetch(`/api/admin/groups/${groupId}/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId })
      })

      if (response.ok) {
        await loadData()
        setShowAddCourse(false)
      }
    } catch (error) {
      console.error('Error adding course:', error)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0  flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-slate-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0  flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800">Управление группами</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Создать группу
              </button>
              <button
                onClick={onClose}
                className="text-slate-500 hover:text-slate-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {groups.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-medium mb-2">Пока нет групп</p>
              <p className="text-sm mb-4">Создайте первую группу для начала работы</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Создать группу
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {groups.map((group) => (
                <div key={group.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">{group.name}</h3>
                      {group.description && (
                        <p className="text-slate-600 text-sm mt-1">{group.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedGroup(group)}
                        className="text-indigo-600 hover:text-indigo-700"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Users className="w-4 h-4" />
                      <span>{group.students.length} / {group.maxStudents} студентов</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <BookOpen className="w-4 h-4" />
                      <span>{group.courses.length} курсов</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar className="w-4 h-4" />
                      <span>Начало: {new Date(group.startDate).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        group.type === 'ONLINE' ? 'bg-indigo-100 text-indigo-700' :
                        group.type === 'OFFLINE' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {group.type === 'ONLINE' ? 'Онлайн' : 
                         group.type === 'OFFLINE' ? 'Офлайн' : 'Гибрид'}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        group.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {group.isActive ? 'Активна' : 'Неактивна'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedGroup(group)
                          setShowAddStudent(true)
                        }}
                        className="px-3 py-1 text-sm border border-indigo-300 text-indigo-600 rounded hover:bg-indigo-50"
                      >
                        <UserPlus className="w-3 h-3 inline mr-1" />
                        Студент
                      </button>
                      <button
                        onClick={() => {
                          setSelectedGroup(group)
                          setShowAddTeacher(true)
                        }}
                        className="px-3 py-1 text-sm border border-emerald-300 text-emerald-600 rounded hover:bg-emerald-50"
                      >
                        <UserPlus className="w-3 h-3 inline mr-1" />
                        Учитель
                      </button>
                      <button
                        onClick={() => {
                          setSelectedGroup(group)
                          setShowAddCourse(true)
                        }}
                        className="px-3 py-1 text-sm border border-purple-300 text-purple-600 rounded hover:bg-purple-50"
                      >
                        <BookOpen className="w-3 h-3 inline mr-1" />
                        Курс
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Модальное окно создания группы */}
        {showCreateForm && (
          <div className="fixed inset-0  flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Создать группу</h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Название группы</label>
                  <input
                    type="text"
                    value={newGroup.name}
                    onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Введите название группы"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Описание</label>
                  <textarea
                    value={newGroup.description}
                    onChange={(e) => setNewGroup({...newGroup, description: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    rows={3}
                    placeholder="Описание группы"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Тип</label>
                    <select
                      value={newGroup.type}
                      onChange={(e) => setNewGroup({...newGroup, type: e.target.value as 'ONLINE' | 'OFFLINE' | 'HYBRID'})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="ONLINE">Онлайн</option>
                      <option value="OFFLINE">Офлайн</option>
                      <option value="HYBRID">Гибрид</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Макс. студентов</label>
                    <input
                      type="number"
                      value={newGroup.maxStudents}
                      onChange={(e) => setNewGroup({...newGroup, maxStudents: parseInt(e.target.value) || 30})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      min="1"
                      max="100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Дата начала</label>
                    <input
                      type="date"
                      value={newGroup.startDate}
                      onChange={(e) => setNewGroup({...newGroup, startDate: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Дата окончания</label>
                    <input
                      type="date"
                      value={newGroup.endDate}
                      onChange={(e) => setNewGroup({...newGroup, endDate: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newGroup.isActive}
                    onChange={(e) => setNewGroup({...newGroup, isActive: e.target.checked})}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                  />
                  <span className="text-sm font-medium text-slate-700">Активная группа</span>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Отмена
                </button>
                <button
                  onClick={createGroup}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Создать
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Модальное окно добавления студента */}
        {showAddStudent && selectedGroup && (
          <div className="fixed inset-0  flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Добавить студента в группу "{selectedGroup.name}"</h3>
                <button
                  onClick={() => setShowAddStudent(false)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Выберите студента</label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        addStudentToGroup(selectedGroup.id, e.target.value)
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Выберите студента...</option>
                    {users.filter(user => user.role === 'STUDENT').map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Модальное окно добавления учителя */}
        {showAddTeacher && selectedGroup && (
          <div className="fixed inset-0  flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Добавить учителя в группу "{selectedGroup.name}"</h3>
                <button
                  onClick={() => setShowAddTeacher(false)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Выберите учителя</label>
                  <select
                    id="teacher-select"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Выберите учителя...</option>
                    {users.filter(user => user.role === 'TEACHER').map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Роль</label>
                  <select
                    id="teacher-role"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="MAIN">Основной учитель</option>
                    <option value="ASSISTANT">Помощник</option>
                    <option value="GUEST">Гость</option>
                  </select>
                </div>

                <button
                  onClick={() => {
                    const teacherSelect = document.getElementById('teacher-select') as HTMLSelectElement
                    const roleSelect = document.getElementById('teacher-role') as HTMLSelectElement
                    if (teacherSelect.value) {
                      addTeacherToGroup(selectedGroup.id, teacherSelect.value, roleSelect.value)
                    }
                  }}
                  className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Добавить учителя
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Модальное окно добавления курса */}
        {showAddCourse && selectedGroup && (
          <div className="fixed inset-0  flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Добавить курс в группу "{selectedGroup.name}"</h3>
                <button
                  onClick={() => setShowAddCourse(false)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Выберите курс</label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        addCourseToGroup(selectedGroup.id, e.target.value)
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Выберите курс...</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
