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
import { AppHeader } from '@/components/layout/AppHeader'

interface AssignmentDetailProps {
  params: Promise<{ id: string }>
}

interface AssignmentDetail {
  assignment: {
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
        router.push('/dashboard/assignments')
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

    if (!resolvedParams?.id) {
      alert('Ошибка: ID задания не найден')
      return
    }

    console.log('🚀 [Assignment Page] Submitting assignment:', resolvedParams.id)
    console.log('🚀 [Assignment Page] Content:', content.trim())
    console.log('🚀 [Assignment Page] File URL:', fileUrl)
    console.log('🚀 [Assignment Page] Session status:', status)
    console.log('🚀 [Assignment Page] Session data:', session)

    const submitUrl = `/api/student/assignments/${resolvedParams.id}/submit`
    console.log('🚀 [Assignment Page] Submit URL:', submitUrl)

    setSubmitting(true)
    try {
      console.log('🚀 [Assignment Page] Making fetch request...')
      const response = await fetch(submitUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: content.trim(),
          fileUrl: fileUrl
        })
      })
      console.log('🚀 [Assignment Page] Response received:', response.status)

      if (response.ok) {
        const result = await response.json()
        alert(result.message)
        setShowSubmissionForm(false)
        await fetchAssignment() // Перезагружаем данные
      } else {
        const error = await response.json()
        console.error('❌ [Assignment Page] Submit error:', error)
        alert(`Ошибка: ${error.error}`)
      }
    } catch (error) {
      console.error('❌ [Assignment Page] Network error submitting assignment:', error)
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

  const isOverdue = () => {
    if (!assignment || !assignment.assignment.dueDate) return false
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <AppHeader />
      <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Заголовок */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-8 mb-8 text-white">
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => router.push('/dashboard/assignments')}
                className="p-3 bg-white/20 rounded-xl backdrop-blur-sm hover:bg-white/30 transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-white" />
              </button>
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-3">
                  {assignment.assignment.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-lg text-blue-100">
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    {assignment.assignment.course.title}
                  </span>
                  <span className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    {assignment.assignment.lesson.module.title}
                  </span>
                  <span className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    {assignment.assignment.group?.name || 'Из курса'}
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
                    {assignment.assignment.dueDate ? formatDate(assignment.assignment.dueDate) : 'Без дедлайна'}
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
              
              {assignment.assignment.maxScore && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-100">Макс. балл</p>
                    <p className="font-semibold text-white">{assignment.assignment.maxScore}</p>
                  </div>
                </div>
              )}
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
                
                {assignment.assignment.description ? (
                  <div className="prose prose-lg max-w-none text-gray-800">
                    {assignment.assignment.description.split('\n').map((line, index) => (
                      <p key={index} className="mb-4 leading-relaxed text-lg font-medium">{line}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic text-lg">Описание задания отсутствует</p>
                )}
              </div>

              {/* Текущая сдача */}
              {assignment.submission && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl shadow-lg border border-green-200 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-green-100 rounded-2xl">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">Ваша сдача</h3>
                        <p className="text-gray-700 font-medium">
                          Сдано {formatDate(assignment.submission.submittedAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {assignment.submission.content && (
                    <div className="mb-6">
                      <p className="text-lg font-semibold text-gray-800 mb-3">Текст решения:</p>
                      <div className="bg-white/80 rounded-xl p-6 border border-white/60">
                        <pre className="whitespace-pre-wrap text-gray-900 text-lg leading-relaxed font-sans font-medium">{assignment.submission.content}</pre>
                      </div>
                    </div>
                  )}
                  
                  {assignment.submission.fileUrl && (
                    <div className="mb-6">
                      <p className="text-lg font-semibold text-gray-800 mb-3">Прикрепленный файл:</p>
                      <a
                        href={assignment.submission.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-3 px-6 py-3 bg-white/80 rounded-xl border border-white/60 hover:bg-white/90 transition-colors text-blue-600 hover:text-blue-800 font-semibold"
                      >
                        <Download className="w-5 h-5" />
                        Скачать файл
                      </a>
                    </div>
                  )}
                  
                  {assignment.submission.score !== null && (
                    <div className="mb-6">
                      <p className="text-lg font-semibold text-gray-800 mb-3">Оценка:</p>
                      <div className="flex items-center gap-4">
                        <div className="p-4 bg-yellow-100 rounded-2xl">
                          <Target className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div>
                          <span className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-bold ${
                            assignment.submission.score >= 4 ? 'bg-green-100 text-green-800' :
                            assignment.submission.score >= 3 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {assignment.submission.score}/5
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {assignment.submission.feedback && (
                    <div className="mb-6">
                      <p className="text-lg font-semibold text-gray-800 mb-3">Обратная связь от преподавателя:</p>
                      <div className="bg-white/80 rounded-xl p-6 border border-white/60">
                        <p className="text-gray-900 text-lg leading-relaxed font-medium">{assignment.submission.feedback}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Форма сдачи */}
              {!showSubmissionForm ? (
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 p-8">
                  <div className="text-center">
                    {canSubmit() ? (
                      <>
                        <div className="p-6 bg-blue-100 rounded-2xl w-fit mx-auto mb-6">
                          <Target className="w-12 h-12 text-blue-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">
                          {assignment.submission ? 'Изменить сдачу' : 'Сдать задание'}
                        </h3>
                        <p className="text-gray-700 mb-8 text-lg font-medium">
                          {assignment.submission 
                            ? 'Вы можете изменить своё решение до истечения дедлайна'
                            : 'Добавьте текст решения или прикрепите файл'
                          }
                        </p>
                        <button
                          onClick={() => setShowSubmissionForm(true)}
                          className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex items-center gap-3 mx-auto font-semibold text-lg"
                        >
                          <Upload className="w-6 h-6" />
                          {assignment.submission ? 'Изменить сдачу' : 'Сдать задание'}
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="p-6 bg-red-100 rounded-2xl w-fit mx-auto mb-6">
                          <AlertCircle className="w-12 h-12 text-red-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">Дедлайн истёк</h3>
                        <p className="text-gray-700 text-lg font-medium">
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
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Информация о задании</h3>
              
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Дедлайн</p>
                      <p className="font-semibold text-gray-900 text-sm">
                        {assignment.assignment.dueDate ? formatDate(assignment.assignment.dueDate) : 'Без дедлайна'}
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

                  {assignment.submission && (
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Статус</p>
                        <p className="font-semibold text-green-600 text-sm">
                          {assignment.submission.gradedAt ? 'Проверено' : 'Сдано'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
            </div>

              {/* Курс и модуль */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Детали курса</h3>
                
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Курс</p>
                    <p className="font-semibold text-gray-900 text-sm">
                      {assignment.assignment.course.title}
                    </p>
                  </div>
                  
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Модуль</p>
                    <p className="font-semibold text-gray-900 text-sm">
                      {assignment.assignment.lesson.module.title}
                    </p>
                  </div>

                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Группа</p>
                    <p className="font-semibold text-gray-900 text-sm">
                      {assignment.assignment.group?.name || 'Из курса'}
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
