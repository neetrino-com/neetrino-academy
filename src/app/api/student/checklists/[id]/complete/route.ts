import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: checklistId } = await params;
    const userId = session.user.id;

    // Получаем чеклист с группами и элементами
    const checklist = await prisma.checklist.findUnique({
      where: { id: checklistId },
      include: {
        groups: {
          include: {
            items: true
          }
        }
      }
    });

    if (!checklist) {
      return NextResponse.json({ error: 'Checklist not found' }, { status: 404 });
    }

    // Получаем или создаем прогресс по чеклисту
    let checklistProgress = await prisma.checklistProgress.findUnique({
      where: {
        userId_checklistId: {
          userId,
          checklistId
        }
      },
      include: {
      }
    });

    if (!checklistProgress) {
      // Создаем новый прогресс
      checklistProgress = await prisma.checklistProgress.create({
        data: {
          userId,
          checklistId
        }
      });
      
      // Создаем прогресс по пунктам отдельно
      const itemProgressData = checklist.groups.flatMap(group =>
        group.items.map(item => ({
          userId,
          itemId: item.id,
          status: 'NOT_COMPLETED' as const
        }))
      );
      
      if (itemProgressData.length > 0) {
        await prisma.checklistItemProgress.createMany({
          data: itemProgressData
        });
      }
    }

    // Получаем прогресс по пунктам
    const itemProgressList = await prisma.checklistItemProgress.findMany({
      where: {
        userId,
        itemId: { in: checklist.groups.flatMap(group => group.items.map(item => item.id)) }
      }
    });
    
    // Подсчитываем общее количество пунктов и выполненных
    const totalItems = checklist.groups.reduce((sum, group) => sum + group.items.length, 0);
    const completedItems = itemProgressList.filter(ip => ip.status === 'COMPLETED').length;
    const completionPercentage = Math.round((completedItems / totalItems) * 100);

    // Проверяем, завершен ли чеклист (все пункты выполнены)
    const isCompleted = completedItems === totalItems;

    if (isCompleted) {
      // Создаем уведомление о завершении
      await prisma.notification.create({
        data: {
          userId,
          type: 'NEW_MESSAGE',
          title: `Чеклист завершен: ${checklist.title}`,
          message: `Поздравляем! Вы успешно завершили чеклист "${checklist.title}" по направлению "${checklist.direction}"`,
          data: JSON.stringify({
            checklistId,
            checklistTitle: checklist.title,
            direction: checklist.direction,
            completionPercentage,
            completedAt: new Date().toISOString()
          }),
          isRead: false
        }
      });

      // Обновляем прогресс чеклиста
      await prisma.checklistProgress.update({
        where: {
          userId_checklistId: {
            userId,
            checklistId
          }
        },
        data: {
          completedAt: new Date(),
          progress: completionPercentage
        }
      });
    }

    return NextResponse.json({
      success: true,
      isCompleted,
      completionPercentage,
      completedItems,
      totalItems,
      message: isCompleted 
        ? 'Чеклист успешно завершен!' 
        : `Прогресс: ${completedItems}/${totalItems} пунктов`
    });
  } catch (error) {
    console.error('Error completing checklist:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
