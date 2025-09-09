import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { notifyGroupStudentsAboutNewAssignment } from '@/lib/notifications'

interface Params {
  id: string
}

// Создать задание для группы
export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Проверяем роль пользователя
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user || (user.role !== 'ADMIN' && user.role !== 'TEACHER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: groupId } = await params
    const body = await request.json()
    const { title, description, lessonId, dueDate } = body

    // Валидация данных
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    if (!dueDate) {
      return NextResponse.json({ error: 'Due date is required' }, { status: 400 })
    }

    // Проверяем, что группа существует
    const group = await prisma.group.findUnique({
      where: { id: groupId }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Если lessonId предоставлен, проверяем, что урок существует и принадлежит курсу, назначенному группе
    let existingLesson = null
    if (lessonId) {
      existingLesson = await prisma.lesson.findFirst({
        where: {
          id: lessonId,
          module: {
            course: {
              groupCourses: {
                some: {
                  groupId: groupId
                }
              }
            }
          }
        },
        include: {
          module: {
            include: {
              course: true
            }
          }
        }
      })

      if (!existingLesson) {
        return NextResponse.json({ 
          error: 'Lesson not found or not assigned to this group' 
        }, { status: 404 })
      }
    }

    // Создаем задание
    const assignment = await prisma.assignment.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        dueDate: new Date(dueDate),
        lessonId: lessonId || null, // lessonId теперь опциональный
        type: 'HOMEWORK',
        status: 'PUBLISHED',
        maxScore: 100,
        createdBy: user.id,
        creator: {
          connect: {
            id: user.id
          }
        }
      }
    })

    // Назначаем задание группе
    await prisma.groupAssignment.create({
      data: {
        groupId,
        assignmentId: assignment.id,
        dueDate: new Date(dueDate)
      }
    })

    // Отправляем уведомления студентам группы о новом задании
    try {
      await notifyGroupStudentsAboutNewAssignment(
        groupId,
        assignment.title,
        assignment.id,
        new Date(dueDate)
      )
    } catch (notificationError) {
      console.error('Error sending notifications:', notificationError)
      // Не прерываем выполнение, если уведомления не отправились
    }

    // Возвращаем созданное задание с полной информацией
    const createdAssignment = await prisma.groupAssignment.findUnique({
      where: {
        groupId_assignmentId: {
          groupId,
          assignmentId: assignment.id
        }
      },
      include: {
        assignment: {
          include: {
            lesson: {
              include: {
                module: {
                  include: {
                    course: {
                      select: {
                        title: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    return NextResponse.json(createdAssignment)
  } catch (error) {
    console.error('Error creating assignment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Получить все задания группы
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: groupId } = await params

    // Проверяем, что группа существует
    const group = await prisma.group.findUnique({
      where: { id: groupId }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Получаем все задания группы
    const assignments = await prisma.groupAssignment.findMany({
      where: { groupId },
      include: {
        assignment: {
          include: {
            lesson: {
              include: {
                module: {
                  include: {
                    course: {
                      select: {
                        id: true,
                        title: true
                      }
                    }
                  }
                }
              }
            },
            creator: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            _count: {
              select: {
                submissions: true
              }
            }
          }
        }
      },
      orderBy: {
        assignedAt: 'desc'
      }
    })

    return NextResponse.json(assignments)
  } catch (error) {
    console.error('Error fetching assignments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Удалить задание из группы
export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Проверяем роль пользователя
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user || (user.role !== 'ADMIN' && user.role !== 'TEACHER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: groupId } = await params
    const { searchParams } = new URL(request.url)
    const assignmentId = searchParams.get('assignmentId')

    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 })
    }

    // Проверяем, что назначение существует
    const groupAssignment = await prisma.groupAssignment.findUnique({
      where: {
        groupId_assignmentId: {
          groupId,
          assignmentId
        }
      }
    })

    if (!groupAssignment) {
      return NextResponse.json({ error: 'Assignment not found in this group' }, { status: 404 })
    }

    // Удаляем назначение задания группе
    await prisma.groupAssignment.delete({
      where: {
        groupId_assignmentId: {
          groupId,
          assignmentId
        }
      }
    })

    // Если задание больше не назначено ни одной группе, удаляем само задание
    const remainingAssignments = await prisma.groupAssignment.count({
      where: { assignmentId }
    })

    if (remainingAssignments === 0) {
      await prisma.assignment.delete({
        where: { id: assignmentId }
      })
    }

    return NextResponse.json({ message: 'Assignment removed from group successfully' })
  } catch (error) {
    console.error('Error removing assignment from group:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
