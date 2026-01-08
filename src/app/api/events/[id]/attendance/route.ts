import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Обновить статус участия в событии
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    const { status, response } = body

    // Валидация статуса
    const validStatuses = ['PENDING', 'ATTENDING', 'NOT_ATTENDING', 'MAYBE', 'ATTENDED', 'ABSENT']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid attendance status' }, { status: 400 })
    }

    // Проверяем существование события
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        isActive: true
      }
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Проверяем, что пользователь является участником события
    const attendee = await prisma.eventAttendee.findUnique({
      where: {
        eventId_userId: {
          eventId: eventId,
          userId: user.id
        }
      }
    })

    if (!attendee) {
      // Если пользователь не является участником, но имеет доступ к событию через группу, добавляем его
      const hasGroupAccess = await prisma.event.findFirst({
        where: {
          id: eventId,
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
        }
      })

      if (!hasGroupAccess) {
        return NextResponse.json({ error: 'Access denied to this event' }, { status: 403 })
      }

      // Создаем запись об участии
      const newAttendee = await prisma.eventAttendee.create({
        data: {
          eventId: eventId,
          userId: user.id,
          status: status,
          response: response?.trim()
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          event: {
            select: {
              id: true,
              title: true,
              startDate: true,
              endDate: true
            }
          }
        }
      })

      return NextResponse.json(newAttendee)
    }

    // Обновляем существующую запись об участии
    const updatedAttendee = await prisma.eventAttendee.update({
      where: {
        eventId_userId: {
          eventId: eventId,
          userId: user.id
        }
      },
      data: {
        status: status,
        response: response?.trim(),
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true
          }
        }
      }
    })

    return NextResponse.json(updatedAttendee)
  } catch (error) {
    console.error('Error updating attendance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Получить информацию об участии пользователя в событии
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const attendee = await prisma.eventAttendee.findUnique({
      where: {
        eventId_userId: {
          eventId: eventId,
          userId: user.id
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            type: true
          }
        }
      }
    })

    if (!attendee) {
      return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 })
    }

    return NextResponse.json(attendee)
  } catch (error) {
    console.error('Error fetching attendance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
