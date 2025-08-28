'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  ArrowLeft,
  Edit,
  Settings,
  Users, 
  BookOpen,
  Calendar,
  Loader2,
  AlertCircle,
  CheckCircle,
  Plus,
  UserPlus,
  UserMinus,
  Trash2,
  Eye,
  Clock,
  Target,
  GraduationCap,
  Award,
  TrendingUp,
  Activity
} from 'lucide-react'

interface GroupStudent {
  id: string
  userId: string
  joinedAt: string
  user: {
    id: string
    name: string
    email: string
    avatar?: string
  }
}

interface GroupTeacher {
  id: string
  userId: string
  joinedAt: string
  user: {
    id: string
    name: string
    email: string
    avatar?: string
  }
}

interface GroupCourse {
  id: string
  courseId: string
  assignedAt: string
  course: {
    id: string
    title: string
    description: string
    direction: string
    level: string
    isActive: boolean
  }
}

interface GroupAssignment {
  id: string
  assignmentId: string
  assignedAt: string
  assignment: {
    id: string
    title: string
    description: string
    dueDate: string
    module: {
      title: string
      course: {
        title: string
      }
    }
  }
}

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
  students: GroupStudent[]
  teachers: GroupTeacher[]
  courses: GroupCourse[]
  assignments: GroupAssignment[]
}

interface GroupDetailProps {
  params: Promise<{
    id: string
  }>
}

export default function GroupDetail({ params }: GroupDetailProps) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [group, setGroup] = useState<Group | null>(null)
  const [error, setError] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'teachers' | 'courses' | 'assignments'>('overview')
  
  // Развертываем промис params
  const resolvedParams = use(params)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
      return
    }

    fetchGroup()
  }, [session, status, router, resolvedParams.id])

  const fetchGroup = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/groups/${resolvedParams.id}`)
      
      if (response.ok) {
        const groupData = await response.json()
        setGroup(groupData)
      } else {
        setError('Группа не найдена')
      }
    } catch (error) {
      console.error('Error fetching group:', error)
      setError('Ошибка загрузки группы')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">
            {status === 'loading' ? 'Проверка авторизации...' : 'Загрузка группы...'}
          </p>
        </div>
      </div>
    )
  }

  if (!session) {
    router.push('/login')
    return null
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Ошибка</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/admin/groups')}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Вернуться к группам
          </button>
        </div>
      </div>
    )
  }

  if (!group) {
    return null
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
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

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-emerald-100 text-emerald-800' 
      : 'bg-amber-100 text-amber-800'
  }

  const tabs = [
    { id: 'overview', label: 'Обзор', icon: Activity },
    { id: 'students', label: `Студенты (${group.students.length})`, icon: Users },
    { id: 'teachers', label: `Преподаватели (${group.teachers.length})`, icon: GraduationCap },
    { id: 'courses', label: `Курсы (${group.courses.length})`, icon: BookOpen },
    { id: 'assignments', label: `Задания (${group.assignments.length})`, icon: Target }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Хедер */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin/groups')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  {group.name}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Создана {formatDate(group.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`/admin/groups/${resolvedParams.id}/edit`)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-all duration-200"
              >
                <Edit className="w-4 h-4" />
                Редактировать
              </button>
              <button
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 flex items-center gap-2 transition-all duration-200"
              >
                <Settings className="w-4 h-4" />
                Настройки
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Информационные карточки */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600 font-semibold">Студенты</p>
                <p className="text-2xl font-bold mt-1 text-gray-900">
                  {group.students.length} / {group.maxStudents}
                </p>
              </div>
              <Users className="w-8 h-8 text-emerald-600" />
            </div>
            <div className="mt-4 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(group.students.length / group.maxStudents) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-semibold">Преподаватели</p>
                <p className="text-2xl font-bold mt-1 text-gray-900">{group.teachers.length}</p>
              </div>
              <GraduationCap className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Активные преподаватели</p>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-semibold">Курсы</p>
                <p className="text-2xl font-bold mt-1 text-gray-900">{group.courses.length}</p>
              </div>
              <BookOpen className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Назначенные курсы</p>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 font-semibold">Задания</p>
                <p className="text-2xl font-bold mt-1 text-gray-900">{group.assignments.length}</p>
              </div>
              <Target className="w-8 h-8 text-amber-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Активные задания</p>
          </div>
        </div>

        {/* Основная информация о группе */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/60 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Информация о группе</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Тип обучения</p>
              <span className={`px-3 py-1 text-sm rounded-full font-medium ${getTypeColor(group.type)}`}>
                {getTypeLabel(group.type)}
              </span>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Статус</p>
              <span className={`px-3 py-1 text-sm rounded-full font-medium ${getStatusColor(group.isActive)}`}>
                {group.isActive ? 'Активна' : 'Неактивна'}
              </span>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Дата начала</p>
              <div className="flex items-center gap-2 text-gray-900">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>{formatDate(group.startDate)}</span>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Дата окончания</p>
              <div className="flex items-center gap-2 text-gray-900">
                <Clock className="w-4 h-4 text-gray-500" />
                <span>{group.endDate ? formatDate(group.endDate) : 'Не указана'}</span>
              </div>
            </div>
          </div>

          {group.description && (
            <div className="mt-6">
              <p className="text-sm font-semibold text-gray-700 mb-2">Описание</p>
              <p className="text-gray-600 leading-relaxed">{group.description}</p>
            </div>
          )}
        </div>

        {/* Табы */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60">
          {/* Навигация по табам */}
          <div className="border-b border-gray-200 px-6">
            <nav className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors duration-200 ${
                      activeTab === tab.id
                        ? 'border-emerald-500 text-emerald-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Содержимое табов */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Последняя активность</h3>
                  <div className="space-y-3">
                    {group.students.slice(0, 3).map((student) => (
                      <div key={student.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {student.user.name} присоединился к группе
                          </p>
                          <p className="text-xs text-gray-500">{formatDate(student.joinedAt)}</p>
                        </div>
                      </div>
                    ))}
                    {group.students.length === 0 && (
                      <p className="text-gray-500 text-center py-8">Пока нет активности в группе</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'students' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Студенты группы</h3>
                  <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Добавить студента
                  </button>
                </div>
                
                <div className="space-y-3">
                  {group.students.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                          <span className="text-emerald-700 font-semibold">
                            {student.user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{student.user.name}</p>
                          <p className="text-sm text-gray-500">{student.user.email}</p>
                          <p className="text-xs text-gray-400">Присоединился {formatDate(student.joinedAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-red-600 hover:bg-red-100 rounded-lg">
                          <UserMinus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {group.students.length === 0 && (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500 mb-4">В группе пока нет студентов</p>
                      <button className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-emerald-400 hover:bg-emerald-50">
                        Добавить первого студента
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'teachers' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Преподаватели группы</h3>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Добавить преподавателя
                  </button>
                </div>
                
                <div className="space-y-3">
                  {group.teachers.map((teacher) => (
                    <div key={teacher.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-700 font-semibold">
                            {teacher.user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{teacher.user.name}</p>
                          <p className="text-sm text-gray-500">{teacher.user.email}</p>
                          <p className="text-xs text-gray-400">Присоединился {formatDate(teacher.joinedAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-red-600 hover:bg-red-100 rounded-lg">
                          <UserMinus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {group.teachers.length === 0 && (
                    <div className="text-center py-12">
                      <GraduationCap className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500 mb-4">В группе пока нет преподавателей</p>
                      <button className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50">
                        Добавить преподавателя
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'courses' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Назначенные курсы</h3>
                  <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Назначить курс
                  </button>
                </div>
                
                <div className="space-y-3">
                  {group.courses.map((groupCourse) => (
                    <div key={groupCourse.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{groupCourse.course.title}</p>
                          <p className="text-sm text-gray-500">{groupCourse.course.description}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                              {groupCourse.course.direction}
                            </span>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {groupCourse.course.level}
                            </span>
                            <span className="text-xs text-gray-400">
                              Назначен {formatDate(groupCourse.assignedAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-red-600 hover:bg-red-100 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {group.courses.length === 0 && (
                    <div className="text-center py-12">
                      <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500 mb-4">Группе не назначены курсы</p>
                      <button className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50">
                        Назначить первый курс
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'assignments' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Задания группы</h3>
                  <button className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Создать задание
                  </button>
                </div>
                
                <div className="space-y-3">
                  {group.assignments.map((groupAssignment) => (
                    <div key={groupAssignment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                          <Target className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{groupAssignment.assignment.title}</p>
                          <p className="text-sm text-gray-500">{groupAssignment.assignment.description}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs text-gray-600">
                              {groupAssignment.assignment.module.course.title} • {groupAssignment.assignment.module.title}
                            </span>
                            <span className="text-xs text-red-600">
                              Срок: {formatDate(groupAssignment.assignment.dueDate)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-red-600 hover:bg-red-100 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {group.assignments.length === 0 && (
                    <div className="text-center py-12">
                      <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500 mb-4">У группы пока нет заданий</p>
                      <button className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-amber-400 hover:bg-amber-50">
                        Создать первое задание
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
