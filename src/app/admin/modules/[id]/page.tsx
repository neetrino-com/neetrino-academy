import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { LessonForm } from '@/components/admin/LessonForm'

interface PageProps {
  params: { id: string }
}

export default async function ModuleLessonsPage({ params }: PageProps) {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  // Проверяем роль пользователя
  if (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  // Получаем модуль с уроками
  const module = await prisma.module.findUnique({
    where: { id: params.id },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true
        }
      },
      lessons: {
        orderBy: {
          order: 'asc'
        }
      },
      _count: {
        select: {
          lessons: true,
          assignments: true
        }
      }
    }
  })

  if (!module) {
    redirect('/admin/courses')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Заголовок */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Уроки модуля: {module.title}
                </h1>
                <p className="mt-2 text-gray-600">
                  Курс: {module.course.title} • Уроков: {module._count.lessons} • Заданий: {module._count.assignments}
                </p>
              </div>
              <div className="flex space-x-3">
                <Link
                  href={`/admin/courses/${module.course.id}/modules`}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Назад к модулям
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Список уроков */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Уроки модуля ({module.lessons.length})
                  </h2>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {module.lessons.length === 0 ? (
                    <div className="px-6 py-8 text-center text-gray-500">
                      <p>Уроки еще не созданы</p>
                    </div>
                  ) : (
                    module.lessons.map((lesson) => (
                      <div key={lesson.id} className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900">
                              {lesson.order}. {lesson.title}
                            </h3>
                            {lesson.content && (
                              <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                                {lesson.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
                              </p>
                            )}
                            <div className="mt-2 flex space-x-4 text-sm text-gray-500">
                              {lesson.duration > 0 && (
                                <span>Длительность: {lesson.duration} мин</span>
                              )}
                              {lesson.videoUrl && (
                                <span className="text-blue-600">Есть видео</span>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Link
                              href={`/admin/lessons/${lesson.id}/edit`}
                              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                              Редактировать
                            </Link>
                            <button
                              onClick={async () => {
                                if (confirm('Вы уверены, что хотите удалить этот урок?')) {
                                  await fetch(`/api/admin/lessons/${lesson.id}`, {
                                    method: 'DELETE'
                                  })
                                  window.location.reload()
                                }
                              }}
                              className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                            >
                              Удалить
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Панель управления */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Управление уроками</h2>
                
                <div className="space-y-4">
                  <Link
                    href={`/admin/modules/${(await params).id}/lessons/create`}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Создать новый урок
                  </Link>

                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Статистика модуля</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Всего уроков:</span>
                        <span className="font-semibold">{module.lessons.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Активных уроков:</span>
                        <span className="font-semibold text-green-600">
                          {module.lessons.filter(l => l.isActive !== false).length}
                        </span>
                      </div>
                    </div>
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
