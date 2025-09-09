import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Получить все задания студента (из курсов и групп)
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

    // 1. Получаем задания из курсов (через Enrollment)
    // Сначала получаем курсы студента
    const studentCourses = await prisma.enrollment.findMany({
      where: {
        userId: user.id,
        status: 'ACTIVE'
      },
      select: {
        courseId: true
      }
    })

    const studentCourseIds = studentCourses.map(e => e.courseId)

    // Получаем уроки, которые принадлежат курсам студента
    const studentLessons = await prisma.lesson.findMany({
      where: {
        module: {
          courseId: {
            in: studentCourseIds
          }
        }
      },
      select: {
        id: true
      }
    })

    const studentLessonIds = studentLessons.map(l => l.id)

    // Теперь получаем задания, которые привязаны к урокам студента
    const courseAssignments = await prisma.assignment.findMany({
      where: {
        lessonId: {
          in: studentLessonIds
        }
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        lesson: {
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
            }
          }
        }
      }
    })

    // 2. Получаем задания из групп
    const groupAssignments = await prisma.groupAssignment.findMany({
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
            lesson: {
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
      }
    })

    // 3. Объединяем все задания
    const allAssignments = [
      // Задания из курсов
      ...courseAssignments.map(assignment => ({
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.dueDate,
        type: assignment.type,
        status: assignment.status,
        maxScore: assignment.maxScore,
        source: 'course' as const,
        course: assignment.lesson?.module.course || null,
        lesson: assignment.lesson || null,
        creator: assignment.creator,
        group: null
      })),
      // Задания из групп
      ...groupAssignments.map(ga => ({
        id: ga.assignment.id,
        title: ga.assignment.title,
        description: ga.assignment.description,
        dueDate: ga.dueDate, // Используем дату из GroupAssignment
        type: ga.assignment.type,
        status: ga.assignment.status,
        maxScore: ga.assignment.maxScore,
        source: 'group' as const,
        course: ga.assignment.lesson?.module?.course || null,
        lesson: ga.assignment.lesson,
        creator: ga.assignment.creator,
        group: ga.group
      }))
    ]

    // 4. Убираем дубликаты по ID задания (если задание есть и в курсе, и в группе)
    const uniqueAssignments = allAssignments.reduce((acc, current) => {
      const existing = acc.find(item => item.id === current.id)
      if (!existing) {
        acc.push(current)
      } else {
        // Если задание есть и в курсе, и в группе, приоритет у группы
        if (current.source === 'group') {
          const index = acc.findIndex(item => item.id === current.id)
          acc[index] = current
        }
      }
      return acc
    }, [] as typeof allAssignments)

    // 5. Получаем информацию о сдачах студента
    const assignmentIds = uniqueAssignments.map(a => a.id)
    const submissions = await prisma.submission.findMany({
      where: {
        userId: user.id,
        assignmentId: {
          in: assignmentIds
        }
      }
    })

    // 6. Создаем маппинг сдач по ID задания
    const submissionMap = new Map(
      submissions.map(sub => [sub.assignmentId, sub])
    )

    // 7. Добавляем информацию о сдачах и сортируем по дате дедлайна
    const assignmentsWithSubmissions = uniqueAssignments
      .map(assignment => ({
        ...assignment,
        submission: submissionMap.get(assignment.id) || null,
        status: getAssignmentStatus(assignment.dueDate, submissionMap.get(assignment.id) || null)
      }))
      .sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      })

    return NextResponse.json(assignmentsWithSubmissions)
  } catch (error) {
    console.error('Error fetching student assignments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Определить статус задания для студента
function getAssignmentStatus(dueDate: Date | null, submission: any) {
  if (!dueDate) {
    return submission ? (submission.gradedAt ? 'graded' : 'submitted') : 'pending'
  }

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
