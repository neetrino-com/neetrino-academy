import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Получение уведомлений по чеклисту
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const checklistId = params.id;

    // Получаем уведомления по чеклисту
    const notifications = await prisma.notification.findMany({
      where: {
        type: 'CHECKLIST_COMPLETION',
        metadata: {
          path: ['checklistId'],
          equals: checklistId
        }
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

    return NextResponse.json(notifications);
  } catch (error) {
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const checklistId = params.id;
    const { userId, message, type = 'CHECKLIST_COMPLETION' } = await request.json();

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
        type,
        title: `Чеклист: ${checklist.title}`,
        message: message || `Вы успешно завершили чеклист "${checklist.title}"`,
        metadata: {
          checklistId,
          checklistTitle: checklist.title,
          direction: checklist.direction
        },
        isRead: false
      }
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error('Error creating checklist notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
