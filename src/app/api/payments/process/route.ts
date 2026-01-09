import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const body = await request.json();
    const { courseId, amount, currency, paymentMethod = 'CARD', paymentType = 'ONE_TIME' } = body;

    if (!courseId || !amount) {
      return NextResponse.json(
        { error: 'Отсутствуют обязательные параметры' },
        { status: 400 }
      );
    }

    // Проверяем, существует ли курс
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Курс не найден' },
        { status: 404 }
      );
    }

    // Проверяем, не записан ли уже пользователь на курс
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: courseId
        }
      }
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { error: 'Вы уже записаны на этот курс' },
        { status: 400 }
      );
    }

    // В реальном приложении здесь была бы интеграция с платежной системой
    // Для демонстрации просто создаем запись о платеже и записи на курс

    // Определяем статус платежа в зависимости от способа оплаты
    const paymentStatus: 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED' = paymentMethod === 'CASH' ? 'PAID' : 'PAID';
    
    // Валидация paymentMethod
    const validPaymentMethods = ['CARD', 'CASH', 'BANK_TRANSFER', 'ONLINE']
    const validPaymentMethod = validPaymentMethods.includes(paymentMethod) 
      ? paymentMethod as 'CARD' | 'CASH' | 'BANK_TRANSFER' | 'ONLINE'
      : 'CARD'
    
    // Валидация paymentType
    const validPaymentTypes = ['ONE_TIME', 'MONTHLY']
    const validPaymentType = validPaymentTypes.includes(paymentType)
      ? paymentType as 'ONE_TIME' | 'MONTHLY'
      : 'ONE_TIME'
    
    // Создаем запись о платеже
    const payment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        courseId: courseId,
        amount: parseFloat(amount.toString()),
        currency: currency || 'RUB',
        status: paymentStatus,
        paymentType: validPaymentType,
        paymentMethod: validPaymentMethod,
        transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        paidAt: new Date()
      }
    });

    // Записываем пользователя на курс
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: session.user.id,
        courseId: courseId,
        enrolledAt: new Date(),
        status: 'ACTIVE',
        paymentStatus: paymentStatus === 'PAID' ? 'PAID' : 'PENDING'
      }
    });

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        transactionId: payment.transactionId
      },
      enrollment: {
        id: enrollment.id,
        courseId: enrollment.courseId,
        status: enrollment.status
      }
    });

  } catch (error) {
    console.error('Ошибка при обработке платежа:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
