import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { ModuleForm } from '@/components/admin/ModuleForm'

interface PageProps {
  params: { id: string }
}

export default async function CourseModulesPage({ params }: PageProps) {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  // Проверяем роль пользователя
  if (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  // Получаем курс с модулями
  const course = await prisma.course.findUnique({
    where: { id: params.id },
    include: {
      modules: {
        include: {
          _count: {
            select: {
              lessons: true
            }
          }
        },
        orderBy: {
          order: 'asc'
        }
      }
    }
  })

  if (!course) {
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
                  Модули курса: {course.title}
                </h1>
                <p className="mt-2 text-gray-600">
                  Управление модулями и уроками курса
                </p>
              </div>
              <div className="flex space-x-3">
                <Link
                  href="/admin/courses"
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Назад к курсам
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Список модулей */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Модули курса ({course.modules.length})
                  </h2>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {course.modules.length === 0 ? (
                    <div className="px-6 py-8 text-center text-gray-500">
                      <p>Модули еще не созданы</p>
                    </div>
                  ) : (
                    course.modules.map((module) => (
                      <div key={module.id} className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900">
                              {module.order}. {module.title}
                            </h3>
                            {module.description && (
                              <p className="mt-1 text-sm text-gray-600">
                                {module.description}
                              </p>
                            )}
                            <div className="mt-2 flex space-x-4 text-sm text-gray-500">
                              <span>Уроков: {module._count.lessons}</span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Link
                              href={`/admin/modules/${module.id}`}
                              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                              Управлять
                            </Link>
                            <Link
                              href={`/admin/modules/${module.id}/edit`}
                              className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                            >
                              Редактировать
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Форма создания модуля */}
            <div className="lg:col-span-1">
              <ModuleForm 
                courseId={(await params).id}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
