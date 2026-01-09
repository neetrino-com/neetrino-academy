import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import StudentSidebar from '@/components/dashboard/StudentSidebar'
import { 
  Users, 
  BookOpen,
  Calendar,
  MessageSquare,
  FileText,
  Target,
  TrendingUp,
  ArrowRight,
  Plus,
  User,
  Clock,
  Award
} from 'lucide-react'

export default async function StudentGroupsPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  // Все авторизованные пользователи могут видеть группы
  // (студенты, учителя, админы)

  // Получаем все группы, в которых состоит студент
  const groupMemberships = await prisma.groupStudent.findMany({
    where: {
      userId: session.user.id,
      status: 'ACTIVE'
    },
    include: {
      group: {
        include: {
          students: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true
                }
              }
            }
          },
          teachers: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true
                }
              }
            }
          },
          courses: {
            include: {
              course: {
                select: {
                  id: true,
                  title: true,
                  direction: true,
                  thumbnail: true
                }
              }
            }
          },
          assignments: {
            include: {
              assignment: {
                select: {
                  id: true,
                  title: true,
                  dueDate: true
                }
              }
            }
          },
          messages: {
            take: 5,
            orderBy: {
              createdAt: 'desc'
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatar: true
                }
              }
            }
          },
          events: {
            where: {
              startDate: {
                gte: new Date()
              }
            },
            take: 3,
            orderBy: {
              startDate: 'asc'
            }
          }
        }
      }
    }
  })

  // Получаем информацию о сдачах заданий студента
  const groupIds = groupMemberships.map(gm => gm.group.id)
  const submissions = await prisma.submission.findMany({
    where: {
      userId: session.user.id,
      assignment: {
        groupAssignments: {
          some: {
            groupId: {
              in: groupIds
            }
          }
        }
      }
    }
  })

  // Создаем маппинг сдач по ID группы
  const submissionMap = new Map()
  submissions.forEach(sub => {
    // Находим группу для этого задания
    const groupAssignment = groupMemberships.find(gm => 
      gm.group.assignments.some(ga => ga.assignment.id === sub.assignmentId)
    )
    if (groupAssignment) {
      const groupId = groupAssignment.group.id
      if (!submissionMap.has(groupId)) {
        submissionMap.set(groupId, [])
      }
      submissionMap.get(groupId).push(sub)
    }
  })

  // Добавляем информацию о сдачах к группам
  const groupsWithData = groupMemberships.map(membership => ({
    ...membership.group,
    submissions: submissionMap.get(membership.group.id) || [],
    studentCount: membership.group.students.length,
    teacherCount: membership.group.teachers.length,
    courseCount: membership.group.courses.length,
    assignmentCount: membership.group.assignments.length,
    upcomingEvents: membership.group.events,
    recentMessages: membership.group.messages
  }))

  // Подсчет общей статистики
  const stats = {
    total: groupsWithData.length,
    active: groupsWithData.filter(g => g.isActive).length,
    courses: groupsWithData.reduce((acc, g) => acc + g.courseCount, 0),
    assignments: groupsWithData.reduce((acc, g) => acc + g.assignmentCount, 0),
    students: groupsWithData.reduce((acc, g) => acc + g.studentCount, 0)
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

  const getGroupTypeColor = (type: string) => {
    switch (type) {
      case 'ONLINE': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      case 'OFFLINE': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'HYBRID': return 'bg-purple-100 text-purple-700 border-purple-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getGroupTypeName = (type: string) => {
    switch (type) {
      case 'ONLINE': return 'Онлайн'
      case 'OFFLINE': return 'Оффлайн'
      case 'HYBRID': return 'Гибрид'
      default: return 'Неизвестно'
    }
  }

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString
    return date.toLocaleDateString('ru-RU', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatEventDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString
    return date.toLocaleDateString('ru-RU', {
      month: 'short',
      day: 'numeric'
    })
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
                <div className="p-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">Мои группы</h1>
                  <p className="text-xl text-gray-600">
                    Управляйте учебными группами и общайтесь с участниками
                  </p>
                </div>
              </div>
            </div>

            {/* Статистика */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-slate-500 to-gray-600 rounded-xl">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Всего групп</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl">
                    <TrendingUp className="w-7 h-7 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Активных</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.active}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
                    <BookOpen className="w-7 h-7 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Курсов</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.courses}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl">
                    <FileText className="w-7 h-7 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Заданий</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.assignments}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl">
                    <User className="w-7 h-7 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Студентов</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.students}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Фильтры и поиск */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-semibold text-gray-900">Все группы</h2>
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {groupsWithData.length} групп
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

            {/* Список групп */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              {groupsWithData.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-32 h-32 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-8">
                    <Users className="w-16 h-16 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Групп пока нет</h3>
                  <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto">
                    У вас пока нет учебных групп. Запишитесь на курсы, чтобы присоединиться к группам.
                  </p>
                  <div className="flex items-center justify-center gap-6 text-sm text-gray-500 mb-8">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      <span>Изучайте курсы</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      <span>Присоединяйтесь к группам</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      <span>Общайтесь с участниками</span>
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
                  {groupsWithData.map((group) => (
                    <div key={group.id} className="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-gray-50 to-white hover:from-blue-50 hover:to-indigo-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl">
                              <Users className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-bold text-gray-900 text-xl mb-2">{group.name}</h3>
                              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getGroupTypeColor(group.type)}`}>
                                  {getGroupTypeName(group.type)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <User className="w-4 h-4" />
                                  {group.studentCount} студентов
                                </span>
                                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                <span className="flex items-center gap-1">
                                  <BookOpen className="w-4 h-4" />
                                  {group.courseCount} курсов
                                </span>
                                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                <span className="flex items-center gap-1">
                                  <FileText className="w-4 h-4" />
                                  {group.assignmentCount} заданий
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {group.description && (
                            <p className="text-gray-600 mb-4 leading-relaxed">
                              {group.description}
                            </p>
                          )}
                          
                          {/* Курсы группы */}
                          {group.courses.length > 0 && (
                            <div className="mb-4">
                              <h4 className="font-semibold text-gray-900 mb-2">Курсы группы:</h4>
                              <div className="flex flex-wrap gap-2">
                                {group.courses.map((groupCourse) => (
                                  <span key={groupCourse.course.id} className={`px-3 py-1 rounded-full text-xs font-semibold border ${getDirectionColor(groupCourse.course.direction)}`}>
                                    {groupCourse.course.title}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Преподаватели */}
                          {group.teachers.length > 0 && (
                            <div className="mb-4">
                              <h4 className="font-semibold text-gray-900 mb-2">Преподаватели:</h4>
                              <div className="flex flex-wrap gap-2">
                                {group.teachers.map((groupTeacher) => (
                                  <span key={groupTeacher.user.id} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold border border-purple-200">
                                    {groupTeacher.user.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Ближайшие события */}
                          {group.upcomingEvents.length > 0 && (
                            <div className="mb-4">
                              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Ближайшие события:
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {group.upcomingEvents.map((event) => (
                                  <span key={event.id} className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold border border-amber-200">
                                    {event.title} - {formatEventDate(event.startDate)}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Последние сообщения */}
                          {group.recentMessages.length > 0 && (
                            <div className="mb-4">
                              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" />
                                Последние сообщения:
                              </h4>
                              <div className="space-y-2">
                                {group.recentMessages.map((message) => (
                                  <div key={message.id} className="flex items-center gap-2 text-sm text-gray-600">
                                    <span className="font-medium">{message.user.name}:</span>
                                    <span className="truncate">{message.content}</span>
                                    <span className="text-xs text-gray-500">{formatDate(message.createdAt)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-3 ml-6">
                          <div className="text-center">
                            <div className="p-3 bg-cyan-100 rounded-xl mb-2">
                              <Users className="w-6 h-6 text-cyan-600 mx-auto" />
                            </div>
                            <p className="text-sm font-semibold text-cyan-700">
                              Активна
                            </p>
                          </div>
                          
                          <Link
                            href={`/dashboard/groups/${group.id}`}
                            className="bg-gradient-to-r from-cyan-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-cyan-700 hover:to-blue-800 transition-all duration-300 text-sm font-semibold text-center shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-2"
                          >
                            Открыть группу
                            <ArrowRight className="w-4 h-4" />
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
