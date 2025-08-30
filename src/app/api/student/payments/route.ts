import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/student/payments - получение платежей студента
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    // Получаем пользователя по email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    
    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    // Только студенты могут смотреть свои платежи
    if (user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    // Получаем платежи пользователя
    const payments = await prisma.payment.findMany({
      where: {
        userId: user.id
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            direction: true,
            paymentType: true,
            duration: true,
            durationUnit: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Получаем записи на курсы с информацией о следующих платежах
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: user.id,
        status: {
          in: ['ACTIVE', 'SUSPENDED']
        }
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            direction: true,
            paymentType: true,
            monthlyPrice: true,
            totalPrice: true,
            duration: true,
            durationUnit: true
          }
        }
      }
    })

    return NextResponse.json({
      payments,
      enrollments,
      summary: {
        totalPayments: payments.length,
        paidAmount: payments
          .filter(p => p.status === 'PAID')
          .reduce((sum, p) => sum + Number(p.amount), 0),
        pendingAmount: payments
          .filter(p => p.status === 'PENDING')
          .reduce((sum, p) => sum + Number(p.amount), 0),
        overdueAmount: payments
          .filter(p => p.status === 'OVERDUE')
          .reduce((sum, p) => sum + Number(p.amount), 0)
      }
    })

  } catch (error) {
    console.error('Ошибка при получении платежей:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// POST /api/student/payments - создание платежа (имитация оплаты)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { paymentId } = await request.json()

    if (!paymentId) {
      return NextResponse.json({ error: 'ID платежа обязателен' }, { status: 400 })
    }

    // Получаем пользователя
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    
    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    // Получаем платеж и проверяем что он принадлежит пользователю
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        userId: user.id,
        status: 'PENDING'
      },
      include: {
        course: true
      }
    })

    if (!payment) {
      return NextResponse.json({ error: 'Платеж не найден или уже оплачен' }, { status: 404 })
    }

    // Обновляем статус платежа
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        paymentMethod: 'card', // Имитация оплаты картой
        transactionId: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      },
      include: {
        course: true
      }
    })

    // Обновляем статус записи на курс
    await prisma.enrollment.updateMany({
      where: {
        userId: user.id,
        courseId: payment.courseId,
        status: 'SUSPENDED' // Если был приостановлен
      },
      data: {
        status: 'ACTIVE',
        paymentStatus: 'PAID'
      }
    })

    // Если это ежемесячный курс, создаем следующий платеж
    if (payment.course.paymentType === 'MONTHLY' && payment.monthNumber) {
      const nextMonthNumber = payment.monthNumber + 1
      const totalMonths = payment.course.duration || 1
      
      if (nextMonthNumber <= totalMonths) {
        const nextDueDate = new Date()
        nextDueDate.setMonth(nextDueDate.getMonth() + 1)
        
        await prisma.payment.create({
          data: {
            userId: user.id,
            courseId: payment.courseId,
            amount: payment.course.monthlyPrice || payment.amount,
            currency: payment.currency,
            status: 'PENDING',
            paymentType: 'MONTHLY',
            monthNumber: nextMonthNumber,
            dueDate: nextDueDate,
            notes: `Ежемесячный платеж ${nextMonthNumber}/${totalMonths}`
          }
        })

        // Обновляем следующую дату платежа в записи
        await prisma.enrollment.updateMany({
          where: {
            userId: user.id,
            courseId: payment.courseId
          },
          data: {
            nextPaymentDue: nextDueDate
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      payment: updatedPayment,
      message: 'Платеж успешно обработан'
    })

  } catch (error) {
    console.error('Ошибка при обработке платежа:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
