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
                         assignment.course?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.lesson?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.group?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filter === 'all' || assignment.status === filter
    const matchesSource = sourceFilter === 'all' || assignment.source === sourceFilter
    
    return matchesSearch && matchesStatus && matchesSource
  })

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      submitted: 'bg-blue-100 text-blue-800 border-blue-200',
      graded: 'bg-green-100 text-green-800 border-green-200',
      overdue: 'bg-red-100 text-red-800 border-red-200',
      due_soon: 'bg-orange-100 text-orange-800 border-orange-200'
    }
    
    const labels = {
      pending: 'Ожидает',
      submitted: 'Сдано',
      graded: 'Проверено',
      overdue: 'Просрочено',
      due_soon: 'Скоро дедлайн'
    }

    return (
      <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${badges[status as keyof typeof badges]}`}>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="flex">
      <StudentSidebar />
      
      <div className="flex-1">
        <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Заголовок */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-8 mb-8 text-white">
              <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <div>
                    <h1 className="text-4xl font-bold mb-2">Мои задания</h1>
                    <p className="text-xl text-blue-100 opacity-90">
                      Все задания из курсов и групп
                  </p>
                </div>
              </div>
            </div>

            {/* Статистика */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <Target className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Всего</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    </div>
                </div>
              </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center">
                    <div className="p-3 bg-yellow-100 rounded-xl">
                      <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Ожидают</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                    </div>
                </div>
              </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <Upload className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Сдано</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.submitted}</p>
                    </div>
                </div>
              </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center">
                    <div className="p-3 bg-green-100 rounded-xl">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Проверено</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.graded}</p>
                    </div>
                </div>
              </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center">
                    <div className="p-3 bg-red-100 rounded-xl">
                      <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Просрочено</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.overdue}</p>
                    </div>
                </div>
              </div>
            </div>

              {/* Фильтры */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 mb-8">
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
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                      />
                    </div>
                  </div>

                  {/* Фильтры */}
                  <div className="flex gap-3">
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                    >
                      <option value="all">Все статусы</option>
                      <option value="pending">Ожидают</option>
                      <option value="submitted">Сдано</option>
                      <option value="graded">Проверено</option>
                      <option value="overdue">Просрочено</option>
                    </select>

                    <select
                      value={sourceFilter}
                      onChange={(e) => setSourceFilter(e.target.value)}
                      className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                    >
                      <option value="all">Все источники</option>
                      <option value="course">Из курса</option>
                      <option value="group">Из группы</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Список заданий */}
              <div className="space-y-6">
                {filteredAssignments.length === 0 ? (
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 text-center border border-white/20">
                    <Target className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                    <h3 className="text-2xl font-semibold text-gray-900 mb-3">Заданий не найдено</h3>
                    <p className="text-gray-600 text-lg">
                      {searchTerm || filter !== 'all' || sourceFilter !== 'all' 
                        ? 'Попробуйте изменить фильтры поиска'
                        : 'У вас пока нет заданий'
                      }
                    </p>
                  </div>
                ) : (
                  filteredAssignments.map((assignment) => (
                    <div key={assignment.id} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                      <div className="p-8">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-4">
                              <h3 className="text-2xl font-bold text-gray-900">{assignment.title}</h3>
                              {getStatusBadge(assignment.status)}
                              <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 rounded-full text-sm text-blue-700">
                                {getSourceIcon(assignment.source)}
                                <span>{getSourceLabel(assignment.source)}</span>
                              </div>
                            </div>
                            
                            {assignment.description && (
                              <p className="text-gray-600 mb-6 text-lg leading-relaxed">{assignment.description}</p>
                            )}
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                              {assignment.course && (
                                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                                  <BookOpen className="w-5 h-5 text-blue-600" />
                                  <div>
                                    <p className="text-sm text-gray-600">Курс</p>
                                    <p className="font-semibold text-gray-900">{assignment.course.title}</p>
                                  </div>
                                </div>
                              )}
                              
                              {assignment.lesson && (
                                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                                  <FileText className="w-5 h-5 text-green-600" />
                                  <div>
                                    <p className="text-sm text-gray-600">Урок</p>
                                    <p className="font-semibold text-gray-900">{assignment.lesson.title}</p>
                                  </div>
                                </div>
                              )}
                              
                              {assignment.group && (
                                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
                                  <Users className="w-5 h-5 text-purple-600" />
                                  <div>
                                    <p className="text-sm text-gray-600">Группа</p>
                                    <p className="font-semibold text-gray-900">{assignment.group.name}</p>
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl">
                                <Calendar className="w-5 h-5 text-orange-600" />
                                <div>
                                  <p className="text-sm text-gray-600">Дедлайн</p>
                                  <p className="font-semibold text-gray-900">{formatDate(assignment.dueDate)}</p>
                                </div>
                              </div>
                            </div>

                            {assignment.maxScore && (
                              <div className="flex items-center gap-2 mb-6">
                                <Award className="w-5 h-5 text-yellow-600" />
                                <span className="text-lg font-semibold text-gray-900">
                                  Максимальный балл: {assignment.maxScore}
                                </span>
                              </div>
                            )}

                            {/* Информация о сдаче */}
                            {assignment.submission && (
                              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-2xl border border-green-200 mb-6">
                                <div className="flex items-center gap-3 mb-4">
                                  <CheckCircle className="w-6 h-6 text-green-600" />
                                  <span className="text-lg font-semibold text-gray-900">Задание сдано</span>
                                  <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full">
                                    {formatDate(assignment.submission.submittedAt)}
                                  </span>
                                </div>
                                
                                {assignment.submission.score !== null && (
                                  <div className="flex items-center gap-3 mb-3">
                                    <Award className="w-5 h-5 text-yellow-600" />
                                    <span className="text-lg font-bold text-gray-900">
                                      Оценка: {assignment.submission.score}
                                      {assignment.maxScore && `/${assignment.maxScore}`}
                                    </span>
                                  </div>
                                )}
                                
                                {assignment.submission.feedback && (
                                  <div className="bg-white/60 p-4 rounded-xl">
                                    <p className="text-sm font-medium text-gray-700 mb-1">Обратная связь:</p>
                                    <p className="text-gray-600">{assignment.submission.feedback}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-3 ml-6">
                            <Link
                              href={`/assignments/${assignment.id}`}
                              className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 font-semibold"
                            >
                              <Eye className="w-5 h-5" />
                              {assignment.submission ? 'Просмотреть' : 'Выполнить'}
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}