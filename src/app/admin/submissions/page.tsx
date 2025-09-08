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
  GraduationCap
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
    dueDate: string
    module: {
      title: string
      course: {
        id: string
        title: string
        direction: string
      }
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
      const response = await fetch(`/api/teacher/submissions?status=${filter}`)
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

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = 
      submission.assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.assignment.lesson.module.course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.groups.some(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()))
    
    return matchesSearch
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (submission: Submission) => {
    if (submission.gradedAt) {
      return submission.score! >= 4 ? 'text-green-600' : 
             submission.score! >= 3 ? 'text-yellow-600' : 'text-red-600'
    }
    
    const isOverdue = new Date() > new Date(submission.assignment.dueDate)
    return isOverdue ? 'text-red-600' : 'text-blue-600'
  }

  const getStatusIcon = (submission: Submission) => {
    if (submission.gradedAt) {
      return <CheckCircle className="w-4 h-4" />
    }
    
    const isOverdue = new Date() > new Date(submission.assignment.dueDate)
    return isOverdue ? <AlertCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />
  }

  const getStatusText = (submission: Submission) => {
    if (submission.gradedAt) {
      return `Проверено (${submission.score}/5)`
    }
    
    const isOverdue = new Date() > new Date(submission.assignment.dueDate)
    return isOverdue ? 'Просрочено' : 'На проверке'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка сдач...</p>
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
                onClick={() => router.push('/admin')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Проверка заданий
                </h1>
                <p className="text-gray-600">Сдачи заданий от студентов</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Всего сдач</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">На проверке</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.ungraded}</p>
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
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Средний балл</p>
                <p className="text-2xl font-bold text-blue-600">{stats.averageScore}</p>
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
                  placeholder="Поиск по заданию, студенту, курсу, группе..."
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
                <option value="all">Все сдачи</option>
                <option value="ungraded">На проверке</option>
                <option value="graded">Проверенные</option>
              </select>
            </div>
          </div>
        </div>

        {/* Список сдач */}
        <div className="space-y-4">
          {filteredSubmissions.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Сдач не найдено</h3>
              <p className="text-gray-600">
                {searchTerm || filter !== 'all' 
                  ? 'Попробуйте изменить фильтры поиска' 
                  : 'Пока нет сдач от студентов'}
              </p>
            </div>
          ) : (
            filteredSubmissions.map((submission) => (
              <div key={submission.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{submission.assignment.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {submission.user.name}
                            </span>
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-4 h-4" />
                              {submission.assignment.lesson.module.course.title}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {submission.groups.map(g => g.name).join(', ')}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Сдано: {formatDate(submission.submittedAt)}
                        </span>
                        {submission.gradedAt && (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Проверено: {formatDate(submission.gradedAt)}
                          </span>
                        )}
                      </div>

                      {submission.content && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <h4 className="font-medium text-gray-900 mb-2">Решение студента:</h4>
                          <p className="text-gray-700 text-sm line-clamp-3">{submission.content}</p>
                        </div>
                      )}

                      {submission.feedback && (
                        <div className="bg-blue-50 rounded-lg p-4 mb-4">
                          <h4 className="font-medium text-gray-900 mb-2">Ваш комментарий:</h4>
                          <p className="text-gray-700 text-sm">{submission.feedback}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-3 ml-6">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(submission)}`}>
                        {getStatusIcon(submission)}
                        {getStatusText(submission)}
                      </span>

                      <div className="flex gap-2">
                        {submission.fileUrl && (
                          <a
                            href={submission.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Скачать файл"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                        
                        <button
                          onClick={() => openGradingModal(submission)}
                          className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                          title={submission.gradedAt ? "Изменить оценку" : "Оценить"}
                        >
                          {submission.gradedAt ? <Edit className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
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

      {/* Модальное окно оценивания */}
      {showGradingModal && selectedSubmission && (
        <GradingModal
          submission={selectedSubmission}
          onClose={() => {
            setShowGradingModal(false)
            setSelectedSubmission(null)
          }}
          onSuccess={() => {
            setShowGradingModal(false)
            setSelectedSubmission(null)
            fetchSubmissions()
          }}
        />
      )}
    </div>
  )
}


