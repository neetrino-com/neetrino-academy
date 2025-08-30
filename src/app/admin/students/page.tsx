'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  Users, 
  Search,
  Eye,
  UserCheck,
  UserX,
  CreditCard,
  BookOpen,
  Clock,
  AlertTriangle,
  CheckCircle,
  Filter,
  Download,
  Loader2,
  Calendar,
  Phone,
  Mail,
  MapPin
} from 'lucide-react'

interface Student {
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
  lastLoginAt?: string
  _count: {
    enrollments: number
    payments: number
    submissions: number
    quizAttempts: number
  }
  enrollments: Array<{
    id: string
    status: string
    course: {
      title: string
      direction: string
      paymentType: string
    }
  }>
  paymentSummary: {
    totalPaid: number
    totalPending: number
    totalOverdue: number
    hasOverduePayments: boolean
    nextPaymentDue?: string
  }
}

interface StudentsResponse {
  students: Student[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  stats: {
    totalStudents: number
    payments: Record<string, { count: number; amount: number }>
  }
}

export default function StudentsManagementPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const [stats, setStats] = useState({
    totalStudents: 0,
    payments: {} as Record<string, { count: number; amount: number }>
  })
  const [search, setSearch] = useState('')
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

    fetchStudents()
  }, [session, status, router, pagination.page, searchTerm])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      })
      
      if (searchTerm) {
        params.append('search', searchTerm)
      }

      console.log('Fetching students from:', `/api/admin/students?${params}`)
      
      const response = await fetch(`/api/admin/students?${params}`)
      
      console.log('Students API response status:', response.status)
      
      if (response.ok) {
        const data: StudentsResponse = await response.json()
        console.log('Students data received:', data)
        setStudents(data.students)
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages
        }))
        setStats(data.stats)
      } else {
        const errorData = await response.json()
        console.error('Students API error:', response.status, errorData)
      }
    } catch (error) {
      console.error('Ошибка загрузки студентов:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setSearchTerm(search)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleStudentClick = (studentId: string) => {
    router.push(`/admin/students/${studentId}`)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(amount).replace('₽', '֏')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getPaymentStatusColor = (hasOverdue: boolean, pending: number, paid: number) => {
    if (hasOverdue) return 'text-red-600 bg-red-50 border-red-200'
    if (pending > 0) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    if (paid > 0) return 'text-green-600 bg-green-50 border-green-200'
    return 'text-gray-600 bg-gray-50 border-gray-200'
  }

  if (loading && students.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Загрузка студентов...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Управление студентами 👥
          </h1>
          <p className="text-gray-600">Информация о студентах, их курсах и платежах</p>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Всего студентов</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalStudents}</p>
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
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(stats.payments?.PAID?.amount || 0)}
                </p>
                <p className="text-sm text-gray-500">{stats.payments?.PAID?.count || 0} платежей</p>
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
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(stats.payments?.PENDING?.amount || 0)}
                </p>
                <p className="text-sm text-gray-500">{stats.payments?.PENDING?.count || 0} платежей</p>
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
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(stats.payments?.OVERDUE?.amount || 0)}
                </p>
                <p className="text-sm text-gray-500">{stats.payments?.OVERDUE?.count || 0} платежей</p>
              </div>
            </div>
          </div>
        </div>

        {/* Поиск и фильтры */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Поиск по имени, email или телефону..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleSearch}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                Найти
              </button>
              
              <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Фильтры
              </button>
              
              <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                <Download className="w-4 h-4" />
                Экспорт
              </button>
            </div>
          </div>
        </div>

        {/* Список студентов */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Студенты ({pagination.total})
            </h2>
          </div>

          {students.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Студенты не найдены</h3>
              <p className="text-gray-600">Попробуйте изменить параметры поиска</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {students.map((student) => (
                <div
                  key={student.id}
                  onClick={() => handleStudentClick(student.id)}
                  className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      {/* Аватар */}
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        {student.avatar ? (
                          <img
                            src={student.avatar}
                            alt={student.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-lg font-bold text-white">
                            {student.name?.charAt(0) || student.email.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* Основная информация */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {student.name || 'Без имени'}
                          </h3>
                          
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            student.isActive 
                              ? 'text-green-600 bg-green-50 border border-green-200' 
                              : 'text-red-600 bg-red-50 border border-red-200'
                          }`}>
                            {student.isActive ? (
                              <>
                                <UserCheck className="w-3 h-3 mr-1" />
                                Активен
                              </>
                            ) : (
                              <>
                                <UserX className="w-3 h-3 mr-1" />
                                Неактивен
                              </>
                            )}
                          </span>

                          {/* Статус платежей */}
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPaymentStatusColor(
                            student.paymentSummary.hasOverduePayments,
                            student.paymentSummary.totalPending,
                            student.paymentSummary.totalPaid
                          )}`}>
                            <CreditCard className="w-3 h-3 mr-1" />
                            {student.paymentSummary.hasOverduePayments ? 'Просрочка' :
                             student.paymentSummary.totalPending > 0 ? 'К оплате' :
                             student.paymentSummary.totalPaid > 0 ? 'Оплачено' : 'Нет платежей'}
                          </span>
                        </div>

                        {/* Контактная информация */}
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {student.email}
                          </div>
                          
                          {student.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              {student.phone}
                            </div>
                          )}
                          
                          {student.city && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {student.city}
                            </div>
                          )}
                        </div>

                        {/* Статистика */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Курсов:</span>
                            <span className="ml-1 font-medium text-gray-900">
                              {student._count.enrollments}
                            </span>
                          </div>
                          
                          <div>
                            <span className="text-gray-500">Платежей:</span>
                            <span className="ml-1 font-medium text-gray-900">
                              {student._count.payments}
                            </span>
                          </div>
                          
                          <div>
                            <span className="text-gray-500">Заданий:</span>
                            <span className="ml-1 font-medium text-gray-900">
                              {student._count.submissions}
                            </span>
                          </div>
                          
                          <div>
                            <span className="text-gray-500">Регистрация:</span>
                            <span className="ml-1 font-medium text-gray-900">
                              {formatDate(student.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Суммы платежей */}
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900 mb-1">
                        {formatCurrency(student.paymentSummary.totalPaid)}
                      </div>
                      
                      {student.paymentSummary.totalPending > 0 && (
                        <div className="text-sm text-yellow-600">
                          К доплате: {formatCurrency(student.paymentSummary.totalPending)}
                        </div>
                      )}
                      
                      {student.paymentSummary.totalOverdue > 0 && (
                        <div className="text-sm text-red-600">
                          Просрочено: {formatCurrency(student.paymentSummary.totalOverdue)}
                        </div>
                      )}
                      
                      {student.paymentSummary.nextPaymentDue && (
                        <div className="text-xs text-gray-500 mt-1">
                          След. платеж: {formatDate(student.paymentSummary.nextPaymentDue)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Активные курсы */}
                  {student.enrollments.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Активные курсы:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {student.enrollments.slice(0, 3).map((enrollment) => (
                          <span
                            key={enrollment.id}
                            className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                          >
                            {enrollment.course.title}
                          </span>
                        ))}
                        {student.enrollments.length > 3 && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-700">
                            +{student.enrollments.length - 3} еще
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Пагинация */}
          {pagination.totalPages > 1 && (
            <div className="p-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Показано {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} из {pagination.total} студентов
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Назад
                  </button>
                  
                  <span className="text-sm text-gray-600">
                    Страница {pagination.page} из {pagination.totalPages}
                  </span>
                  
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Далее
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
