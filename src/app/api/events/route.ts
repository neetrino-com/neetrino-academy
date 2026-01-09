import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { notifyEventParticipants } from '@/lib/notifications'
import { Prisma } from '@prisma/client'

// Получить события пользователя
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const groupId = searchParams.get('groupId')
    const type = searchParams.get('type')

    // Базовые условия фильтрации
    let whereCondition: Prisma.EventWhereInput = {
      isActive: true,
      OR: [
        // События, которые создал пользователь
        { createdById: user.id },
        // События, на которые пользователь приглашен
        {
          attendees: {
            some: {
              userId: user.id
            }
          }
        },
        // События групп, в которых участвует пользователь
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
        }
      ]
    }

    // Фильтр по датам
    if (startDate && endDate) {
      whereCondition.AND = [
        {
          OR: [
            // События, которые начинаются в диапазоне
            {
              startDate: {
                gte: new Date(startDate),
                lte: new Date(endDate)
              }
            },
            // События, которые заканчиваются в диапазоне
            {
              endDate: {
                gte: new Date(startDate),
                lte: new Date(endDate)
              }
            },
            // События, которые охватывают весь диапазон
            {
              AND: [
                { startDate: { lte: new Date(startDate) } },
                { endDate: { gte: new Date(endDate) } }
              ]
            }
          ]
        }
      ]
    }

    // Фильтр по группе
    if (groupId) {
      whereCondition.groupId = groupId
    }

    // Фильтр по типу события
    if (type && type !== 'ALL') {
      const validEventTypes = ['LESSON', 'EXAM', 'DEADLINE', 'MEETING', 'WORKSHOP', 'SEMINAR', 'CONSULTATION', 'ANNOUNCEMENT', 'OTHER']
      if (validEventTypes.includes(type)) {
        whereCondition.type = type as 'LESSON' | 'EXAM' | 'DEADLINE' | 'MEETING' | 'WORKSHOP' | 'SEMINAR' | 'CONSULTATION' | 'ANNOUNCEMENT' | 'OTHER'
      }
    }

    // Для студентов ограничиваем доступ только к событиям их групп
    if (user.role === 'STUDENT') {
      const studentWhere: Prisma.EventWhereInput = {
        ...whereCondition,
        OR: [
          // События групп студента
          {
            group: {
              students: {
                some: {
                  userId: user.id,
                  status: 'ACTIVE'
                }
              }
            }
          },
          // События, на которые студент приглашен
          {
            attendees: {
              some: {
                userId: user.id
              }
            }
          }
        ]
      }
      Object.assign(whereCondition, studentWhere)
    }

    const events = await prisma.event.findMany({
      where: whereCondition,
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
        },
        _count: {
          select: {
            attendees: true
          }
        }
      },
      orderBy: {
        startDate: 'asc'
      }
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Создать новое событие
export async function POST(request: NextRequest) {
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

    // Проверяем права на создание событий
    if (user.role === 'STUDENT') {
      return NextResponse.json({ error: 'Students cannot create events' }, { status: 403 })
    }

    const body = await request.json()
    const {
      title,
      description,
      type,
      startDate,
      endDate,
      location,
      groupId,
      courseId,
      assignmentId,
      attendeeIds = [],
      isRecurring = false,
      recurringRule
    } = body

    // Валидация
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Event title is required' }, { status: 400 })
    }

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Start and end dates are required' }, { status: 400 })
    }

    if (new Date(startDate) >= new Date(endDate)) {
      return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 })
    }

    // Проверяем доступ к группе, если указана
    if (groupId) {
      const groupAccess = await prisma.group.findFirst({
        where: {
          id: groupId,
          OR: [
            {
              teachers: {
                some: {
                  userId: user.id
                }
              }
            },
            // Админы могут создавать события для любых групп
            ...(user.role === 'ADMIN' ? [{}] : [])
          ]
        }
      })

      if (!groupAccess) {
        return NextResponse.json({ error: 'Access denied to this group' }, { status: 403 })
      }
    }

    // Создаем событие
    const event = await prisma.event.create({
      data: {
        title: title.trim(),
        description: description?.trim(),
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        location: location?.trim(),
        groupId,
        courseId,
        assignmentId,
        isRecurring,
        recurringRule: isRecurring ? JSON.stringify(recurringRule) : null,
        createdById: user.id
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
        }
      }
    })

    // Добавляем участников
    if (attendeeIds.length > 0) {
      await prisma.eventAttendee.createMany({
        data: attendeeIds.map((userId: string) => ({
          eventId: event.id,
          userId: userId
        }))
      })
    }

    // Автоматически добавляем всех участников группы, если событие для группы
    if (groupId) {
      const [groupStudents, groupTeachers] = await Promise.all([
        prisma.groupStudent.findMany({
          where: { groupId, status: 'ACTIVE' },
          select: { userId: true }
        }),
        prisma.groupTeacher.findMany({
          where: { groupId },
          select: { userId: true }
        })
      ])

      const allGroupMemberIds = [
        ...groupStudents.map(s => s.userId),
        ...groupTeachers.map(t => t.userId)
      ].filter(id => id !== user.id) // Исключаем создателя

      if (allGroupMemberIds.length > 0) {
        await prisma.eventAttendee.createMany({
          data: allGroupMemberIds.map(userId => ({
            eventId: event.id,
            userId: userId
          })),
          skipDuplicates: true
        })
      }
    }

    // Отправляем уведомления участникам
    try {
      await notifyEventParticipants(
        event.id,
        'EVENT_REMINDER',
        title,
        new Date(startDate),
        groupId
      )
    } catch (notificationError) {
      console.error('Error sending event notifications:', notificationError)
    }

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
