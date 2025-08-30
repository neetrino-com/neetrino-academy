import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// POST /api/admin/payments/access-control - автоматическое управление доступом
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
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const { action } = await request.json()

    if (!action) {
      return NextResponse.json({
        error: 'Обязательные поля: action'
      }, { status: 400 })
    }

    let result

    switch (action) {
      case 'check_overdue_payments':
        result = await checkAndSuspendOverduePayments()
        break

      case 'restore_access_after_payment':
        result = await restoreAccessAfterPayment()
        break

      case 'send_payment_reminders':
        result = await sendPaymentReminders()
        break

      default:
        return NextResponse.json({
          error: 'Неизвестное действие'
        }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `Операция ${action} выполнена успешно`,
      result
    })

  } catch (error) {
    console.error('Ошибка при управлении доступом:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// Проверка и приостановление доступа для просроченных платежей
async function checkAndSuspendOverduePayments() {
  const currentDate = new Date()
  
  // Находим все просроченные платежи
  const overduePayments = await prisma.payment.findMany({
    where: {
      status: 'OVERDUE',
      dueDate: {
        lt: currentDate
      }
    },
    include: {
      user: true,
      course: true
    }
  })

  const suspendedEnrollments = []

  for (const payment of overduePayments) {
    // Приостанавливаем доступ к курсу
    const enrollment = await prisma.enrollment.updateMany({
      where: {
        userId: payment.userId,
        courseId: payment.courseId,
        status: 'ACTIVE'
      },
      data: {
        status: 'SUSPENDED',
        paymentStatus: 'OVERDUE'
      }
    })

    if (enrollment.count > 0) {
      suspendedEnrollments.push({
        userId: payment.userId,
        courseId: payment.courseId,
        courseTitle: payment.course.title,
        userName: payment.user.name
      })

      // Создаем уведомление о приостановлении доступа
      try {
        await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/notifications/payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'payment_overdue',
            paymentId: payment.id,
            userId: payment.userId,
            courseId: payment.courseId,
            message: `Доступ к курсу "${payment.course.title}" приостановлен из-за просрочки платежа`
          })
        })
      } catch (error) {
        console.error('Ошибка при создании уведомления:', error)
      }
    }
  }

  return {
    checkedPayments: overduePayments.length,
    suspendedEnrollments: suspendedEnrollments.length,
    details: suspendedEnrollments
  }
}

// Восстановление доступа после оплаты
async function restoreAccessAfterPayment() {
  // Находим все записи на курсы с оплаченными платежами, но приостановленным доступом
  const enrollmentsToRestore = await prisma.enrollment.findMany({
    where: {
      status: 'SUSPENDED',
      paymentStatus: 'PAID'
    },
    include: {
      user: true,
      course: true
    }
  })

  const restoredEnrollments = []

  for (const enrollment of enrollmentsToRestore) {
    // Проверяем, есть ли активный оплаченный платеж
    const activePayment = await prisma.payment.findFirst({
      where: {
        userId: enrollment.userId,
        courseId: enrollment.courseId,
        status: 'PAID',
        paidAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // За последние 24 часа
        }
      }
    })

    if (activePayment) {
      // Восстанавливаем доступ
      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: {
          status: 'ACTIVE',
          paymentStatus: 'PAID'
        }
      })

      restoredEnrollments.push({
        userId: enrollment.userId,
        courseId: enrollment.courseId,
        courseTitle: enrollment.course.title,
        userName: enrollment.user.name
      })

      // Создаем уведомление о восстановлении доступа
      try {
        await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/notifications/payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'payment_successful',
            userId: enrollment.userId,
            courseId: enrollment.courseId,
            message: `Доступ к курсу "${enrollment.course.title}" восстановлен после успешной оплаты`
          })
        })
      } catch (error) {
        console.error('Ошибка при создании уведомления:', error)
      }
    }
  }

  return {
    checkedEnrollments: enrollmentsToRestore.length,
    restoredEnrollments: restoredEnrollments.length,
    details: restoredEnrollments
  }
}

// Отправка напоминаний о предстоящих платежах
async function sendPaymentReminders() {
  const currentDate = new Date()
  const reminderDate = new Date(currentDate.getTime() + 3 * 24 * 60 * 60 * 1000) // За 3 дня

  // Находим платежи, которые нужно оплатить в ближайшие 3 дня
  const upcomingPayments = await prisma.payment.findMany({
    where: {
      status: 'PENDING',
      dueDate: {
        gte: currentDate,
        lte: reminderDate
      }
    },
    include: {
      user: true,
      course: true
    }
  })

  const sentReminders = []

  for (const payment of upcomingPayments) {
    // Проверяем, не отправляли ли мы уже напоминание
    const existingNotification = await prisma.notification.findFirst({
      where: {
        userId: payment.userId,
        type: 'PAYMENT_REMINDER',
        relatedEntityId: payment.id,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // За последние 24 часа
        }
      }
    })

    if (!existingNotification) {
      // Создаем напоминание
      try {
        await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/notifications/payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'payment_due',
            paymentId: payment.id,
            userId: payment.userId,
            courseId: payment.courseId,
            message: `Напоминаем о необходимости оплаты курса "${payment.course.title}" до ${payment.dueDate?.toLocaleDateString('ru-RU')}`
          })
        })

        sentReminders.push({
          userId: payment.userId,
          courseId: payment.courseId,
          courseTitle: payment.course.title,
          userName: payment.user.name,
          dueDate: payment.dueDate
        })
      } catch (error) {
        console.error('Ошибка при создании напоминания:', error)
      }
    }
  }

  return {
    checkedPayments: upcomingPayments.length,
    sentReminders: sentReminders.length,
    details: sentReminders
  }
}
