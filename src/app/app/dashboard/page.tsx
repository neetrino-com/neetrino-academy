import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import StudentAssignments from '@/components/dashboard/StudentAssignments'

export default async function AppDashboardPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  // Только студенты могут видеть дашборд
  if (session.user.role !== 'STUDENT') {
    redirect('/app/admin')
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
    },
    take: 3 // Показываем только 3 последних курса
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Приветствие */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm p-8 mb-8 border border-slate-200/60">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-3">
              Добро пожаловать, {session.user?.name}! 👋
            </h1>
            <p className="text-lg text-slate-600 font-medium">
              Продолжайте обучение и достигайте новых высот
            </p>
          </div>

          {/* Статистика */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-semibold uppercase tracking-wide">Активных курсов</p>
                  <p className="text-3xl font-bold mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {totalCourses}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl p-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-600 font-semibold uppercase tracking-wide">Завершено уроков</p>
                  <p className="text-3xl font-bold mt-2 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    {completedLessons}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl p-4">
                  <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-600 font-semibold uppercase tracking-wide">Общий прогресс</p>
                  <p className="text-3xl font-bold mt-2 bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                    {overallProgress}%
                  </p>
                </div>
                <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl p-4">
                  <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-semibold uppercase tracking-wide">Достижений</p>
                  <p className="text-3xl font-bold mt-2 bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                    0
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-100 to-violet-100 rounded-2xl p-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Мои курсы */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm p-8 mb-8 border border-slate-200/60">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Мои курсы</h2>
              <Link
                href="/courses"
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Все курсы →
              </Link>
            </div>

            {enrollments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    <div key={enrollment.id} className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/60 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-105">
                      <h3 className="font-bold text-blue-900 mb-4 text-lg">{course.title}</h3>
                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-blue-600 mb-2 font-medium">
                          <span>Прогресс</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-sm text-blue-600 font-medium">
                        <span>{completedLessons} из {totalLessons} уроков</span>
                        <Link
                          href={`/courses/${course.id}`}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
                        >
                          Продолжить →
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-blue-400 mb-6">
                  <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">
                  У вас пока нет курсов
                </h3>
                <p className="text-slate-600 mb-6">
                  Запишитесь на свой первый курс и начните обучение
                </p>
                <Link
                  href="/courses"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold"
                >
                  Выбрать курс
                </Link>
              </div>
            )}
          </div>

          {/* Виджет заданий для студентов */}
          <StudentAssignments />
        </div>
      </div>
    </div>
  )
}
