'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { 
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  BookOpen,
  FileText,
  Award,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Edit,
  Ban,
  UserCheck,
  Loader2,
  TrendingUp,
  Target,
  Activity,
  Users
} from 'lucide-react'

interface StudentDetails {
  student: {
    id: string
    name: string
    email: string
    avatar?: string
    isActive: boolean
    age?: number
    gender?: string
    phone?: string
    address?: string
    city?: string
    country?: string
    telegram?: string
    instagram?: string
    createdAt: string
    updatedAt: string
    lastLoginAt?: string
    _count: {
      enrollments: number
      payments: number
      submissions: number
      quizAttempts: number
      lessonProgress: number
      notifications: number
    }
  }
  enrollments: Array<{
    id: string
    status: string
    enrolledAt: string
    paymentStatus: string
    nextPaymentDue?: string
    course: {
      id: string
      title: string
      description?: string
      direction: string
      level: string
      paymentType: string
      monthlyPrice?: number
      totalPrice?: number
      duration?: number
      durationUnit?: string
      thumbnail?: string
      _count: {
        modules: number
      }
    }
  }>
  payments: Array<{
    id: string
    amount: number
    currency: string
    status: string
    paymentType: string
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
    }
  }>
  paymentSummary: {
    totalPaid: number
    totalPending: number
    totalOverdue: number
    totalCancelled: number
    hasOverduePayments: boolean
    lastPayment?: any
    nextPaymentDue?: any
  }
  learningStats: {
    coursesEnrolled: number
    coursesCompleted: number
    coursesActive: number
    coursesSuspended: number
    lessonsCompleted: number
    totalLessons: number
    averageProgress: number
    quizzesPassed: number
    totalQuizzes: number
    averageQuizScore: number
    assignmentsSubmitted: number
    assignmentsGraded: number
    averageAssignmentScore: number
  }
}

export default function StudentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [student, setStudent] = useState<StudentDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

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

    fetchStudentDetails()
  }, [session, status, router, params.id])

  const fetchStudentDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/students/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setStudent(data)
      } else {
        router.push('/admin/students')
      }
    } catch (error) {
      console.error('Ошибка загрузки студента:', error)
      router.push('/admin/students')
    } finally {
      setLoading(false)
    }
  }

  const toggleStudentStatus = async () => {
    if (!student) return
    
    try {
      setUpdating(true)
      const response = await fetch(`/api/admin/students/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isActive: !student.student.isActive
        })
      })

      if (response.ok) {
        fetchStudentDetails()
      }
    } catch (error) {
      console.error('Ошибка обновления статуса:', error)
    } finally {
      setUpdating(false)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-600 bg-green-50 border-green-200'
      case 'COMPLETED': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'SUSPENDED': return 'text-red-600 bg-red-50 border-red-200'
      case 'CANCELLED': return 'text-gray-600 bg-gray-50 border-gray-200'
      case 'PAID': return 'text-green-600 bg-green-50 border-green-200'
      case 'PENDING': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'OVERDUE': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <CheckCircle className="w-4 h-4" />
      case 'COMPLETED': return <Award className="w-4 h-4" />
      case 'SUSPENDED': return <Ban className="w-4 h-4" />
      case 'CANCELLED': return <XCircle className="w-4 h-4" />
      case 'PAID': return <CheckCircle className="w-4 h-4" />
      case 'PENDING': return <Clock className="w-4 h-4" />
      case 'OVERDUE': return <AlertTriangle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Загрузка информации о студенте...</p>
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Студент не найден</h2>
          <Link 
            href="/admin/students"
            className="text-blue-600 hover:text-blue-700"
          >
            Вернуться к списку студентов
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Хлебные крошки и действия */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link 
              href="/admin/students"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Назад к списку
            </Link>
            
            <div className="text-gray-400">/</div>
            
            <h1 className="text-2xl font-bold text-gray-900">
              {student.student.name || 'Студент'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleStudentStatus}
              disabled={updating}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                student.student.isActive
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {updating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : student.student.isActive ? (
                <Ban className="w-4 h-4" />
              ) : (
                <UserCheck className="w-4 h-4" />
              )}
              {student.student.isActive ? 'Деактивировать' : 'Активировать'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Левая колонка - Информация о студенте */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Основная информация */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  {student.student.avatar ? (
                    <img
                      src={student.student.avatar}
                      alt={student.student.name}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-white">
                      {student.student.name?.charAt(0) || student.student.email.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {student.student.name || 'Без имени'}
                </h2>
                
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${
                  student.student.isActive 
                    ? 'text-green-600 bg-green-50 border-green-200' 
                    : 'text-red-600 bg-red-50 border-red-200'
                }`}>
                  {student.student.isActive ? (
                    <>
                      <UserCheck className="w-4 h-4" />
                      Активен
                    </>
                  ) : (
                    <>
                      <Ban className="w-4 h-4" />
                      Неактивен
                    </>
                  )}
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900">{student.student.email}</span>
                </div>

                {student.student.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">{student.student.phone}</span>
                  </div>
                )}

                {(student.student.city || student.student.country) && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">
                      {[student.student.city, student.student.country].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900">
                    Регистрация: {formatDate(student.student.createdAt)}
                  </span>
                </div>

                {student.student.lastLoginAt && (
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">
                      Последний вход: {formatDate(student.student.lastLoginAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Дополнительная информация */}
            {(student.student.age || student.student.gender || student.student.address || student.student.telegram || student.student.instagram) && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Дополнительная информация</h3>
                
                <div className="space-y-3">
                  {student.student.age && (
                    <div>
                      <span className="text-sm text-gray-500">Возраст:</span>
                      <p className="text-gray-900">{student.student.age} лет</p>
                    </div>
                  )}

                  {student.student.gender && (
                    <div>
                      <span className="text-sm text-gray-500">Пол:</span>
                      <p className="text-gray-900">
                        {student.student.gender === 'male' ? 'Мужской' : 
                         student.student.gender === 'female' ? 'Женский' : 'Другой'}
                      </p>
                    </div>
                  )}

                  {student.student.address && (
                    <div>
                      <span className="text-sm text-gray-500">Адрес:</span>
                      <p className="text-gray-900">{student.student.address}</p>
                    </div>
                  )}

                  {student.student.telegram && (
                    <div>
                      <span className="text-sm text-gray-500">Telegram:</span>
                      <p className="text-gray-900">{student.student.telegram}</p>
                    </div>
                  )}

                  {student.student.instagram && (
                    <div>
                      <span className="text-sm text-gray-500">Instagram:</span>
                      <p className="text-gray-900">{student.student.instagram}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Статистика обучения */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Статистика обучения</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{student.learningStats.coursesActive}</div>
                  <div className="text-sm text-gray-600">Активных курсов</div>
                </div>

                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{student.learningStats.coursesCompleted}</div>
                  <div className="text-sm text-gray-600">Завершено</div>
                </div>

                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{student.learningStats.lessonsCompleted}</div>
                  <div className="text-sm text-gray-600">Уроков пройдено</div>
                </div>

                <div className="text-center p-3 bg-amber-50 rounded-lg">
                  <div className="text-2xl font-bold text-amber-600">{Math.round(student.learningStats.averageProgress)}%</div>
                  <div className="text-sm text-gray-600">Средний прогресс</div>
                </div>
              </div>
            </div>
          </div>

          {/* Правая колонка - Курсы и платежи */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Сводка платежей */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Оплачено</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {formatCurrency(student.paymentSummary.totalPaid)}
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
                    <p className="text-xl font-semibold text-gray-900">
                      {formatCurrency(student.paymentSummary.totalPending)}
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
                    <p className="text-xl font-semibold text-gray-900">
                      {formatCurrency(student.paymentSummary.totalOverdue)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <XCircle className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Отменено</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {formatCurrency(student.paymentSummary.totalCancelled)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Курсы студента */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Курсы студента</h3>
              
              {student.enrollments.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Студент не записан на курсы</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {student.enrollments.map((enrollment) => (
                    <div key={enrollment.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">
                              {enrollment.course.title}
                            </h4>
                            
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(enrollment.status)}`}>
                              {getStatusIcon(enrollment.status)}
                              {enrollment.status === 'ACTIVE' ? 'Активен' :
                               enrollment.status === 'COMPLETED' ? 'Завершен' :
                               enrollment.status === 'SUSPENDED' ? 'Приостановлен' :
                               enrollment.status}
                            </span>

                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(enrollment.paymentStatus)}`}>
                              <CreditCard className="w-3 h-3" />
                              {enrollment.paymentStatus === 'PAID' ? 'Оплачено' :
                               enrollment.paymentStatus === 'PENDING' ? 'К оплате' :
                               enrollment.paymentStatus === 'OVERDUE' ? 'Просрочено' :
                               enrollment.paymentStatus}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-3">
                            {enrollment.course.direction} • {enrollment.course.level} • {enrollment.course._count.modules} модулей
                          </p>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>Записан: {formatDate(enrollment.enrolledAt)}</span>
                            {enrollment.nextPaymentDue && (
                              <span>Следующий платеж: {formatDate(enrollment.nextPaymentDue)}</span>
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
                          <p className="text-sm text-gray-600">
                            {enrollment.course.paymentType === 'MONTHLY' ? 'Ежемесячно' : 'Разово'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* История платежей */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">История платежей</h3>
              
              {student.payments.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">История платежей пуста</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {student.payments.map((payment) => (
                    <div key={payment.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-gray-900">
                              {payment.course.title}
                            </h4>
                            
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(payment.status)}`}>
                              {getStatusIcon(payment.status)}
                              {payment.status === 'PAID' ? 'Оплачено' :
                               payment.status === 'PENDING' ? 'Ожидает' :
                               payment.status === 'OVERDUE' ? 'Просрочено' :
                               payment.status === 'CANCELLED' ? 'Отменено' :
                               payment.status}
                            </span>
                          </div>
                          
                          <div className="text-sm text-gray-600">
                            {payment.paymentType === 'MONTHLY' && payment.monthNumber && (
                              <>Месяц {payment.monthNumber} • </>
                            )}
                            {payment.paidAt ? `Оплачено: ${formatDate(payment.paidAt)}` :
                             payment.dueDate ? `К оплате до: ${formatDate(payment.dueDate)}` : 
                             'Дата не указана'}
                          </div>
                          
                          {payment.transactionId && (
                            <div className="text-xs text-gray-500 mt-1">
                              ID транзакции: {payment.transactionId}
                            </div>
                          )}
                          
                          {payment.notes && (
                            <div className="text-sm text-gray-600 mt-1">
                              {payment.notes}
                            </div>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">
                            {formatCurrency(payment.amount, payment.currency)}
                          </p>
                          {payment.paymentMethod && (
                            <p className="text-sm text-gray-600">
                              {payment.paymentMethod === 'card' ? 'Карта' : payment.paymentMethod}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
