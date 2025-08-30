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
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Plus,
  RefreshCw
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
  createdAt: string
  user: {
    id: string
    name: string
    email: string
  }
  course: {
    id: string
    title: string
    direction: string
    paymentType: string
  }
}

interface PaymentStats {
  [key: string]: number
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function AdminPaymentsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState<PaymentStats>({})
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)
  
  // Фильтры
  const [filters, setFilters] = useState({
    status: '',
    paymentType: '',
    userId: '',
    courseId: ''
  })
  
  // Поиск
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
      return
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'TEACHER') {
      router.push('/')
      return
    }

    fetchPayments()
  }, [session, status, router, pagination.page, filters, searchTerm])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      })
      
      if (filters.status) params.append('status', filters.status)
      if (filters.paymentType) params.append('paymentType', filters.paymentType)
      if (filters.userId) params.append('userId', filters.userId)
      if (filters.courseId) params.append('courseId', filters.courseId)
      if (searchTerm) params.append('search', searchTerm)

      const response = await fetch(`/api/admin/payments?${params}`)
      if (response.ok) {
        const data = await response.json()
        setPayments(data.payments)
        setStats(data.stats)
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages
        }))
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

  const handleStatusChange = async (paymentId: string, newStatus: string) => {
    try {
      setProcessing(paymentId)
      const response = await fetch(`/api/admin/payments/${paymentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Статус платежа обновлен' })
        fetchPayments() // Обновляем список
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Ошибка обновления статуса' })
      }
    } catch (error) {
      console.error('Ошибка обновления статуса:', error)
      setMessage({ type: 'error', text: 'Ошибка обновления статуса' })
    } finally {
      setProcessing(null)
    }
  }

  const handleBulkAction = async (action: string, paymentIds: string[]) => {
    try {
      setProcessing('bulk')
      const response = await fetch('/api/admin/payments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, paymentIds })
      })

      if (response.ok) {
        const data = await response.json()
        setMessage({ type: 'success', text: data.message })
        fetchPayments() // Обновляем список
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Ошибка массовой операции' })
      }
    } catch (error) {
      console.error('Ошибка массовой операции:', error)
      setMessage({ type: 'error', text: 'Ошибка массовой операции' })
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

  const clearFilters = () => {
    setFilters({
      status: '',
      paymentType: '',
      userId: '',
      courseId: ''
    })
    setSearchTerm('')
    setPagination(prev => ({ ...prev, page: 1 }))
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
            Управление платежами 💳
          </h1>
          <p className="text-gray-600">Просмотр и управление всеми платежами в системе</p>
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
                <p className="text-2xl font-semibold text-gray-900">{pagination.total}</p>
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
                <p className="text-2xl font-semibold text-gray-900">{stats.PAID || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ожидают оплаты</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.PENDING || 0}</p>
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
                <p className="text-2xl font-semibold text-gray-900">{stats.OVERDUE || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Фильтры и поиск */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Поиск</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Поиск по студенту, курсу..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Статус</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Все статусы</option>
                <option value="PENDING">Ожидает оплаты</option>
                <option value="PAID">Оплачено</option>
                <option value="OVERDUE">Просрочено</option>
                <option value="CANCELLED">Отменено</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Тип оплаты</label>
              <select
                value={filters.paymentType}
                onChange={(e) => setFilters(prev => ({ ...prev, paymentType: e.target.value }))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Все типы</option>
                <option value="ONE_TIME">Разовая оплата</option>
                <option value="MONTHLY">Ежемесячная оплата</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Сбросить
              </button>
              <button
                onClick={fetchPayments}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Обновить
              </button>
            </div>
          </div>
        </div>

        {/* Массовые операции */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Массовые операции</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleBulkAction('markAsPaid', payments.filter(p => p.status === 'PENDING').map(p => p.id))}
              disabled={!payments.some(p => p.status === 'PENDING') || processing === 'bulk'}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {processing === 'bulk' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Отметить как оплаченные
            </button>
            
            <button
              onClick={() => handleBulkAction('markAsOverdue', payments.filter(p => p.status === 'PENDING').map(p => p.id))}
              disabled={!payments.some(p => p.status === 'PENDING') || processing === 'bulk'}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {processing === 'bulk' ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
              Отметить как просроченные
            </button>
            
            <button
              onClick={() => handleBulkAction('cancel', payments.filter(p => p.status === 'PENDING').map(p => p.id))}
              disabled={!payments.some(p => p.status === 'PENDING') || processing === 'bulk'}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {processing === 'bulk' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              Отменить
            </button>
          </div>
        </div>

        {/* Список платежей */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Список платежей</h2>
            <button className="text-blue-600 hover:text-blue-700 flex items-center gap-1">
              <Download className="w-4 h-4" />
              Экспорт
            </button>
          </div>
          
          {payments.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Платежи не найдены</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Студент</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Курс</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Сумма</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Тип</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Статус</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Дата</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{payment.user.name}</p>
                          <p className="text-sm text-gray-500">{payment.user.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{payment.course.title}</p>
                          <p className="text-sm text-gray-500">{payment.course.direction}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(payment.amount, payment.currency)}
                        </p>
                        {payment.paymentType === 'MONTHLY' && payment.monthNumber && (
                          <p className="text-xs text-gray-500">Месяц {payment.monthNumber}</p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          payment.paymentType === 'MONTHLY' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {payment.paymentType === 'MONTHLY' ? 'Ежемесячно' : 'Разовая'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(payment.status)}`}>
                          {getStatusIcon(payment.status)}
                          {getStatusLabel(payment.status)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-600">
                          <p>Создан: {formatDate(payment.createdAt)}</p>
                          {payment.dueDate && (
                            <p>К оплате: {formatDate(payment.dueDate)}</p>
                          )}
                          {payment.paidAt && (
                            <p className="text-green-600">Оплачен: {formatDate(payment.paidAt)}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/admin/payments/${payment.id}`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Просмотр"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {payment.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(payment.id, 'PAID')}
                                disabled={processing === payment.id}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Отметить как оплаченный"
                              >
                                {processing === payment.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                              </button>
                              
                              <button
                                onClick={() => handleStatusChange(payment.id, 'OVERDUE')}
                                disabled={processing === payment.id}
                                className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Отметить как просроченный"
                              >
                                {processing === payment.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Пагинация */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700">
                Показано {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} из {pagination.total} платежей
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Назад
                </button>
                <span className="px-3 py-2 text-gray-700">
                  Страница {pagination.page} из {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Вперед
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
