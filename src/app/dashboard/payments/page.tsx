'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import StudentSidebar from '@/components/dashboard/StudentSidebar'
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
  Download,
  TrendingUp,
  BarChart3,
  Target,
  Award,
  Star,
  Zap,
  HelpCircle
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
  createdAt?: string
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

export default function DashboardPaymentsPage() {
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
      case 'PAID': return 'text-emerald-600 bg-emerald-50 border-emerald-200'
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
      currency: currency === 'AMD' ? 'RUB' : currency,
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex">
        <StudentSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Загрузка платежей...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex">
      {/* Боковая панель */}
      <StudentSidebar />
      
      {/* Основной контент */}
      <div className="flex-1">
        <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            
            {/* Сообщения */}
            {message && (
              <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 ${
                message.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
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
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl">
                  <CreditCard className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">Мои платежи</h1>
                  <p className="text-xl text-gray-600">
                    Управление оплатой курсов и история платежей
                  </p>
                </div>
              </div>
            </div>

            {/* Статистика */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
                    <CreditCard className="w-7 h-7 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Всего платежей</p>
                    <p className="text-3xl font-bold text-gray-900">{summary.totalPayments}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl">
                    <CheckCircle className="w-7 h-7 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Оплачено</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {formatCurrency(summary.paidAmount)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl">
                    <Clock className="w-7 h-7 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">К оплате</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {formatCurrency(summary.pendingAmount)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-red-500 to-pink-600 rounded-xl">
                    <AlertTriangle className="w-7 h-7 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Просрочено</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {formatCurrency(summary.overdueAmount)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Активные курсы и предстоящие платежи */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Активные курсы</h2>
                    <div className="p-2 bg-blue-100 rounded-xl">
                      <BookOpen className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  
                  {enrollments.length === 0 ? (
                    <div className="text-center py-12">
                      <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Курсов пока нет</h3>
                      <p className="text-gray-600 mb-6">Запишитесь на свой первый курс</p>
                      <button className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 font-medium">
                        Найти курсы
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {enrollments.map((enrollment) => (
                        <div key={enrollment.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 bg-gradient-to-r from-gray-50 to-white">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 mb-2 text-lg">
                                {enrollment.course.title}
                              </h3>
                              <p className="text-sm text-gray-600 mb-3">
                                {enrollment.course.direction} • {enrollment.course.paymentType === 'MONTHLY' ? 'Ежемесячная оплата' : 'Разовая оплата'}
                              </p>
                              
                              <div className="flex items-center gap-4 text-sm">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                                  enrollment.status === 'ACTIVE' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' :
                                  enrollment.status === 'SUSPENDED' ? 'text-red-600 bg-red-50 border-red-200' :
                                  'text-gray-600 bg-gray-50 border-gray-200'
                                }`}>
                                  {enrollment.status === 'ACTIVE' ? 'Активен' : 
                                   enrollment.status === 'SUSPENDED' ? 'Приостановлен' : 
                                   enrollment.status}
                                </span>
                                
                                {enrollment.nextPaymentDue && (
                                  <span className="text-gray-600 flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    Следующий платеж: {formatDate(enrollment.nextPaymentDue)}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="text-right">
                              {enrollment.course.paymentType === 'MONTHLY' ? (
                                <p className="text-2xl font-bold text-gray-900">
                                  {formatCurrency(enrollment.course.monthlyPrice || 0)}/мес
                                </p>
                              ) : (
                                <p className="text-2xl font-bold text-gray-900">
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
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Предстоящие платежи</h2>
                    <div className="p-2 bg-amber-100 rounded-xl">
                      <Clock className="w-6 h-6 text-amber-600" />
                    </div>
                  </div>
                  
                  {payments.filter(p => p.status === 'PENDING' || p.status === 'OVERDUE').length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Все платежи оплачены!</h3>
                      <p className="text-gray-600">Продолжайте обучение</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {payments
                        .filter(p => p.status === 'PENDING' || p.status === 'OVERDUE')
                        .map((payment) => (
                        <div key={payment.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 bg-gradient-to-r from-gray-50 to-white">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <h3 className="font-semibold text-gray-900 text-lg">
                                  {payment.course.title}
                                </h3>
                                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(payment.status)}`}>
                                  {getStatusIcon(payment.status)}
                                  {getStatusLabel(payment.status)}
                                </span>
                              </div>
                              
                              <p className="text-sm text-gray-600 mb-3">
                                {payment.paymentType === 'MONTHLY' && payment.monthNumber && (
                                  <>Месяц {payment.monthNumber} • </>
                                )}
                                {payment.dueDate && `К оплате до: ${formatDate(payment.dueDate)}`}
                              </p>
                              
                              {payment.notes && (
                                <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">{payment.notes}</p>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-2xl font-bold text-gray-900">
                                  {formatCurrency(payment.amount, payment.currency)}
                                </p>
                              </div>
                              
                              {payment.status === 'PENDING' && (
                                <button
                                  onClick={() => handlePayment(payment.id)}
                                  disabled={processing === payment.id}
                                  className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 disabled:opacity-50 flex items-center gap-2 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1"
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
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">История платежей</h2>
                    <button className="text-blue-600 hover:text-blue-700 flex items-center gap-1 p-2 hover:bg-blue-50 rounded-lg transition-colors">
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
                        <div key={payment.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 rounded-lg px-2 transition-colors">
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
                        <button className="w-full text-center text-blue-600 hover:text-blue-700 py-3 text-sm font-medium hover:bg-blue-50 rounded-lg transition-colors">
                          Показать все ({payments.length})
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Быстрые действия */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Быстрые действия</h3>
                  <div className="space-y-3">
                    <button className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 group">
                      <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                        <CreditCard className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="font-medium text-gray-900">Новый платеж</span>
                    </button>
                    
                    <button className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:border-green-300 hover:shadow-md transition-all duration-200 group">
                      <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                        <Download className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="font-medium text-gray-900">Скачать отчет</span>
                    </button>
                    
                    <button className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-md transition-all duration-200 group">
                      <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                        <HelpCircle className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="font-medium text-gray-900">Помощь</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
