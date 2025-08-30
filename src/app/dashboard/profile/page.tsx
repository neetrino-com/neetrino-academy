import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import StudentSidebar from '@/components/dashboard/StudentSidebar'
import { 
  User, 
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  TrendingUp,
  BookOpen,
  FileText,
  Star,
  Clock,
  ArrowRight,
  Edit,
  Settings
} from 'lucide-react'

export default async function StudentProfilePage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'STUDENT') {
    redirect('/')
  }

  // Получаем полную информацию о пользователе
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      enrollments: {
        where: { status: 'ACTIVE' },
        include: {
          course: {
            include: {
              modules: {
                include: {
                  lessons: {
                    include: {
                      progress: {
                        where: { userId: session.user.id }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      submissions: {
        include: {
          assignment: true
        }
      },
      quizAttempts: {
        include: {
          quiz: true
        }
      },
      achievements: {
        orderBy: { earnedAt: 'desc' },
        take: 5
      }
    }
  })

  if (!user) {
    redirect('/login')
  }

  // Вычисляем статистику
  const totalCourses = user.enrollments.length
  const totalLessons = user.enrollments.reduce((acc, enrollment) => {
    return acc + enrollment.course.modules.reduce((moduleAcc, module) => {
      return moduleAcc + module.lessons.length
    }, 0)
  }, 0)
  
  const completedLessons = user.enrollments.reduce((acc, enrollment) => {
    return acc + enrollment.course.modules.reduce((moduleAcc, module) => {
      return moduleAcc + module.lessons.filter(lesson => 
        lesson.progress.some(p => p.completed)
      ).length
    }, 0)
  }, 0)

  const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
  const totalAssignments = user.submissions.length
  const totalQuizzes = user.quizAttempts.length
  const passedQuizzes = user.quizAttempts.filter(attempt => attempt.passed).length

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'COURSE_COMPLETED': return <BookOpen className="w-5 h-5" />
      case 'ASSIGNMENT_SUBMITTED': return <FileText className="w-5 h-5" />
      case 'PERFECT_SCORE': return <Star className="w-5 h-5" />
      case 'STREAK_7_DAYS': return <TrendingUp className="w-5 h-5" />
      case 'STREAK_30_DAYS': return <Award className="w-5 h-5" />
      default: return <Award className="w-5 h-5" />
    }
  }

  const getAchievementColor = (type: string) => {
    switch (type) {
      case 'COURSE_COMPLETED': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      case 'ASSIGNMENT_SUBMITTED': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'PERFECT_SCORE': return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'STREAK_7_DAYS': return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'STREAK_30_DAYS': return 'bg-rose-100 text-rose-700 border-rose-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
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
                <div className="p-3 bg-gradient-to-r from-slate-500 to-gray-600 rounded-xl">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">Мой профиль</h1>
                  <p className="text-xl text-gray-600">
                    Управляйте личной информацией и отслеживайте достижения
                  </p>
                </div>
              </div>
            </div>

            {/* Основная информация профиля */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">{user.name}</h2>
                    <p className="text-lg text-gray-600 mb-1">{user.email}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                        Студент
                      </span>
                      <span>•</span>
                      <span>Зарегистрирован {formatDate(user.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <Link
                  href="/dashboard/settings"
                  className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all duration-300 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-1 flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Редактировать
                </Link>
              </div>

              {/* Дополнительная информация */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Личная информация</h3>
                  <div className="space-y-3">
                    {user.age && (
                      <div className="flex items-center gap-3 text-gray-600">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <span>Возраст: {user.age} лет</span>
                      </div>
                    )}
                    {user.gender && (
                      <div className="flex items-center gap-3 text-gray-600">
                        <User className="w-5 h-5 text-gray-400" />
                        <span>Пол: {user.gender === 'male' ? 'Мужской' : user.gender === 'female' ? 'Женский' : 'Другой'}</span>
                      </div>
                    )}
                    {user.phone && (
                      <div className="flex items-center gap-3 text-gray-600">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <span>Телефон: {user.phone}</span>
                      </div>
                    )}
                    {user.city && (
                      <div className="flex items-center gap-3 text-gray-600">
                        <MapPin className="w-5 h-5 text-gray-400" />
                        <span>Город: {user.city}</span>
                      </div>
                    )}
                    {user.country && (
                      <div className="flex items-center gap-3 text-gray-600">
                        <MapPin className="w-5 h-5 text-gray-400" />
                        <span>Страна: {user.country}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Социальные сети</h3>
                  <div className="space-y-3">
                    {user.telegram && (
                      <div className="flex items-center gap-3 text-gray-600">
                        <div className="w-5 h-5 bg-blue-500 rounded"></div>
                        <span>Telegram: @{user.telegram}</span>
                      </div>
                    )}
                    {user.instagram && (
                      <div className="flex items-center gap-3 text-gray-600">
                        <div className="w-5 h-5 bg-pink-500 rounded"></div>
                        <span>Instagram: @{user.instagram}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Статистика обучения */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
                    <BookOpen className="w-7 h-7 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Активных курсов</p>
                    <p className="text-3xl font-bold text-gray-900">{totalCourses}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl">
                    <TrendingUp className="w-7 h-7 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Общий прогресс</p>
                    <p className="text-3xl font-bold text-gray-900">{overallProgress}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl">
                    <FileText className="w-7 h-7 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Сдано заданий</p>
                    <p className="text-3xl font-bold text-gray-900">{totalAssignments}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl">
                    <Star className="w-7 h-7 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Пройдено тестов</p>
                    <p className="text-3xl font-bold text-gray-900">{passedQuizzes}/{totalQuizzes}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Активные курсы */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Активные курсы</h2>
                <Link
                  href="/dashboard/courses"
                  className="text-blue-600 hover:text-blue-700 font-medium hover:underline flex items-center gap-1"
                >
                  Все курсы
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {user.enrollments.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Курсов пока нет</h3>
                  <p className="text-gray-600 mb-4">Запишитесь на свой первый курс</p>
                  <Link
                    href="/courses"
                    className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 font-medium"
                  >
                    Найти курсы
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {user.enrollments.slice(0, 3).map((enrollment) => {
                    const course = enrollment.course
                    const totalLessons = course.modules.reduce((acc, module) => {
                      return acc + module.lessons.length
                    }, 0)
                    
                    const completedLessons = course.modules.reduce((acc, module) => {
                      return acc + module.lessons.filter(lesson => 
                        lesson.progress.some(p => p.completed)
                      ).length
                    }, 0)

                    const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

                    return (
                      <div key={enrollment.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200 bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-gray-900">{course.title}</h3>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getDirectionColor(course.direction)}`}>
                                {getDirectionName(course.direction)}
                              </span>
                            </div>
                            <div className="mb-2">
                              <div className="flex justify-between text-sm text-gray-600 mb-1">
                                <span>Прогресс</span>
                                <span className="font-semibold">{progress}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${progress}%` }}
                                ></div>
                              </div>
                            </div>
                            <div className="text-sm text-gray-600">
                              {completedLessons} из {totalLessons} уроков завершено
                            </div>
                          </div>
                          <Link
                            href={`/courses/${course.id}`}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            Продолжить
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Достижения */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Достижения</h2>
                <div className="text-sm text-gray-500">
                  {user.achievements.length} достижений
                </div>
              </div>

              {user.achievements.length === 0 ? (
                <div className="text-center py-8">
                  <Award className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Достижений пока нет</h3>
                  <p className="text-gray-600 mb-4">Продолжайте обучение, чтобы получить достижения</p>
                  <Link
                    href="/dashboard"
                    className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 font-medium"
                  >
                    Начать обучение
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {user.achievements.map((achievement) => (
                    <div key={achievement.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-lg ${getAchievementColor(achievement.type)}`}>
                          {getAchievementIcon(achievement.type)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{achievement.title}</h4>
                          <p className="text-sm text-gray-600">{achievement.description}</p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        Получено {formatDate(achievement.earnedAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Быстрые действия */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Быстрые действия</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 group"
                >
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <Settings className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Настройки профиля</span>
                    <p className="text-sm text-gray-600">Изменить личную информацию</p>
                  </div>
                </Link>

                <Link
                  href="/dashboard"
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-green-300 hover:shadow-md transition-all duration-200 group"
                >
                  <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Мой прогресс</span>
                    <p className="text-sm text-gray-600">Отследить обучение</p>
                  </div>
                </Link>

                <Link
                  href="/courses"
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-md transition-all duration-200 group"
                >
                  <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                    <BookOpen className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Найти курсы</span>
                    <p className="text-sm text-gray-600">Расширить знания</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
