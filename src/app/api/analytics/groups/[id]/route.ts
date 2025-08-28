import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface Params {
  id: string
}

// Получить аналитику по конкретной группе
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user || (user.role !== 'ADMIN' && user.role !== 'TEACHER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: groupId } = await params

    // Проверяем доступ к группе
    const group = await prisma.group.findFirst({
      where: {
        id: groupId,
        ...(user.role === 'TEACHER' && {
          teachers: {
            some: {
              userId: user.id
            }
          }
        })
      },
      include: {
        students: {
          where: { status: 'ACTIVE' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        assignments: {
          include: {
            assignment: {
              select: {
                id: true,
                title: true,
                dueDate: true,
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
        }
      }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found or access denied' }, { status: 404 })
    }

    // Получаем все сдачи заданий для этой группы
    const submissions = await prisma.submission.findMany({
      where: {
        assignment: {
          groupAssignments: {
            some: {
              groupId: groupId
            }
          }
        }
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
            dueDate: true
          }
        }
      }
    })

    // Статистика по студентам
    const studentStats = group.students.map(student => {
      const studentSubmissions = submissions.filter(s => s.user.id === student.user.id)
      const gradedSubmissions = studentSubmissions.filter(s => s.score !== null)
      const averageScore = gradedSubmissions.length > 0 
        ? gradedSubmissions.reduce((acc, s) => acc + (s.score || 0), 0) / gradedSubmissions.length
        : 0

      return {
        student: student.user,
        totalAssignments: group.assignments.length,
        submittedAssignments: studentSubmissions.length,
        gradedAssignments: gradedSubmissions.length,
        averageScore: Math.round(averageScore * 100) / 100,
        completionRate: group.assignments.length > 0 
          ? Math.round((studentSubmissions.length / group.assignments.length) * 100)
          : 0
      }
    })

    // Статистика по заданиям
    const assignmentStats = group.assignments.map(groupAssignment => {
      const assignmentSubmissions = submissions.filter(s => s.assignment.id === groupAssignment.assignment.id)
      const gradedSubmissions = assignmentSubmissions.filter(s => s.score !== null)
      const averageScore = gradedSubmissions.length > 0
        ? gradedSubmissions.reduce((acc, s) => acc + (s.score || 0), 0) / gradedSubmissions.length
        : 0

      return {
        assignment: groupAssignment.assignment,
        totalStudents: group.students.length,
        submittedCount: assignmentSubmissions.length,
        gradedCount: gradedSubmissions.length,
        averageScore: Math.round(averageScore * 100) / 100,
        submissionRate: group.students.length > 0
          ? Math.round((assignmentSubmissions.length / group.students.length) * 100)
          : 0
      }
    })

    // Общая статистика группы
    const groupOverview = {
      totalStudents: group.students.length,
      totalAssignments: group.assignments.length,
      totalSubmissions: submissions.length,
      gradedSubmissions: submissions.filter(s => s.score !== null).length,
      averageGroupScore: submissions.filter(s => s.score !== null).length > 0
        ? Math.round(
            submissions
              .filter(s => s.score !== null)
              .reduce((acc, s) => acc + (s.score || 0), 0) / 
            submissions.filter(s => s.score !== null).length * 100
          ) / 100
        : 0,
      completionRate: group.assignments.length > 0 && group.students.length > 0
        ? Math.round((submissions.length / (group.assignments.length * group.students.length)) * 100)
        : 0
    }

    // Прогресс по времени (последние 30 дней)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const progressData = await prisma.submission.groupBy({
      by: ['submittedAt'],
      where: {
        assignment: {
          groupAssignments: {
            some: {
              groupId: groupId
            }
          }
        },
        submittedAt: {
          gte: thirtyDaysAgo
        }
      },
      _count: {
        id: true
      }
    })

    // Группируем по неделям
    const weeklyProgress = []
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - (i * 7))
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)

      const weekSubmissions = progressData.filter(p => {
        const date = new Date(p.submittedAt)
        return date >= weekStart && date <= weekEnd
      }).reduce((acc, curr) => acc + curr._count.id, 0)

      weeklyProgress.push({
        week: `${weekStart.toLocaleDateString('ru-RU')} - ${weekEnd.toLocaleDateString('ru-RU')}`,
        submissions: weekSubmissions
      })
    }

    const analytics = {
      group: {
        id: group.id,
        name: group.name,
        description: group.description
      },
      overview: groupOverview,
      studentStats: studentStats.sort((a, b) => b.averageScore - a.averageScore),
      assignmentStats: assignmentStats.sort((a, b) => b.submissionRate - a.submissionRate),
      weeklyProgress
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Error fetching group analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
