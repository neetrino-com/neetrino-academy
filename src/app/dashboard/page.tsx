import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import StudentAssignments from '@/components/dashboard/StudentAssignments'
import StudentSidebar from '@/components/dashboard/StudentSidebar'

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex">
      {/* Боковая панель */}
      <StudentSidebar />
      
      {/* Основной контент */}
      <div className="flex-1">
        <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Приветствие */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-8 mb-8 text-white">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-4xl font-bold mb-2">
                    Добро пожаловать, {session.user?.name}! 👋
                  </h1>
                  <p className="text-xl text-blue-100 opacity-90">
                    Продолжайте обучение и достигайте новых высот
                  </p>
                </div>
              </div>
              
              {/* Прогресс-бар */}
              <div className="mt-6">
                <div className="flex justify-between text-sm text-blue-100 mb-2 font-medium">
                  <span>Общий прогресс обучения</span>
                  <span className="font-bold text-white">{overallProgress}%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-3 backdrop-blur-sm">
                  <div 
                    className="bg-gradient-to-r from-emerald-400 to-teal-500 h-3 rounded-full transition-all duration-1000 ease-out shadow-lg"
                    style={{ width: `${overallProgress}%` }}
                  ></div>
                </div>
              </div>
            </div>

          {/* Статистика */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
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
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Завершено уроков</p>
                  <p className="text-3xl font-bold text-gray-900">{completedLessons}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
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
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Достижений</p>
                  <p className="text-3xl font-bold text-gray-900">0</p>
                </div>
              </div>
            </div>
          </div>

          {/* Мои курсы */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Мои курсы ({enrollments.length})</h2>
                <p className="text-gray-600">Управляйте своими курсами и отслеживайте прогресс</p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/courses"
                  className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  Все курсы →
                </Link>
                <Link
                  href="/payments"
                  className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-6 py-3 rounded-xl hover:from-emerald-700 hover:to-teal-800 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  Мои платежи →
                </Link>
              </div>
            </div>

            {enrollments.length > 0 ? (
              <div className="space-y-6">
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
                    <div key={enrollment.id} className="border border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-gray-50 to-white hover:from-blue-50 hover:to-indigo-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-4">
                            <h3 className="font-bold text-gray-900 text-xl">{course.title}</h3>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              course.direction === 'WORDPRESS' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                              course.direction === 'VIBE_CODING' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                              'bg-green-100 text-green-700 border border-green-200'
                            }`}>
                              {course.direction === 'WORDPRESS' ? 'WordPress' :
                               course.direction === 'VIBE_CODING' ? 'Vibe Coding' : 'Shopify'}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              course.level === 'BEGINNER' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                              course.level === 'INTERMEDIATE' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                              'bg-red-100 text-red-700 border border-red-200'
                            }`}>
                              {course.level === 'BEGINNER' ? 'Начинающий' :
                               course.level === 'INTERMEDIATE' ? 'Средний' : 'Продвинутый'}
                            </span>
                          </div>
                          
                          <div className="mb-6">
                            <div className="flex justify-between text-sm text-gray-600 mb-2 font-semibold">
                              <span>Прогресс обучения</span>
                              <span className="font-bold text-gray-900">{progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-1000 ease-out shadow-sm"
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <span className="font-medium">{completedLessons} из {totalLessons} уроков завершено</span>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                              {course.modules.length} модулей
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-3 ml-6">
                          <Link
                            href={`/courses/${course.id}`}
                            className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 text-sm font-semibold text-center shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                          >
                            Продолжить
                          </Link>
                          <Link
                            href={`/courses/${course.id}/learn`}
                            className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all duration-300 text-sm font-semibold text-center shadow-md hover:shadow-lg transform hover:-translate-y-1"
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
              <div className="text-center py-12">
                <div className="text-blue-400 mb-6">
                  <svg className="mx-auto h-20 w-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  У вас пока нет курсов
                </h3>
                <p className="text-gray-600 mb-8 text-lg">
                  Запишитесь на свой первый курс и начните обучение
                </p>
                <Link
                  href="/courses"
                  className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 inline-block"
                >
                  Выбрать курс
                </Link>
              </div>
            )}
          </div>

          {/* Быстрые действия */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Быстрые действия</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link
                href="/courses"
                className="flex flex-col items-center p-6 border border-gray-200 rounded-2xl hover:border-blue-300 hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <span className="text-base font-semibold text-gray-700 text-center">Найти новые курсы</span>
              </Link>

              <Link
                href="/payments"
                className="flex flex-col items-center p-6 border border-gray-200 rounded-2xl hover:border-emerald-300 hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <span className="text-base font-semibold text-gray-700 text-center">Мои платежи</span>
              </Link>

              <Link
                href="/dashboard/profile"
                className="flex flex-col items-center p-6 border border-gray-200 rounded-2xl hover:border-purple-300 hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className="text-base font-semibold text-gray-700 text-center">Профиль</span>
              </Link>

              <Link
                href="/support"
                className="flex flex-col items-center p-6 border border-gray-200 rounded-2xl hover:border-orange-300 hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-base font-semibold text-gray-700 text-center">Поддержка</span>
              </Link>
            </div>
          </div>

          {/* Виджет заданий для студентов */}
          <StudentAssignments />
        </div>
      </div>
    </div>
  </div>
  )
}