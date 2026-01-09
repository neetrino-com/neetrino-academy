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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Загрузка сдач...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Современный хедер */}
      <div className="border-b border-slate-200/40 rounded-b-2xl mx-6 mt-6">
        <div className="w-full px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Управление сдачами 📝
                </h1>
                <p className="text-slate-600 mt-1 font-medium">
                  Проверка и оценка всех сдач заданий
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg px-3 py-2">
                <p className="text-sm text-emerald-700 font-semibold">
                  {stats.ungraded > 0 ? `${stats.ungraded} работ ожидают проверки` : 'Все работы проверены'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-blue-200/80 hover:shadow-2xl transition-all duration-300 group hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-semibold">Всего сдач</p>
                <p className="text-3xl font-bold mt-1 text-gray-900">{stats.total}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl p-4 group-hover:scale-110 transition-transform duration-300">
                <Target className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-yellow-200/80 hover:shadow-2xl transition-all duration-300 group hover:bg-gradient-to-br hover:from-yellow-50 hover:to-amber-50 hover:border-yellow-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 font-semibold">Ожидают проверки</p>
                <p className="text-3xl font-bold mt-1 text-gray-900">{stats.ungraded}</p>
              </div>
              <div className="bg-gradient-to-br from-yellow-100 to-amber-100 rounded-2xl p-4 group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-green-200/80 hover:shadow-2xl transition-all duration-300 group hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 hover:border-green-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-semibold">Проверено</p>
                <p className="text-3xl font-bold mt-1 text-gray-900">{stats.graded}</p>
              </div>
              <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl p-4 group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-purple-200/80 hover:shadow-2xl transition-all duration-300 group hover:bg-gradient-to-br hover:from-purple-50 hover:to-violet-50 hover:border-purple-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-semibold">Средняя оценка</p>
                <p className="text-3xl font-bold mt-1 text-gray-900">{stats.averageScore}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-100 to-violet-100 rounded-2xl p-4 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Поиск и фильтры */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Поиск по студенту, заданию или курсу..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">Все сдачи</option>
              <option value="ungraded">Ожидают проверки</option>
              <option value="graded">Проверено</option>
            </select>
          </div>
        </div>

        {/* Список сдач */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">
              Студенческие работы ({filteredSubmissions.length})
            </h2>
          </div>
          
          <div className="divide-y divide-gray-100">
            {filteredSubmissions.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
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
                <div key={submission.id} className="group bg-white/60 hover:bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 hover:border-indigo-200 relative overflow-hidden">
                  {/* Декоративный элемент */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-lg group-hover:text-indigo-700 transition-colors">
                            {submission.user.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            {getStatusBadge(submission)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-blue-50 px-3 py-2 rounded-lg group-hover:from-indigo-100 group-hover:to-blue-100 transition-colors">
                          <User className="w-4 h-4 text-indigo-500" />
                          <span className="font-medium">{submission.user.email}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 px-3 py-2 rounded-lg group-hover:from-green-100 group-hover:to-emerald-100 transition-colors">
                          <BookOpen className="w-4 h-4 text-green-500" />
                          <span className="font-medium">{submission.assignment.lesson.module.course.title}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-pink-50 px-3 py-2 rounded-lg group-hover:from-purple-100 group-hover:to-pink-100 transition-colors">
                          <FileText className="w-4 h-4 text-purple-500" />
                          <span className="font-medium">{submission.assignment.title}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 bg-gradient-to-r from-orange-50 to-yellow-50 px-3 py-2 rounded-lg group-hover:from-orange-100 group-hover:to-yellow-100 transition-colors">
                          <Calendar className="w-4 h-4 text-orange-500" />
                          <span className="font-medium">Сдано: {formatDate(submission.submittedAt)}</span>
                        </div>
                        
                        {submission.assignment.dueDate && (
                          <div className="flex items-center gap-2 bg-gradient-to-r from-red-50 to-rose-50 px-3 py-2 rounded-lg group-hover:from-red-100 group-hover:to-rose-100 transition-colors">
                            <Clock className="w-4 h-4 text-red-500" />
                            <span className="font-medium">Дедлайн: {formatDate(submission.assignment.dueDate)}</span>
                          </div>
                        )}
                      </div>

                      {/* Группы */}
                      {submission.groups.length > 0 && (
                        <div className="flex items-center gap-2 mb-4">
                          <Users className="w-4 h-4 text-gray-500" />
                          <div className="flex flex-wrap gap-1">
                            {submission.groups.map((group) => (
                              <span
                                key={group.id}
                                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium"
                              >
                                {group.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Содержимое сдачи */}
                      {submission.content && (
                        <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-xl mb-4 group-hover:from-indigo-50 group-hover:to-blue-50 transition-colors">
                          <p className="text-sm text-gray-700 line-clamp-3 group-hover:text-gray-800 transition-colors">
                            {submission.content}
                          </p>
                        </div>
                      )}

                      {/* Файл */}
                      {submission.fileUrl && (
                        <div className="flex items-center gap-2 mb-4">
                          <Download className="w-4 h-4 text-gray-500" />
                          <a
                            href={submission.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Скачать файл
                          </a>
                        </div>
                      )}

                      {/* Оценка */}
                      {submission.score !== null && (
                        <div className="flex items-center gap-2 mb-4">
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
                        <div className="mt-2 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl group-hover:from-yellow-100 group-hover:to-amber-100 transition-colors">
                          <p className="text-sm text-gray-700 group-hover:text-gray-800 transition-colors">
                            <strong>Обратная связь:</strong> {submission.feedback}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 ml-6 opacity-60 group-hover:opacity-100 transition-opacity">
                      {!submission.gradedAt ? (
                        <button
                          onClick={() => openGradingModal(submission)}
                          className="w-12 h-12 flex items-center justify-center text-blue-600 hover:text-white hover:bg-blue-600 rounded-xl transition-all duration-200 hover:scale-110 shadow-md hover:shadow-lg border-2 border-blue-200 hover:border-blue-600 backdrop-blur-sm"
                          title="Проверить"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => openGradingModal(submission)}
                          className="w-12 h-12 flex items-center justify-center text-emerald-600 hover:text-white hover:bg-emerald-600 rounded-xl transition-all duration-200 hover:scale-110 shadow-md hover:shadow-lg border-2 border-emerald-200 hover:border-emerald-600 backdrop-blur-sm"
                          title="Просмотреть"
                        >
                          <Eye className="w-5 h-5" />
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
            submission={{
              ...selectedSubmission,
              assignment: {
                ...selectedSubmission.assignment,
                dueDate: selectedSubmission.assignment.dueDate || '',
                module: selectedSubmission.assignment.lesson?.module || { title: '', course: { id: '', title: '', direction: '' } }
              }
            }}
            onClose={closeGradingModal}
            onSuccess={handleGradingSuccess}
          />
        )}
      </div>
    </div>
  )
}