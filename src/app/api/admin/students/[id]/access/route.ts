import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const updateAccessSchema = z.object({
  courseId: z.string(),
  action: z.enum(['grant_access', 'revoke_access', 'mark_paid', 'mark_unpaid']),
  reason: z.string().optional()
});

// PUT /api/admin/students/[id]/access - управление доступом студента к курсам
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    // Проверить права администратора
    const admin = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!admin || (admin.role !== 'ADMIN' && admin.role !== 'TEACHER')) {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
    }

    const studentId = params.id;
    const validatedData = updateAccessSchema.parse(await request.json());
    const { courseId, action, reason } = validatedData;

    // Проверить что студент существует
    const student = await prisma.user.findUnique({
      where: { 
        id: studentId,
        role: 'STUDENT'
      }
    });

    if (!student) {
      return NextResponse.json({ error: 'Студент не найден' }, { status: 404 });
    }

    // Проверить что курс существует
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return NextResponse.json({ error: 'Курс не найден' }, { status: 404 });
    }

    // Найти или создать запись на курс
    let enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: studentId,
          courseId: courseId
        }
      }
    });

    if (!enrollment) {
      // Создать запись если её нет
      enrollment = await prisma.enrollment.create({
        data: {
          userId: studentId,
          courseId: courseId,
          status: 'INACTIVE',
          paymentStatus: 'PENDING'
        }
      });
    }

    // Выполнить действие
    let updateData: any = {};
    let logMessage = '';

    switch (action) {
      case 'grant_access':
        updateData = {
          status: 'ACTIVE'
        };
        logMessage = `Администратор ${admin.name} предоставил доступ к курсу "${course.title}"${reason ? `. Причина: ${reason}` : ''}`;
        break;

      case 'revoke_access':
        updateData = {
          status: 'INACTIVE'
        };
        logMessage = `Администратор ${admin.name} отозвал доступ к курсу "${course.title}"${reason ? `. Причина: ${reason}` : ''}`;
        break;

      case 'mark_paid':
        updateData = {
          paymentStatus: 'PAID'
        };
        logMessage = `Администратор ${admin.name} отметил курс "${course.title}" как оплаченный${reason ? `. Причина: ${reason}` : ''}`;
        break;

      case 'mark_unpaid':
        updateData = {
          paymentStatus: 'PENDING'
        };
        logMessage = `Администратор ${admin.name} отметил курс "${course.title}" как неоплаченный${reason ? `. Причина: ${reason}` : ''}`;
        break;
    }

    // Обновить запись
    const updatedEnrollment = await prisma.enrollment.update({
      where: {
        userId_courseId: {
          userId: studentId,
          courseId: courseId
        }
      },
      data: updateData,
      include: {
        course: {
          select: {
            title: true
          }
        }
      }
    });

    // Создать уведомление для студента
    await prisma.notification.create({
      data: {
        userId: studentId,
        title: 'Изменение статуса курса',
        message: logMessage,
        type: 'admin_action'
      }
    });

    // Создать лог для аудита
    console.log(`ADMIN ACTION: ${logMessage}`);

    return NextResponse.json({
      success: true,
      enrollment: {
        id: updatedEnrollment.id,
        status: updatedEnrollment.status,
        paymentStatus: updatedEnrollment.paymentStatus,
        course: updatedEnrollment.course
      },
      message: 'Статус успешно обновлен'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Неверные данные', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Ошибка при обновлении доступа:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
