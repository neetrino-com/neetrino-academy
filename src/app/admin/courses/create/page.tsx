import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { CourseForm } from '@/components/admin/CourseForm'

export default async function CreateCoursePage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  // Проверяем роль пользователя
  if (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Создание нового курса
          </h1>
          <p className="text-gray-600">
            Создайте новый курс для обучения студентов
          </p>
        </div>

        {/* Форма создания */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <CourseForm mode="create" />
        </div>

        {/* Быстрые действия */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
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
