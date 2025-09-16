'use client'

import { useState, useEffect, use, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  ArrowLeft,
  Target, 
  Clock, 
  Calendar,
  BookOpen,
  FileText,
  Users,
  CheckCircle,
  AlertCircle,
  Edit,
  Trash2,
  Eye,
  Download,
  User,
  BarChart3
} from 'lucide-react'
import { withStaffProtection } from '@/components/auth/withRoleProtection'

interface AssignmentDetailProps {
  params: Promise<{ id: string }>
}

interface AssignmentDetail {
  id: string
  title: string
  description: string | null
  dueDate: string | null
  type: string
  status: string
  maxScore: number | null
  isTemplate: boolean
  templateId: string | null
  createdAt: string
  lesson: {
    id: string
    title: string
    module: {
      id: string
      title: string
      course: {
        id: string
        title: string
        direction: string
      }
    }
  } | null
  creator: {
    id: string
    name: string
    email: string
  }
  submissions: {
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
    }
  }[]
  groupAssignments: {
    id: string
    group: {
      id: string
      name: string
    }
    dueDate: string
    assignedAt: string
  }[]
  _count: {
    submissions: number
    groupAssignments: number
  }
}

function AssignmentDetailPage({ params }: AssignmentDetailProps) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [grading, setGrading] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null)
  const [grade, setGrade] = useState('')
  const [feedback, setFeedback] = useState('')

  // Развертываем промис params
  const resolvedParams = use(params)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
      return
    }

    if (resolvedParams?.id) {
      fetchAssignment()
    }
  }, [session, status, router, resolvedParams?.id, fetchAssignment])

  const fetchAssignment = useCallback(async () => {
    if (!resolvedParams?.id) {
      console.log('🔍 [Admin Assignment Page] No assignment ID yet')
      return
    }
    
    try {
      console.log('🔍 [Admin Assignment Page] Starting fetch for assignment:', resolvedParams.id)
      setLoading(true)
      
      const response = await fetch(`/api/assignments/${resolvedParams.id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ [Admin Assignment Page] Data received:', data)
        setAssignment(data)
      } else {
        console.error('❌ [Admin Assignment Page] Response not ok:', response.status)
        alert('Ошибка загрузки задания')
        router.push('/admin/assignments')
      }
    } catch (error) {
      console.error('❌ [Admin Assignment Page] Network error:', error)
      alert('Ошибка сети при загрузке задания')
      router.push('/admin/assignments')
    } finally {
      setLoading(false)
    }
  }, [resolvedParams?.id, router])

  const handleGrade = async (submissionId: string) => {
    if (!grade.trim()) {
      alert('Введите оценку')
      return
    }

    const score = parseFloat(grade)
    if (isNaN(score) || score < 0 || score > 5) {
      alert('Оценка должна быть от 0 до 5')
      return
    }

    setGrading(true)
    try {
      const response = await fetch(`/api/submissions/${submissionId}/grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          score,
          feedback: feedback.trim() || null
        })
      })

      if (response.ok) {
        alert('Оценка поставлена')
        setSelectedSubmission(null)
        setGrade('')
        setFeedback('')
        await fetchAssignment()
      } else {
        const error = await response.json()
        alert(`Ошибка: ${error.error}`)
      }
    } catch (error) {
      console.error('Error grading submission:', error)
      alert('Ошибка при выставлении оценки')
    } finally {
      setGrading(false)
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

  const getDaysUntilDue = (dueDate: string | null) => {
    if (!dueDate) return { text: 'Без дедлайна', color: 'text-gray-600' }
    
    const now = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return { text: `Просрочено на ${Math.abs(diffDays)} дн.`, color: 'text-red-600' }
    if (diffDays === 0) return { text: 'Сегодня', color: 'text-red-600' }
    if (diffDays === 1) return { text: 'Завтра', color: 'text-yellow-600' }
    if (diffDays <= 3) return { text: `Через ${diffDays} дн.`, color: 'text-yellow-600' }
    return { text: `Через ${diffDays} дн.`, color: 'text-gray-600' }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'HOMEWORK': return 'bg-blue-100 text-blue-800'
      case 'PROJECT': return 'bg-purple-100 text-purple-800'
      case 'QUIZ': return 'bg-green-100 text-green-800'
      case 'EXAM': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'HOMEWORK': return 'Домашнее задание'
      case 'PROJECT': return 'Проект'
      case 'QUIZ': return 'Тест'
      case 'EXAM': return 'Экзамен'
      default: return type
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка задания...</p>
        </div>
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <Target className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Задание не найдено</h2>
          <p className="text-gray-600 mb-4">Возможно, задание было удалено</p>
          <button
            onClick={() => router.push('/admin/assignments')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Вернуться к заданиям
          </button>
        </div>
      </div>
    )
  }

  const timeInfo = getDaysUntilDue(assignment.dueDate)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Заголовок */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-8 mb-8 text-white">
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => router.push('/admin/assignments')}
                className="p-3 bg-white/20 rounded-xl backdrop-blur-sm hover:bg-white/30 transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-white" />
              </button>
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-3">
                  {assignment.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-lg text-blue-100">
                  {assignment.lesson && (
                    <>
                      <span className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        {assignment.lesson.module.course.title}
                      </span>
                      <span className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        {assignment.lesson.module.title}
                      </span>
                    </>
                  )}
                  <span className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    {assignment._count.groupAssignments} групп
                  </span>
                </div>
              </div>
            </div>
            
            {/* Статус и дедлайн */}
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-blue-100">Дедлайн</p>
                  <p className="font-semibold text-white">
                    {assignment.dueDate ? formatDate(assignment.dueDate) : 'Без дедлайна'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-blue-100">Статус</p>
                  <p className={`font-semibold text-white`}>
                    {timeInfo.text}
                  </p>
                </div>
              </div>
              
              {assignment.maxScore && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-100">Макс. балл</p>
                    <p className="font-semibold text-white">{assignment.maxScore}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-blue-100">Сдач</p>
                  <p className="font-semibold text-white">{assignment._count.submissions}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* Основное содержимое */}
            <div className="xl:col-span-3 space-y-6">
              {/* Информация о задании */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 bg-amber-100 rounded-2xl">
                    <Target className="w-6 h-6 text-amber-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Описание задания</h2>
                </div>
                
                {assignment.description ? (
                  <div className="prose prose-lg max-w-none text-gray-800">
                    {assignment.description.split('\n').map((line, index) => (
                      <p key={index} className="mb-4 leading-relaxed text-lg font-medium">{line}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic text-lg">Описание задания отсутствует</p>
                )}

                <div className="mt-6 flex items-center gap-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(assignment.type)}`}>
                    {getTypeLabel(assignment.type)}
                  </span>
                  {assignment.isTemplate && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                      Шаблон
                    </span>
                  )}
                </div>
              </div>

              {/* Сдачи студентов */}
              {assignment.submissions.length > 0 && (
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-4 bg-green-100 rounded-2xl">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">Сдачи студентов</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {assignment.submissions.map((submission) => (
                      <div key={submission.id} className="border border-gray-200 rounded-xl p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{submission.user.name}</h4>
                              <p className="text-sm text-gray-600">{submission.user.email}</p>
                              <p className="text-xs text-gray-500">Сдано {formatDate(submission.submittedAt)}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {submission.score !== null ? (
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                                submission.score >= 4 ? 'bg-green-100 text-green-800' :
                                submission.score >= 3 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {submission.score}/5
                              </span>
                            ) : (
                              <button
                                onClick={() => setSelectedSubmission(submission.id)}
                                className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium hover:bg-indigo-200 transition-colors"
                              >
                                Оценить
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {submission.content && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">Решение:</p>
                            <div className="bg-gray-50 rounded-lg p-4">
                              <pre className="whitespace-pre-wrap text-gray-900 text-sm">{submission.content}</pre>
                            </div>
                          </div>
                        )}
                        
                        {submission.fileUrl && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">Файл:</p>
                            <a
                              href={submission.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                            >
                              <Download className="w-4 h-4" />
                              Скачать файл
                            </a>
                          </div>
                        )}
                        
                        {submission.feedback && (
                          <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                            <p className="text-sm font-medium text-gray-700 mb-2">Обратная связь:</p>
                            <p className="text-gray-900 text-sm">{submission.feedback}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Форма оценки */}
              {selectedSubmission && (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Оценить сдачу</h2>
                    <button
                      onClick={() => setSelectedSubmission(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Оценка (0-5)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="5"
                        step="0.1"
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Введите оценку"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Обратная связь (опционально)
                      </label>
                      <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                        placeholder="Добавьте комментарий к оценке..."
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => setSelectedSubmission(null)}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Отмена
                      </button>
                      <button
                        onClick={() => handleGrade(selectedSubmission)}
                        disabled={grading || !grade.trim()}
                        className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {grading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Сохранение...
                          </>
                        ) : (
                          'Сохранить оценку'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Боковая панель */}
            <div className="space-y-6">
              {/* Информация о задании */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Информация о задании</h3>
              
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Дедлайн</p>
                      <p className="font-semibold text-gray-900 text-sm">
                        {assignment.dueDate ? formatDate(assignment.dueDate) : 'Без дедлайна'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                    <Clock className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Осталось времени</p>
                      <p className={`font-semibold text-sm ${timeInfo.color}`}>
                        {timeInfo.text}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Сдач</p>
                      <p className="font-semibold text-green-600 text-sm">
                        {assignment._count.submissions}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Курс и модуль */}
              {assignment.lesson && (
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Детали курса</h3>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Курс</p>
                      <p className="font-semibold text-gray-900 text-sm">
                        {assignment.lesson.module.course.title}
                      </p>
                    </div>
                    
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Модуль</p>
                      <p className="font-semibold text-gray-900 text-sm">
                        {assignment.lesson.module.title}
                      </p>
                    </div>

                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Урок</p>
                      <p className="font-semibold text-gray-900 text-sm">
                        {assignment.lesson.title}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Группы */}
              {assignment.groupAssignments.length > 0 && (
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Назначено группам</h3>
                  
                  <div className="space-y-2">
                    {assignment.groupAssignments.map((groupAssignment) => (
                      <div key={groupAssignment.id} className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-semibold text-gray-900 text-sm">
                          {groupAssignment.group.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          Назначено {formatDate(groupAssignment.assignedAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Создатель */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Создатель</h3>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <User className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      {assignment.creator.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {assignment.creator.email}
                    </p>
                    <p className="text-xs text-gray-500">
                      Создано {formatDate(assignment.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default withStaffProtection(AssignmentDetailPage)
