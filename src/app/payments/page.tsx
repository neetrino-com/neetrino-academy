'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, CheckCircle, AlertCircle } from 'lucide-react'

interface PaymentInfo {
  courseId: string
  courseTitle: string
  amount: number
  currency: string
  paymentType: 'ONE_TIME' | 'MONTHLY'
}

export default function PaymentsPage() {
  const router = useRouter()
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'error'>('pending')

  useEffect(() => {
    // Получаем информацию о платеже из localStorage или URL параметров
    const courseId = new URLSearchParams(window.location.search).get('courseId')
    if (courseId) {
      fetchPaymentInfo(courseId)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchPaymentInfo = async (courseId: string) => {
    try {
      const response = await fetch(`/api/courses/${courseId}`)
      const data = await response.json()

      if (response.ok) {
        setPaymentInfo({
          courseId: data.course.id,
          courseTitle: data.course.title,
          amount: parseFloat(data.course.price) || 0,
          currency: data.course.currency || 'RUB',
          paymentType: data.course.paymentType || 'ONE_TIME'
        })
      }
    } catch (error) {
      console.error('Ошибка загрузки информации о курсе:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!paymentInfo) return

    try {
      setProcessing(true)
      
      // Имитация процесса оплаты
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // В реальном приложении здесь был бы вызов платежного API
      const response = await fetch('/api/payments/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: paymentInfo.courseId,
          amount: paymentInfo.amount,
          currency: paymentInfo.currency
        })
      })

      if (response.ok) {
        setPaymentStatus('success')
        // Перенаправляем на курс через 3 секунды
        setTimeout(() => {
          router.push(`/courses/${paymentInfo.courseId}`)
        }, 3000)
      } else {
        setPaymentStatus('error')
      }
    } catch (error) {
      console.error('Ошибка при обработке платежа:', error)
      setPaymentStatus('error')
    } finally {
      setProcessing(false)
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency === 'AMD' ? 'RUB' : currency,
      minimumFractionDigits: 0
    }).format(amount).replace('₽', currency === 'AMD' ? '֏' : '₽')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-indigo-600 font-medium">Загрузка информации о платеже...</p>
        </div>
      </div>
    )
  }

  if (!paymentInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Ошибка</h1>
          <p className="text-gray-600 mb-6">Не удалось загрузить информацию о платеже</p>
          <button
            onClick={() => router.push('/courses')}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Вернуться к курсам
          </button>
        </div>
      </div>
    )
  }

  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Оплата успешна!</h1>
          <p className="text-gray-600 mb-6">
            Вы успешно оплатили курс "{paymentInfo.courseTitle}". 
            Сейчас вы будете перенаправлены на страницу курса.
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        </div>
      </div>
    )
  }

  if (paymentStatus === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Ошибка оплаты</h1>
          <p className="text-gray-600 mb-6">
            Произошла ошибка при обработке платежа. Попробуйте еще раз.
          </p>
          <div className="space-x-4">
            <button
              onClick={handlePayment}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Попробовать снова
            </button>
            <button
              onClick={() => router.push('/courses')}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Вернуться к курсам
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Заголовок */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
            <h1 className="text-2xl font-bold text-white">Оплата курса</h1>
            <p className="text-indigo-100 mt-2">Завершите оплату для доступа к курсу</p>
          </div>

          {/* Информация о курсе */}
          <div className="p-8">
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {paymentInfo.courseTitle}
              </h2>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Тип оплаты:</p>
                  <p className="font-medium text-gray-900">
                    {paymentInfo.paymentType === 'ONE_TIME' ? 'Разовая оплата' : 'Ежемесячная оплата'}
                  </p>
                </div>
                
                <div className="text-right">
                  <p className="text-sm text-gray-600">Сумма к оплате:</p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {formatCurrency(paymentInfo.amount, paymentInfo.currency)}
                  </p>
                </div>
              </div>
            </div>

            {/* Форма оплаты */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Способ оплаты</h3>
              
              {/* Имитация формы оплаты */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Номер карты
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      disabled
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Срок действия
                    </label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      disabled
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CVV
                    </label>
                    <input
                      type="text"
                      placeholder="123"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      disabled
                    />
                  </div>
                </div>
              </div>

              {/* Кнопка оплаты */}
              <div className="pt-6">
                <button
                  onClick={handlePayment}
                  disabled={processing}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Обработка платежа...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 mr-3" />
                      Оплатить {formatCurrency(paymentInfo.amount, paymentInfo.currency)}
                    </>
                  )}
                </button>
              </div>

              {/* Информационное сообщение */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Внимание:</strong> Это демонстрационная версия. В реальном приложении здесь была бы интеграция с платежными системами.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
