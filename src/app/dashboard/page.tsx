import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import StudentAssignments from '@/components/dashboard/StudentAssignments'

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  // Только студенты могут видеть дашборд
  if (session.user.role !== 'STUDENT') {
    redirect('/')
  }

  // Получаем курсы пользователя
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
                  progress: {
                    where: {
                      userId: session.user.id
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    orderBy: {
      enrolledAt: 'desc'
    }
    // Убрали take: 3 - теперь показываем все курсы
  })

  // Вычисляем статистику
  const totalCourses = enrollments.length
  const totalLessons = enrollments.reduce((acc, enrollment) => {
    return acc + enrollment.course.modules.reduce((moduleAcc, module) => {
      return moduleAcc + module.lessons.length
    }, 0)
  }, 0)
  
  const completedLessons = enrollments.reduce((acc, enrollment) => {
    return acc + enrollment.course.modules.reduce((moduleAcc, module) => {
      return moduleAcc + module.lessons.filter(lesson => 
        lesson.progress.some(p => p.completed)
      ).length
    }, 0)
  }, 0)

  const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  return (
    <div className="min-h-screen bg-blue-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Приветствие */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h1 className="text-3xl font-bold text-blue-900 mb-2">
              Добро пожаловать, {session.user?.name}! 👋
            </h1>
            <p className="text-lg text-blue-600">
              Продолжайте обучение и достигайте новых высот
            </p>
          </div>

          {/* Статистика */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-600">Активных курсов</p>
                  <p className="text-2xl font-semibold text-blue-900">{totalCourses}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-green-600">Завершено уроков</p>
                  <p className="text-2xl font-semibold text-green-900">{completedLessons}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-yellow-600">Общий прогресс</p>
                  <p className="text-2xl font-semibold text-yellow-900">{overallProgress}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-purple-600">Достижений</p>
                  <p className="text-2xl font-semibold text-purple-900">0</p>
                </div>
              </div>
            </div>
          </div>

          {/* Мои курсы */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-blue-900">Мои курсы ({enrollments.length})</h2>
              <div className="flex gap-3">
                <Link
                  href="/courses"
                  className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                >
                  Все курсы →
                </Link>
                <Link
                  href="/payments"
                  className="text-green-600 hover:text-green-700 font-medium hover:underline"
                >
                  Мои платежи →
                </Link>
              </div>
            </div>

            {enrollments.length > 0 ? (
              <div className="space-y-4">
                {enrollments.map((enrollment) => {
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
                    <div key={enrollment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="font-semibold text-gray-900 text-lg">{course.title}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              course.direction === 'WORDPRESS' ? 'bg-blue-100 text-blue-700' :
                              course.direction === 'VIBE_CODING' ? 'bg-purple-100 text-purple-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {course.direction === 'WORDPRESS' ? 'WordPress' :
                               course.direction === 'VIBE_CODING' ? 'Vibe Coding' : 'Shopify'}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              course.level === 'BEGINNER' ? 'bg-green-100 text-green-700' :
                              course.level === 'INTERMEDIATE' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {course.level === 'BEGINNER' ? 'Начинающий' :
                               course.level === 'INTERMEDIATE' ? 'Средний' : 'Продвинутый'}
                            </span>
                          </div>
                          
                          <div className="mb-3">
                            <div className="flex justify-between text-sm text-gray-600 mb-1 font-medium">
                              <span>Прогресс обучения</span>
                              <span className="font-semibold">{progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>{completedLessons} из {totalLessons} уроков завершено</span>
                            <span className="text-xs text-gray-500">
                              {course.modules.length} модулей
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 ml-4">
                          <Link
                            href={`/courses/${course.id}`}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium text-center"
                          >
                            Продолжить
                          </Link>
                          <Link
                            href={`/courses/${course.id}/learn`}
                            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium text-center"
                          >
                            Учиться
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-blue-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-blue-900 mb-2">
                  У вас пока нет курсов
                </h3>
                <p className="text-blue-600 mb-4">
                  Запишитесь на свой первый курс и начните обучение
                </p>
                <Link
                  href="/courses"
                  className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Выбрать курс
                </Link>
              </div>
            )}
          </div>

          {/* Быстрые действия */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold text-blue-900 mb-6">Быстрые действия</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/courses"
                className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200 group"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-700 text-center">Найти новые курсы</span>
              </Link>

              <Link
                href="/payments"
                className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:shadow-md transition-all duration-200 group"
              >
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-green-200 transition-colors">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-700 text-center">Мои платежи</span>
              </Link>

              <Link
                href="/profile"
                className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all duration-200 group"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-purple-200 transition-colors">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-700 text-center">Профиль</span>
              </Link>

              <Link
                href="/support"
                className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:shadow-md transition-all duration-200 group"
              >
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-orange-200 transition-colors">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-700 text-center">Поддержка</span>
              </Link>
            </div>
          </div>

          {/* Виджет заданий для студентов */}
          <StudentAssignments />
        </div>
      </div>
    </div>
  )
}