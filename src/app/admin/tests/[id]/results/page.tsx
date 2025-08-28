'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  ArrowLeft,
  Users, 
  Clock,
  Award,
  BarChart3,
  Loader2,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Download,
  Eye,
  TrendingUp,
  TrendingDown,
  Target
} from 'lucide-react'

interface QuizAttempt {
  id: string
  score: number
  maxScore: number
  passed: boolean
  startedAt: string
  completedAt: string
  user: {
    id: string
    name: string
    email: string
  }
}

interface QuizDetails {
  id: string
  title: string
  description: string
  timeLimit: number
  passingScore: number
  isActive: boolean
  lesson: {
    title: string
    module: {
      title: string
      course: {
        title: string
      }
    }
  }
  questions: Array<{
    id: string
    question: string
    type: string
    points: number
  }>
  attempts: QuizAttempt[]
}

interface QuizStats {
  totalAttempts: number
  passedAttempts: number
  failedAttempts: number
  averageScore: number
  passRate: number
  averageTime: number
}

export default function QuizResults() {
  const router = useRouter()
  const params = useParams()
  const { data: session, status } = useSession()
  const [quiz, setQuiz] = useState<QuizDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<QuizStats>({
    totalAttempts: 0,
    passedAttempts: 0,
    failedAttempts: 0,
    averageScore: 0,
    passRate: 0,
    averageTime: 0
  })

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
      return
    }

    fetchQuizResults()
  }, [session, status, router, params.id])

  const fetchQuizResults = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/quizzes/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setQuiz(data)
        
        // Подсчёт статистики
        const attempts = data.attempts
        const passedAttempts = attempts.filter((a: QuizAttempt) => a.passed)
        const failedAttempts = attempts.filter((a: QuizAttempt) => !a.passed)
        
        const totalScore = attempts.reduce((acc: number, attempt: QuizAttempt) => 
          acc + (attempt.score || 0), 0)
        
        const totalTime = attempts
          .filter((a: QuizAttempt) => a.completedAt)
          .reduce((acc: number, attempt: QuizAttempt) => {
            const startTime = new Date(attempt.startedAt).getTime()
            const endTime = new Date(attempt.completedAt).getTime()
            return acc + (endTime - startTime)
          }, 0)
        
        setStats({
          totalAttempts: attempts.length,
          passedAttempts: passedAttempts.length,
          failedAttempts: failedAttempts.length,
          averageScore: attempts.length > 0 ? Math.round(totalScore / attempts.length) : 0,
          passRate: attempts.length > 0 ? Math.round((passedAttempts.length / attempts.length) * 100) : 0,
          averageTime: attempts.length > 0 ? Math.round(totalTime / attempts.length / 60000) : 0 // в минутах
        })
      }
    } catch (error) {
      console.error('Ошибка загрузки результатов:', error)
    } finally {
      setLoading(false)
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

  const formatDuration = (startTime: string, endTime: string) => {
    if (!endTime) return 'Не завершено'
    
    const start = new Date(startTime).getTime()
    const end = new Date(endTime).getTime()
    const minutes = Math.round((end - start) / 60000)
    
    return `${minutes} мин`
  }

  const exportResults = () => {
    if (!quiz) return
    
    const csvContent = [
      ['Студент', 'Email', 'Баллы', 'Максимум', 'Процент', 'Статус', 'Время начала', 'Время завершения', 'Длительность'].join(','),
      ...quiz.attempts.map(attempt => [
        attempt.user.name,
        attempt.user.email,
        attempt.score || 0,
        attempt.maxScore,
        Math.round(((attempt.score || 0) / attempt.maxScore) * 100),
        attempt.passed ? 'Пройден' : 'Не пройден',
        formatDate(attempt.startedAt),
        attempt.completedAt ? formatDate(attempt.completedAt) : 'Не завершено',
        attempt.completedAt ? formatDuration(attempt.startedAt, attempt.completedAt) : 'Не завершено'
      ].join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `quiz_results_${quiz.title}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Тест не найден</h2>
          <button
            onClick={() => router.push('/admin/tests')}
            className="text-violet-600 hover:text-violet-700"
          >
            Вернуться к списку тестов
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Хедер */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin/tests')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                  Результаты теста
                </h1>
                <p className="text-sm text-gray-600">{quiz.title}</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={exportResults}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
                disabled={quiz.attempts.length === 0}
              >
                <Download className="w-4 h-4" />
                Экспорт CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Информация о тесте */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Информация о тесте</h2>
              <div className="space-y-2 text-sm">
                <div><span className="text-gray-500">Курс:</span> <span className="font-medium">{quiz.lesson.module.course.title}</span></div>
                <div><span className="text-gray-500">Модуль:</span> <span className="font-medium">{quiz.lesson.module.title}</span></div>
                <div><span className="text-gray-500">Урок:</span> <span className="font-medium">{quiz.lesson.title}</span></div>
                <div><span className="text-gray-500">Время на тест:</span> <span className="font-medium">{quiz.timeLimit} минут</span></div>
                <div><span className="text-gray-500">Проходной балл:</span> <span className="font-medium">{quiz.passingScore}%</span></div>
                <div><span className="text-gray-500">Количество вопросов:</span> <span className="font-medium">{quiz.questions.length}</span></div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Статус теста</h3>
              <div className="flex items-center gap-2">
                {quiz.isActive ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span className="text-emerald-600 font-medium">Активен</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-amber-600" />
                    <span className="text-amber-600 font-medium">Неактивен</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-violet-600 font-semibold">Всего попыток</p>
                <p className="text-3xl font-bold mt-1 text-gray-900">{stats.totalAttempts}</p>
              </div>
              <Users className="w-8 h-8 text-violet-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600 font-semibold">Пройдено</p>
                <p className="text-3xl font-bold mt-1 text-gray-900">{stats.passedAttempts}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-semibold">Не пройдено</p>
                <p className="text-3xl font-bold mt-1 text-gray-900">{stats.failedAttempts}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-indigo-600 font-semibold">Средний балл</p>
                <p className="text-3xl font-bold mt-1 text-gray-900">{stats.averageScore}%</p>
              </div>
              <BarChart3 className="w-8 h-8 text-indigo-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 font-semibold">Процент прохождения</p>
                <p className="text-3xl font-bold mt-1 text-gray-900">{stats.passRate}%</p>
              </div>
              <Target className="w-8 h-8 text-amber-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-semibold">Среднее время</p>
                <p className="text-3xl font-bold mt-1 text-gray-900">{stats.averageTime}</p>
                <p className="text-xs text-slate-500">минут</p>
              </div>
              <Clock className="w-8 h-8 text-slate-600" />
            </div>
          </div>
        </div>

        {/* Список попыток */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">
              Результаты студентов ({quiz.attempts.length})
            </h2>
          </div>

          {quiz.attempts.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Пока нет попыток</h3>
              <p className="text-gray-500">
                Студенты еще не проходили этот тест
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {quiz.attempts.map(attempt => {
                const percentage = Math.round(((attempt.score || 0) / attempt.maxScore) * 100)
                
                return (
                  <div key={attempt.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-violet-100 to-purple-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-violet-600" />
                        </div>
                        
                        <div>
                          <h3 className="font-medium text-gray-900">{attempt.user.name}</h3>
                          <p className="text-sm text-gray-500">{attempt.user.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <p className="text-gray-500">Баллы</p>
                          <p className="font-bold text-gray-900">
                            {attempt.score || 0} / {attempt.maxScore}
                          </p>
                        </div>

                        <div className="text-center">
                          <p className="text-gray-500">Процент</p>
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${
                              percentage >= quiz.passingScore ? 'text-emerald-600' : 'text-red-600'
                            }`}>
                              {percentage}%
                            </span>
                            {percentage >= quiz.passingScore ? (
                              <TrendingUp className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-red-600" />
                            )}
                          </div>
                        </div>

                        <div className="text-center">
                          <p className="text-gray-500">Статус</p>
                          {attempt.passed ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-emerald-100 text-emerald-800 rounded-full font-medium">
                              <CheckCircle className="w-3 h-3" />
                              Пройден
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full font-medium">
                              <XCircle className="w-3 h-3" />
                              Не пройден
                            </span>
                          )}
                        </div>

                        <div className="text-center">
                          <p className="text-gray-500">Время</p>
                          <p className="font-medium text-gray-900">
                            {attempt.completedAt ? formatDuration(attempt.startedAt, attempt.completedAt) : 'Не завершено'}
                          </p>
                        </div>

                        <div className="text-center">
                          <p className="text-gray-500">Дата</p>
                          <p className="font-medium text-gray-900">
                            {formatDate(attempt.startedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
