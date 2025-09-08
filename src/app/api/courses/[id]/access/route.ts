import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/courses/[id]/access - проверка доступа к курсу
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const courseId = params.id;

    // Найти пользователя
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    // Администраторы и учителя имеют полный доступ
    if (user.role === 'ADMIN' || user.role === 'TEACHER') {
      return NextResponse.json({
        hasAccess: true,
        paymentStatus: 'PAID',
        accessGranted: true,
        enrollmentStatus: 'ACTIVE',
        canRequestAccess: false,
        adminAccess: true
      });
    }

    // Проверить запись на курс
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: courseId
        }
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            paymentType: true,
            monthlyPrice: true,
            totalPrice: true
          }
        }
      }
    });

    if (!enrollment) {
      return NextResponse.json({
        hasAccess: false,
        paymentStatus: 'PENDING',
        accessGranted: false,
        enrollmentStatus: 'INACTIVE',
        canRequestAccess: true,
        message: 'Вы не записаны на этот курс'
      });
    }

    // Проверить платежи
    const payments = await prisma.payment.findMany({
      where: {
        userId: user.id,
        courseId: courseId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Логика определения доступа
    let hasAccess = false;
    let accessGranted = false;

    // Проверяем ручную разблокировку (accessGranted в статусе записи)
    if (enrollment.status === 'ACTIVE') {
      accessGranted = true;
    }

    // Проверяем оплату
    if (enrollment.paymentStatus === 'PAID') {
      hasAccess = true;
    } else if (enrollment.course.paymentType === 'MONTHLY') {
      // Для ежемесячных курсов проверяем текущий период
      const currentDate = new Date();
      const validPayment = payments.find(payment => 
        (payment.status === 'PAID' || payment.status === 'COMPLETED') && 
        payment.dueDate && 
        new Date(payment.dueDate) >= currentDate
      );
      
      if (validPayment) {
        hasAccess = true;
      }
    } else {
      // Для разовых курсов проверяем наличие успешного платежа
      const validPayment = payments.find(payment => 
        payment.status === 'PAID' || payment.status === 'COMPLETED'
      );
      
      if (validPayment) {
        hasAccess = true;
      }
    }

    // Окончательное решение о доступе
    const finalAccess = hasAccess || accessGranted;

    return NextResponse.json({
      hasAccess: finalAccess,
      paymentStatus: enrollment.paymentStatus,
      accessGranted: accessGranted,
      enrollmentStatus: enrollment.status,
      nextPaymentDue: enrollment.nextPaymentDue?.toISOString(),
      canRequestAccess: !finalAccess && enrollment.paymentStatus !== 'CANCELLED',
      courseInfo: {
        title: enrollment.course.title,
        paymentType: enrollment.course.paymentType,
        monthlyPrice: enrollment.course.monthlyPrice,
        totalPrice: enrollment.course.totalPrice
      },
      payments: payments.map(p => ({
        id: p.id,
        amount: p.amount,
        status: p.status,
        dueDate: p.dueDate?.toISOString(),
        paidAt: p.paidAt?.toISOString(),
        monthNumber: p.monthNumber
      }))
    });

  } catch (error) {
    console.error('Ошибка при проверке доступа к курсу:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
