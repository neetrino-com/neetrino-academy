import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-purple-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Neetrino Academy
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Профессиональное обучение веб-разработке, WordPress и Shopify. 
              Станьте востребованным специалистом в IT-индустрии.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/courses" 
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
              >
                Посмотреть курсы
              </Link>
              <Link 
                href="/register" 
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-lg"
              >
                Зарегистрироваться
              </Link>
              <Link 
                href="/about" 
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                Узнать больше
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
              <div className="py-16 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-blue-900 mb-4">
              Направления обучения
            </h2>
            <p className="text-lg text-blue-600 max-w-2xl mx-auto">
              Выберите направление, которое подходит именно вам
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* WordPress */}
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-blue-600 font-bold text-xl">W</span>
              </div>
              <h3 className="text-xl font-semibold text-blue-900 mb-2">
                WordPress Разработка
              </h3>
              <p className="text-blue-600 mb-4">
                Изучите создание сайтов на WordPress, разработку тем и плагинов, 
                кастомизацию и оптимизацию.
              </p>
              <ul className="text-sm text-blue-600 space-y-1 mb-6">
                <li>• Создание тем и плагинов</li>
                <li>• Кастомизация WordPress</li>
                <li>• SEO оптимизация</li>
                <li>• Безопасность сайтов</li>
              </ul>
              <Link 
                href="/courses/wordpress" 
                className="text-blue-600 font-medium hover:text-blue-700"
              >
                Подробнее →
              </Link>
            </div>

            {/* Vibe Coding */}
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-green-600 font-bold text-xl">V</span>
              </div>
                             <h3 className="text-xl font-semibold text-green-900 mb-2">
                 Vibe Coding
               </h3>
               <p className="text-green-600 mb-4">
                 Современная веб-разработка с использованием AI-инструментов. 
                 Быстрое создание качественных веб-приложений.
               </p>
               <ul className="text-sm text-green-600 space-y-1 mb-6">
                 <li>• AI-ассистированная разработка</li>
                 <li>• Современные фреймворки</li>
                 <li>• Быстрая разработка MVP</li>
                 <li>• Интеграция AI-сервисов</li>
               </ul>
              <Link 
                href="/courses/vibe-coding" 
                className="text-green-600 font-medium hover:text-green-700"
              >
                Подробнее →
              </Link>
            </div>

            {/* Shopify */}
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-purple-600 font-bold text-xl">S</span>
              </div>
                             <h3 className="text-xl font-semibold text-purple-900 mb-2">
                 Shopify Разработка
               </h3>
               <p className="text-purple-600 mb-4">
                 Создание интернет-магазинов на Shopify. Разработка тем, 
                 приложений и интеграций для e-commerce.
               </p>
               <ul className="text-sm text-purple-600 space-y-1 mb-6">
                 <li>• Создание тем магазинов</li>
                 <li>• Разработка приложений</li>
                 <li>• E-commerce интеграции</li>
                 <li>• Оптимизация продаж</li>
               </ul>
              <Link 
                href="/courses/shopify" 
                className="text-purple-600 font-medium hover:text-purple-700"
              >
                Подробнее →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Готовы начать обучение?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Присоединяйтесь к тысячам студентов, которые уже изменили свою карьеру
          </p>
          <Link 
            href="/register" 
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Зарегистрироваться бесплатно
          </Link>
        </div>
      </div>
    </div>
  )
}
