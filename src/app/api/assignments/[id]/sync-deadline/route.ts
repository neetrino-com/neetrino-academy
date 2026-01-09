import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Синхронизировать дедлайн задания с календарем
export async function POST(
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

    // Проверяем права - только преподаватели и админы могут синхронизировать дедлайны
    if (user.role === 'STUDENT') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { id: assignmentId } = await params

    // Получаем задание с полной информацией
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: assignmentId
      },
      include: {
        lesson: {
          include: {
            module: {
              include: {
                course: true
              }
            }
          }
        },
        groupAssignments: {
          include: {
            group: true
          }
        }
      }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    if (!assignment.dueDate) {
      return NextResponse.json({ error: 'Assignment has no due date' }, { status: 400 })
    }

    const events = []

    // Создаем события для каждой группы, которой назначено задание
    for (const groupAssignment of assignment.groupAssignments) {
      // Проверяем, нет ли уже события для этого дедлайна
      const existingEvent = await prisma.event.findFirst({
        where: {
          assignmentId: assignment.id,
          groupId: groupAssignment.group.id,
          type: 'DEADLINE',
          isActive: true
        }
      })

      if (existingEvent) {
        // Обновляем существующее событие
        const updatedEvent = await prisma.event.update({
          where: { id: existingEvent.id },
          data: {
            title: `Дедлайн: ${assignment.title}`,
            description: `Срок сдачи задания "${assignment.title}"\n\nКурс: ${assignment.lesson?.module?.course?.title || 'Неизвестный курс'}\nМодуль: ${assignment.lesson?.module?.title || 'Неизвестный модуль'}\n\n${assignment.description || ''}`,
            startDate: new Date(assignment.dueDate.getTime() - 60 * 60 * 1000), // За час до дедлайна
            endDate: assignment.dueDate,
            updatedAt: new Date()
          }
        })
        
        events.push(updatedEvent)
      } else {
        // Создаем новое событие
        const newEvent = await prisma.event.create({
          data: {
            title: `Дедлайн: ${assignment.title}`,
            description: `Срок сдачи задания "${assignment.title}"\n\nКурс: ${assignment.lesson?.module?.course?.title || 'Неизвестный курс'}\nМодуль: ${assignment.lesson?.module?.title || 'Неизвестный модуль'}\n\n${assignment.description || ''}`,
            type: 'DEADLINE',
            startDate: new Date(assignment.dueDate.getTime() - 60 * 60 * 1000), // За час до дедлайна
            endDate: assignment.dueDate,
            groupId: groupAssignment.group.id,
            courseId: assignment.lesson?.module?.course?.id || null,
            assignmentId: assignment.id,
            createdById: user.id
          }
        })

        // Автоматически добавляем всех участников группы как участников события
        const [groupStudents, groupTeachers] = await Promise.all([
          prisma.groupStudent.findMany({
            where: { 
              groupId: groupAssignment.group.id,
              status: 'ACTIVE'
            },
            select: { userId: true }
          }),
          prisma.groupTeacher.findMany({
            where: { groupId: groupAssignment.group.id },
            select: { userId: true }
          })
        ])

        const allMemberIds = [
          ...groupStudents.map(s => s.userId),
          ...groupTeachers.map(t => t.userId)
        ]

        if (allMemberIds.length > 0) {
          await prisma.eventAttendee.createMany({
            data: allMemberIds.map(userId => ({
              eventId: newEvent.id,
              userId: userId,
              status: 'PENDING'
            })),
            skipDuplicates: true
          })
        }

        events.push(newEvent)
      }
    }

    return NextResponse.json({ 
      message: 'Deadline events synchronized successfully',
      events: events
    })
  } catch (error) {
    console.error('Error syncing deadline:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
