'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
  User,
  BookOpen,
  ArrowLeft,
  Edit,
  Save,
  X
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
  updatedAt: string
  user: {
    id: string
    name: string
    email: string
    role: string
  }
  course: {
    id: string
    title: string
    direction: string
    paymentType: string
    duration?: number
    durationUnit?: string
  }
}

export default function PaymentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [payment, setPayment] = useState<Payment | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editedPayment, setEditedPayment] = useState<Partial<Payment>>({})
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

  const paymentId = params.id as string

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

    fetchPayment()
  }, [session, status, router, paymentId])

  const fetchPayment = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/payments/${paymentId}`)
      if (response.ok) {
        const data = await response.json()
        setPayment(data.payment)
        setEditedPayment(data.payment)
      } else {
        setMessage({ type: 'error', text: 'Ошибка загрузки платежа' })
      }
    } catch (error) {
      console.error('Ошибка загрузки платежа:', error)
      setMessage({ type: 'error', text: 'Ошибка загрузки платежа' })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      setSaving(true)
      const response = await fetch(`/api/admin/payments/${paymentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Статус платежа обновлен' })
        fetchPayment() // Обновляем данные
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Ошибка обновления статуса' })
      }
    } catch (error) {
      console.error('Ошибка обновления статуса:', error)
      setMessage({ type: 'error', text: 'Ошибка обновления статуса' })
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await fetch(`/api/admin/payments/${paymentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editedPayment)
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Платеж обновлен' })
        setEditing(false)
        fetchPayment() // Обновляем данные
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Ошибка обновления платежа' })
      }
    } catch (error) {
      console.error('Ошибка обновления платежа:', error)
      setMessage({ type: 'error', text: 'Ошибка обновления платежа' })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditing(false)
    setEditedPayment(payment || {})
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Загрузка платежа...</p>
        </div>
      </div>
    )
  }

  if (!payment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Платеж не найден
            </h3>
            <p className="text-gray-600 mb-4">
              Запрашиваемый платеж не существует или был удален
            </p>
            <button
              onClick={() => router.push('/admin/payments')}
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
            >
              Вернуться к платежам
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        
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
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Навигация */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/admin/payments')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Вернуться к платежам
          </button>
        </div>

        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Детали платежа 💳
          </h1>
          <p className="text-gray-600">Просмотр и управление платежом</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Основная информация */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Информация о платеже</h2>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Редактировать
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {saving ? 'Сохранение...' : 'Сохранить'}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Отмена
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {/* Статус */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Статус:</span>
                  {editing ? (
                    <select
                      value={editedPayment.status || payment.status}
                      onChange={(e) => setEditedPayment(prev => ({ ...prev, status: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="PENDING">Ожидает оплаты</option>
                      <option value="PAID">Оплачено</option>
                      <option value="OVERDUE">Просрочено</option>
                      <option value="CANCELLED">Отменено</option>
                    </select>
                  ) : (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(payment.status)}`}>
                      {getStatusIcon(payment.status)}
                      {getStatusLabel(payment.status)}
                    </span>
                  )}
                </div>

                {/* Сумма */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Сумма:</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {formatCurrency(payment.amount, payment.currency)}
                  </span>
                </div>

                {/* Тип оплаты */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Тип оплаты:</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    payment.paymentType === 'MONTHLY' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {payment.paymentType === 'MONTHLY' ? 'Ежемесячная' : 'Разовая'}
                  </span>
                </div>

                {/* Номер месяца для ежемесячных платежей */}
                {payment.paymentType === 'MONTHLY' && payment.monthNumber && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Месяц:</span>
                    <span className="text-sm text-gray-900">
                      {payment.monthNumber}
                    </span>
                  </div>
                )}

                {/* Даты */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Создан:</span>
                    <span className="text-sm text-gray-900">
                      {formatDate(payment.createdAt)}
                    </span>
                  </div>
                  
                  {payment.dueDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">К оплате до:</span>
                      <span className="text-sm text-gray-900">
                        {formatDate(payment.dueDate)}
                      </span>
                    </div>
                  )}
                  
                  {payment.paidAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Оплачен:</span>
                      <span className="text-sm text-green-600">
                        {formatDate(payment.paidAt)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Дополнительная информация */}
                {payment.paymentMethod && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Способ оплаты:</span>
                    <span className="text-sm text-gray-900">
                      {payment.paymentMethod}
                    </span>
                  </div>
                )}

                {payment.transactionId && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">ID транзакции:</span>
                    <span className="text-sm text-gray-900 font-mono">
                      {payment.transactionId}
                    </span>
                  </div>
                )}

                {/* Заметки */}
                {payment.notes && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Заметки:</span>
                    <p className="text-sm text-gray-900 mt-1">{payment.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Действия */}
            {!editing && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Действия</h3>
                <div className="flex flex-wrap gap-3">
                  {payment.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleStatusChange('PAID')}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        Отметить как оплаченный
                      </button>
                      
                      <button
                        onClick={() => handleStatusChange('OVERDUE')}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                        Отметить как просроченный
                      </button>
                    </>
                  )}
                  
                  {payment.status === 'PENDING' && (
                    <button
                      onClick={() => handleStatusChange('CANCELLED')}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                      Отменить
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Боковая панель */}
          <div className="lg:col-span-1">
            {/* Информация о студенте */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Студент
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-700">Имя:</span>
                  <p className="text-sm text-gray-900">{payment.user.name}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Email:</span>
                  <p className="text-sm text-gray-900">{payment.user.email}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Роль:</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                    payment.user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                    payment.user.role === 'TEACHER' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {payment.user.role === 'ADMIN' ? 'Администратор' :
                     payment.user.role === 'TEACHER' ? 'Преподаватель' : 'Студент'}
                  </span>
                </div>
              </div>
            </div>

            {/* Информация о курсе */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Курс
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-700">Название:</span>
                  <p className="text-sm text-gray-900">{payment.course.title}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Направление:</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                    payment.course.direction === 'WORDPRESS' ? 'bg-blue-100 text-blue-800' :
                    payment.course.direction === 'VIBE_CODING' ? 'bg-purple-100 text-purple-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {payment.course.direction === 'WORDPRESS' ? 'WordPress' :
                     payment.course.direction === 'VIBE_CODING' ? 'Vibe Coding' : 'Shopify'}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Тип оплаты:</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                    payment.course.paymentType === 'MONTHLY' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {payment.course.paymentType === 'MONTHLY' ? 'Ежемесячная' : 'Разовая'}
                  </span>
                </div>
                {payment.course.duration && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Длительность:</span>
                    <p className="text-sm text-gray-900">
                      {payment.course.duration} {payment.course.durationUnit || 'месяцев'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
