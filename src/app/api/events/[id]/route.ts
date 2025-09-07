import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { notifyEventParticipants } from '@/lib/notifications'

interface Params {
  id: string
}

// Получить конкретное событие
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { id: eventId } = await params

    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        isActive: true,
        OR: [
          // Создатель события
          { createdById: user.id },
          // Участник события
          {
            attendees: {
              some: {
                userId: user.id
              }
            }
          },
          // Член группы, для которой создано событие
          {
            group: {
              OR: [
                {
                  students: {
                    some: {
                      userId: user.id,
                      status: 'ACTIVE'
                    }
                  }
                },
                {
                  teachers: {
                    some: {
                      userId: user.id
                    }
                  }
                }
              ]
            }
          },
          // Админы видят все события
          ...(user.role === 'ADMIN' ? [{}] : [])
        ]
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        group: {
          select: {
            id: true,
            name: true
          }
        },
        course: {
          select: {
            id: true,
            title: true
          }
        },
        assignment: {
          select: {
            id: true,
            title: true
          }
        },
        attendees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          }
        }
      }
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found or access denied' }, { status: 404 })
    }

    return NextResponse.json(event)
  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Обновить событие
export async function PATCH(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { id: eventId } = await params
    const body = await request.json()

    // Проверяем существование события и права на изменение
    const existingEvent = await prisma.event.findFirst({
      where: {
        id: eventId,
        isActive: true,
        OR: [
          // Создатель события
          { createdById: user.id },
          // Админы могут редактировать любые события
          ...(user.role === 'ADMIN' ? [{}] : []),
          // Преподаватели могут редактировать события своих групп
          ...(user.role === 'TEACHER' ? [{
            group: {
              teachers: {
                some: {
                  userId: user.id
                }
              }
            }
          }] : [])
        ]
      }
    })

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found or access denied' }, { status: 404 })
    }

    const {
      title,
      description,
      type,
      startDate,
      endDate,
      location,
      isAttendanceRequired,
      attendeeIds
    } = body

    // Валидация дат
    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 })
    }

    // Обновляем событие
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() }),
        ...(type !== undefined && { type }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: new Date(endDate) }),
        ...(location !== undefined && { location: location?.trim() }),
        ...(isAttendanceRequired !== undefined && { isAttendanceRequired }),
        updatedAt: new Date()
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        group: {
          select: {
            id: true,
            name: true
          }
        },
        course: {
          select: {
            id: true,
            title: true
          }
        },
        assignment: {
          select: {
            id: true,
            title: true
          }
        },
        attendees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          }
        }
      }
    })

    // Обновляем список участников, если передан
    if (attendeeIds !== undefined) {
      // Удаляем всех текущих участников (кроме групповых)
      await prisma.eventAttendee.deleteMany({
        where: {
          eventId: eventId,
          userId: {
            notIn: attendeeIds
          }
        }
      })

      // Добавляем новых участников
      if (attendeeIds.length > 0) {
        await prisma.eventAttendee.createMany({
          data: attendeeIds.map((userId: string) => ({
            eventId: eventId,
            userId: userId
          })),
          skipDuplicates: true
        })
      }
    }

    // Уведомляем участников об изменениях
    try {
      await notifyEventParticipants(
        eventId,
        'EVENT_UPDATED',
        updatedEvent.title,
        updatedEvent.startDate,
        updatedEvent.groupId
      )
    } catch (notificationError) {
      console.error('Error sending update notifications:', notificationError)
    }

    return NextResponse.json(updatedEvent)
  } catch (error) {
    console.error('Error updating event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Удалить событие
export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { id: eventId } = await params

    // Проверяем существование события и права на удаление
    const existingEvent = await prisma.event.findFirst({
      where: {
        id: eventId,
        isActive: true,
        OR: [
          // Создатель события
          { createdById: user.id },
          // Админы могут удалять любые события
          ...(user.role === 'ADMIN' ? [{}] : []),
          // Преподаватели могут удалять события своих групп
          ...(user.role === 'TEACHER' ? [{
            group: {
              teachers: {
                some: {
                  userId: user.id
                }
              }
            }
          }] : [])
        ]
      }
    })

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found or access denied' }, { status: 404 })
    }

    // Мягкое удаление события
    await prisma.event.update({
      where: { id: eventId },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    })

    // Уведомляем участников об отмене события
    try {
      await notifyEventParticipants(
        eventId,
        'EVENT_CANCELLED',
        existingEvent.title,
        existingEvent.startDate,
        existingEvent.groupId
      )
    } catch (notificationError) {
      console.error('Error sending cancellation notifications:', notificationError)
    }

    return NextResponse.json({ message: 'Event deleted successfully' })
  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
