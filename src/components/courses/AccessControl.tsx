'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Lock, CreditCard, Clock, CheckCircle } from 'lucide-react'

interface AccessControlProps {
  courseId: string
  children: React.ReactNode
  showBlockMessage?: boolean
}

interface AccessStatus {
  hasAccess: boolean
  paymentStatus: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  accessGranted: boolean // Ручная разблокировка от админа
  enrollmentStatus: 'ACTIVE' | 'INACTIVE' | 'COMPLETED' | 'CANCELLED'
  nextPaymentDue?: string
  canRequestAccess: boolean
}

export function AccessControl({ courseId, children, showBlockMessage = true }: AccessControlProps) {
  const { data: session, status } = useSession()
  const [accessStatus, setAccessStatus] = useState<AccessStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [requestingAccess, setRequestingAccess] = useState(false)

  useEffect(() => {
    if (status === 'loading' || !session) return
    
    checkCourseAccess()
  }, [session, status, courseId])

  const checkCourseAccess = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/courses/${courseId}/access`)
      
      if (response.ok) {
        const data = await response.json()
        setAccessStatus(data)
      } else {
        // Если курс не найден или нет записи - блокируем доступ
        setAccessStatus({
          hasAccess: false,
          paymentStatus: 'PENDING',
          accessGranted: false,
          enrollmentStatus: 'INACTIVE',
          canRequestAccess: true
        })
      }
    } catch (error) {
      console.error('Ошибка проверки доступа:', error)
      setAccessStatus({
        hasAccess: false,
        paymentStatus: 'PENDING',
        accessGranted: false,
        enrollmentStatus: 'INACTIVE',
        canRequestAccess: false
      })
    } finally {
      setLoading(false)
    }
  }

  const requestTemporaryAccess = async () => {
    try {
      setRequestingAccess(true)
      const response = await fetch(`/api/courses/${courseId}/request-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: 'payment_delay'
        })
      })

      if (response.ok) {
        alert('Запрос на временный доступ отправлен администратору')
        checkCourseAccess() // Обновляем статус
      } else {
        alert('Ошибка отправки запроса')
      }
    } catch (error) {
      console.error('Ошибка запроса доступа:', error)
      alert('Ошибка отправки запроса')
    } finally {
      setRequestingAccess(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Проверка доступа...</span>
      </div>
    )
  }

  // Если нет данных о доступе - блокируем
  if (!accessStatus) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Ошибка проверки доступа</h3>
        <p className="text-gray-600">Не удалось проверить права доступа к курсу</p>
      </div>
    )
  }

  // Если есть доступ - показываем контент
  if (accessStatus.hasAccess || accessStatus.accessGranted) {
    return <>{children}</>
  }

  // Если нет доступа и не нужно показывать сообщение - возвращаем null
  if (!showBlockMessage) {
    return null
  }

  // Блокировка доступа с информационным сообщением
  return (
    <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-8 text-center border border-red-200">
      <div className="flex justify-center mb-4">
        {accessStatus.paymentStatus === 'PENDING' && (
          <CreditCard className="w-16 h-16 text-orange-500" />
        )}
        {accessStatus.paymentStatus === 'OVERDUE' && (
          <Clock className="w-16 h-16 text-red-500" />
        )}
        {accessStatus.paymentStatus === 'CANCELLED' && (
          <Lock className="w-16 h-16 text-gray-500" />
        )}
      </div>

      <h3 className="text-xl font-bold text-gray-900 mb-4">
        {accessStatus.paymentStatus === 'PENDING' && 'Требуется оплата курса'}
        {accessStatus.paymentStatus === 'OVERDUE' && 'Просрочена оплата'}
        {accessStatus.paymentStatus === 'CANCELLED' && 'Доступ к курсу заблокирован'}
      </h3>

      <div className="bg-white rounded-lg p-4 mb-6 text-left">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Статус оплаты:</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            accessStatus.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
            accessStatus.paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
            accessStatus.paymentStatus === 'OVERDUE' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {accessStatus.paymentStatus === 'PAID' && 'Оплачено'}
            {accessStatus.paymentStatus === 'PENDING' && 'Ожидает оплаты'}
            {accessStatus.paymentStatus === 'OVERDUE' && 'Просрочено'}
            {accessStatus.paymentStatus === 'CANCELLED' && 'Отменено'}
          </span>
        </div>
        
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Статус обучения:</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            accessStatus.enrollmentStatus === 'ACTIVE' ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {accessStatus.enrollmentStatus === 'ACTIVE' ? 'Активен' : 'Неактивен'}
          </span>
        </div>

        {accessStatus.nextPaymentDue && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Следующий платеж:</span>
            <span className="text-sm text-gray-600">
              {new Date(accessStatus.nextPaymentDue).toLocaleDateString('ru-RU')}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {accessStatus.paymentStatus === 'PENDING' && (
          <p className="text-gray-700">
            Для доступа к материалам курса необходимо произвести оплату. 
            Обратитесь к администратору для получения реквизитов.
          </p>
        )}

        {accessStatus.paymentStatus === 'OVERDUE' && (
          <div>
            <p className="text-gray-700 mb-3">
              Оплата просрочена. Пожалуйста, произведите платеж для продолжения обучения.
            </p>
            {accessStatus.canRequestAccess && (
              <button
                onClick={requestTemporaryAccess}
                disabled={requestingAccess}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {requestingAccess ? 'Отправка...' : 'Запросить временный доступ'}
              </button>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button 
            onClick={() => window.location.href = '/payments'}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            <CreditCard className="w-4 h-4 inline mr-2" />
            Перейти к оплате
          </button>
          
          <button 
            onClick={() => window.location.href = '/contact'}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Связаться с поддержкой
          </button>
        </div>
      </div>
    </div>
  )
}
