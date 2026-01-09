import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// POST /api/notifications/payment - создание уведомлений о платежах
export async function POST(request: NextRequest) {
  try {
    const { type, paymentId, userId, courseId, message } = await request.json()

    if (!type || !userId || !courseId) {
      return NextResponse.json({
        error: 'Обязательные поля: type, userId, courseId'
      }, { status: 400 })
    }

    // Получаем информацию о курсе и пользователе
    const [course, user] = await Promise.all([
      prisma.course.findUnique({
        where: { id: courseId },
        select: { title: true, direction: true }
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true }
      })
    ])

    if (!course || !user) {
      return NextResponse.json({
        error: 'Курс или пользователь не найден'
      }, { status: 404 })
    }

    // Определяем тип уведомления и заголовок
    let notificationType: 'NEW_MESSAGE' = 'NEW_MESSAGE'
    let title = 'Напоминание о платеже'
    let description = message

    switch (type) {
      case 'payment_due':
        notificationType = 'NEW_MESSAGE'
        title = 'Напоминание о платеже'
        description = `Напоминаем о необходимости оплаты курса "${course.title}"`
        break
      
      case 'payment_overdue':
        notificationType = 'NEW_MESSAGE'
        title = 'Платеж просрочен'
        description = `Платеж за курс "${course.title}" просрочен. Доступ к курсу приостановлен.`
        break
      
      case 'payment_successful':
        notificationType = 'NEW_MESSAGE'
        title = 'Платеж успешно обработан'
        description = `Платеж за курс "${course.title}" успешно обработан. Доступ к курсу восстановлен.`
        break
      
      case 'next_payment_created':
        notificationType = 'NEW_MESSAGE'
        title = 'Создан следующий платеж'
        description = `Для курса "${course.title}" создан следующий ежемесячный платеж.`
        break
      
      default:
        notificationType = 'NEW_MESSAGE'
        title = 'Уведомление о платеже'
        description = message || 'Уведомление о платеже'
    }

    // Создаем уведомление
    const notification = await prisma.notification.create({
      data: {
        userId,
        type: notificationType,
        title,
        message: description,
        data: paymentId ? JSON.stringify({ paymentId }) : null,
        isRead: false
      }
    })

    return NextResponse.json({
      success: true,
      notification,
      message: 'Уведомление создано успешно'
    }, { status: 201 })

  } catch (error) {
    console.error('Ошибка при создании уведомления о платеже:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// GET /api/notifications/payment - получение уведомлений о платежах для пользователя
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type')

    if (!userId) {
      return NextResponse.json({
        error: 'userId обязателен'
      }, { status: 400 })
    }

    const where: {
      userId: string;
      type: string | { in: string[] };
    } = {
      userId,
      type: 'NEW_MESSAGE'
    }

    if (type) {
      where.type = type
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    })

    return NextResponse.json({
      notifications,
      total: notifications.length
    })

  } catch (error) {
    console.error('Ошибка при получении уведомлений о платежах:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
