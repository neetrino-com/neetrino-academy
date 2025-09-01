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

    // Получаем события группы с обязательной посещаемостью
    const events = await prisma.event.findMany({
      where: {
        groupId: groupId,
        isAttendanceRequired: true,
        isActive: true
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
        startDate: 'desc'
      }
    })

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
      }))
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
    const { eventId, userId, status, response } = body

    // Валидация статуса
    const validStatuses = ['PENDING', 'ATTENDING', 'NOT_ATTENDING', 'MAYBE', 'ATTENDED', 'ABSENT']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid attendance status' }, { status: 400 })
    }

    // Проверяем, что событие принадлежит группе
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        groupId: groupId,
        isAttendanceRequired: true
      }
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found or not attendance required' }, { status: 404 })
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
          eventId: eventId,
          userId: userId
        }
      },
      update: {
        status: status as any,
        response: response || null,
        updatedAt: new Date()
      },
      create: {
        eventId: eventId,
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
