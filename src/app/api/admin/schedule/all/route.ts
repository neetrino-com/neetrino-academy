import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { memoryCache } from '@/lib/cache'

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 [Schedule All] Запрос всех данных расписания')
    
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
    const force = searchParams.get('force') === 'true' // Принудительная загрузка без кэша
    const timeFilter = searchParams.get('timeFilter') || 'current' // Фильтр по времени: current, past, all

    // Определяем диапазон дат в зависимости от фильтра
    let start: Date, end: Date
    const now = new Date()
    
    if (startDate && endDate) {
      // Если даты переданы явно, используем их
      start = new Date(startDate)
      end = new Date(endDate)
    } else {
      // Определяем диапазон по фильтру времени
      switch (timeFilter) {
        case 'current':
          // Текущие события: с сегодняшнего дня до конца текущего месяца
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
          break
        case 'past':
          // Прошедшие события: с начала предыдущего месяца до вчера
          start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59)
          break
        default:
          // По умолчанию: текущие события
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
          break
      }
    }

    console.log(`🚀 [Schedule All] Фильтр: ${timeFilter}, Период: ${start.toISOString().split('T')[0]} - ${end.toISOString().split('T')[0]}`)
    console.log(`🚀 [Schedule All] Текущая дата: ${now.toISOString().split('T')[0]}`)

    // Проверяем кэш (только если не принудительная загрузка)
    const cacheKey = `schedule-all:${timeFilter}:${start.toISOString().split('T')[0]}:${end.toISOString().split('T')[0]}:${groupId || 'all'}:${teacherId || 'all'}:${page}:${limit}`
    
    if (!force) {
      const cached = memoryCache.get(cacheKey)
      if (cached) {
        console.log(`📦 [Schedule All] Используем кэшированные данные`)
        return NextResponse.json(cached)
      }
    } else {
      console.log(`🔄 [Schedule All] Принудительная загрузка - пропускаем кэш`)
    }

    // Один оптимизированный запрос для всех данных
    const [events, totalCount, groups, teachers] = await Promise.all([
      // События с пагинацией и оптимизированными select
      prisma.event.findMany({
        where: {
          isActive: true,
          startDate: { gte: start },
          endDate: { lte: end },
          ...(groupId && { groupId }),
          ...(teacherId && { createdById: teacherId })
        },
        select: {
          id: true,
          title: true,
          startDate: true,
          endDate: true,
          location: true,
          type: true,
          isActive: true,
          isAttendanceRequired: true,
          createdById: true,
          groupId: true,
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
      
      // Общее количество событий
      prisma.event.count({
        where: {
          isActive: true,
          startDate: { gte: start },
          endDate: { lte: end },
          ...(groupId && { groupId }),
          ...(teacherId && { createdById: teacherId })
        }
      }),
      
      // Группы с минимальными данными
      prisma.group.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          type: true,
          description: true,
          teachers: {
            select: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            },
            take: 1 // Только основной учитель
          },
          students: {
            select: {
              id: true,
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      }),
      
      // Учителя с минимальными данными
      prisma.user.findMany({
        where: { 
          role: 'TEACHER',
          isActive: true 
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true
        }
      })
    ])

    // Форматируем события для календаря
    const calendarEvents = events.map(event => ({
      id: event.id,
      title: event.title,
      start: event.startDate.toISOString(),
      end: event.endDate.toISOString(),
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
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

    // Форматируем группы
    const formattedGroups = groups.map(group => ({
      id: group.id,
      name: group.name,
      description: group.description,
      type: group.type,
      teacher: group.teachers[0]?.user || null,
      students: group.students.map(gs => ({
        id: gs.id,
        user: gs.user
      }))
    }))

    // Статистика
    const currentTime = new Date()
    const stats = {
      totalEvents: totalCount,
      totalSchedules: 0, // Не загружаем расписания для оптимизации
      totalGroups: groups.length,
      upcomingEvents: events.filter(e => e.startDate > currentTime).length,
      pastEvents: events.filter(e => e.startDate <= currentTime).length
    }

    console.log(`✅ [Schedule All] Найдено событий: ${events.length}, групп: ${groups.length}`)
    console.log(`✅ [Schedule All] События:`, events.map(e => ({ id: e.id, title: e.title, startDate: e.startDate })))

    const response = {
      success: true,
      events: calendarEvents,
      groups: formattedGroups,
      teachers: teachers,
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
      },
      timeFilter: timeFilter
    }

    // Сохраняем в кэш на 5 минут
    memoryCache.set(cacheKey, response, 5 * 60 * 1000)

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ [Schedule All] Ошибка получения данных:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
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
