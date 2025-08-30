import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { notifyStudentAboutGrade } from '@/lib/notifications'

interface Params {
  id: string
}

// Выставить оценку за сдачу задания
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

    const { id: submissionId } = await params
    const body = await request.json()
    const { score, feedback } = body

    // Валидация данных
    if (score === undefined || score === null) {
      return NextResponse.json({ error: 'Score is required' }, { status: 400 })
    }

    if (typeof score !== 'number' || score < 0 || score > 5) {
      return NextResponse.json({ error: 'Score must be a number between 0 and 5' }, { status: 400 })
    }

    // Проверяем, что сдача существует
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          include: {
            groupAssignments: {
              include: {
                group: {
                  include: {
                    teachers: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Для преподавателя проверяем, что он имеет доступ к этому заданию
    if (user.role === 'TEACHER') {
      const hasAccess = submission.assignment.groupAssignments.some(ga =>
        ga.group.teachers.some(teacher => teacher.userId === user.id)
      )

      if (!hasAccess) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // Обновляем сдачу с оценкой
    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        score: score,
        feedback: feedback?.trim() || null,
        gradedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignment: {
          select: {
            id: true,
            title: true,
            module: {
              select: {
                title: true,
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
    })

    // Уведомляем студента о выставленной оценке
    try {
      await notifyStudentAboutGrade(
        updatedSubmission.user.id,
        updatedSubmission.assignment.title,
        score,
        updatedSubmission.assignment.id,
        updatedSubmission.id
      )
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError)
    }

    return NextResponse.json({
      message: 'Submission graded successfully',
      submission: updatedSubmission
    })
  } catch (error) {
    console.error('Error grading submission:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Получить детали сдачи для проверки
export async function GET(
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

    const { id: submissionId } = await params

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
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
            groupAssignments: {
              include: {
                group: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Для преподавателя проверяем доступ
    if (user.role === 'TEACHER') {
      const hasAccess = submission.assignment.groupAssignments.some(ga =>
        ga.group.teachers?.some((teacher: { userId: string }) => teacher.userId === user.id)
      )

      if (!hasAccess) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    return NextResponse.json(submission)
  } catch (error) {
    console.error('Error fetching submission:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
