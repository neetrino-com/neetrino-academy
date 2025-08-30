import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import StudentSidebar from '@/components/dashboard/StudentSidebar'
import { 
  Target, 
  Clock, 
  AlertCircle,
  CheckCircle,
  Upload,
  Eye,
  Calendar,
  FileText,
  Users,
  TrendingUp,
  Award,
  ArrowRight,
  Plus
} from 'lucide-react'

export default async function StudentAssignmentsPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'STUDENT') {
    redirect('/')
  }

  // Получаем все задания студента из его групп
  const assignments = await prisma.groupAssignment.findMany({
    where: {
      group: {
        students: {
          some: {
            userId: session.user.id,
            status: 'ACTIVE'
          }
        }
      }
    },
    include: {
      assignment: {
        include: {
          module: {
            include: {
              course: {
                select: {
                  id: true,
                  title: true,
                  direction: true
                }
              }
            }
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      },
      group: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: {
      dueDate: 'asc'
    }
  })

  // Получаем информацию о сдачах студента
  const assignmentIds = assignments.map(ga => ga.assignment.id)
  const submissions = await prisma.submission.findMany({
    where: {
      userId: session.user.id,
      assignmentId: {
        in: assignmentIds
      }
    }
  })

  // Создаем маппинг сдач по ID задания
  const submissionMap = new Map(
    submissions.map(sub => [sub.assignmentId, sub])
  )

  // Добавляем информацию о сдачах к заданиям
  const assignmentsWithSubmissions = assignments.map(groupAssignment => ({
    ...groupAssignment,
    submission: submissionMap.get(groupAssignment.assignment.id) || null,
    status: getAssignmentStatus(groupAssignment.dueDate, submissionMap.get(groupAssignment.assignment.id))
  }))

  // Подсчет статистики
  const stats = {
    total: assignmentsWithSubmissions.length,
    pending: assignmentsWithSubmissions.filter(a => a.status === 'pending' || a.status === 'due_soon').length,
    submitted: assignmentsWithSubmissions.filter(a => a.status === 'submitted').length,
    graded: assignmentsWithSubmissions.filter(a => a.status === 'graded').length,
    overdue: assignmentsWithSubmissions.filter(a => a.status === 'overdue').length
  }

  // Функция для определения статуса задания
  function getAssignmentStatus(dueDate: Date, submission: any) {
    const now = new Date()
    const due = new Date(dueDate)

    if (submission) {
      if (submission.gradedAt) {
        return 'graded' // Проверено
      }
      return 'submitted' // Сдано, но не проверено
    }

    if (now > due) {
      return 'overdue' // Просрочено
    }

    if (now > new Date(due.getTime() - 24 * 60 * 60 * 1000)) {
      return 'due_soon' // Скоро дедлайн (меньше суток)
    }

    return 'pending' // Ожидает выполнения
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-blue-600'
      case 'due_soon': return 'text-yellow-600'
      case 'overdue': return 'text-red-600'
      case 'submitted': return 'text-purple-600'
      case 'graded': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-blue-50 border-blue-200'
      case 'due_soon': return 'bg-yellow-50 border-yellow-200'
      case 'overdue': return 'bg-red-50 border-red-200'
      case 'submitted': return 'bg-purple-50 border-purple-200'
      case 'graded': return 'bg-green-50 border-green-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-5 h-5" />
      case 'due_soon': return <AlertCircle className="w-5 h-5" />
      case 'overdue': return <AlertCircle className="w-5 h-5" />
      case 'submitted': return <Upload className="w-5 h-5" />
      case 'graded': return <CheckCircle className="w-5 h-5" />
      default: return <Clock className="w-5 h-5" />
    }
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

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case 'WORDPRESS': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'VIBE_CODING': return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'SHOPIFY': return 'bg-green-100 text-green-700 border-green-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getDirectionName = (direction: string) => {
    switch (direction) {
      case 'WORDPRESS': return 'WordPress'
      case 'VIBE_CODING': return 'Vibe Coding'
      case 'SHOPIFY': return 'Shopify'
      default: return 'Неизвестно'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex">
      {/* Боковая панель */}
      <StudentSidebar />
      
      {/* Основной контент */}
      <div className="flex-1">
        <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Заголовок */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">Мои задания</h1>
                  <p className="text-xl text-gray-600">
                    Управляйте домашними заданиями и отслеживайте прогресс
                  </p>
                </div>
              </div>
            </div>

            {/* Статистика */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-slate-500 to-gray-600 rounded-xl">
                    <Target className="w-7 h-7 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Всего заданий</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
                    <Clock className="w-7 h-7 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">К выполнению</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.pending}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl">
                    <Upload className="w-7 h-7 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Сдано</p>
                    <p className="text-3xl font-bold text-purple-600">{stats.submitted}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl">
                    <CheckCircle className="w-7 h-7 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Проверено</p>
                    <p className="text-3xl font-bold text-emerald-600">{stats.graded}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-red-500 to-pink-600 rounded-xl">
                    <AlertCircle className="w-7 h-7 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Просрочено</p>
                    <p className="text-3xl font-bold text-red-600">{stats.overdue}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Фильтры и поиск */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-semibold text-gray-900">Все задания</h2>
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {assignmentsWithSubmissions.length} заданий
                  </span>
                </div>
                <div className="flex gap-3">
                  <Link
                    href="/dashboard"
                    className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 px-4 py-2 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all duration-300 font-medium"
                  >
                    ← Назад в дашборд
                  </Link>
                  <Link
                    href="/courses"
                    className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-2 rounded-xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    <Plus className="w-4 h-4 mr-2 inline" />
                    Найти курсы
                  </Link>
                </div>
              </div>
            </div>

            {/* Список заданий */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              {assignmentsWithSubmissions.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-32 h-32 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-8">
                    <Target className="w-16 h-16 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Заданий пока нет</h3>
                  <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto">
                    У вас пока нет заданий в группах. Запишитесь на курсы, чтобы получать задания от преподавателей.
                  </p>
                  <div className="flex items-center justify-center gap-6 text-sm text-gray-500 mb-8">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      <span>Проверьте расписание</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      <span>Следите за обновлениями</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      <span>Присоединитесь к группам</span>
                    </div>
                  </div>
                  <Link
                    href="/courses"
                    className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 inline-block"
                  >
                    Найти курсы
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {assignmentsWithSubmissions.map((assignment) => (
                    <div key={assignment.id} className={`border rounded-2xl p-6 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 ${getStatusBgColor(assignment.status)}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-4">
                            <div className={`p-3 rounded-xl ${getStatusBgColor(assignment.status)}`}>
                              <div className={`flex items-center gap-2 ${getStatusColor(assignment.status)}`}>
                                {getStatusIcon(assignment.status)}
                              </div>
                            </div>
                            <div className="flex-1">
                              <h3 className="font-bold text-gray-900 text-xl mb-2">{assignment.assignment.title}</h3>
                              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getDirectionColor(assignment.assignment.module.course.direction)}`}>
                                  {getDirectionName(assignment.assignment.module.course.direction)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                  </svg>
                                  {assignment.assignment.module.course.title}
                                </span>
                                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                <span className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                  </svg>
                                  {assignment.group.name}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {assignment.assignment.description && (
                            <p className="text-gray-600 mb-4 leading-relaxed">
                              {assignment.assignment.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-6 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              <span className="font-medium">Дедлайн:</span>
                              <span className="font-semibold text-gray-900">{formatDate(assignment.dueDate)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-gray-500" />
                              <span className="font-medium">Модуль:</span>
                              <span className="font-semibold text-gray-900">{assignment.assignment.module.title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-gray-500" />
                              <span className="font-medium">Преподаватель:</span>
                              <span className="font-semibold text-gray-900">{assignment.assignment.creator.name}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-3 ml-6">
                          {assignment.submission ? (
                            <div className="text-center">
                              <div className="p-3 bg-green-100 rounded-xl mb-2">
                                <CheckCircle className="w-6 h-6 text-green-600 mx-auto" />
                              </div>
                              <p className="text-sm font-semibold text-green-700">
                                {assignment.submission.gradedAt ? 'Проверено' : 'Сдано'}
                              </p>
                              {assignment.submission.score && (
                                <p className="text-xs text-green-600">
                                  Оценка: {assignment.submission.score}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="text-center">
                              <div className="p-3 bg-blue-100 rounded-xl mb-2">
                                <Clock className="w-6 h-6 text-blue-600 mx-auto" />
                              </div>
                              <p className="text-sm font-semibold text-blue-700">
                                {assignment.status === 'overdue' ? 'Просрочено' : 'Ожидает выполнения'}
                              </p>
                            </div>
                          )}
                          
                          <Link
                            href={`/assignments/${assignment.assignment.id}`}
                            className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-800 transition-all duration-300 text-sm font-semibold text-center shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            {assignment.submission ? 'Просмотреть' : 'Выполнить'}
                          </Link>
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
