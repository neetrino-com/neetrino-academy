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

    // Получаем пользователя
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    
    if (!user || (user.role !== 'ADMIN' && user.role !== 'TEACHER')) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const courseId = searchParams.get('courseId')
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Строим фильтры
    const where: any = {}
    if (status) where.status = status
    if (courseId) where.courseId = courseId
    if (userId) where.userId = userId

    // Получаем платежи с пагинацией
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
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.payment.count({ where })
    ])

    // Статистика платежей
    const stats = await prisma.payment.groupBy({
      by: ['status'],
      _count: {
        id: true
      },
      _sum: {
        amount: true
      }
    })

    return NextResponse.json({
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: stats.reduce((acc, stat) => {
        acc[stat.status] = {
          count: stat._count.id,
          amount: Number(stat._sum.amount || 0)
        }
        return acc
      }, {} as Record<string, { count: number; amount: number }>)
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

    // Получаем пользователя
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
      currency = 'AMD',
      paymentType,
      monthNumber,
      dueDate,
      notes
    } = await request.json()

    // Валидация
    if (!userId || !courseId || !amount || !paymentType) {
      return NextResponse.json({ 
        error: 'Обязательные поля: userId, courseId, amount, paymentType' 
      }, { status: 400 })
    }

    // Проверяем существование студента и курса
    const [student, course] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.course.findUnique({ where: { id: courseId } })
    ])

    if (!student || student.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Студент не найден' }, { status: 404 })
    }

    if (!course) {
      return NextResponse.json({ error: 'Курс не найден' }, { status: 404 })
    }

    // Создаем платеж
    const payment = await prisma.payment.create({
      data: {
        userId,
        courseId,
        amount,
        currency,
        paymentType,
        monthNumber,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes,
        status: 'PENDING'
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
            direction: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      payment,
      message: 'Платеж успешно создан'
    })

  } catch (error) {
    console.error('Ошибка при создании платежа:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
