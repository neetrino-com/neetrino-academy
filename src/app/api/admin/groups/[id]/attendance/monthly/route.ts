import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface Params {
  id: string
}

// Получить данные посещаемости за месяц
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    console.log('Monthly attendance API called')
    const session = await auth()
    if (!session?.user) {
      console.log('No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('Session found:', session.user.email)

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user || !['ADMIN', 'TEACHER'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: groupId } = await params
    const { searchParams } = new URL(request.url)
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

    // Вычисляем даты начала и конца месяца
    const monthStartDate = new Date(year, month - 1, 1)
    const monthEndDate = new Date(year, month, 0) // Последний день месяца
    const daysInMonth = monthEndDate.getDate()

    // Получаем события группы с обязательной посещаемостью за указанный месяц
    const events = await prisma.event.findMany({
      where: {
        groupId: groupId,
        isAttendanceRequired: true,
        isActive: true,
        startDate: {
          gte: monthStartDate,
          lte: monthEndDate
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

    console.log('Found events with attendance required:', events.length)

    // Если нет событий с обязательной посещаемостью, создаем тестовое событие
    if (events.length === 0) {
      console.log('No events with attendance required found, creating test event')
      const testEvent = await prisma.event.create({
        data: {
          title: `Тестовое занятие - ${monthStartDate.toLocaleDateString('ru-RU')}`,
          description: 'Автоматически созданное тестовое событие для проверки посещаемости',
          type: 'LESSON',
          startDate: monthStartDate,
          endDate: new Date(monthStartDate.getTime() + 2 * 60 * 60 * 1000), // +2 часа
          groupId: groupId,
          isAttendanceRequired: true,
          isActive: true,
          createdById: user.id
        }
      })
      console.log('Test event created:', testEvent.id)
    }

    // Получаем все записи о посещаемости за месяц
    const attendanceRecords = await prisma.eventAttendee.findMany({
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

    // Формируем данные для месячного отображения
    const monthlyData = {
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
      attendanceRecords: attendanceRecords.map(record => ({
        id: record.id,
        userId: record.userId,
        eventId: record.eventId,
        status: record.status,
        date: record.event.startDate.toISOString().split('T')[0], // YYYY-MM-DD
        eventTitle: record.event.title
      })),
      currentMonth: `${year}-${month.toString().padStart(2, '0')}`,
      daysInMonth,
      monthStartDate: monthStartDate.toISOString(),
      monthEndDate: monthEndDate.toISOString()
    }

    return NextResponse.json(monthlyData)

  } catch (error) {
    console.error('Ошибка получения данных посещаемости за месяц:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Обновить посещаемость за конкретный день
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
    const { userId, date, status } = body

    // Валидация статуса
    const validStatuses = ['ATTENDED', 'ABSENT', 'PENDING', 'ATTENDING', 'NOT_ATTENDING', 'MAYBE']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid attendance status' }, { status: 400 })
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

    // Ищем событие на указанную дату
    const targetDate = new Date(date)
    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    let event = await prisma.event.findFirst({
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

    // Если события нет, создаем виртуальное событие для ежедневной отметки
    if (!event) {
      event = await prisma.event.create({
        data: {
          title: `Ежедневная отметка - ${targetDate.toLocaleDateString('ru-RU')}`,
          description: 'Автоматически созданное событие для ежедневной отметки посещаемости',
          startDate: startOfDay,
          endDate: endOfDay,
          groupId: groupId,
          isAttendanceRequired: true,
          isActive: true,
          createdBy: user.id
        }
      })
    }

    // Обновляем или создаем запись о посещаемости
    const existingAttendance = await prisma.eventAttendee.findFirst({
      where: {
        eventId: event.id,
        userId: userId
      }
    })

    if (existingAttendance) {
      await prisma.eventAttendee.update({
        where: {
          id: existingAttendance.id
        },
        data: {
          status: status as 'ATTENDED' | 'ABSENT' | 'PENDING' | 'ATTENDING' | 'NOT_ATTENDING' | 'MAYBE',
          updatedAt: new Date()
        }
      })
    } else {
      await prisma.eventAttendee.create({
        data: {
          eventId: event.id,
          userId: userId,
          status: status as 'ATTENDED' | 'ABSENT' | 'PENDING' | 'ATTENDING' | 'NOT_ATTENDING' | 'MAYBE',
          response: null
        }
      })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Ошибка обновления посещаемости за день:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
