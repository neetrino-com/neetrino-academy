import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/admin/students - получение списка студентов с информацией о платежах
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
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Строим фильтры для поиска
    const where: {
      role: 'STUDENT';
      OR?: Array<{
        name?: { contains: string };
        email?: { contains: string };
        phone?: { contains: string };
      }>;
    } = {
      role: 'STUDENT'
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } }
      ]
    }

    // Получаем студентов с пагинацией
    const [students, total] = await Promise.all([
      prisma.user.findMany({
        where,
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
          lastLoginAt: true,
          _count: {
            select: {
              enrollments: true,
              payments: true,
              submissions: true,
              quizAttempts: true
            }
          },
          enrollments: {
            include: {
              course: {
                select: {
                  id: true,
                  title: true,
                  direction: true,
                  paymentType: true
                }
              }
            }
          },
          payments: {
            select: {
              id: true,
              status: true,
              amount: true,
              currency: true,
              dueDate: true,
              paidAt: true,
              course: {
                select: {
                  title: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 5 // Последние 5 платежей
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.user.count({ where })
    ])

    // Добавляем сводную информацию о платежах для каждого студента
    const studentsWithPaymentSummary = students.map(student => {
      const paymentSummary = {
        totalPaid: student.payments
          .filter(p => p.status === 'PAID')
          .reduce((sum, p) => sum + Number(p.amount), 0),
        totalPending: student.payments
          .filter(p => p.status === 'PENDING')
          .reduce((sum, p) => sum + Number(p.amount), 0),
        totalOverdue: student.payments
          .filter(p => p.status === 'OVERDUE')
          .reduce((sum, p) => sum + Number(p.amount), 0),
        hasOverduePayments: student.payments.some(p => p.status === 'OVERDUE'),
        nextPaymentDue: student.payments
          .filter(p => p.status === 'PENDING' && p.dueDate)
          .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())[0]?.dueDate
      }

      return {
        ...student,
        paymentSummary
      }
    })

    // Общая статистика
    const totalStats = await prisma.user.aggregate({
      where: { role: 'STUDENT' },
      _count: {
        id: true
      }
    })

    const paymentStats = await prisma.payment.groupBy({
      by: ['status'],
      _count: {
        id: true
      },
      _sum: {
        amount: true
      }
    })

    return NextResponse.json({
      students: studentsWithPaymentSummary,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        totalStudents: totalStats._count.id,
        payments: paymentStats.reduce((acc, stat) => {
          acc[stat.status] = {
            count: stat._count.id,
            amount: Number(stat._sum.amount || 0)
          }
          return acc
        }, {} as Record<string, { count: number; amount: number }>)
      }
    })

  } catch (error) {
    console.error('Ошибка при получении студентов:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
