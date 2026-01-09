import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// POST /api/courses/[id]/request-access - запрос временного доступа
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { id: courseId } = await params;
    const { reason } = await request.json();

    // Найти пользователя
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    // Проверить что пользователь записан на курс
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
            title: true
          }
        }
      }
    });

    if (!enrollment) {
      return NextResponse.json({ error: 'Вы не записаны на этот курс' }, { status: 400 });
    }

    // Создать уведомление для администраторов
    const admins = await prisma.user.findMany({
      where: {
        role: {
          in: ['ADMIN', 'TEACHER']
        }
      }
    });

    const notificationPromises = admins.map(admin =>
      prisma.notification.create({
        data: {
          userId: admin.id,
          title: 'Запрос временного доступа к курсу',
          message: `Студент ${user.name} (${user.email}) запрашивает временный доступ к курсу "${enrollment.course.title}". Причина: ${reason || 'Не указана'}`,
          type: 'NEW_MESSAGE',
          data: JSON.stringify({
            studentId: user.id,
            studentName: user.name,
            studentEmail: user.email,
            courseId: courseId,
            courseName: enrollment.course.title,
            reason: reason
          })
        }
      })
    );

    await Promise.all(notificationPromises);

    return NextResponse.json({
      success: true,
      message: 'Запрос отправлен администратору'
    });

  } catch (error) {
    console.error('Ошибка при отправке запроса доступа:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
