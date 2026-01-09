'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ModuleList } from '@/components/courses/ModuleList'
import { AccessControl } from '@/components/courses/AccessControl'
import { CreditCard, Calendar, DollarSign, Clock } from 'lucide-react'

interface Module {
  id: string
  title: string
  description?: string | null
  order: number
  lessons: Array<{
    id: string;
    title: string;
    description?: string | null;
    order: number;
  }>
  _count: {
    lessons: number
    assignments: number
  }
}

interface Course {
  id: string
  title: string
  description?: string | null
  direction: string
  level: string
  price?: number | null
  paymentType?: 'ONE_TIME' | 'MONTHLY'
  monthlyPrice?: number | null
  totalPrice?: number | null
  duration?: number | null
  durationUnit?: string | null
  currency?: string
  modules: Module[]
  _count: {
    enrollments: number
  }
}

interface CourseResponse {
  course: Course
  error?: string
}

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [enrolling, setEnrolling] = useState(false)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  const courseId = params.id as string

  useEffect(() => {
    fetchCourse()
    checkEnrollment()
  }, [courseId])

  const fetchCourse = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/courses/${courseId}`)
      const data: CourseResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка загрузки курса')
      }

      setCourse(data.course)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки курса')
    } finally {
      setLoading(false)
    }
  }

  const checkEnrollment = async () => {
    try {
      const response = await fetch('/api/courses/my')
      if (response.ok) {
        const data = await response.json()
        const enrolled = data.courses.some((enrollment: { courseId: string }) => 
          enrollment.courseId === courseId
        )
        setIsEnrolled(enrolled)
      }
    } catch (error) {
      console.error('Error checking enrollment:', error)
    }
  }

  const handleEnroll = async () => {
    try {
      setEnrolling(true)
      const response = await fetch(`/api/courses/${courseId}/enroll`, {
        method: 'POST'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка записи на курс')
      }

      setIsEnrolled(true)
      
      if (data.paymentRequired) {
        setShowPaymentModal(true)
        // Перенаправляем на страницу платежей с параметром курса
        setTimeout(() => {
          router.push(`/payments?courseId=${courseId}`)
        }, 2000)
      } else {
        alert('Вы успешно записались на курс!')
        // Обновляем статус записи
        setIsEnrolled(true)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка записи на курс')
    } finally {
      setEnrolling(false)
    }
  }

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case 'WORDPRESS':
        return 'bg-blue-100 text-blue-800'
      case 'VIBE_CODING':
        return 'bg-purple-100 text-purple-800'
      case 'SHOPIFY':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'BEGINNER':
        return 'bg-green-100 text-green-800'
      case 'INTERMEDIATE':
        return 'bg-yellow-100 text-yellow-800'
      case 'ADVANCED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getDirectionLabel = (direction: string) => {
    switch (direction) {
      case 'WORDPRESS':
        return 'WordPress'
      case 'VIBE_CODING':
        return 'Vibe Coding'
      case 'SHOPIFY':
        return 'Shopify'
      default:
        return direction
    }
  }

  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'BEGINNER':
        return 'Начинающий'
      case 'INTERMEDIATE':
        return 'Средний'
      case 'ADVANCED':
        return 'Продвинутый'
      default:
        return level
    }
  }

  const formatCurrency = (amount: number | string | null, currency: string = 'AMD') => {
    if (amount === null || amount === 0 || amount === '0') return 'Бесплатно'
    
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency === 'AMD' ? 'RUB' : currency,
      minimumFractionDigits: 0
    }).format(numericAmount).replace('₽', currency === 'AMD' ? '֏' : '₽')
  }

  const getDurationLabel = (duration: number | null, unit: string | null) => {
    if (!duration) return ''
    
    const unitLabels: Record<string, string> = {
      'days': 'дней',
      'weeks': 'недель',
      'months': 'месяцев'
    }
    
    return `${duration} ${unitLabels[unit || 'months'] || unit}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Загрузка курса...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Ошибка загрузки курса
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link
              href="/courses"
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
            >
              Вернуться к курсам
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Хлебные крошки */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li>
              <Link href="/courses" className="hover:text-gray-700">
                Курсы
              </Link>
            </li>
            <li>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </li>
            <li className="text-gray-900">{course.title}</li>
          </ol>
        </nav>

        {/* Заголовок курса */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {course.title}
              </h1>
              
              {course.description && (
                <p className="text-lg text-gray-600 mb-6">
                  {course.description}
                </p>
              )}

              <div className="flex flex-wrap gap-3 mb-6">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getDirectionColor(course.direction)}`}>
                  {getDirectionLabel(course.direction)}
                </span>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getLevelColor(course.level)}`}>
                  {getLevelLabel(course.level)}
                </span>
              </div>

              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  {course.modules.length} модулей
                </span>
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  {course._count.enrollments} студентов
                </span>
                {course.duration && (
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    {getDurationLabel(course.duration ?? null, course.durationUnit ?? null)}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-6 lg:mt-0 lg:ml-8">
              <div className="bg-gray-50 rounded-lg p-6">
                {/* Информация о стоимости */}
                <div className="text-center mb-6">
                  {course.paymentType === 'ONE_TIME' ? (
                    <div>
                      <div className="text-3xl font-bold text-gray-900 mb-2">
                        {formatCurrency(course.price, course.currency)}
                      </div>
                      <p className="text-sm text-gray-600">Разовая оплата за весь курс</p>
                    </div>
                  ) : course.paymentType === 'MONTHLY' ? (
                    <div>
                      <div className="text-3xl font-bold text-gray-900 mb-2">
                        {formatCurrency(course.monthlyPrice, course.currency)}/мес
                      </div>
                      <p className="text-sm text-gray-600">
                        Ежемесячная оплата • {course.duration} месяцев
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Итого: {formatCurrency((course.monthlyPrice || 0) * (course.duration || 1), course.currency)}
                      </p>
                    </div>
                  ) : (
                    <div className="text-3xl font-bold text-gray-900">
                      {formatCurrency(course.price, course.currency)}
                    </div>
                  )}
                </div>

                {isEnrolled ? (
                  <div className="space-y-3">
                    <button
                      disabled
                      className="w-full bg-green-600 text-white px-6 py-3 rounded-md text-sm font-medium opacity-50 cursor-not-allowed"
                    >
                      Вы уже записаны
                    </button>
                    <Link
                      href={`/courses/${courseId}/learn`}
                      className="block w-full bg-blue-600 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors text-center"
                    >
                      Начать обучение
                    </Link>
                  </div>
                ) : (
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="w-full bg-green-600 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {enrolling ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Запись...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        Записаться на курс
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Модули курса */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Программа курса
          </h2>

          {course.modules.length > 0 ? (
            <ModuleList 
              modules={course.modules} 
              courseId={courseId} 
              isEnrolled={isEnrolled} 
            />
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Модули пока не добавлены
              </h3>
              <p className="text-gray-600">
                Содержание курса будет добавлено в ближайшее время
              </p>
            </div>
          )}
        </div>

        {/* Модальное окно успешной записи */}
        {showPaymentModal && (
          <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
              <div className="text-green-600 mb-4">
                <CreditCard className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Вы успешно записались на курс!
              </h3>
              <p className="text-gray-600 mb-6">
                Теперь необходимо оплатить курс. Вы будете перенаправлены на страницу платежей.
              </p>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
              >
                Понятно
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
