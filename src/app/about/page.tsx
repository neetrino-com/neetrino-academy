import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-purple-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              О Neetrino Academy
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Мы создаем будущее образования в сфере веб-разработки
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center mb-16">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Наша миссия
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Мы верим, что качественное образование в области веб-разработки должно быть доступным для каждого. 
                Наша цель — подготовить новое поколение специалистов, которые смогут создавать инновационные 
                веб-решения с использованием современных технологий.
              </p>
              <p className="text-lg text-gray-600">
                Neetrino Academy объединяет лучшие практики традиционного обучения с передовыми технологиями, 
                включая AI-ассистированную разработку.
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">1000+</div>
                <div className="text-gray-600 mb-6">Выпускников</div>
                <div className="text-4xl font-bold text-purple-600 mb-2">95%</div>
                <div className="text-gray-600 mb-6">Трудоустройство</div>
                <div className="text-4xl font-bold text-green-600 mb-2">4.9</div>
                <div className="text-gray-600">Средний рейтинг</div>
              </div>
            </div>
          </div>

          {/* Направления */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Наши направления
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-600 font-bold text-2xl">W</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">WordPress</h3>
                <p className="text-gray-600">
                  Профессиональная разработка на WordPress — от простых сайтов до сложных корпоративных решений
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-green-600 font-bold text-2xl">V</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Vibe Coding</h3>
                <p className="text-gray-600">
                  Современная веб-разработка с AI-инструментами для быстрого создания качественных приложений
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-purple-600 font-bold text-2xl">S</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Shopify</h3>
                <p className="text-gray-600">
                  Создание интернет-магазинов на Shopify с фокусом на конверсию и пользовательский опыт
                </p>
              </div>
            </div>
          </div>

          {/* Команда */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Наша команда
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">СБ</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Сипан Бабаджанян</h3>
                <p className="text-blue-600 font-medium mb-3">Основатель и главный инструктор</p>
                <p className="text-gray-600 text-sm">
                  Более 10 лет опыта в веб-разработке. Специалист по WordPress, создатель множества 
                  успешных проектов.
                </p>
              </div>
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-teal-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">ЭК</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Эксперт команды</h3>
                <p className="text-green-600 font-medium mb-3">Ведущий разработчик</p>
                <p className="text-gray-600 text-sm">
                  Специалист по современным технологиям и AI-инструментам. Ментор по Vibe Coding.
                </p>
              </div>
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">ШС</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Shopify специалист</h3>
                <p className="text-purple-600 font-medium mb-3">E-commerce эксперт</p>
                <p className="text-gray-600 text-sm">
                  Профессионал в области создания интернет-магазинов на Shopify с опытом работы 
                  с крупными брендами.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Готовы начать свой путь в веб-разработке?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Присоединяйтесь к нашему сообществу и станьте востребованным специалистом
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/courses" 
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Посмотреть курсы
              </Link>
              <Link 
                href="/contact" 
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                Связаться с нами
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
