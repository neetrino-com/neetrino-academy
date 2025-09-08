import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import StudentSidebar from '@/components/dashboard/StudentSidebar'

export default async function StudentCoursesPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  // Все авторизованные пользователи могут видеть курсы
  // (студенты, учителя, админы)

  // Получаем все курсы студента
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
  })

  return (
    <div className="min-h-screen bg-blue-50 flex">
      {/* Боковая панель */}
      <StudentSidebar />
      
      {/* Основной контент */}
      <div className="flex-1">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Заголовок */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-blue-900 mb-2">Мои курсы</h1>
              <p className="text-lg text-blue-600">
                Управляйте своими курсами и отслеживайте прогресс
              </p>
            </div>

            {/* Статистика */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-blue-600">Всего курсов</p>
                    <p className="text-2xl font-semibold text-blue-900">{enrollments.length}</p>
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
                    <p className="text-sm font-medium text-green-600">Активных</p>
                    <p className="text-2xl font-semibold text-green-900">{enrollments.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-purple-600">В процессе</p>
                    <p className="text-2xl font-semibold text-purple-900">
                      {enrollments.filter(e => e.course.modules.some(m => m.lessons.some(l => l.progress.some(p => p.completed)))).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Список курсов */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-blue-900">Список курсов</h2>
                <Link
                  href="/courses"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Найти новые курсы
                </Link>
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
                      <div key={enrollment.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                              <h3 className="text-xl font-semibold text-gray-900">{course.title}</h3>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                course.direction === 'WORDPRESS' ? 'bg-blue-100 text-blue-700' :
                                course.direction === 'VIBE_CODING' ? 'bg-purple-100 text-purple-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {course.direction === 'WORDPRESS' ? 'WordPress' :
                                 course.direction === 'VIBE_CODING' ? 'Vibe Coding' : 'Shopify'}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                course.level === 'BEGINNER' ? 'bg-green-100 text-green-700' :
                                course.level === 'INTERMEDIATE' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {course.level === 'BEGINNER' ? 'Начинающий' :
                                 course.level === 'INTERMEDIATE' ? 'Средний' : 'Продвинутый'}
                              </span>
                            </div>
                            
                            {course.description && (
                              <p className="text-gray-600 mb-4">{course.description}</p>
                            )}
                            
                            <div className="mb-4">
                              <div className="flex justify-between text-sm text-gray-600 mb-2 font-medium">
                                <span>Прогресс обучения</span>
                                <span className="font-semibold">{progress}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-3">
                                <div 
                                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-300"
                                  style={{ width: `${progress}%` }}
                                ></div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Уроков:</span> {totalLessons}
                              </div>
                              <div>
                                <span className="font-medium">Завершено:</span> {completedLessons}
                              </div>
                              <div>
                                <span className="font-medium">Модулей:</span> {course.modules.length}
                              </div>
                              <div>
                                <span className="font-medium">Записался:</span> {new Date(enrollment.enrolledAt).toLocaleDateString('ru-RU')}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-3 ml-6">
                            <Link
                              href={`/courses/${course.id}`}
                              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors text-center font-medium"
                            >
                              Продолжить
                            </Link>
                            <Link
                              href={`/courses/${course.id}/learn`}
                              className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors text-center font-medium"
                            >
                              Учиться
                            </Link>
                            <Link
                              href={`/dashboard/courses/${course.id}/progress`}
                              className="bg-green-100 text-green-700 px-6 py-3 rounded-lg hover:bg-green-200 transition-colors text-center font-medium"
                            >
                              Прогресс
                            </Link>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-blue-400 mb-4">
                    <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    У вас пока нет курсов
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Запишитесь на свой первый курс и начните обучение
                  </p>
                  <Link
                    href="/courses"
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Выбрать курс
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
