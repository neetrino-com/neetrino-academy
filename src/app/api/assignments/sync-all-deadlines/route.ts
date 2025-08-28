import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Синхронизировать все дедлайны заданий с календарем
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

    // Проверяем права - только админы могут синхронизировать все дедлайны
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied - admin required' }, { status: 403 })
    }

    // Получаем все задания с дедлайнами
    const assignments = await prisma.assignment.findMany({
      where: {
        dueDate: {
          not: null
        }
      },
      include: {
        module: {
          include: {
            course: true
          }
        },
        groupAssignments: {
          include: {
            group: true
          }
        }
      }
    })

    let createdEvents = 0
    let updatedEvents = 0
    let skippedEvents = 0

    for (const assignment of assignments) {
      if (!assignment.dueDate) continue

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
          // Проверяем, нужно ли обновление
          const shouldUpdate = 
            existingEvent.title !== `Дедлайн: ${assignment.title}` ||
            existingEvent.endDate.getTime() !== assignment.dueDate.getTime()

          if (shouldUpdate) {
            await prisma.event.update({
              where: { id: existingEvent.id },
              data: {
                title: `Дедлайн: ${assignment.title}`,
                description: `Срок сдачи задания "${assignment.title}"\n\nКурс: ${assignment.module.course.title}\nМодуль: ${assignment.module.title}\n\n${assignment.description || ''}`,
                startDate: new Date(assignment.dueDate.getTime() - 60 * 60 * 1000), // За час до дедлайна
                endDate: assignment.dueDate,
                updatedAt: new Date()
              }
            })
            updatedEvents++
          } else {
            skippedEvents++
          }
        } else {
          // Создаем новое событие
          const newEvent = await prisma.event.create({
            data: {
              title: `Дедлайн: ${assignment.title}`,
              description: `Срок сдачи задания "${assignment.title}"\n\nКурс: ${assignment.module.course.title}\nМодуль: ${assignment.module.title}\n\n${assignment.description || ''}`,
              type: 'DEADLINE',
              startDate: new Date(assignment.dueDate.getTime() - 60 * 60 * 1000), // За час до дедлайна
              endDate: assignment.dueDate,
              groupId: groupAssignment.group.id,
              courseId: assignment.module.course.id,
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

          createdEvents++
        }
      }
    }

    return NextResponse.json({ 
      message: 'All deadline events synchronized successfully',
      statistics: {
        created: createdEvents,
        updated: updatedEvents,
        skipped: skippedEvents,
        total: createdEvents + updatedEvents + skippedEvents
      }
    })
  } catch (error) {
    console.error('Error syncing all deadlines:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
