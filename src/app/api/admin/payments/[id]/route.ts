import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/admin/payments/[id] - получение конкретного платежа
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

    // Получаем платеж
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        course: {
          select: {
            id: true,
            title: true,
            direction: true,
            paymentType: true,
            monthlyPrice: true,
            totalPrice: true
          }
        }
      }
    })

    if (!payment) {
      return NextResponse.json({ error: 'Платеж не найден' }, { status: 404 })
    }

    return NextResponse.json(payment)

  } catch (error) {
    console.error('Ошибка при получении платежа:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/payments/[id] - обновление платежа
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
    
    if (!user || (user.role !== 'ADMIN' && user.role !== 'TEACHER')) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const { 
      status,
      amount,
      currency,
      dueDate,
      paidAt,
      paymentMethod,
      transactionId,
      notes
    } = await request.json()

    // Получаем текущий платеж
    const currentPayment = await prisma.payment.findUnique({
      where: { id },
      include: { course: true }
    })

    if (!currentPayment) {
      return NextResponse.json({ error: 'Платеж не найден' }, { status: 404 })
    }

    // Подготавливаем данные для обновления
    const updateData: {
      status?: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
      amount?: number;
      currency?: string;
      dueDate?: Date | null;
      paidAt?: Date | null;
      paymentMethod?: string;
      transactionId?: string;
      notes?: string;
    } = {}
    if (status !== undefined) updateData.status = status
    if (amount !== undefined) updateData.amount = amount
    if (currency !== undefined) updateData.currency = currency
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null
    if (paidAt !== undefined) updateData.paidAt = paidAt ? new Date(paidAt) : null
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod
    if (transactionId !== undefined) updateData.transactionId = transactionId
    if (notes !== undefined) updateData.notes = notes

    // Если меняем статус на PAID, добавляем дату оплаты
    if (status === 'PAID' && !updateData.paidAt) {
      updateData.paidAt = new Date()
    }

    // Обновляем платеж
    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: updateData,
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

    // Если платеж стал оплаченным, обновляем статус записи на курс
    if (status === 'PAID') {
      await prisma.enrollment.updateMany({
        where: {
          userId: currentPayment.userId,
          courseId: currentPayment.courseId
        },
        data: {
          status: 'ACTIVE',
          paymentStatus: 'PAID'
        }
      })
    }

    // Если платеж просрочен, приостанавливаем доступ к курсу
    if (status === 'OVERDUE') {
      await prisma.enrollment.updateMany({
        where: {
          userId: currentPayment.userId,
          courseId: currentPayment.courseId
        },
        data: {
          status: 'SUSPENDED',
          paymentStatus: 'OVERDUE'
        }
      })
    }

    return NextResponse.json({
      success: true,
      payment: updatedPayment,
      message: 'Платеж успешно обновлен'
    })

  } catch (error) {
    console.error('Ошибка при обновлении платежа:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/payments/[id] - удаление платежа
export async function DELETE(
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

    // Проверяем существование платежа
    const payment = await prisma.payment.findUnique({
      where: { id }
    })

    if (!payment) {
      return NextResponse.json({ error: 'Платеж не найден' }, { status: 404 })
    }

    // Нельзя удалять оплаченные платежи
    if (payment.status === 'PAID') {
      return NextResponse.json({ 
        error: 'Нельзя удалять оплаченные платежи' 
      }, { status: 400 })
    }

    // Удаляем платеж
    await prisma.payment.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Платеж успешно удален'
    })

  } catch (error) {
    console.error('Ошибка при удалении платежа:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
