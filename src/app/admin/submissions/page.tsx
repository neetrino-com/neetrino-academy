'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  ArrowLeft,
  FileText, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Users,
  BookOpen,
  Download,
  Eye,
  Edit,
  Search,
  Filter,
  Star,
  Calendar,
  User,
  GraduationCap,
  Target,
  Award,
  TrendingUp
} from 'lucide-react'
import GradingModal from '@/components/admin/GradingModal'

interface Submission {
  id: string
  content: string | null
  fileUrl: string | null
  submittedAt: string
  score: number | null
  feedback: string | null
  gradedAt: string | null
  user: {
    id: string
    name: string
    email: string
    avatar: string | null
  }
  assignment: {
    id: string
    title: string
    description: string | null
    dueDate: string | null
    maxScore: number | null
    lesson: {
      id: string
      title: string
      module: {
        title: string
        course: {
          id: string
          title: string
          direction: string
        }
      }
    }
    creator: {
      id: string
      name: string
      email: string
    }
  }
  groups: Array<{
    id: string
    name: string
  }>
}

interface SubmissionStats {
  total: number
  ungraded: number
  graded: number
  averageScore: number
}

export default function SubmissionsManagement() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all') // all, ungraded, graded
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [showGradingModal, setShowGradingModal] = useState(false)
  const [stats, setStats] = useState<SubmissionStats>({
    total: 0,
    ungraded: 0,
    graded: 0,
    averageScore: 0
  })

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
      return
    }

    // Проверяем роль пользователя
    if (session.user.role !== 'ADMIN' && session.user.role !== 'TEACHER') {
      router.push('/dashboard')
      return
    }

    fetchSubmissions()
  }, [session, status, router, filter])

  const fetchSubmissions = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/submissions?status=${filter}`)
      if (response.ok) {
        const data = await response.json()
        setSubmissions(data)
        
        // Подсчет статистики
        const total = data.length
        const ungraded = data.filter((s: Submission) => !s.gradedAt).length
        const graded = data.filter((s: Submission) => s.gradedAt).length
        const totalScore = data.reduce((acc: number, s: Submission) => acc + (s.score || 0), 0)
        const averageScore = graded > 0 ? Math.round((totalScore / graded) * 100) / 100 : 0
        
        setStats({ total, ungraded, graded, averageScore })
      }
    } catch (error) {
      console.error('Ошибка загрузки сдач:', error)
    } finally {
      setLoading(false)
    }
  }

  const openGradingModal = (submission: Submission) => {
    setSelectedSubmission(submission)
    setShowGradingModal(true)
  }

  const closeGradingModal = () => {
    setSelectedSubmission(null)
    setShowGradingModal(false)
  }

  const handleGradingSuccess = () => {
    fetchSubmissions()
    closeGradingModal()
  }

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = 
      submission.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.assignment.lesson.module.course.title.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (submission: Submission) => {
    if (submission.gradedAt) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Проверено
        </span>
      )
    }
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        Ожидает проверки
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        {/* Заголовок */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Управление сдачами</h1>
          </div>
          <p className="text-gray-600">Проверка и оценка всех сдач заданий</p>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Target className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Всего сдач</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ожидают проверки</p>
                <p className="text-2xl font-bold text-gray-900">{stats.ungraded}</p>
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
              <TrendingUp className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Средняя оценка</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageScore}</p>
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
                  placeholder="Поиск по студенту, заданию или курсу..."
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
                <option value="all">Все сдачи</option>
                <option value="ungraded">Ожидают проверки</option>
                <option value="graded">Проверено</option>
              </select>
            </div>
          </div>
        </div>

        {/* Список сдач */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Студенческие работы</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredSubmissions.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Сдач не найдено</h3>
                <p className="text-gray-600">
                  {searchTerm || filter !== 'all' 
                    ? 'Попробуйте изменить фильтры поиска'
                    : 'Пока нет сдач заданий'
                  }
                </p>
              </div>
            ) : (
              filteredSubmissions.map((submission) => (
                <div key={submission.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {submission.user.name}
                        </h3>
                        {getStatusBadge(submission)}
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{submission.user.email}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          <span>{submission.assignment.lesson.module.course.title}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          <span>{submission.assignment.title}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Сдано: {formatDate(submission.submittedAt)}</span>
                        </div>
                        
                        {submission.assignment.dueDate && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>Дедлайн: {formatDate(submission.assignment.dueDate)}</span>
                          </div>
                        )}
                      </div>

                      {/* Группы */}
                      {submission.groups.length > 0 && (
                        <div className="flex items-center gap-2 mb-3">
                          <Users className="w-4 h-4 text-gray-400" />
                          <div className="flex flex-wrap gap-1">
                            {submission.groups.map((group) => (
                              <span
                                key={group.id}
                                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                              >
                                {group.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Содержимое сдачи */}
                      {submission.content && (
                        <div className="bg-gray-50 p-3 rounded-lg mb-3">
                          <p className="text-sm text-gray-700 line-clamp-3">
                            {submission.content}
                          </p>
                        </div>
                      )}

                      {/* Файл */}
                      {submission.fileUrl && (
                        <div className="flex items-center gap-2 mb-3">
                          <Download className="w-4 h-4 text-gray-400" />
                          <a
                            href={submission.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            Скачать файл
                          </a>
                        </div>
                      )}

                      {/* Оценка */}
                      {submission.score !== null && (
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm font-medium text-gray-900">
                            Оценка: {submission.score}
                            {submission.assignment.maxScore && `/${submission.assignment.maxScore}`}
                          </span>
                          {submission.gradedAt && (
                            <span className="text-sm text-gray-600">
                              ({formatDate(submission.gradedAt)})
                            </span>
                          )}
                        </div>
                      )}

                      {/* Обратная связь */}
                      {submission.feedback && (
                        <div className="mt-2 p-3 bg-yellow-50 rounded-lg">
                          <p className="text-sm text-gray-700">
                            <strong>Обратная связь:</strong> {submission.feedback}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {!submission.gradedAt ? (
                        <button
                          onClick={() => openGradingModal(submission)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                          Проверить
                        </button>
                      ) : (
                        <button
                          onClick={() => openGradingModal(submission)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          Просмотреть
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Модальное окно оценки */}
        {showGradingModal && selectedSubmission && (
          <GradingModal
            submission={selectedSubmission}
            onClose={closeGradingModal}
            onSuccess={handleGradingSuccess}
          />
        )}
      </div>
    </div>
  )
}