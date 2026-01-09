import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Получить все сдачи заданий для преподавателя
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

    // Получаем параметры фильтрации
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // all, ungraded, graded
    const groupId = searchParams.get('groupId')
    const assignmentId = searchParams.get('assignmentId')

    // Базовый запрос для получения сдач
    const whereCondition: any = {}

    // Для админа показываем все сдачи, для преподавателя - только от его групп
    if (user.role === 'TEACHER') {
      whereCondition.assignment = {
        groupAssignments: {
          some: {
            group: {
              teachers: {
                some: {
                  userId: user.id
                }
              }
            }
          }
        }
      }
    }

    // Фильтр по статусу
    if (status === 'ungraded') {
      whereCondition.gradedAt = null
    } else if (status === 'graded') {
      whereCondition.gradedAt = { not: null }
    }

    // Фильтр по группе
    if (groupId) {
      whereCondition.assignment = {
        ...whereCondition.assignment,
        groupAssignments: {
          some: {
            groupId: groupId
          }
        }
      }
    }

    // Фильтр по заданию
    if (assignmentId) {
      whereCondition.assignmentId = assignmentId
    }

    const submissions = await prisma.submission.findMany({
      where: whereCondition,
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

    // Преобразуем данные для удобства
    const submissionsWithGroupInfo = submissions.map(submission => ({
      ...submission,
      groups: submission.assignment.groupAssignments.map(ga => ga.group)
    }))

    return NextResponse.json(submissionsWithGroupInfo)
  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
