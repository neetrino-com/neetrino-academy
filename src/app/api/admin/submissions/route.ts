import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Получить все сдачи заданий для администратора
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'

    // Получаем все сдачи с полной информацией
    const submissions = await prisma.submission.findMany({
      where: {
        // Если статус 'ungraded', показываем только неоцененные
        ...(status === 'ungraded' ? { gradedAt: null } : {}),
        // Если статус 'graded', показываем только оцененные
        ...(status === 'graded' ? { gradedAt: { not: null } } : {})
      },
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
      },
      orderBy: {
        submittedAt: 'desc'
      }
    })

    // Форматируем данные для фронтенда
    const formattedSubmissions = submissions.map(submission => ({
      id: submission.id,
      content: submission.content,
      fileUrl: submission.fileUrl,
      submittedAt: submission.submittedAt,
      score: submission.score,
      feedback: submission.feedback,
      gradedAt: submission.gradedAt,
      user: submission.user,
      assignment: {
        id: submission.assignment.id,
        title: submission.assignment.title,
        description: submission.assignment.description,
        dueDate: submission.assignment.dueDate,
        maxScore: submission.assignment.maxScore,
        lesson: {
          id: submission.assignment.lesson.id,
          title: submission.assignment.lesson.title,
          module: {
            title: submission.assignment.lesson.module.title,
            course: submission.assignment.lesson.module.course
          }
        },
        creator: submission.assignment.creator
      },
      groups: submission.assignment.groupAssignments.map(ga => ga.group)
    }))

    return NextResponse.json(formattedSubmissions)
  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
