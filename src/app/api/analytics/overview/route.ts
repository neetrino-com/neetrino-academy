import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Получить общую аналитику для преподавателя/админа
export async function GET(request: NextRequest) {
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

    // Для админа показываем всю статистику, для преподавателя - только его группы
    const isAdmin = user.role === 'ADMIN'

    // Базовые фильтры
    const groupFilter = isAdmin ? {} : {
      teachers: {
        some: {
          userId: user.id
        }
      }
    }

    const submissionFilter = isAdmin ? {} : {
      assignment: {
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

    // Параллельные запросы для производительности
    const [
      totalGroups,
      totalStudents,
      totalAssignments,
      totalSubmissions,
      ungraded,
      avgScore,
      recentSubmissions,
      topStudents,
      assignmentStats
    ] = await Promise.all([
      // Общее количество групп
      prisma.group.count({
        where: groupFilter
      }),

      // Общее количество студентов
      prisma.groupStudent.count({
        where: {
          status: 'ACTIVE',
          group: groupFilter
        }
      }),

      // Общее количество заданий
      prisma.groupAssignment.count({
        where: {
          group: groupFilter
        }
      }),

      // Общее количество сдач
      prisma.submission.count({
        where: submissionFilter
      }),

      // Количество непроверенных работ
      prisma.submission.count({
        where: {
          ...submissionFilter,
          gradedAt: null
        }
      }),

      // Средний балл
      prisma.submission.aggregate({
        where: {
          ...submissionFilter,
          score: { not: null }
        },
        _avg: {
          score: true
        }
      }),

      // Последние сдачи (5 штук)
      prisma.submission.findMany({
        where: submissionFilter,
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          },
          assignment: {
            select: {
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
        },
        orderBy: {
          submittedAt: 'desc'
        },
        take: 5
      }),

      // Топ студенты по средним оценкам
      prisma.submission.groupBy({
        by: ['userId'],
        where: {
          ...submissionFilter,
          score: { not: null }
        },
        _avg: {
          score: true
        },
        _count: {
          score: true
        },
        orderBy: {
          _avg: {
            score: 'desc'
          }
        },
        take: 5
      }),

      // Статистика заданий
      prisma.submission.groupBy({
        by: ['assignmentId'],
        where: submissionFilter,
        _count: {
          id: true
        },
        _avg: {
          score: true
        }
      })
    ])

    // Получаем информацию о студентах для топ-листа
    const topStudentIds = topStudents.map(s => s.userId)
    const topStudentDetails = await prisma.user.findMany({
      where: {
        id: { in: topStudentIds }
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    })

    const topStudentsWithDetails = topStudents.map(student => {
      const userDetails = topStudentDetails.find(u => u.id === student.userId)
      return {
        ...student,
        user: userDetails
      }
    })

    // Статистика по дням (последние 7 дней)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const dailySubmissions = await prisma.submission.groupBy({
      by: ['submittedAt'],
      where: {
        ...submissionFilter,
        submittedAt: {
          gte: sevenDaysAgo
        }
      },
      _count: {
        id: true
      }
    })

    // Преобразуем данные для графика
    const dailyStats = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const count = dailySubmissions.filter(s => 
        s.submittedAt.toISOString().split('T')[0] === dateStr
      ).reduce((acc, curr) => acc + curr._count.id, 0)

      dailyStats.push({
        date: dateStr,
        submissions: count
      })
    }

    const analytics = {
      overview: {
        totalGroups,
        totalStudents,
        totalAssignments,
        totalSubmissions,
        ungraded,
        averageScore: avgScore._avg.score ? Math.round(avgScore._avg.score * 100) / 100 : 0
      },
      recentSubmissions: recentSubmissions.map(submission => ({
        id: submission.id,
        studentName: submission.user.name,
        assignmentTitle: submission.assignment.title,
        courseTitle: submission.assignment.lesson.module.course.title,
        submittedAt: submission.submittedAt,
        score: submission.score,
        isGraded: !!submission.gradedAt
      })),
      topStudents: topStudentsWithDetails.map(student => ({
        name: student.user?.name || 'Unknown',
        email: student.user?.email || 'unknown@example.com',
        averageScore: Math.round((student._avg.score || 0) * 100) / 100,
        submissionsCount: student._count.score
      })),
      dailySubmissions: dailyStats,
      assignmentStats: assignmentStats.length
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
