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
  Activity,
  MessageCircle,
  Calendar as CalendarIcon,
  ClipboardList
} from 'lucide-react'
import CourseAssignmentModal from '@/components/admin/CourseAssignmentModal'
import StudentManagementModal from '@/components/admin/StudentManagementModal'
import TeacherManagementModal from '@/components/admin/TeacherManagementModal'
import AssignmentCreationModal from '@/components/admin/AssignmentCreationModal'
import GroupChat from '@/components/chat/GroupChat'
import CalendarComponent from '@/components/calendar/Calendar'
import EventModal from '@/components/calendar/EventModal'

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
  type TabId = 'overview' | 'students' | 'teachers' | 'courses' | 'assignments' | 'schedule' | 'chat'
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [showCourseAssignmentModal, setShowCourseAssignmentModal] = useState(false)
  const [showStudentManagementModal, setShowStudentManagementModal] = useState(false)
  const [showTeacherManagementModal, setShowTeacherManagementModal] = useState(false)
  const [showAssignmentCreationModal, setShowAssignmentCreationModal] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)
  const [editingEventId, setEditingEventId] = useState<string | undefined>()
  
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

  const removeCourseFromGroup = async (courseId: string, courseTitle: string) => {
    if (!confirm(`Вы уверены, что хотите удалить курс "${courseTitle}" из группы? Это действие нельзя отменить.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/groups/${resolvedParams.id}/courses?courseId=${courseId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Перезагружаем данные группы
        await fetchGroup()
      } else {
        const error = await response.json()
        alert(`Ошибка удаления курса: ${error.error}`)
      }
    } catch (error) {
      console.error('Error removing course from group:', error)
      alert('Ошибка удаления курса из группы')
    }
  }

  // Функции для работы с событиями
  const handleEventCreate = () => {
    setEditingEventId(undefined)
    setShowEventModal(true)
  }

  const handleEventEdit = (eventId: string) => {
    setEditingEventId(eventId)
    setShowEventModal(true)
  }

  const handleEventSubmit = async (eventData: {
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    groupId: string;
  }) => {
    try {
      const url = editingEventId 
        ? `/api/events/${editingEventId}` 
        : '/api/events'
      
      const method = editingEventId ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      })

      if (response.ok) {
        setShowEventModal(false)
        setEditingEventId(undefined)
        // Календарь автоматически обновится
      } else {
        const error = await response.json()
        alert(`Ошибка: ${error.error}`)
      }
    } catch (error) {
      console.error('Error saving event:', error)
      alert('Ошибка сохранения события')
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

  const removeStudentFromGroup = async (studentId: string, studentName: string) => {
    if (!confirm(`Вы уверены, что хотите удалить студента "${studentName}" из группы? Это действие нельзя отменить.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/groups/${resolvedParams.id}/students?studentId=${studentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Перезагружаем данные группы
        await fetchGroup()
      } else {
        const error = await response.json()
        alert(`Ошибка удаления студента: ${error.error}`)
      }
    } catch (error) {
      console.error('Error removing student from group:', error)
      alert('Ошибка удаления студента из группы')
    }
  }

  const removeTeacherFromGroup = async (teacherId: string, teacherName: string) => {
    if (!confirm(`Вы уверены, что хотите удалить преподавателя "${teacherName}" из группы? Это действие нельзя отменить.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/groups/${resolvedParams.id}/teachers?teacherId=${teacherId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Перезагружаем данные группы
        await fetchGroup()
      } else {
        const error = await response.json()
        alert(`Ошибка удаления преподавателя: ${error.error}`)
      }
    } catch (error) {
      console.error('Error removing teacher from group:', error)
      alert('Ошибка удаления преподавателя из группы')
    }
  }

  const removeAssignmentFromGroup = async (assignmentId: string, assignmentTitle: string) => {
    if (!confirm(`Вы уверены, что хотите удалить задание "${assignmentTitle}" из группы? Это действие нельзя отменить.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/groups/${resolvedParams.id}/assignments?assignmentId=${assignmentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Перезагружаем данные группы
        await fetchGroup()
      } else {
        const error = await response.json()
        alert(`Ошибка удаления задания: ${error.error}`)
      }
    } catch (error) {
      console.error('Error removing assignment from group:', error)
      alert('Ошибка удаления задания из группы')
    }
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

  const tabs: { id: TabId; label: string; icon: any }[] = [
    { id: 'overview', label: 'Обзор', icon: Activity },
    { id: 'students', label: `Студенты (${group.students.length})`, icon: Users },
    { id: 'teachers', label: `Преподаватели (${group.teachers.length})`, icon: GraduationCap },
    { id: 'courses', label: `Курсы (${group.courses.length})`, icon: BookOpen },
    { id: 'assignments', label: `Задания (${group.assignments.length})`, icon: Target },
    { id: 'schedule', label: 'Расписание', icon: CalendarIcon },
    { id: 'chat', label: 'Чат', icon: MessageCircle }
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
                onClick={() => router.push(`/admin/groups/${resolvedParams.id}/schedule`)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Calendar className="w-4 h-4" />
                Расписание
              </button>
              <button
                onClick={() => router.push(`/admin/groups/${resolvedParams.id}/attendance`)}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <ClipboardList className="w-4 h-4" />
                Посещаемость
              </button>
              
              <div className="flex items-center gap-2 ml-2">
                <button
                  onClick={() => router.push(`/admin/groups/${resolvedParams.id}/edit`)}
                  className="w-12 h-12 flex items-center justify-center text-indigo-600 hover:text-white hover:bg-indigo-600 rounded-xl transition-all duration-200 hover:scale-110 shadow-md hover:shadow-lg border-2 border-indigo-200 hover:border-indigo-600 backdrop-blur-sm"
                  title="Редактировать"
                >
                  <Edit className="w-5 h-5" />
                </button>
                
                <button
                  onClick={() => router.push(`/admin/groups/${resolvedParams.id}/analytics`)}
                  className="w-12 h-12 flex items-center justify-center text-purple-600 hover:text-white hover:bg-purple-600 rounded-xl transition-all duration-200 hover:scale-110 shadow-md hover:shadow-lg border-2 border-purple-200 hover:border-purple-600 backdrop-blur-sm"
                  title="Аналитика"
                >
                  <TrendingUp className="w-5 h-5" />
                </button>
                
                <button
                  className="w-12 h-12 flex items-center justify-center text-emerald-600 hover:text-white hover:bg-emerald-600 rounded-xl transition-all duration-200 hover:scale-110 shadow-md hover:shadow-lg border-2 border-emerald-200 hover:border-emerald-600 backdrop-blur-sm"
                  title="Настройки"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>
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
                    onClick={() => setActiveTab(tab.id)}
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
                  <button 
                    onClick={() => setShowStudentManagementModal(true)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
                  >
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
                        <button 
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                          title="Просмотр профиля"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => removeStudentFromGroup(student.user.id, student.user.name)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                          title="Удалить из группы"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {group.students.length === 0 && (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500 mb-4">В группе пока нет студентов</p>
                      <button 
                        onClick={() => setShowStudentManagementModal(true)}
                        className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-emerald-400 hover:bg-emerald-50"
                      >
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
                  <button 
                    onClick={() => setShowTeacherManagementModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
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
                        <button 
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                          title="Просмотр профиля"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => removeTeacherFromGroup(teacher.user.id, teacher.user.name)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                          title="Удалить из группы"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {group.teachers.length === 0 && (
                    <div className="text-center py-12">
                      <GraduationCap className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500 mb-4">В группе пока нет преподавателей</p>
                      <button 
                        onClick={() => setShowTeacherManagementModal(true)}
                        className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50"
                      >
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
                  <button 
                    onClick={() => setShowCourseAssignmentModal(true)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                  >
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
                        <button 
                          onClick={() => router.push(`/courses/${groupCourse.course.id}`)}
                          className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg"
                          title="Просмотр курса"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => removeCourseFromGroup(groupCourse.course.id, groupCourse.course.title)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                          title="Удалить курс из группы"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {group.courses.length === 0 && (
                    <div className="text-center py-12">
                      <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500 mb-4">Группе не назначены курсы</p>
                      <button 
                        onClick={() => setShowCourseAssignmentModal(true)}
                        className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50"
                      >
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
                  <button 
                    onClick={() => setShowAssignmentCreationModal(true)}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center gap-2"
                  >
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
                        <button 
                          onClick={() => router.push(`/admin/assignments/${groupAssignment.assignment.id}`)}
                          className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg"
                          title="Просмотр задания"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => removeAssignmentFromGroup(groupAssignment.assignment.id, groupAssignment.assignment.title)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                          title="Удалить задание из группы"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {group.assignments.length === 0 && (
                    <div className="text-center py-12">
                      <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500 mb-4">У группы пока нет заданий</p>
                      <button 
                        onClick={() => setShowAssignmentCreationModal(true)}
                        className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-amber-400 hover:bg-amber-50"
                      >
                        Создать первое задание
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'schedule' && (
              <div className="h-[380px] overflow-hidden">
                <CalendarComponent
                  groupId={group.id}
                  canCreateEvents={session?.user?.role === 'ADMIN' || session?.user?.role === 'TEACHER'}
                  onEventCreate={handleEventCreate}
                  onEventEdit={handleEventEdit}
                />
              </div>
            )}

            {activeTab === 'chat' && (
              <div className="h-[600px]">
                <GroupChat 
                  groupId={group.id} 
                  groupName={group.name}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Модальное окно назначения курсов */}
      {group && (
        <CourseAssignmentModal
          isOpen={showCourseAssignmentModal}
          onClose={() => setShowCourseAssignmentModal(false)}
          groupId={group.id}
          groupName={group.name}
          assignedCourseIds={group.courses.map(gc => gc.course.id)}
          onAssignSuccess={() => {
            fetchGroup() // Перезагружаем данные группы
          }}
        />
      )}

      {/* Модальное окно управления студентами */}
      {group && (
        <StudentManagementModal
          isOpen={showStudentManagementModal}
          onClose={() => setShowStudentManagementModal(false)}
          groupId={group.id}
          groupName={group.name}
          assignedStudentIds={group.students.map(gs => gs.user.id)}
          onAddSuccess={() => {
            fetchGroup() // Перезагружаем данные группы
          }}
        />
      )}

      {/* Модальное окно управления преподавателями */}
      {group && (
        <TeacherManagementModal
          isOpen={showTeacherManagementModal}
          onClose={() => setShowTeacherManagementModal(false)}
          groupId={group.id}
          groupName={group.name}
          assignedTeacherIds={group.teachers.map(gt => gt.user.id)}
          onAddSuccess={() => {
            fetchGroup() // Перезагружаем данные группы
          }}
        />
      )}

      {/* Модальное окно создания заданий */}
      {group && (
        <AssignmentCreationModal
          isOpen={showAssignmentCreationModal}
          onClose={() => setShowAssignmentCreationModal(false)}
          groupId={group.id}
          onAssignmentCreated={fetchGroup}
        />
      )}

      {/* Модальное окно создания/редактирования событий */}
      <EventModal
        isOpen={showEventModal}
        onClose={() => {
          setShowEventModal(false)
          setEditingEventId(undefined)
        }}
        onSubmit={handleEventSubmit}
        eventId={editingEventId}
        groupId={group?.id}
      />
    </div>
  )
}
