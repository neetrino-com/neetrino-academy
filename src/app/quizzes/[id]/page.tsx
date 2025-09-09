'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { auth } from '@/lib/auth'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  ArrowLeft, 
  ArrowRight,
  Target,
  Award,
  RotateCcw
} from 'lucide-react'

interface QuizQuestion {
  id: string
  question: string
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE'
  points: number
  options: {
    id: string
    text: string
    isCorrect: boolean
    order: number
  }[]
}

interface Quiz {
  id: string
  title: string
  description?: string
  timeLimit?: number
  passingScore: number
  attemptType: 'SINGLE' | 'MULTIPLE'
  questions: QuizQuestion[]
}

interface QuizAttempt {
  id: string
  score: number
  maxScore: number
  passed: boolean
  completedAt: string
}

export default function QuizPage() {
  const params = useParams()
  const router = useRouter()
  const quizId = params.id as string
  const [assignmentId, setAssignmentId] = useState<string | null>(null)

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [attempts, setAttempts] = useState<QuizAttempt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalContent, setModalContent] = useState<{
    title: string
    message: string
    type: 'success' | 'error' | 'warning' | 'info'
  } | null>(null)

  useEffect(() => {
    // Получаем assignmentId из URL параметров
    const urlParams = new URLSearchParams(window.location.search)
    const assignmentIdParam = urlParams.get('assignmentId')
    setAssignmentId(assignmentIdParam)
    
    fetchQuiz()
  }, [quizId])

  useEffect(() => {
    if (timeLeft !== null && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0) {
      handleSubmit()
    }
  }, [timeLeft])

  const showNotification = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setModalContent({ title, message, type })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setModalContent(null)
  }

  const fetchQuiz = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/quizzes/${quizId}/submit`)
      
      if (!response.ok) {
        throw new Error('Ошибка загрузки теста')
      }

      const data = await response.json()
      setQuiz(data.quiz)
      setAttempts(data.userAttempts || [])
      
      // Устанавливаем таймер если есть ограничение по времени
      if (data.quiz.timeLimit) {
        setTimeLeft(data.quiz.timeLimit * 60) // конвертируем минуты в секунды
      }
    } catch (error) {
      console.error('Ошибка при получении теста:', error)
      setError('Не удалось загрузить тест')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerChange = (questionId: string, optionId: string, isMultiple: boolean) => {
    setAnswers(prev => {
      const currentAnswers = prev[questionId] || []
      
      if (isMultiple) {
        // Для множественного выбора
        if (currentAnswers.includes(optionId)) {
          return {
            ...prev,
            [questionId]: currentAnswers.filter(id => id !== optionId)
          }
        } else {
          return {
            ...prev,
            [questionId]: [...currentAnswers, optionId]
          }
        }
      } else {
        // Для одиночного выбора
        return {
          ...prev,
          [questionId]: [optionId]
        }
      }
    })
  }

  const handleSubmit = async () => {
    if (!quiz) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers: Object.entries(answers).map(([questionId, selectedOptions]) => ({
            questionId,
            selectedOptions
          })),
          assignmentId: assignmentId
        })
      })

      if (response.ok) {
        const result = await response.json()
        const percentage = result.score
        
        if (result.passed) {
          showNotification(
            'Поздравляем! 🎉',
            `Вы прошли тест с результатом ${percentage.toFixed(1)}%`,
            'success'
          )
        } else {
          showNotification(
            'Тест не пройден',
            `Ваш результат: ${percentage.toFixed(1)}%. Необходимо набрать минимум ${quiz.passingScore}%`,
            'warning'
          )
        }
        
        // Обновляем список попыток
        await fetchQuiz()
      } else {
        const error = await response.json()
        
        if (response.status === 400 && error.error) {
          // Специальная обработка для уже пройденного теста
          if (error.existingAttempt) {
            const attempt = error.existingAttempt
            showNotification(
              'Тест уже пройден',
              `Результат: ${attempt.score.toFixed(1)}%\nСтатус: ${attempt.passed ? 'Пройден' : 'Не пройден'}\nДата: ${new Date(attempt.completedAt).toLocaleString()}`,
              'info'
            )
          } else {
            showNotification('Ошибка', error.error, 'error')
          }
        } else {
          showNotification('Ошибка', 'Ошибка при сохранении результатов теста', 'error')
        }
      }
    } catch (error) {
      console.error('Ошибка при отправке результатов теста:', error)
      showNotification('Ошибка', 'Ошибка при сохранении результатов теста', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    
    if (hours > 0) {
      return `${hours}ч ${mins}м`
    }
    return `${mins}м`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка теста...</p>
        </div>
      </div>
    )
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ошибка</h2>
          <p className="text-gray-600 mb-4">{error || 'Тест не найден'}</p>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Назад
          </button>
        </div>
      </div>
    )
  }

  const currentQ = quiz.questions[currentQuestion]
  const isLastQuestion = currentQuestion === quiz.questions.length - 1
  const isFirstQuestion = currentQuestion === 0
  const isQuizCompleted = quiz.attemptType === 'SINGLE' && attempts.length > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Назад
            </button>
            
            {timeLeft !== null && (
              <div className="flex items-center gap-2 text-lg font-semibold text-red-600">
                <Clock className="w-5 h-5" />
                {formatTime(timeLeft)}
              </div>
            )}
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{quiz.title}</h1>
            {quiz.description && (
              <p className="text-gray-600 mb-4">{quiz.description}</p>
            )}
            
            <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                <span>Вопросов: {quiz.questions.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                <span>Проходной балл: {quiz.passingScore}%</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                <span>
                  {quiz.attemptType === 'SINGLE' ? 'Однократный тест' : 'Многократный тест'}
                </span>
              </div>
              {quiz.timeLimit && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Время: {formatDuration(quiz.timeLimit)}</span>
                </div>
              )}
            </div>

            {attempts.length > 0 && (
              <div className={`mt-4 p-3 rounded-lg ${
                quiz.attemptType === 'SINGLE' && attempts.length > 0
                  ? 'bg-amber-50 border border-amber-200'
                  : 'bg-blue-50'
              }`}>
                <p className={`text-sm ${
                  quiz.attemptType === 'SINGLE' && attempts.length > 0
                    ? 'text-amber-700'
                    : 'text-blue-700'
                }`}>
                  <RotateCcw className="w-4 h-4 inline mr-1" />
                  {quiz.attemptType === 'SINGLE' && attempts.length > 0 ? (
                    <>
                      Тест уже пройден | Результат: {attempts[0].score.toFixed(1)}% | 
                      Статус: {attempts[0].passed ? 'Пройден' : 'Не пройден'}
                    </>
                  ) : (
                    <>
                      Попыток: {attempts.length} | Последний результат: {attempts[0].score.toFixed(1)}%
                    </>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Вопрос {currentQuestion + 1} из {quiz.questions.length}
            </span>
            <span className="text-sm font-medium text-gray-600">
              {Math.round(((currentQuestion + 1) / quiz.questions.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8">
          {isQuizCompleted && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-800 font-medium">
                ⚠️ Этот тест уже был пройден. Вы можете просмотреть вопросы, но не можете изменить ответы.
              </p>
            </div>
          )}
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {currentQ.question}
            </h2>
            <p className="text-sm text-gray-500">
              {currentQ.type === 'SINGLE_CHOICE' && 'Выберите один ответ'}
              {currentQ.type === 'MULTIPLE_CHOICE' && 'Выберите несколько ответов'}
              {currentQ.type === 'TRUE_FALSE' && 'Выберите один ответ'}
              {' • '}Баллов: {currentQ.points}
            </p>
          </div>

          <div className="space-y-3">
            {currentQ.options.map((option) => {
              const isSelected = answers[currentQ.id]?.includes(option.id) || false
              const isMultiple = currentQ.type === 'MULTIPLE_CHOICE'
              
              return (
                <label
                  key={option.id}
                  className={`flex items-center p-4 rounded-xl border-2 transition-all duration-200 ${
                    isQuizCompleted
                      ? 'cursor-not-allowed opacity-60'
                      : 'cursor-pointer'
                  } ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type={isMultiple ? 'checkbox' : 'radio'}
                    name={currentQ.id}
                    checked={isSelected}
                    onChange={() => !isQuizCompleted && handleAnswerChange(currentQ.id, option.id, isMultiple)}
                    disabled={isQuizCompleted}
                    className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-gray-900 font-medium">
                    {option.text}
                  </span>
                </label>
              )
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentQuestion(currentQuestion - 1)}
            disabled={isFirstQuestion}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
              isFirstQuestion
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Предыдущий
          </button>

          <div className="flex gap-3">
            {!isLastQuestion ? (
              <button
                onClick={() => setCurrentQuestion(currentQuestion + 1)}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all duration-200 font-semibold"
              >
                Следующий
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : !isQuizCompleted ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  isSubmitting
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Отправка...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Завершить тест
                  </>
                )}
              </button>
            ) : (
              <div className="flex items-center gap-2 px-8 py-3 rounded-xl font-semibold bg-gray-100 text-gray-600">
                <CheckCircle className="w-4 h-4" />
                Тест уже пройден
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Модальное окно уведомлений */}
      {showModal && modalContent && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            {/* Заголовок */}
            <div className={`flex items-center justify-between p-4 border-b border-gray-200 ${
              modalContent.type === 'success' ? 'bg-green-50' :
              modalContent.type === 'error' ? 'bg-red-50' :
              modalContent.type === 'warning' ? 'bg-yellow-50' :
              'bg-blue-50'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  modalContent.type === 'success' ? 'bg-green-100' :
                  modalContent.type === 'error' ? 'bg-red-100' :
                  modalContent.type === 'warning' ? 'bg-yellow-100' :
                  'bg-blue-100'
                }`}>
                  {modalContent.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
                  {modalContent.type === 'error' && <XCircle className="w-5 h-5 text-red-600" />}
                  {modalContent.type === 'warning' && <Award className="w-5 h-5 text-yellow-600" />}
                  {modalContent.type === 'info' && <Target className="w-5 h-5 text-blue-600" />}
                </div>
                <div>
                  <h2 className={`text-lg font-semibold ${
                    modalContent.type === 'success' ? 'text-green-800' :
                    modalContent.type === 'error' ? 'text-red-800' :
                    modalContent.type === 'warning' ? 'text-yellow-800' :
                    'text-blue-800'
                  }`}>
                    {modalContent.title}
                  </h2>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5 text-gray-600 hover:text-gray-800" />
              </button>
            </div>

            {/* Содержимое */}
            <div className="p-4">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line mb-4">
                {modalContent.message}
              </p>
              
              <div className="flex justify-end">
                <button
                  onClick={closeModal}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    modalContent.type === 'success' ? 'bg-green-600 hover:bg-green-700 text-white' :
                    modalContent.type === 'error' ? 'bg-red-600 hover:bg-red-700 text-white' :
                    modalContent.type === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700 text-white' :
                    'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  Понятно
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
