'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  ArrowLeft,
  Target, 
  Clock, 
  AlertCircle,
  CheckCircle,
  FileText,
  Calendar,
  BookOpen,
  Upload,
  Eye,
  Filter,
  Search,
  Users
} from 'lucide-react'

interface Assignment {
  id: string
  assignmentId: string
  dueDate: string
  assignedAt: string
  assignment: {
    id: string
    title: string
    description: string | null
    dueDate: string
    module: {
      title: string
      course: {
        id: string
        title: string
        direction: string
      }
    }
    creator: {
      id: string
      name: string
      email: string
    }
  }
  group: {
    id: string
    name: string
  }
  submission: {
    id: string
    content: string | null
    fileUrl: string | null
    submittedAt: string
    score: number | null
    feedback: string | null
    gradedAt: string | null
  } | null
  status: 'pending' | 'due_soon' | 'overdue' | 'submitted' | 'graded'
}

interface Stats {
  total: number
  pending: number
  submitted: number
  graded: number
  overdue: number
}

export default function StudentAssignments() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all') // all, pending, submitted, graded, overdue
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

    // Только студенты могут видеть эту страницу
    if (session.user.role !== 'STUDENT') {
      router.push('/')
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
        const stats = data.reduce((acc: any, assignment: Assignment) => {
          acc.total++
          acc[assignment.status]++
          return acc
        }, { total: 0, pending: 0, submitted: 0, graded: 0, overdue: 0, due_soon: 0 })
        
        setStats({
          total: stats.total,
          pending: stats.pending + stats.due_soon,
          submitted: stats.submitted,
          graded: stats.graded,
          overdue: stats.overdue
        })
      }
    } catch (error) {
      console.error('Ошибка загрузки заданий:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.assignment.module.course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.group.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (filter === 'all') return matchesSearch
    if (filter === 'pending') return matchesSearch && (assignment.status === 'pending' || assignment.status === 'due_soon')
    return matchesSearch && assignment.status === filter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'due_soon': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200'
      case 'submitted': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'graded': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'К выполнению'
      case 'due_soon': return 'Скоро дедлайн'
      case 'overdue': return 'Просрочено'
      case 'submitted': return 'Сдано'
      case 'graded': return 'Проверено'
      default: return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'due_soon': return <AlertCircle className="w-4 h-4" />
      case 'overdue': return <AlertCircle className="w-4 h-4" />
      case 'submitted': return <Upload className="w-4 h-4" />
      case 'graded': return <CheckCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDaysUntilDue = (dueDate: string) => {
    const now = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return `Просрочено на ${Math.abs(diffDays)} дн.`
    if (diffDays === 0) return 'Сегодня'
    if (diffDays === 1) return 'Завтра'
    return `Через ${diffDays} дн.`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка заданий...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Заголовок */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Мои задания
                </h1>
                <p className="text-gray-600">Задания из ваших групп</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Всего</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">К выполнению</p>
                <p className="text-2xl font-bold text-blue-600">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Upload className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Сдано</p>
                <p className="text-2xl font-bold text-purple-600">{stats.submitted}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Проверено</p>
                <p className="text-2xl font-bold text-green-600">{stats.graded}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Просрочено</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Фильтры и поиск */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Поиск заданий..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">Все задания</option>
                <option value="pending">К выполнению</option>
                <option value="submitted">Сданные</option>
                <option value="graded">Проверенные</option>
                <option value="overdue">Просроченные</option>
              </select>
            </div>
          </div>
        </div>

        {/* Список заданий */}
        <div className="space-y-4">
          {filteredAssignments.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
              <Target className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Заданий не найдено</h3>
              <p className="text-gray-600">
                {searchTerm || filter !== 'all' 
                  ? 'Попробуйте изменить фильтры поиска' 
                  : 'У вас пока нет заданий в группах'}
              </p>
            </div>
          ) : (
            filteredAssignments.map((assignment) => (
              <div key={assignment.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                          <Target className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{assignment.assignment.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-4 h-4" />
                              {assignment.assignment.module.course.title} • {assignment.assignment.module.title}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {assignment.group.name}
                            </span>
                          </div>
                        </div>
                      </div>

                      {assignment.assignment.description && (
                        <p className="text-gray-700 mb-4 leading-relaxed">
                          {assignment.assignment.description}
                        </p>
                      )}

                      <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Дедлайн: {formatDate(assignment.dueDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {getDaysUntilDue(assignment.dueDate)}
                        </span>
                      </div>

                      {assignment.submission && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">Ваша сдача</h4>
                            <span className="text-sm text-gray-600">
                              Сдано: {formatDate(assignment.submission.submittedAt)}
                            </span>
                          </div>
                          {assignment.submission.score !== null && (
                            <div className="mb-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded text-sm font-medium ${
                                assignment.submission.score >= 4 ? 'bg-green-100 text-green-800' :
                                assignment.submission.score >= 3 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                Оценка: {assignment.submission.score}/5
                              </span>
                            </div>
                          )}
                          {assignment.submission.feedback && (
                            <p className="text-gray-700 text-sm">
                              <strong>Обратная связь:</strong> {assignment.submission.feedback}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-3 ml-6">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(assignment.status)}`}>
                        {getStatusIcon(assignment.status)}
                        {getStatusText(assignment.status)}
                      </span>

                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/assignments/${assignment.assignment.id}`)}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Открыть
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
