'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  CreditCard, 
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Calendar,
  Loader2,
  DollarSign,
  BookOpen,
  Eye,
  ArrowRight,
  Download
} from 'lucide-react'

interface Payment {
  id: string
  amount: number
  currency: string
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  paymentType: 'MONTHLY' | 'ONE_TIME'
  monthNumber?: number
  dueDate?: string
  paidAt?: string
  paymentMethod?: string
  transactionId?: string
  notes?: string
  course: {
    id: string
    title: string
    direction: string
    paymentType: string
    duration?: number
    durationUnit?: string
  }
}

interface Enrollment {
  id: string
  status: string
  enrolledAt: string
  paymentStatus: string
  nextPaymentDue?: string
  course: {
    id: string
    title: string
    direction: string
    paymentType: string
    monthlyPrice?: number
    totalPrice?: number
    duration?: number
    durationUnit?: string
  }
}

interface PaymentSummary {
  totalPayments: number
  paidAmount: number
  pendingAmount: number
  overdueAmount: number
}

export default function PaymentsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [payments, setPayments] = useState<Payment[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [summary, setSummary] = useState<PaymentSummary>({
    totalPayments: 0,
    paidAmount: 0,
    pendingAmount: 0,
    overdueAmount: 0
  })
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
      return
    }

    if (session.user.role !== 'STUDENT') {
      router.push('/')
      return
    }

    fetchPayments()
  }, [session, status, router])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/student/payments')
      if (response.ok) {
        const data = await response.json()
        setPayments(data.payments)
        setEnrollments(data.enrollments)
        setSummary(data.summary)
      } else {
        setMessage({ type: 'error', text: 'Ошибка загрузки платежей' })
      }
    } catch (error) {
      console.error('Ошибка загрузки платежей:', error)
      setMessage({ type: 'error', text: 'Ошибка загрузки платежей' })
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async (paymentId: string) => {
    try {
      setProcessing(paymentId)
      const response = await fetch('/api/student/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ paymentId })
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Платеж успешно обработан!' })
        fetchPayments() // Обновляем список платежей
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Ошибка обработки платежа' })
      }
    } catch (error) {
      console.error('Ошибка обработки платежа:', error)
      setMessage({ type: 'error', text: 'Ошибка обработки платежа' })
    } finally {
      setProcessing(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'text-green-600 bg-green-50 border-green-200'
      case 'PENDING': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'OVERDUE': return 'text-red-600 bg-red-50 border-red-200'
      case 'CANCELLED': return 'text-gray-600 bg-gray-50 border-gray-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID': return <CheckCircle className="w-4 h-4" />
      case 'PENDING': return <Clock className="w-4 h-4" />
      case 'OVERDUE': return <AlertTriangle className="w-4 h-4" />
      case 'CANCELLED': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PAID': return 'Оплачено'
      case 'PENDING': return 'Ожидает оплаты'
      case 'OVERDUE': return 'Просрочено'
      case 'CANCELLED': return 'Отменено'
      default: return status
    }
  }

  const formatCurrency = (amount: number, currency: string = 'AMD') => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency === 'AMD' ? 'RUB' : currency, // Заменяем AMD на RUB для отображения
      minimumFractionDigits: 0
    }).format(amount).replace('₽', currency === 'AMD' ? '֏' : '₽')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Загрузка платежей...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Сообщения */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? 
              <CheckCircle className="w-5 h-5" /> : 
              <AlertTriangle className="w-5 h-5" />
            }
            <span>{message.text}</span>
            <button
              onClick={() => setMessage(null)}
              className="ml-auto p-1 hover:bg-white/50 rounded"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Мои платежи 💳
          </h1>
          <p className="text-gray-600">Управление оплатой курсов и история платежей</p>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Всего платежей</p>
                <p className="text-2xl font-semibold text-gray-900">{summary.totalPayments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Оплачено</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(summary.paidAmount)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">К оплате</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(summary.pendingAmount)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Просрочено</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(summary.overdueAmount)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Активные курсы и предстоящие платежи */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Активные курсы</h2>
              
              {enrollments.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">У вас нет активных курсов</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {enrollments.map((enrollment) => (
                    <div key={enrollment.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {enrollment.course.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {enrollment.course.direction} • {enrollment.course.paymentType === 'MONTHLY' ? 'Ежемесячная оплата' : 'Разовая оплата'}
                          </p>
                          
                          <div className="flex items-center gap-4 text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              enrollment.status === 'ACTIVE' ? 'text-green-600 bg-green-50 border-green-200' :
                              enrollment.status === 'SUSPENDED' ? 'text-red-600 bg-red-50 border-red-200' :
                              'text-gray-600 bg-gray-50 border-gray-200'
                            }`}>
                              {enrollment.status === 'ACTIVE' ? 'Активен' : 
                               enrollment.status === 'SUSPENDED' ? 'Приостановлен' : 
                               enrollment.status}
                            </span>
                            
                            {enrollment.nextPaymentDue && (
                              <span className="text-gray-600">
                                Следующий платеж: {formatDate(enrollment.nextPaymentDue)}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          {enrollment.course.paymentType === 'MONTHLY' ? (
                            <p className="text-lg font-semibold text-gray-900">
                              {formatCurrency(enrollment.course.monthlyPrice || 0)}/мес
                            </p>
                          ) : (
                            <p className="text-lg font-semibold text-gray-900">
                              {formatCurrency(enrollment.course.totalPrice || 0)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Предстоящие платежи */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Предстоящие платежи</h2>
              
              {payments.filter(p => p.status === 'PENDING' || p.status === 'OVERDUE').length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <p className="text-gray-600">Все платежи оплачены!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {payments
                    .filter(p => p.status === 'PENDING' || p.status === 'OVERDUE')
                    .map((payment) => (
                    <div key={payment.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">
                              {payment.course.title}
                            </h3>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(payment.status)}`}>
                              {getStatusIcon(payment.status)}
                              {getStatusLabel(payment.status)}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">
                            {payment.paymentType === 'MONTHLY' && payment.monthNumber && (
                              <>Месяц {payment.monthNumber} • </>
                            )}
                            {payment.dueDate && `К оплате до: ${formatDate(payment.dueDate)}`}
                          </p>
                          
                          {payment.notes && (
                            <p className="text-sm text-gray-500">{payment.notes}</p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-lg font-semibold text-gray-900">
                              {formatCurrency(payment.amount, payment.currency)}
                            </p>
                          </div>
                          
                          {payment.status === 'PENDING' && (
                            <button
                              onClick={() => handlePayment(payment.id)}
                              disabled={processing === payment.id}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                              {processing === payment.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <CreditCard className="w-4 h-4" />
                              )}
                              {processing === payment.id ? 'Обработка...' : 'Оплатить'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* История платежей */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">История платежей</h2>
                <button className="text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  <Download className="w-4 h-4" />
                  Экспорт
                </button>
              </div>
              
              {payments.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">История платежей пуста</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.slice(0, 10).map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {payment.course.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(payment.status)}`}>
                            {getStatusIcon(payment.status)}
                            {getStatusLabel(payment.status)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {payment.paidAt ? formatDate(payment.paidAt) : 
                           payment.dueDate ? `До ${formatDate(payment.dueDate)}` : 
                           formatDate(payment.createdAt || '')}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency(payment.amount, payment.currency)}
                        </p>
                        {payment.transactionId && (
                          <p className="text-xs text-gray-500">
                            ID: {payment.transactionId.slice(-8)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {payments.length > 10 && (
                    <button className="w-full text-center text-blue-600 hover:text-blue-700 py-2 text-sm font-medium">
                      Показать все ({payments.length})
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
