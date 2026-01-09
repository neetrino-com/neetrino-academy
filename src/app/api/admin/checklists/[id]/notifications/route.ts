import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Получение уведомлений по чеклисту
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const checklistId = resolvedParams.id;

    // Получаем ID пользователей, которые имеют прогресс по этому чеклисту
    const progress = await prisma.checklistProgress.findMany({
      where: { checklistId },
      select: { userId: true }
    });
    const userIds = progress.map(p => p.userId);

    // Получаем уведомления для этих пользователей и фильтруем по checklistId в data
    const allNotifications = await prisma.notification.findMany({
      where: {
        userId: { in: userIds }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Фильтруем уведомления, которые относятся к этому чеклисту
    const notifications = allNotifications.filter(notif => {
      if (!notif.data) return false;
      try {
        const data = typeof notif.data === 'string' ? JSON.parse(notif.data) : notif.data;
        return data.checklistId === checklistId;
      } catch {
        return false;
      }
    });

    return NextResponse.json(notifications);
  } catch (error: unknown) {
    console.error('Error fetching checklist notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Создание уведомления о завершении чеклиста
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const checklistId = resolvedParams.id;
    const { userId, message } = await request.json();

    // Проверяем существование чеклиста и пользователя
    const [checklist, user] = await Promise.all([
      prisma.checklist.findUnique({ where: { id: checklistId } }),
      prisma.user.findUnique({ where: { id: userId } })
    ]);

    if (!checklist || !user) {
      return NextResponse.json({ error: 'Checklist or user not found' }, { status: 404 });
    }

    // Создаем уведомление
    const notification = await prisma.notification.create({
      data: {
        userId,
        type: 'NEW_MESSAGE', // Используем существующий тип
        title: `Чеклист: ${checklist.title}`,
        message: message || `Вы успешно завершили чеклист "${checklist.title}"`,
        data: JSON.stringify({
          checklistId,
          checklistTitle: checklist.title,
          direction: checklist.direction
        }),
        isRead: false
      }
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating checklist notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
