import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Получить все задания студента из его групп
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Получаем пользователя
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Получаем все задания из групп, где студент состоит
    const assignments = await prisma.groupAssignment.findMany({
      where: {
        group: {
          students: {
            some: {
              userId: user.id,
              status: 'ACTIVE'
            }
          }
        }
      },
      include: {
        assignment: {
          include: {
            module: {
              include: {
                course: {
                  select: {
                    id: true,
                    title: true,
                    direction: true
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
            }
          }
        },
        group: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        dueDate: 'asc'
      }
    })

    // Получаем информацию о сдачах студента
    const assignmentIds = assignments.map(ga => ga.assignment.id)
    const submissions = await prisma.submission.findMany({
      where: {
        userId: user.id,
        assignmentId: {
          in: assignmentIds
        }
      }
    })

    // Создаем маппинг сдач по ID задания
    const submissionMap = new Map(
      submissions.map(sub => [sub.assignmentId, sub])
    )

    // Добавляем информацию о сдачах к заданиям
    const assignmentsWithSubmissions = assignments.map(groupAssignment => ({
      ...groupAssignment,
      submission: submissionMap.get(groupAssignment.assignment.id) || null,
      status: getAssignmentStatus(groupAssignment.dueDate, submissionMap.get(groupAssignment.assignment.id))
    }))

    return NextResponse.json(assignmentsWithSubmissions)
  } catch (error) {
    console.error('Error fetching student assignments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Определить статус задания для студента
function getAssignmentStatus(dueDate: Date, submission: any) {
  const now = new Date()
  const due = new Date(dueDate)

  if (submission) {
    if (submission.gradedAt) {
      return 'graded' // Проверено
    }
    return 'submitted' // Сдано, но не проверено
  }

  if (now > due) {
    return 'overdue' // Просрочено
  }

  if (now > new Date(due.getTime() - 24 * 60 * 60 * 1000)) {
    return 'due_soon' // Скоро дедлайн (меньше суток)
  }

  return 'pending' // Ожидает выполнения
}
