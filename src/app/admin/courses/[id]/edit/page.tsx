import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { CourseForm } from '@/components/admin/CourseForm'

interface EditCoursePageProps {
  params: { id: string }
}

export default async function EditCoursePage({ params }: EditCoursePageProps) {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  // Проверяем роль пользователя
  if (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  // Получаем курс для редактирования
  const course = await prisma.course.findUnique({
    where: { id: (await params).id },
    include: {
      modules: {
        include: {
          _count: {
            select: {
              lessons: true,
              assignments: true
            }
          }
        },
        orderBy: { order: 'asc' }
      },
      _count: {
        select: {
          enrollments: true
        }
      }
    }
  })

  if (!course) {
    redirect('/admin/courses')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Редактирование курса
          </h1>
          <p className="text-gray-600">
            Обновите информацию о курсе "{course.title}"
          </p>
        </div>

        {/* Статистика курса */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-2xl font-bold text-blue-600">
              {course.modules.length}
            </div>
            <div className="text-sm text-gray-600">Модулей</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-2xl font-bold text-green-600">
              {course.modules.reduce((acc, module) => acc + module._count.lessons, 0)}
            </div>
            <div className="text-sm text-gray-600">Уроков</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-2xl font-bold text-purple-600">
              {course.modules.reduce((acc, module) => acc + module._count.assignments, 0)}
            </div>
            <div className="text-sm text-gray-600">Заданий</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-2xl font-bold text-orange-600">
              {course._count.enrollments}
            </div>
            <div className="text-sm text-gray-600">Студентов</div>
          </div>
        </div>

        {/* Форма редактирования */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <CourseForm 
            mode="edit" 
            initialData={course}
            courseId={course.id}
          />
        </div>

        {/* Быстрые действия */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href={`/admin/courses/${course.id}/modules`}
            className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg shadow-md transition-colors"
          >
            <div className="text-lg font-semibold mb-2">Управление модулями</div>
            <div className="text-sm opacity-90">
              Добавляйте и редактируйте модули курса
            </div>
          </a>
          
          <a
            href="/admin/courses"
            className="bg-gray-600 hover:bg-gray-700 text-white p-4 rounded-lg shadow-md transition-colors"
          >
            <div className="text-lg font-semibold mb-2">Все курсы</div>
            <div className="text-sm opacity-90">
              Вернуться к списку всех курсов
            </div>
          </a>
          
          <a
            href="/assignments"
            className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg shadow-md transition-colors"
          >
            <div className="text-lg font-semibold mb-2">Задания</div>
            <div className="text-sm opacity-90">
              Создавать и управлять заданиями
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}
