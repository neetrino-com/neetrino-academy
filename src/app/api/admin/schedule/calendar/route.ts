import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('📅 [Calendar] Запрос календарных данных')
    
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user || !['ADMIN', 'TEACHER'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start')
    const endDate = searchParams.get('end')
    const groupId = searchParams.get('groupId')
    const teacherId = searchParams.get('teacherId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Параметры по умолчанию
    const start = startDate ? new Date(startDate) : new Date()
    const end = endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 дней

    console.log(`📅 [Calendar] Период: ${start.toISOString().split('T')[0]} - ${end.toISOString().split('T')[0]}`)

    // Получаем события с пагинацией
    const [events, totalCount] = await Promise.all([
      prisma.event.findMany({
        where: {
          isActive: true,
          startDate: { gte: start },
          endDate: { lte: end },
          ...(groupId && { groupId }),
          ...(teacherId && { createdById: teacherId })
        },
        include: {
          group: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          startDate: 'asc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.event.count({
        where: {
          isActive: true,
          startDate: { gte: start },
          endDate: { lte: end },
          ...(groupId && { groupId }),
          ...(teacherId && { createdById: teacherId })
        }
      })
    ])

    // Получаем расписание групп
    const schedules = await prisma.groupSchedule.findMany({
      where: {
        isActive: true,
        ...(groupId && { groupId })
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    })

    // Получаем группы для статистики
    const groups = await prisma.group.findMany({
      where: { isActive: true },
      include: {
        teachers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        students: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })

    // Форматируем события для календаря
    const calendarEvents = events.map(event => ({
      id: event.id,
      title: event.title,
      start: event.startDate.toISOString(),
      end: event.endDate.toISOString(),
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      allDay: false,
      groupId: event.groupId,
      groupName: event.group?.name || 'Неизвестная группа',
      teacherId: event.createdById,
      teacherName: event.createdBy?.name || 'Неизвестный учитель',
      location: event.location,
      type: event.type,
      isActive: event.isActive,
      isAttendanceRequired: event.isAttendanceRequired,
      color: getEventColor(event.type, event.group?.type)
    }))

    // Группируем события по месяцам для месячного вида
    const eventsByMonth = groupEventsByMonth(calendarEvents)

    // Статистика
    const now = new Date()
    const stats = {
      totalEvents: events.length,
      totalSchedules: schedules.length,
      totalGroups: groups.length,
      eventsByType: getEventsByType(events),
      upcomingEvents: events.filter(e => e.startDate > now).length,
      pastEvents: events.filter(e => e.startDate <= now).length
    }

    console.log(`✅ [Calendar] Найдено событий: ${events.length}, расписаний: ${schedules.length}`)

    return NextResponse.json({
      success: true,
      events: calendarEvents,
      schedules: schedules,
      groups: groups,
      eventsByMonth: eventsByMonth,
      stats: stats,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
        hasMore: page < Math.ceil(totalCount / limit)
      },
      period: {
        start: start.toISOString(),
        end: end.toISOString()
      }
    })

  } catch (error) {
    console.error('❌ [Calendar] Ошибка получения данных:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Группировка событий по месяцам
function groupEventsByMonth(events: Array<{
  id: string
  title: string
  start: string
  end: string
  startDate: string
  endDate: string
  groupId: string
  groupName: string
  teacherId: string
  teacherName: string
  location?: string
  type: string
  isActive: boolean
  isAttendanceRequired: boolean
  color: string
}>) {
  const months: { [key: string]: typeof events } = {}
  
  events.forEach(event => {
    const date = new Date(event.start)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    if (!months[monthKey]) {
      months[monthKey] = []
    }
    
    months[monthKey].push(event)
  })
  
  return months
}

// Получение цвета события по типу
function getEventColor(type: string, groupType?: string): string {
  const colors: { [key: string]: string } = {
    'LESSON': '#3B82F6',      // Синий
    'EXAM': '#EF4444',        // Красный
    'MEETING': '#10B981',     // Зеленый
    'WORKSHOP': '#F59E0B',    // Оранжевый
    'SEMINAR': '#8B5CF6',     // Фиолетовый
    'CONSULTATION': '#06B6D4', // Голубой
    'ANNOUNCEMENT': '#6B7280', // Серый
    'OTHER': '#9CA3AF'        // Светло-серый
  }
  
  return colors[type] || colors['OTHER']
}

// Статистика по типам событий
function getEventsByType(events: Array<{ type: string }>) {
  const types: { [key: string]: number } = {}
  
  events.forEach(event => {
    types[event.type] = (types[event.type] || 0) + 1
  })
  
  return types
}
