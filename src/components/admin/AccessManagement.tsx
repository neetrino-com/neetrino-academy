'use client'

import { useState, useEffect } from 'react'
import { 
  Lock, 
  Unlock, 
  CreditCard, 
  XCircle, 
  CheckCircle, 
  Clock,
  User,
  AlertTriangle
} from 'lucide-react'

interface Course {
  id: string
  title: string
  paymentType: 'MONTHLY' | 'ONE_TIME'
  monthlyPrice?: number
  totalPrice?: number
}

interface Enrollment {
  id: string
  status: 'ACTIVE' | 'INACTIVE' | 'COMPLETED' | 'CANCELLED'
  paymentStatus: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  enrolledAt: string
  nextPaymentDue?: string
  course: Course
}

interface AccessManagementProps {
  studentId: string
  studentName: string
  onClose: () => void
}

export function AccessManagement({ studentId, studentName, onClose }: AccessManagementProps) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetchEnrollments()
  }, [studentId])

  const fetchEnrollments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/students/${studentId}`)
      
      if (response.ok) {
        const data = await response.json()
        setEnrollments(data.enrollments || [])
      }
    } catch (error) {
      console.error('Ошибка загрузки записей:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateAccess = async (courseId: string, action: string, reason?: string) => {
    try {
      setUpdating(courseId)
      
      const response = await fetch(`/api/admin/students/${studentId}/access`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          courseId,
          action,
          reason
        })
      })

      if (response.ok) {
        await fetchEnrollments() // Обновляем данные
        alert('Статус успешно обновлен')
      } else {
        const error = await response.json()
        alert(`Ошибка: ${error.error}`)
      }
    } catch (error) {
      console.error('Ошибка обновления доступа:', error)
      alert('Ошибка обновления статуса')
    } finally {
      setUpdating(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'PAID': return 'bg-green-100 text-green-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'OVERDUE': return 'bg-red-100 text-red-800'
      case 'CANCELLED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string, paymentStatus: string) => {
    if (status === 'ACTIVE' && paymentStatus === 'PAID') {
      return <CheckCircle className="w-4 h-4 text-green-600" />
    } else if (status === 'ACTIVE' && paymentStatus !== 'PAID') {
      return <Unlock className="w-4 h-4 text-orange-600" />
    } else if (paymentStatus === 'OVERDUE') {
      return <Clock className="w-4 h-4 text-red-600" />
    } else if (paymentStatus === 'CANCELLED') {
      return <XCircle className="w-4 h-4 text-gray-600" />
    } else {
      return <Lock className="w-4 h-4 text-gray-600" />
    }
  }

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Заголовок */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="w-6 h-6" />
              <div>
                <h2 className="text-lg font-semibold">Управление доступом</h2>
                <p className="text-blue-100 text-sm">{studentName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Содержимое */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Загрузка...</span>
            </div>
          ) : enrollments.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Студент не записан ни на один курс</p>
            </div>
          ) : (
            <div className="space-y-4">
              {enrollments.map((enrollment) => (
                <div key={enrollment.id} className="bg-gray-50 rounded-lg p-4 border">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {enrollment.course.title}
                      </h3>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Статус доступа:</span>
                          <div className="flex items-center gap-2 mt-1">
                            {getStatusIcon(enrollment.status, enrollment.paymentStatus)}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(enrollment.status)}`}>
                              {enrollment.status === 'ACTIVE' ? 'Активен' : 'Неактивен'}
                            </span>
                          </div>
                        </div>

                        <div>
                          <span className="text-gray-600">Статус оплаты:</span>
                          <div className="mt-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(enrollment.paymentStatus)}`}>
                              {enrollment.paymentStatus === 'PAID' ? 'Оплачено' :
                               enrollment.paymentStatus === 'PENDING' ? 'Ожидает' :
                               enrollment.paymentStatus === 'OVERDUE' ? 'Просрочено' : 'Отменено'}
                            </span>
                          </div>
                        </div>

                        <div>
                          <span className="text-gray-600">Тип оплаты:</span>
                          <div className="mt-1 text-gray-900">
                            {enrollment.course.paymentType === 'MONTHLY' ? 'Ежемесячно' : 'Разово'}
                          </div>
                        </div>

                        <div>
                          <span className="text-gray-600">Цена:</span>
                          <div className="mt-1 text-gray-900">
                            {enrollment.course.paymentType === 'MONTHLY' 
                              ? `${enrollment.course.monthlyPrice} AMD/мес`
                              : `${enrollment.course.totalPrice} AMD`
                            }
                          </div>
                        </div>
                      </div>

                      {enrollment.nextPaymentDue && (
                        <div className="mt-2 text-sm">
                          <span className="text-gray-600">Следующий платеж: </span>
                          <span className="text-gray-900">
                            {new Date(enrollment.nextPaymentDue).toLocaleDateString('ru-RU')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Кнопки управления */}
                  <div className="flex flex-wrap gap-2">
                    {enrollment.status === 'ACTIVE' ? (
                      <button
                        onClick={() => updateAccess(enrollment.course.id, 'revoke_access')}
                        disabled={updating === enrollment.course.id}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        <Lock className="w-4 h-4" />
                        {updating === enrollment.course.id ? 'Обновление...' : 'Заблокировать доступ'}
                      </button>
                    ) : (
                      <button
                        onClick={() => updateAccess(enrollment.course.id, 'grant_access')}
                        disabled={updating === enrollment.course.id}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        <Unlock className="w-4 h-4" />
                        {updating === enrollment.course.id ? 'Обновление...' : 'Предоставить доступ'}
                      </button>
                    )}

                    {enrollment.paymentStatus === 'PAID' ? (
                      <button
                        onClick={() => updateAccess(enrollment.course.id, 'mark_unpaid')}
                        disabled={updating === enrollment.course.id}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Отметить неоплаченным
                      </button>
                    ) : (
                      <button
                        onClick={() => updateAccess(enrollment.course.id, 'mark_paid')}
                        disabled={updating === enrollment.course.id}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        <CreditCard className="w-4 h-4" />
                        Отметить оплаченным
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
