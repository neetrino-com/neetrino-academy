import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ [Bulk Delete] Запрос массового удаления будущих занятий')
    
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

    const body = await request.json()
    const { eventIds, groupIds, startDate, endDate, confirmDelete } = body

    // Проверяем подтверждение удаления
    if (!confirmDelete) {
      return NextResponse.json({ 
        error: 'Confirmation required. Set confirmDelete to true to proceed.' 
      }, { status: 400 })
    }

    const now = new Date()
    let deletedEvents = 0
    let deletedSchedules = 0

    // Удаляем события
    if (eventIds && eventIds.length > 0) {
      // Удаляем только будущие события
      const deleteResult = await prisma.event.deleteMany({
        where: {
          id: { in: eventIds },
          startDate: { gt: now }, // Только будущие события
          isActive: true
        }
      })
      deletedEvents = deleteResult.count
      console.log(`🗑️ [Bulk Delete] Удалено событий: ${deletedEvents}`)
    }

    // Удаляем расписание по группам
    if (groupIds && groupIds.length > 0) {
      // Удаляем только будущие записи расписания
      const deleteResult = await prisma.groupSchedule.deleteMany({
        where: {
          groupId: { in: groupIds },
          isActive: true
        }
      })
      deletedSchedules = deleteResult.count
      console.log(`🗑️ [Bulk Delete] Удалено записей расписания: ${deletedSchedules}`)
    }

    // Удаляем по датам
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        // Удаляем события в указанном периоде
        const eventsResult = await prisma.event.deleteMany({
          where: {
            startDate: { gte: start, lte: end },
            startDate: { gt: now }, // Только будущие
            isActive: true
          }
        })
        deletedEvents += eventsResult.count

        console.log(`🗑️ [Bulk Delete] Удалено событий по датам: ${eventsResult.count}`)
      }
    }

    // Логируем действие в аудит
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'BULK_DELETE_FUTURE_SCHEDULE',
        entity: 'Event',
        details: JSON.stringify({
          deletedEvents,
          deletedSchedules,
          eventIds: eventIds || [],
          groupIds: groupIds || [],
          startDate,
          endDate,
          timestamp: now.toISOString()
        }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent')
      }
    })

    console.log(`✅ [Bulk Delete] Итого удалено: ${deletedEvents} событий, ${deletedSchedules} записей расписания`)

    return NextResponse.json({
      success: true,
      message: `Успешно удалено ${deletedEvents} событий и ${deletedSchedules} записей расписания`,
      deleted: {
        events: deletedEvents,
        schedules: deletedSchedules,
        total: deletedEvents + deletedSchedules
      }
    })

  } catch (error) {
    console.error('❌ [Bulk Delete] Ошибка удаления:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Предварительный просмотр удаления
export async function POST(request: NextRequest) {
  try {
    console.log('👁️ [Bulk Delete Preview] Запрос предварительного просмотра удаления')
    
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

    const body = await request.json()
    const { eventIds, groupIds, startDate, endDate } = body

    const now = new Date()
    let eventsToDelete = []
    let schedulesToDelete = []

    // Находим события для удаления
    if (eventIds && eventIds.length > 0) {
      eventsToDelete = await prisma.event.findMany({
        where: {
          id: { in: eventIds },
          startDate: { gt: now },
          isActive: true
        },
        include: {
          group: {
            select: {
              id: true,
              name: true
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })
    }

    // Находим расписание для удаления
    if (groupIds && groupIds.length > 0) {
      schedulesToDelete = await prisma.groupSchedule.findMany({
        where: {
          groupId: { in: groupIds },
          isActive: true
        },
        include: {
          group: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })
    }

    // Находим по датам
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        const eventsByDate = await prisma.event.findMany({
          where: {
            startDate: { gte: start, lte: end },
            startDate: { gt: now },
            isActive: true
          },
          include: {
            group: {
              select: {
                id: true,
                name: true
              }
            },
            createdBy: {
              select: {
                id: true,
                name: true
              }
            }
          }
        })
        
        eventsToDelete = [...eventsToDelete, ...eventsByDate]
      }
    }

    // Убираем дубликаты
    const uniqueEvents = eventsToDelete.filter((event, index, self) => 
      index === self.findIndex(e => e.id === event.id)
    )

    console.log(`👁️ [Bulk Delete Preview] Найдено для удаления: ${uniqueEvents.length} событий, ${schedulesToDelete.length} записей расписания`)

    return NextResponse.json({
      success: true,
      preview: {
        events: uniqueEvents.map(event => ({
          id: event.id,
          title: event.title,
          startDate: event.startDate,
          endDate: event.endDate,
          groupName: event.group?.name || 'Неизвестная группа',
          teacherName: event.createdBy?.name || 'Неизвестный учитель',
          location: event.location
        })),
        schedules: schedulesToDelete.map(schedule => ({
          id: schedule.id,
          groupName: schedule.group?.name || 'Неизвестная группа',
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime
        })),
        summary: {
          eventsCount: uniqueEvents.length,
          schedulesCount: schedulesToDelete.length,
          totalCount: uniqueEvents.length + schedulesToDelete.length
        }
      }
    })

  } catch (error) {
    console.error('❌ [Bulk Delete Preview] Ошибка предварительного просмотра:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
