import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import StudentSidebar from '@/components/dashboard/StudentSidebar'
import { 
  Star, 
  Clock, 
  CheckCircle,
  XCircle,
  TrendingUp,
  Award,
  ArrowRight,
  Plus,
  BookOpen,
  Users,
  Calendar,
  Target
} from 'lucide-react'

export default async function StudentQuizzesPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  // Все авторизованные пользователи могут видеть тесты
  // (студенты, учителя, админы)

  // Получаем все тесты из курсов, на которые записан студент
  const enrollments = await prisma.enrollment.findMany({
    where: {
      userId: session.user.id,
      status: 'ACTIVE'
    },
    include: {
      course: {
        include: {
          modules: {
            include: {
              lessons: {
                include: {
                  quiz: {
                    include: {
                      questions: {
                        include: {
                          options: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  })

  // Собираем все тесты
  const allQuizzes = enrollments.flatMap(enrollment =>
    enrollment.course.modules.flatMap(module =>
      module.lessons
        .filter(lesson => lesson.quiz)
        .map(lesson => ({
          ...lesson.quiz!,
          lesson: lesson,
          module: module,
          course: enrollment.course
        }))
    )
  )

  // Получаем попытки прохождения тестов студентом
  const quizIds = allQuizzes.map(q => q.id)
  const attempts = await prisma.quizAttempt.findMany({
    where: {
      userId: session.user.id,
      quizId: {
        in: quizIds
      }
    }
  })

  // Создаем маппинг попыток по ID теста
  const attemptMap = new Map(
    attempts.map(attempt => [attempt.quizId, attempt])
  )

  // Добавляем информацию о попытках к тестам
  const quizzesWithAttempts = allQuizzes.map(quiz => ({
    ...quiz,
    attempt: attemptMap.get(quiz.id) || null,
    status: getQuizStatus(quiz, attemptMap.get(quiz.id))
  }))

  // Подсчет статистики
  const stats = {
    total: quizzesWithAttempts.length,
    available: quizzesWithAttempts.filter(q => q.status === 'available').length,
    completed: quizzesWithAttempts.filter(q => q.status === 'completed').length,
    passed: quizzesWithAttempts.filter(q => q.status === 'passed').length,
    failed: quizzesWithAttempts.filter(q => q.status === 'failed').length
  }

  // Функция для определения статуса теста
  function getQuizStatus(quiz: {
    id: string;
    title: string;
    description?: string;
    timeLimit: number;
    passingScore: number;
  }, attempt: {
    id: string;
    passed: boolean;
    score: number;
    completedAt: string;
  } | null) {
    if (!attempt) {
      return 'available' // Доступен для прохождения
    }
    
    if (attempt.passed) {
      return 'passed' // Пройден успешно
    } else {
      return 'failed' // Не пройден
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-blue-600'
      case 'completed': return 'text-purple-600'
      case 'passed': return 'text-green-600'
      case 'failed': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-blue-50 border-blue-200'
      case 'completed': return 'bg-purple-50 border-purple-200'
      case 'passed': return 'bg-green-50 border-green-200'
      case 'failed': return 'bg-red-50 border-red-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <Star className="w-5 h-5" />
      case 'completed': return <CheckCircle className="w-5 h-5" />
      case 'passed': return <Award className="w-5 h-5" />
      case 'failed': return <XCircle className="w-5 h-5" />
      default: return <Star className="w-5 h-5" />
    }
  }

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case 'WORDPRESS': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'VIBE_CODING': return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'SHOPIFY': return 'bg-green-100 text-green-700 border-green-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getDirectionName = (direction: string) => {
    switch (direction) {
      case 'WORDPRESS': return 'WordPress'
      case 'VIBE_CODING': return 'Vibe Coding'
      case 'SHOPIFY': return 'Shopify'
      default: return 'Неизвестно'
    }
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} мин`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}ч ${mins}мин`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex">
      {/* Боковая панель */}
      <StudentSidebar />
      
      {/* Основной контент */}
      <div className="flex-1">
        <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Заголовок */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-gradient-to-r from-rose-500 to-red-600 rounded-xl">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">Мои тесты</h1>
                  <p className="text-xl text-gray-600">
                    Проверяйте знания и отслеживайте прогресс обучения
                  </p>
                </div>
              </div>
            </div>

            {/* Статистика */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-slate-500 to-gray-600 rounded-xl">
                    <Target className="w-7 h-7 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Всего тестов</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
                    <Star className="w-7 h-7 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Доступно</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.available}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl">
                    <CheckCircle className="w-7 h-7 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Завершено</p>
                    <p className="text-3xl font-bold text-purple-600">{stats.completed}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl">
                    <Award className="w-7 h-7 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Пройдено</p>
                    <p className="text-3xl font-bold text-emerald-600">{stats.passed}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-red-500 to-pink-600 rounded-xl">
                    <XCircle className="w-7 h-7 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Не пройдено</p>
                    <p className="text-3xl font-bold text-red-600">{stats.failed}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Фильтры и поиск */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-semibold text-gray-900">Все тесты</h2>
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {quizzesWithAttempts.length} тестов
                  </span>
                </div>
                <div className="flex gap-3">
                  <Link
                    href="/dashboard"
                    className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 px-4 py-2 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all duration-300 font-medium"
                  >
                    ← Назад в дашборд
                  </Link>
                  <Link
                    href="/courses"
                    className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-2 rounded-xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    <Plus className="w-4 h-4 mr-2 inline" />
                    Найти курсы
                  </Link>
                </div>
              </div>
            </div>

            {/* Список тестов */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              {quizzesWithAttempts.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-32 h-32 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-8">
                    <Star className="w-16 h-16 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Тестов пока нет</h3>
                  <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto">
                    У вас пока нет тестов для прохождения. Запишитесь на курсы, чтобы получать тесты от преподавателей.
                  </p>
                  <div className="flex items-center justify-center gap-6 text-sm text-gray-500 mb-8">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      <span>Изучайте уроки</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      <span>Следите за прогрессом</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      <span>Присоединитесь к группам</span>
                    </div>
                  </div>
                  <Link
                    href="/courses"
                    className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 inline-block"
                  >
                    Найти курсы
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {quizzesWithAttempts.map((quiz) => (
                    <div key={quiz.id} className={`border rounded-2xl p-6 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 ${getStatusBgColor(quiz.status)}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-4">
                            <div className={`p-3 rounded-xl ${getStatusBgColor(quiz.status)}`}>
                              <div className={`flex items-center gap-2 ${getStatusColor(quiz.status)}`}>
                                {getStatusIcon(quiz.status)}
                              </div>
                            </div>
                            <div className="flex-1">
                              <h3 className="font-bold text-gray-900 text-xl mb-2">{quiz.title}</h3>
                              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getDirectionColor(quiz.course.direction)}`}>
                                  {getDirectionName(quiz.course.direction)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                  </svg>
                                  {quiz.course.title}
                                </span>
                                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                <span className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                  </svg>
                                  {quiz.lesson.module.title}
                                </span>
                                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                <span className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {quiz.lesson.title}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {quiz.description && (
                            <p className="text-gray-600 mb-4 leading-relaxed">
                              {quiz.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-6 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span className="font-medium">Время:</span>
                              <span className="font-semibold text-gray-900">
                                {quiz.timeLimit ? formatDuration(quiz.timeLimit) : 'Без ограничений'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Target className="w-4 h-4 text-gray-500" />
                              <span className="font-medium">Вопросов:</span>
                              <span className="font-semibold text-gray-900">{quiz.questions.length}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Award className="w-4 h-4 text-gray-500" />
                              <span className="font-medium">Проходной балл:</span>
                              <span className="font-semibold text-gray-900">{quiz.passingScore}%</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-3 ml-6">
                          {quiz.attempt ? (
                            <div className="text-center">
                              {quiz.attempt.passed ? (
                                <div className="p-3 bg-green-100 rounded-xl mb-2">
                                  <Award className="w-6 h-6 text-green-600 mx-auto" />
                                </div>
                              ) : (
                                <div className="p-3 bg-red-100 rounded-xl mb-2">
                                  <XCircle className="w-6 h-6 text-red-600 mx-auto" />
                                </div>
                              )}
                              <p className={`text-sm font-semibold ${
                                quiz.attempt.passed ? 'text-green-700' : 'text-red-700'
                              }`}>
                                {quiz.attempt.passed ? 'Пройден' : 'Не пройден'}
                              </p>
                              <p className="text-xs text-gray-600">
                                Оценка: {quiz.attempt.score}/{quiz.attempt.maxScore}
                              </p>
                            </div>
                          ) : (
                            <div className="text-center">
                              <div className="p-3 bg-blue-100 rounded-xl mb-2">
                                <Star className="w-6 h-6 text-blue-600 mx-auto" />
                              </div>
                              <p className="text-sm font-semibold text-blue-700">
                                Доступен
                              </p>
                            </div>
                          )}
                          
                          <Link
                            href={`/quizzes/${quiz.id}`}
                            className="bg-gradient-to-r from-rose-600 to-red-700 text-white px-6 py-3 rounded-xl hover:from-rose-700 hover:to-red-800 transition-all duration-300 text-sm font-semibold text-center shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-2"
                          >
                            {quiz.attempt ? 'Повторить' : 'Начать тест'}
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
