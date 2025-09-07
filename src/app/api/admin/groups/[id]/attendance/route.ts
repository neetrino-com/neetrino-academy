import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface Params {
  id: string
}

// Получить журнал посещаемости для группы
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
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

    const { id: groupId } = await params
    const { searchParams } = new URL(request.url)
    
    // Параметры для разных режимов отображения
    const viewMode = searchParams.get('view') || 'table' // table, calendar
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString())

    // Проверяем существование группы
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        students: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Ограничиваем выборку только прошедшими днями и сегодняшним днем
    const today = new Date()
    today.setHours(23, 59, 59, 999) // Конец сегодняшнего дня

    let events, attendanceRecords, daysWithLessons

    if (viewMode === 'calendar') {
      // Календарный режим - получаем данные за конкретный месяц
      const monthStartDate = new Date(year, month - 1, 1)
      const monthEndDate = new Date(year, month, 0) // Последний день месяца
      const maxDate = today < monthEndDate ? today : monthEndDate

      // Получаем события группы с обязательной посещаемостью за указанный месяц
      events = await prisma.event.findMany({
        where: {
          groupId: groupId,
          isAttendanceRequired: true,
          isActive: true,
          startDate: {
            gte: monthStartDate,
            lte: maxDate
          }
        },
        include: {
          attendees: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: {
          startDate: 'asc'
        }
      })

      // Получаем все записи о посещаемости за месяц
      attendanceRecords = await prisma.eventAttendee.findMany({
        where: {
          event: {
            groupId: groupId,
            isAttendanceRequired: true,
            isActive: true,
            startDate: {
              gte: monthStartDate,
              lte: monthEndDate
            }
          }
        },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              startDate: true
            }
          }
        },
        orderBy: {
          event: {
            startDate: 'asc'
          }
        }
      })

      // Формируем уникальные дни с занятиями
      daysWithLessons = [...new Set(events.map(event => 
        event.startDate.toISOString().split('T')[0]
      ))].sort()

    } else {
      // Обычный режим (таблица/карточки) - получаем все события
      events = await prisma.event.findMany({
        where: {
          groupId: groupId,
          isAttendanceRequired: true,
          isActive: true,
          startDate: {
            lte: today
          }
        },
        include: {
          attendees: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: {
          startDate: 'asc'
        }
      })
    }

    // Формируем данные для журнала посещаемости
    const attendanceData = {
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        type: group.type
      },
      students: group.students.map(gs => ({
        id: gs.user.id,
        name: gs.user.name,
        email: gs.user.email,
        status: gs.status,
        joinedAt: gs.joinedAt
      })),
      events: events.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        attendanceDeadline: event.attendanceDeadline,
        attendees: event.attendees.map(attendee => ({
          userId: attendee.userId,
          status: attendee.status,
          response: attendee.response,
          updatedAt: attendee.updatedAt
        }))
      })),
      // Дополнительные данные для календарного режима
      ...(viewMode === 'calendar' && {
        attendanceRecords: attendanceRecords.map(record => ({
          id: record.id,
          userId: record.userId,
          eventId: record.eventId,
          status: record.status,
          date: record.event.startDate.toISOString().split('T')[0], // YYYY-MM-DD
          eventTitle: record.event.title
        })),
        currentMonth: `${year}-${month.toString().padStart(2, '0')}`,
        daysWithLessons,
        monthStartDate: new Date(year, month - 1, 1).toISOString(),
        monthEndDate: new Date(year, month, 0).toISOString()
      })
    }

    return NextResponse.json(attendanceData)

  } catch (error) {
    console.error('Ошибка получения журнала посещаемости:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Обновить посещаемость для события
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
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

    const { id: groupId } = await params
    const body = await request.json()
    const { eventId, userId, status, response, date } = body

    // Валидация статуса
    const validStatuses = ['PENDING', 'ATTENDING', 'NOT_ATTENDING', 'MAYBE', 'ATTENDED', 'ABSENT']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid attendance status' }, { status: 400 })
    }

    let event

    if (date) {
      // Календарный режим - ищем событие по дате
      const targetDate = new Date(date)
      const startOfDay = new Date(targetDate)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(targetDate)
      endOfDay.setHours(23, 59, 59, 999)

      event = await prisma.event.findFirst({
        where: {
          groupId: groupId,
          isAttendanceRequired: true,
          isActive: true,
          startDate: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      })

      if (!event) {
        return NextResponse.json({ error: 'No lesson found for this date' }, { status: 404 })
      }
    } else {
      // Обычный режим - ищем событие по ID
      event = await prisma.event.findFirst({
        where: {
          id: eventId,
          groupId: groupId,
          isAttendanceRequired: true
        }
      })

      if (!event) {
        return NextResponse.json({ error: 'Event not found or not attendance required' }, { status: 404 })
      }
    }

    // Проверяем, что пользователь является студентом группы
    const groupStudent = await prisma.groupStudent.findUnique({
      where: {
        groupId_userId: {
          groupId: groupId,
          userId: userId
        }
      }
    })

    if (!groupStudent) {
      return NextResponse.json({ error: 'User is not a student in this group' }, { status: 400 })
    }

    // Обновляем или создаем запись о посещаемости
    const attendanceRecord = await prisma.eventAttendee.upsert({
      where: {
        eventId_userId: {
          eventId: event.id, // Используем найденное событие
          userId: userId
        }
      },
      update: {
        status: status as any,
        response: response || null,
        updatedAt: new Date()
      },
      create: {
        eventId: event.id, // Используем найденное событие
        userId: userId,
        status: status as any,
        response: response || null
      }
    })

    return NextResponse.json({
      success: true,
      attendance: attendanceRecord
    })

  } catch (error) {
    console.error('Ошибка обновления посещаемости:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
