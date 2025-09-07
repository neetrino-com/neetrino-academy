'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  ArrowLeft,
  Award,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  MessageCircle,
  Download,
  Eye,
  Users,
  Filter,
  Search,
  Loader2
} from 'lucide-react'

interface Submission {
  id: string
  studentName: string
  studentEmail: string
  courseName: string
  assignmentTitle: string
  submittedAt: string
  status: 'pending' | 'reviewed' | 'graded'
  grade?: number
  maxGrade: number
  fileUrl?: string
  feedback?: string
}

export default function GradingPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'reviewed' | 'graded'>('all')
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [showGradingModal, setShowGradingModal] = useState(false)
  const [gradeValue, setGradeValue] = useState('')
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
      return
    }

    fetchSubmissions()
  }, [session, status, router])

  useEffect(() => {
    filterSubmissions()
  }, [submissions, searchTerm, statusFilter])

  const fetchSubmissions = async () => {
    try {
      setLoading(true)
      
      // Имитация данных - в реальном приложении здесь будет API вызов
      const mockSubmissions: Submission[] = [
        {
          id: '1',
          studentName: 'Иван Петров',
          studentEmail: 'ivan.petrov@example.com',
          courseName: 'WordPress Разработка',
          assignmentTitle: 'Создание темы для блога',
          submittedAt: '2024-01-15T10:30:00Z',
          status: 'pending',
          maxGrade: 100,
          fileUrl: '/uploads/submission-1.zip'
        },
        {
          id: '2',
          studentName: 'Мария Сидорова',
          studentEmail: 'maria.sidorova@example.com',
          courseName: 'React Основы',
          assignmentTitle: 'Todo List приложение',
          submittedAt: '2024-01-14T15:45:00Z',
          status: 'reviewed',
          grade: 85,
          maxGrade: 100,
          feedback: 'Хорошая работа! Есть небольшие замечания по стилям.'
        },
        {
          id: '3',
          studentName: 'Алексей Козлов',
          studentEmail: 'alexey.kozlov@example.com',
          courseName: 'Shopify Development',
          assignmentTitle: 'Кастомное приложение',
          submittedAt: '2024-01-13T09:20:00Z',
          status: 'graded',
          grade: 92,
          maxGrade: 100,
          feedback: 'Отличная работа! Все требования выполнены на высоком уровне.'
        }
      ]
      
      setSubmissions(mockSubmissions)
    } catch (error) {
      console.error('Ошибка загрузки работ:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterSubmissions = () => {
    let filtered = submissions

    if (searchTerm) {
      filtered = filtered.filter(submission =>
        submission.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.assignmentTitle.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(submission => submission.status === statusFilter)
    }

    setFilteredSubmissions(filtered)
  }

  const handleGradeSubmission = async () => {
    if (!selectedSubmission) return

    try {
      // В реальном приложении здесь будет API вызов
      const updatedSubmission = {
        ...selectedSubmission,
        grade: parseInt(gradeValue),
        feedback,
        status: 'graded' as const
      }

      setSubmissions(prev => 
        prev.map(sub => sub.id === selectedSubmission.id ? updatedSubmission : sub)
      )

      setShowGradingModal(false)
      setSelectedSubmission(null)
      setGradeValue('')
      setFeedback('')
    } catch (error) {
      console.error('Ошибка при выставлении оценки:', error)
    }
  }

  const getStatusBadge = (status: Submission['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 text-sm font-medium rounded-full">
            <Clock className="w-4 h-4" />
            На проверке
          </span>
        )
      case 'reviewed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
            <Eye className="w-4 h-4" />
            Просмотрено
          </span>
        )
      case 'graded':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-full">
            <CheckCircle className="w-4 h-4" />
            Оценено
          </span>
        )
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Загрузка системы оценивания...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Хедер */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-10 rounded-b-2xl mx-6 mt-6">
        <div className="w-full px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin')}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
                Назад
              </button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent">
                  Проверка и оценивание работ
                </h1>
                <p className="text-slate-600 mt-1 font-medium">
                  Система оценивания студенческих работ
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg px-3 py-2">
                <p className="text-sm text-orange-700 font-semibold">
                  {filteredSubmissions.filter(s => s.status === 'pending').length} работ ожидают проверки
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Фильтры и поиск */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-slate-200/60">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Поиск по студенту, курсу или заданию..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'reviewed' | 'graded')}
                className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
              >
                <option value="all">Все статусы</option>
                <option value="pending">На проверке</option>
                <option value="reviewed">Просмотрено</option>
                <option value="graded">Оценено</option>
              </select>
            </div>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-amber-200/60">
            <div className="flex items-center gap-4">
              <div className="bg-amber-100 rounded-xl p-3">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">
                  {submissions.filter(s => s.status === 'pending').length}
                </p>
                <p className="text-slate-600 text-sm">На проверке</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-200/60">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 rounded-xl p-3">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {submissions.filter(s => s.status === 'reviewed').length}
                </p>
                <p className="text-slate-600 text-sm">Просмотрено</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-emerald-200/60">
            <div className="flex items-center gap-4">
              <div className="bg-emerald-100 rounded-xl p-3">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">
                  {submissions.filter(s => s.status === 'graded').length}
                </p>
                <p className="text-slate-600 text-sm">Оценено</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60">
            <div className="flex items-center gap-4">
              <div className="bg-slate-100 rounded-xl p-3">
                <Users className="w-6 h-6 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-600">
                  {submissions.length}
                </p>
                <p className="text-slate-600 text-sm">Всего работ</p>
              </div>
            </div>
          </div>
        </div>

        {/* Список работ */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200/60">
            <h2 className="text-xl font-bold text-slate-800">Студенческие работы</h2>
          </div>
          
          <div className="divide-y divide-slate-200/60">
            {filteredSubmissions.map((submission) => (
              <div key={submission.id} className="p-6 hover:bg-slate-50/50 transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-lg font-semibold text-slate-800">
                        {submission.studentName}
                      </h3>
                      {getStatusBadge(submission.status)}
                    </div>
                    
                    <div className="space-y-1 text-sm text-slate-600">
                      <p><span className="font-medium">Курс:</span> {submission.courseName}</p>
                      <p><span className="font-medium">Задание:</span> {submission.assignmentTitle}</p>
                      <p><span className="font-medium">Отправлено:</span> {formatDate(submission.submittedAt)}</p>
                      {submission.grade !== undefined && (
                        <p><span className="font-medium">Оценка:</span> 
                          <span className="ml-1 font-bold text-orange-600">
                            {submission.grade}/{submission.maxGrade}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {submission.fileUrl && (
                      <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors duration-200">
                        <Download className="w-4 h-4" />
                        Скачать
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        setSelectedSubmission(submission)
                        setGradeValue(submission.grade?.toString() || '')
                        setFeedback(submission.feedback || '')
                        setShowGradingModal(true)
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors duration-200"
                    >
                      <Award className="w-4 h-4" />
                      {submission.status === 'graded' ? 'Изменить оценку' : 'Оценить'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredSubmissions.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">Работы не найдены</h3>
              <p className="text-slate-500">Попробуйте изменить фильтры или поисковый запрос</p>
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно для оценивания */}
      {showGradingModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-slate-800 mb-4">
              Оценить работу: {selectedSubmission.assignmentTitle}
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-600 mb-1">Студент: {selectedSubmission.studentName}</p>
                <p className="text-sm text-slate-600">Курс: {selectedSubmission.courseName}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Оценка (макс. {selectedSubmission.maxGrade})
                </label>
                <input
                  type="number"
                  min="0"
                  max={selectedSubmission.maxGrade}
                  value={gradeValue}
                  onChange={(e) => setGradeValue(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Введите оценку"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Обратная связь
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                  placeholder="Оставьте комментарий для студента..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowGradingModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors duration-200"
                >
                  Отмена
                </button>
                <button
                  onClick={handleGradeSubmission}
                  disabled={!gradeValue}
                  className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white rounded-xl transition-colors duration-200"
                >
                  Сохранить оценку
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
