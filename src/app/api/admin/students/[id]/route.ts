import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/admin/students/[id] - получение детальной информации о студенте
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { id } = await params

    // Получаем пользователя
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    
    if (!user || (user.role !== 'ADMIN' && user.role !== 'TEACHER')) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    // Получаем информацию о студенте
    const student = await prisma.user.findUnique({
      where: { 
        id,
        role: 'STUDENT'
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        isActive: true,
        age: true,
        gender: true,
        phone: true,
        address: true,
        city: true,
        country: true,
        telegram: true,
        instagram: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            enrollments: true,
            payments: true,
            submissions: true,
            quizAttempts: true,
            lessonProgress: true,
            notifications: true
          }
        }
      }
    })

    if (!student) {
      return NextResponse.json({ error: 'Студент не найден' }, { status: 404 })
    }

    // Получаем записи на курсы с детальной информацией
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            direction: true,
            level: true,
            paymentType: true,
            monthlyPrice: true,
            totalPrice: true,
            duration: true,
            durationUnit: true,
            thumbnail: true,
            _count: {
              select: {
                modules: true
              }
            }
          }
        }
      },
      orderBy: {
        enrolledAt: 'desc'
      }
    })

    // Получаем все платежи студента
    const payments = await prisma.payment.findMany({
      where: { userId: id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            direction: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Получаем прогресс по урокам
    const lessonProgress = await prisma.lessonProgress.findMany({
      where: { userId: id },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            module: {
              select: {
                id: true,
                title: true,
                course: {
                  select: {
                    id: true,
                    title: true
                  }
                }
              }
            }
          }
        }
      }
    })

    // Получаем результаты тестов
    const quizAttempts = await prisma.quizAttempt.findMany({
      where: { userId: id },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            lesson: {
              select: {
                id: true,
                title: true,
                module: {
                  select: {
                    course: {
                      select: {
                        id: true,
                        title: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        startedAt: 'desc'
      }
    })

    // Получаем задания
    const submissions = await prisma.submission.findMany({
      where: { userId: id },
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            module: {
              select: {
                id: true,
                title: true,
                course: {
                  select: {
                    id: true,
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
      }
    })

    // Вычисляем статистику платежей
    const paymentSummary = {
      totalPaid: payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + Number(p.amount), 0),
      totalPending: payments.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + Number(p.amount), 0),
      totalOverdue: payments.filter(p => p.status === 'OVERDUE').reduce((sum, p) => sum + Number(p.amount), 0),
      totalCancelled: payments.filter(p => p.status === 'CANCELLED').reduce((sum, p) => sum + Number(p.amount), 0),
      hasOverduePayments: payments.some(p => p.status === 'OVERDUE'),
      lastPayment: payments.find(p => p.status === 'PAID'),
      nextPaymentDue: payments
        .filter(p => p.status === 'PENDING' && p.dueDate)
        .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())[0]
    }

    // Вычисляем статистику обучения
    const learningStats = {
      coursesEnrolled: enrollments.length,
      coursesCompleted: enrollments.filter(e => e.status === 'COMPLETED').length,
      coursesActive: enrollments.filter(e => e.status === 'ACTIVE').length,
      coursesSuspended: enrollments.filter(e => e.status === 'SUSPENDED').length,
      lessonsCompleted: lessonProgress.filter(lp => lp.completed).length,
      totalLessons: lessonProgress.length,
      averageProgress: lessonProgress.length > 0 
        ? lessonProgress.reduce((sum, lp) => sum + lp.progress, 0) / lessonProgress.length 
        : 0,
      quizzesPassed: quizAttempts.filter(qa => qa.passed).length,
      totalQuizzes: quizAttempts.length,
      averageQuizScore: quizAttempts.length > 0 
        ? quizAttempts.reduce((sum, qa) => sum + (qa.score || 0), 0) / quizAttempts.length 
        : 0,
      assignmentsSubmitted: submissions.length,
      assignmentsGraded: submissions.filter(s => s.score !== null).length,
      averageAssignmentScore: submissions.filter(s => s.score !== null).length > 0
        ? submissions.filter(s => s.score !== null).reduce((sum, s) => sum + (s.score || 0), 0) / submissions.filter(s => s.score !== null).length
        : 0
    }

    return NextResponse.json({
      student,
      enrollments,
      payments,
      lessonProgress,
      quizAttempts,
      submissions,
      paymentSummary,
      learningStats
    })

  } catch (error) {
    console.error('Ошибка при получении информации о студенте:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/students/[id] - обновление информации о студенте
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { id } = await params

    // Получаем пользователя
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const { isActive, notes } = await request.json()

    // Проверяем существование студента
    const student = await prisma.user.findUnique({
      where: { 
        id,
        role: 'STUDENT'
      }
    })

    if (!student) {
      return NextResponse.json({ error: 'Студент не найден' }, { status: 404 })
    }

    // Обновляем студента
    const updateData: {
      name?: string;
      email?: string;
      role?: 'STUDENT' | 'TEACHER' | 'ADMIN';
      bio?: string;
      phone?: string;
      telegramUsername?: string;
      isActive?: boolean;
    } = {}
    if (isActive !== undefined) updateData.isActive = isActive

    const updatedStudent = await prisma.user.update({
      where: { id },
      data: updateData
    })

    // Если деактивируем студента, приостанавливаем все его курсы
    if (isActive === false) {
      await prisma.enrollment.updateMany({
        where: { 
          userId: id,
          status: 'ACTIVE'
        },
        data: {
          status: 'SUSPENDED'
        }
      })
    }

    // Если активируем студента, возобновляем курсы с оплаченными платежами
    if (isActive === true) {
      await prisma.enrollment.updateMany({
        where: { 
          userId: id,
          status: 'SUSPENDED',
          paymentStatus: 'PAID'
        },
        data: {
          status: 'ACTIVE'
        }
      })
    }

    return NextResponse.json({
      success: true,
      student: updatedStudent,
      message: 'Информация о студенте обновлена'
    })

  } catch (error) {
    console.error('Ошибка при обновлении студента:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
