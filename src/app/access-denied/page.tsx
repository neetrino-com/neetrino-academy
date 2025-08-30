'use client'

import { useRouter } from 'next/navigation'
import { Shield, AlertTriangle, ArrowLeft, Home, BookOpen, LayoutDashboard } from 'lucide-react'

export default function AccessDeniedPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          {/* Иконка и заголовок */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-red-100 rounded-full mb-6">
              <Shield className="w-12 h-12 text-red-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Доступ запрещен
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              У вас недостаточно прав для просмотра этой страницы. 
              Обратитесь к администратору для получения необходимого доступа.
            </p>
          </div>

          {/* Информационный блок */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-red-100">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-yellow-600 mt-1 flex-shrink-0" />
              <div className="text-left">
                <h3 className="font-semibold text-gray-800 mb-2">
                  Что произошло?
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Система безопасности определила, что у вашей учетной записи нет прав 
                  для доступа к запрашиваемому разделу. Это может быть связано с вашей 
                  ролью в системе или отсутствием необходимых разрешений.
                </p>
              </div>
            </div>
          </div>

          {/* Кнопки навигации */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center justify-center space-x-2 bg-indigo-600 text-white py-4 px-6 rounded-xl hover:bg-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Мой дашборд</span>
            </button>
            
            <button
              onClick={() => router.push('/courses')}
              className="flex items-center justify-center space-x-2 bg-emerald-600 text-white py-4 px-6 rounded-xl hover:bg-emerald-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <BookOpen className="w-5 h-5" />
              <span>Просмотреть курсы</span>
            </button>
            
            <button
              onClick={() => router.push('/')}
              className="flex items-center justify-center space-x-2 bg-gray-600 text-white py-4 px-6 rounded-xl hover:bg-gray-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <Home className="w-5 h-5" />
              <span>Главная страница</span>
            </button>
          </div>

          {/* Кнопка "Назад" */}
          <button
            onClick={() => router.back()}
            className="inline-flex items-center space-x-2 bg-white border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Вернуться назад</span>
          </button>

          {/* Дополнительная информация */}
          <div className="mt-12 p-6 bg-white rounded-2xl shadow-lg border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">
              Нужна помощь?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Для студентов:</h4>
                <ul className="space-y-1">
                  <li>• Убедитесь, что вы записались на нужный курс</li>
                  <li>• Проверьте статус вашей подписки</li>
                  <li>• Обратитесь к преподавателю курса</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Для преподавателей:</h4>
                <ul className="space-y-1">
                  <li>• Обратитесь к администратору системы</li>
                  <li>• Проверьте ваши права доступа</li>
                  <li>• Убедитесь, что ваш аккаунт активирован</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
