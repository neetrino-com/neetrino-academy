'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  ArrowLeft,
  Target, 
  Clock, 
  Calendar,
  BookOpen,
  Upload,
  FileText,
  Users,
  CheckCircle,
  AlertCircle,
  Save,
  Send,
  Eye,
  Download
} from 'lucide-react'
import FileUpload from '@/components/ui/FileUpload'

interface AssignmentDetailProps {
  params: Promise<{ id: string }>
}

interface AssignmentDetail {
  assignment: {
    id: string
    assignmentId: string
    dueDate: string
    assignedAt: string
    assignment: {
      id: string
      title: string
      description: string | null
      dueDate: string
      lesson: {
        title: string
        module: {
          title: string
          course: {
            title: string
          }
        }
      }
    }
    group: {
      name: string
    }
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
}

export default function AssignmentDetail({ params }: AssignmentDetailProps) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // Форма сдачи
  const [content, setContent] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [showSubmissionForm, setShowSubmissionForm] = useState(false)

  // Развертываем промис params
  const resolvedParams = use(params)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
      return
    }

    fetchAssignment()
  }, [session, status, router, resolvedParams.id])

  const fetchAssignment = async () => {
    try {
      console.log('🔍 [Assignment Page] Starting fetch for assignment:', resolvedParams.id)
      console.log('🔍 [Assignment Page] Assignment ID type:', typeof resolvedParams.id)
      console.log('🔍 [Assignment Page] Assignment ID length:', resolvedParams.id?.length)
      setLoading(true)
      
      const apiUrl = `/api/student/assignments/${resolvedParams.id}/submission`
      console.log('🔍 [Assignment Page] API URL:', apiUrl)
      
      const response = await fetch(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      console.log('📡 [Assignment Page] Response status:', response.status)
      console.log('📡 [Assignment Page] Response statusText:', response.statusText)
      console.log('📡 [Assignment Page] Response headers:', Object.fromEntries(response.headers.entries()))
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ [Assignment Page] Data received:', data)
        setAssignment(data)
        
        // Заполняем форму существующими данными
        if (data.submission) {
          setContent(data.submission.content || '')
          setFileUrl(data.submission.fileUrl || '')
        }
      } else {
        console.log('❌ [Assignment Page] Response not ok, status:', response.status)
        console.log('❌ [Assignment Page] Response statusText:', response.statusText)
        console.log('❌ [Assignment Page] Response URL:', response.url)
        
        let errorData: { error?: string } = {}
        try {
          const text = await response.text()
          console.log('❌ [Assignment Page] Raw response text length:', text.length)
          console.log('❌ [Assignment Page] Raw response text:', text)
          console.log('❌ [Assignment Page] Raw response text type:', typeof text)
          
          if (text && text.trim()) {
            try {
              errorData = JSON.parse(text)
              console.log('❌ [Assignment Page] Parsed error data:', errorData)
            } catch (jsonError) {
              console.error('❌ [Assignment Page] JSON parse error:', jsonError)
              errorData = { error: `Invalid JSON response: ${text.substring(0, 100)}...` }
            }
          } else {
            console.log('❌ [Assignment Page] Empty response text')
            errorData = { error: `Empty response from server (HTTP ${response.status})` }
          }
        } catch (parseError) {
          console.error('❌ [Assignment Page] Failed to parse error response:', parseError)
          errorData = { error: 'Failed to parse server response' }
        }
        
        console.error('❌ [Assignment Page] Final error data:', errorData)
        console.error('❌ [Assignment Page] Error data keys:', Object.keys(errorData))
        console.error('❌ [Assignment Page] Error data values:', Object.values(errorData))
        
        const errorMessage = errorData.error || `HTTP ${response.status}`
        console.error('❌ [Assignment Page] Final error message:', errorMessage)
        
        alert(`Ошибка загрузки задания: ${errorMessage}`)
        router.push('/assignments')
      }
    } catch (error) {
      console.error('❌ [Assignment Page] Network error:', error)
      alert('Ошибка сети при загрузке задания')
      router.push('/assignments')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!content.trim() && !fileUrl) {
      alert('Добавьте текст решения или прикрепите файл')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/student/assignments/${resolvedParams.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: content.trim(),
          fileUrl: fileUrl
        })
      })

      if (response.ok) {
        const result = await response.json()
        alert(result.message)
        setShowSubmissionForm(false)
        await fetchAssignment() // Перезагружаем данные
      } else {
        const error = await response.json()
        alert(`Ошибка: ${error.error}`)
      }
    } catch (error) {
      console.error('Ошибка отправки:', error)
      alert('Ошибка отправки задания')
    } finally {
      setSubmitting(false)
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
    
    if (diffDays < 0) return { text: `Просрочено на ${Math.abs(diffDays)} дн.`, color: 'text-red-600' }
    if (diffDays === 0) return { text: 'Сегодня', color: 'text-red-600' }
    if (diffDays === 1) return { text: 'Завтра', color: 'text-yellow-600' }
    if (diffDays <= 3) return { text: `Через ${diffDays} дн.`, color: 'text-yellow-600' }
    return { text: `Через ${diffDays} дн.`, color: 'text-gray-600' }
  }

  const isOverdue = () => {
    if (!assignment) return false
    return new Date() > new Date(assignment.assignment.dueDate)
  }

  const canSubmit = () => {
    return !isOverdue() && assignment
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
          <p className="text-gray-600 mb-4">Возможно, у вас нет доступа к этому заданию</p>
          <button
            onClick={() => router.push('/assignments')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Вернуться к заданиям
          </button>
        </div>
      </div>
    )
  }

  const timeInfo = getDaysUntilDue(assignment.assignment.dueDate)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Заголовок */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/assignments')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {assignment.assignment.assignment.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  {assignment.assignment.assignment.lesson.module.course.title} • {assignment.assignment.assignment.lesson.module.title}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {assignment.assignment.group.name}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Основное содержимое */}
          <div className="lg:col-span-2 space-y-6">
            {/* Информация о задании */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-amber-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Описание задания</h2>
              </div>
              
              {assignment.assignment.assignment.description ? (
                <div className="prose prose-sm max-w-none text-gray-700">
                  {assignment.assignment.assignment.description.split('\n').map((line, index) => (
                    <p key={index} className="mb-3 leading-relaxed">{line}</p>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">Описание задания отсутствует</p>
              )}
            </div>

            {/* Текущая сдача */}
            {assignment.submission && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Ваша сдача</h2>
                  <span className="text-sm text-gray-600">
                    Сдано: {formatDate(assignment.submission.submittedAt)}
                  </span>
                </div>

                {assignment.submission.content && (
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-900 mb-2">Текст решения:</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <pre className="whitespace-pre-wrap text-gray-700 font-sans">{assignment.submission.content}</pre>
                    </div>
                  </div>
                )}

                {assignment.submission.fileUrl && (
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-900 mb-2">Прикрепленный файл:</h3>
                    <a
                      href={assignment.submission.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Download className="w-4 h-4 text-blue-600" />
                      <span className="text-blue-600">Скачать файл</span>
                    </a>
                  </div>
                )}

                {assignment.submission.score !== null && (
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-900 mb-2">Оценка:</h3>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      assignment.submission.score >= 4 ? 'bg-green-100 text-green-800' :
                      assignment.submission.score >= 3 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {assignment.submission.score}/5
                    </span>
                  </div>
                )}

                {assignment.submission.feedback && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Обратная связь от преподавателя:</h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-gray-700">{assignment.submission.feedback}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Форма сдачи */}
            {!showSubmissionForm ? (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="text-center">
                  {canSubmit() ? (
                    <>
                      <Target className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {assignment.submission ? 'Изменить сдачу' : 'Сдать задание'}
                      </h3>
                      <p className="text-gray-600 mb-6">
                        {assignment.submission 
                          ? 'Вы можете изменить своё решение до истечения дедлайна'
                          : 'Добавьте текст решения или прикрепите файл'
                        }
                      </p>
                      <button
                        onClick={() => setShowSubmissionForm(true)}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 mx-auto"
                      >
                        <Upload className="w-5 h-5" />
                        {assignment.submission ? 'Изменить сдачу' : 'Сдать задание'}
                      </button>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-300" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Дедлайн истек</h3>
                      <p className="text-gray-600">
                        Срок сдачи задания уже прошел. Обратитесь к преподавателю для уточнения возможности сдачи.
                      </p>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {assignment.submission ? 'Изменить сдачу' : 'Сдать задание'}
                  </h2>
                  <button
                    onClick={() => setShowSubmissionForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Текст решения */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Текст решения
                    </label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Опишите ваше решение, приведите код, объяснения..."
                      rows={8}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    />
                  </div>

                  {/* Загрузка файла */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Прикрепить файл (опционально)
                    </label>
                    <FileUpload
                      onFileUpload={(url: string) => setFileUrl(url)}
                    />
                  </div>

                  {/* Кнопки */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowSubmissionForm(false)}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting || (!content.trim() && !fileUrl)}
                      className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Отправка...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          {assignment.submission ? 'Обновить сдачу' : 'Сдать задание'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Боковая панель */}
          <div className="space-y-6">
            {/* Информация о дедлайне */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Информация о задании</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Calendar className="w-4 h-4" />
                    Дедлайн
                  </div>
                  <p className="font-medium text-gray-900">
                    {formatDate(assignment.assignment.dueDate)}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Clock className="w-4 h-4" />
                    Осталось времени
                  </div>
                  <p className={`font-medium ${timeInfo.color}`}>
                    {timeInfo.text}
                  </p>
                </div>

                {assignment.submission && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <CheckCircle className="w-4 h-4" />
                      Статус
                    </div>
                    <p className="font-medium text-green-600">
                      {assignment.submission.gradedAt ? 'Проверено' : 'Сдано'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Курс и модуль */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Курс</h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Курс</p>
                  <p className="font-medium text-gray-900">
                    {assignment.assignment.assignment.lesson.module.course.title}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Модуль</p>
                  <p className="font-medium text-gray-900">
                    {assignment.assignment.assignment.lesson.module.title}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Группа</p>
                  <p className="font-medium text-gray-900">
                    {assignment.assignment.group.name}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
