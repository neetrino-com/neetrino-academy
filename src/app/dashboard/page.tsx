import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Добро пожаловать в Neetrino Academy!
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Привет, {session.user?.name}! Вы успешно вошли в систему.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Мои курсы
                  </h3>
                  <p className="text-gray-600">
                    Здесь будут отображаться ваши активные курсы
                  </p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Прогресс
                  </h3>
                  <p className="text-gray-600">
                    Отслеживайте свой прогресс обучения
                  </p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Достижения
                  </h3>
                  <p className="text-gray-600">
                    Ваши достижения и награды
                  </p>
                </div>
              </div>
              
              <div className="mt-8">
                <button className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors">
                  Перейти к курсам
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
