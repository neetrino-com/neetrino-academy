import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/admin/payments - получение всех платежей для админов
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    // Проверяем роль пользователя
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    
    if (!user || (user.role !== 'ADMIN' && user.role !== 'TEACHER')) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const paymentType = searchParams.get('paymentType')
    const userId = searchParams.get('userId')
    const courseId = searchParams.get('courseId')

    const where: {
      status?: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
      paymentType?: 'ONE_TIME' | 'MONTHLY';
      userId?: string;
      courseId?: string;
    } = {}
    
    // Проверяем валидность значений enum перед использованием
    const validStatuses = ['PENDING', 'PAID', 'OVERDUE', 'CANCELLED'] as const;
    const validPaymentTypes = ['ONE_TIME', 'MONTHLY'] as const;
    
    if (status && validStatuses.includes(status as typeof validStatuses[number])) {
      where.status = status as typeof validStatuses[number];
    }
    if (paymentType && validPaymentTypes.includes(paymentType as typeof validPaymentTypes[number])) {
      where.paymentType = paymentType as typeof validPaymentTypes[number];
    }
    if (userId) where.userId = userId
    if (courseId) where.courseId = courseId

    const skip = (page - 1) * limit

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          course: {
            select: {
              id: true,
              title: true,
              direction: true,
              paymentType: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.payment.count({ where })
    ])

    // Статистика по платежам
    const stats = await prisma.payment.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    })

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages
      },
      stats: stats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.status
        return acc
      }, {} as Record<string, number>)
    })

  } catch (error) {
    console.error('Ошибка при получении платежей:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// POST /api/admin/payments - создание платежа для студента
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    // Проверяем роль пользователя
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    
    if (!user || (user.role !== 'ADMIN' && user.role !== 'TEACHER')) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const {
      userId,
      courseId,
      amount,
      paymentType,
      monthNumber,
      dueDate,
      notes
    } = await request.json()

    if (!userId || !courseId || !amount || !paymentType) {
      return NextResponse.json({
        error: 'Обязательные поля: userId, courseId, amount, paymentType'
      }, { status: 400 })
    }

    // Проверяем существование пользователя и курса
    const [userExists, courseExists] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.course.findUnique({ where: { id: courseId } })
    ])

    if (!userExists) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    if (!courseExists) {
      return NextResponse.json({ error: 'Курс не найден' }, { status: 404 })
    }

    // Создаем платеж
    const payment = await prisma.payment.create({
      data: {
        userId,
        courseId,
        amount,
        currency: courseExists.currency || 'AMD',
        status: 'PENDING',
        paymentType,
        monthNumber,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        notes
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        course: {
          select: {
            id: true,
            title: true,
            direction: true,
            paymentType: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Платеж успешно создан',
      payment
    }, { status: 201 })

  } catch (error) {
    console.error('Ошибка при создании платежа:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/payments/bulk - массовые операции с платежами
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    // Проверяем роль пользователя
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const { action, paymentIds, data } = await request.json()

    if (!action || !paymentIds || !Array.isArray(paymentIds)) {
      return NextResponse.json({
        error: 'Обязательные поля: action, paymentIds (массив)'
      }, { status: 400 })
    }

    let result

    switch (action) {
      case 'markAsPaid':
        result = await prisma.payment.updateMany({
          where: {
            id: { in: paymentIds }
          },
          data: {
            status: 'PAID',
            paidAt: new Date()
          }
        })
        break

      case 'markAsOverdue':
        result = await prisma.payment.updateMany({
          where: {
            id: { in: paymentIds }
          },
          data: {
            status: 'OVERDUE'
          }
        })
        break

      case 'cancel':
        result = await prisma.payment.updateMany({
          where: {
            id: { in: paymentIds }
          },
          data: {
            status: 'CANCELLED'
          }
        })
        break

      default:
        return NextResponse.json({
          error: 'Неизвестное действие'
        }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `Операция ${action} выполнена успешно`,
      updatedCount: result.count
    })

  } catch (error) {
    console.error('Ошибка при массовых операциях с платежами:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// Функция для автоматического создания следующего ежемесячного платежа
export async function createNextMonthlyPayment(
  userId: string,
  courseId: string,
  currentMonthNumber: number
) {
  try {
    // Получаем информацию о курсе
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course || course.paymentType !== 'MONTHLY') {
      throw new Error('Курс не найден или не поддерживает ежемесячную оплату')
    }

    const nextMonthNumber = currentMonthNumber + 1
    const totalMonths = course.duration || 1

    // Проверяем, не превышает ли следующий месяц общую длительность
    if (nextMonthNumber > totalMonths) {
      return null // Курс завершен
    }

    // Вычисляем дату следующего платежа
    const nextDueDate = new Date()
    nextDueDate.setMonth(nextDueDate.getMonth() + 1)

    // Создаем следующий платеж
    const nextPayment = await prisma.payment.create({
      data: {
        userId,
        courseId,
        amount: course.monthlyPrice || 0,
        currency: course.currency || 'AMD',
        status: 'PENDING',
        paymentType: 'MONTHLY',
        monthNumber: nextMonthNumber,
        dueDate: nextDueDate,
        notes: `Ежемесячный платеж ${nextMonthNumber}/${totalMonths}`
      }
    })

    // Обновляем дату следующего платежа в записи на курс
    await prisma.enrollment.updateMany({
      where: {
        userId,
        courseId
      },
      data: {
        nextPaymentDue: nextDueDate
      }
    })

    return nextPayment
  } catch (error) {
    console.error('Ошибка при создании следующего ежемесячного платежа:', error)
    throw error
  }
}
