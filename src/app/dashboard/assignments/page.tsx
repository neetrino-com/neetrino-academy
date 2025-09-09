'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import StudentSidebar from '@/components/dashboard/StudentSidebar'
import { 
  Target, 
  Clock, 
  AlertCircle,
  CheckCircle,
  Upload,
  Eye,
  Calendar,
  FileText,
  Users,
  TrendingUp,
  Award,
  ArrowRight,
  Plus,
  Filter,
  Search,
  BookOpen,
  GraduationCap
} from 'lucide-react'

interface Assignment {
  id: string
  title: string
  description: string | null
  dueDate: string | null
  type: string
  status: string
  maxScore: number | null
  source: 'course' | 'group'
  course: {
    id: string
    title: string
    direction: string
  }
  lesson: {
    id: string
    title: string
          module: {
      title: string
    }
  }
          creator: {
    id: string
    name: string
    email: string
  }
      group: {
    id: string
    name: string
  } | null
  submission: {
    id: string
    content: string | null
    fileUrl: string | null
    submittedAt: string
    score: number | null
    feedback: string | null
    gradedAt: string | null
  } | null
  status: 'pending' | 'submitted' | 'graded' | 'overdue' | 'due_soon'
}

interface Stats {
  total: number
  pending: number
  submitted: number
  graded: number
  overdue: number
}

export default function StudentAssignmentsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all') // all, pending, submitted, graded, overdue
  const [sourceFilter, setSourceFilter] = useState('all') // all, course, group
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    submitted: 0,
    graded: 0,
    overdue: 0
  })

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
      return
    }

    fetchAssignments()
  }, [session, status, router])

  const fetchAssignments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/student/assignments')
      if (response.ok) {
        const data = await response.json()
        setAssignments(data)

  // Подсчет статистики
        const stats = data.reduce((acc: Stats, assignment: Assignment) => {
          acc.total++
          acc[assignment.status]++
          return acc
        }, { total: 0, pending: 0, submitted: 0, graded: 0, overdue: 0 })
        
        setStats(stats)
      }
    } catch (error) {
      console.error('Ошибка загрузки заданий:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.course.title.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filter === 'all' || assignment.status === filter
    const matchesSource = sourceFilter === 'all' || assignment.source === sourceFilter
    
    return matchesSearch && matchesStatus && matchesSource
  })

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      submitted: 'bg-blue-100 text-blue-800',
      graded: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      due_soon: 'bg-orange-100 text-orange-800'
    }
    
    const labels = {
      pending: 'Ожидает',
      submitted: 'Сдано',
      graded: 'Проверено',
      overdue: 'Просрочено',
      due_soon: 'Скоро дедлайн'
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  const getSourceIcon = (source: string) => {
    return source === 'course' ? (
      <BookOpen className="w-4 h-4 text-blue-600" />
    ) : (
      <GraduationCap className="w-4 h-4 text-green-600" />
    )
  }

  const getSourceLabel = (source: string) => {
    return source === 'course' ? 'Из курса' : 'Из группы'
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Без дедлайна'
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          <StudentSidebar />
          <div className="flex-1 p-6">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
      <StudentSidebar />
      
        <div className="flex-1 p-6">
            {/* Заголовок */}
            <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Мои задания</h1>
            <p className="text-gray-600">Все задания из курсов и групп</p>
                </div>

          {/* Статистика */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <Target className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Всего</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                <Clock className="w-8 h-8 text-yellow-600" />
                  <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ожидают</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                  </div>
                </div>
              </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                <Upload className="w-8 h-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Сдано</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.submitted}</p>
                </div>
                </div>
              </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Проверено</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.graded}</p>
                </div>
                </div>
              </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Просрочено</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.overdue}</p>
                </div>
                </div>
              </div>
            </div>

          {/* Фильтры */}
          <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Поиск */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Поиск по названию, описанию или курсу..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Фильтр по статусу */}
              <div className="flex gap-2">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Все статусы</option>
                  <option value="pending">Ожидают</option>
                  <option value="submitted">Сдано</option>
                  <option value="graded">Проверено</option>
                  <option value="overdue">Просрочено</option>
                </select>

                {/* Фильтр по источнику */}
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Все источники</option>
                  <option value="course">Из курса</option>
                  <option value="group">Из группы</option>
                </select>
              </div>
              </div>
            </div>

            {/* Список заданий */}
          <div className="space-y-4">
            {filteredAssignments.length === 0 ? (
              <div className="bg-white p-12 rounded-lg shadow-sm border text-center">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Заданий не найдено</h3>
                <p className="text-gray-600">
                  {searchTerm || filter !== 'all' || sourceFilter !== 'all' 
                    ? 'Попробуйте изменить фильтры поиска'
                    : 'У вас пока нет заданий'
                  }
                </p>
                </div>
              ) : (
              filteredAssignments.map((assignment) => (
                <div key={assignment.id} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{assignment.title}</h3>
                        {getStatusBadge(assignment.status)}
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          {getSourceIcon(assignment.source)}
                          <span>{getSourceLabel(assignment.source)}</span>
                            </div>
                          </div>
                          
                      {assignment.description && (
                        <p className="text-gray-600 mb-3 line-clamp-2">{assignment.description}</p>
                      )}
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          <span>{assignment.course.title}</span>
                            </div>
                        
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          <span>{assignment.lesson.title}</span>
                            </div>
                        
                        {assignment.group && (
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{assignment.group.name}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Дедлайн: {formatDate(assignment.dueDate)}</span>
                        </div>
                        
                        {assignment.maxScore && (
                          <div className="flex items-center gap-1">
                            <Award className="w-4 h-4" />
                            <span>Макс. балл: {assignment.maxScore}</span>
                              </div>
                              )}
                            </div>

                      {/* Информация о сдаче */}
                      {assignment.submission && (
                        <div className="bg-gray-50 p-3 rounded-lg mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-gray-900">Сдано</span>
                            <span className="text-sm text-gray-600">
                              {formatDate(assignment.submission.submittedAt)}
                            </span>
                              </div>
                          
                          {assignment.submission.score !== null && (
                            <div className="flex items-center gap-2">
                              <Award className="w-4 h-4 text-yellow-600" />
                              <span className="text-sm font-medium text-gray-900">
                                Оценка: {assignment.submission.score}
                                {assignment.maxScore && `/${assignment.maxScore}`}
                              </span>
                            </div>
                          )}
                          
                          {assignment.submission.feedback && (
                            <p className="text-sm text-gray-600 mt-1">
                              {assignment.submission.feedback}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                          <Link
                        href={`/assignments/${assignment.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            {assignment.submission ? 'Просмотреть' : 'Выполнить'}
                          </Link>
                        </div>
                      </div>
                    </div>
              ))
              )}
          </div>
        </div>
      </div>
    </div>
  )
}