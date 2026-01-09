import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

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

    // Получаем чеклист с группами и элементами
    const checklist = await prisma.checklist.findUnique({
      where: { id: checklistId },
      include: {
        groups: {
          include: {
            items: true
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!checklist) {
      return NextResponse.json({ error: 'Checklist not found' }, { status: 404 });
    }

    // Получаем прогресс всех студентов по этому чеклисту
    const progress = await prisma.checklistProgress.findMany({
      where: { checklistId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    // Получаем ID всех элементов чеклиста
    const itemIds = checklist.groups.flatMap(group => group.items.map(item => item.id));

    // Получаем прогресс по элементам для всех студентов
    const userIds = progress.map(p => p.userId);
    const itemProgress = await prisma.checklistItemProgress.findMany({
      where: {
        userId: { in: userIds },
        itemId: { in: itemIds }
      },
      include: {
        item: {
          select: {
            id: true,
            title: true,
            groupId: true
          }
        }
      }
    });

    // Группируем itemProgress по userId
    const itemProgressByUser = itemProgress.reduce((acc, ip) => {
      if (!acc[ip.userId]) {
        acc[ip.userId] = [];
      }
      acc[ip.userId].push(ip);
      return acc;
    }, {} as Record<string, typeof itemProgress>);

    // Анализируем данные
    const analytics = {
      checklist: {
        id: checklist.id,
        title: checklist.title,
        direction: checklist.direction,
        totalGroups: checklist.groups.length,
        totalItems: checklist.groups.reduce((sum, group) => sum + group.items.length, 0)
      },
      studentProgress: progress.map(p => {
        const userItemProgress = itemProgressByUser[p.userId] || [];
        const totalItems = checklist.groups.reduce((sum, group) => sum + group.items.length, 0);
        const completedItems = userItemProgress.filter(ip => ip.status === 'COMPLETED').length;
        
        return {
          userId: p.user.id,
          userName: p.user.name,
          userEmail: p.user.email,
          userRole: p.user.role,
          completedItems,
          totalItems,
          completionPercentage: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
          lastUpdated: p.completedAt || p.startedAt
        };
      }),
      groupAnalytics: checklist.groups.map(group => {
        const groupProgress = itemProgress.filter(ip => ip.item.groupId === group.id);
        
        const statusCounts = {
          COMPLETED: groupProgress.filter(ip => ip.status === 'COMPLETED').length,
          NOT_COMPLETED: groupProgress.filter(ip => ip.status === 'NOT_COMPLETED').length,
          NOT_NEEDED: groupProgress.filter(ip => ip.status === 'NOT_NEEDED').length,
          HAS_QUESTIONS: groupProgress.filter(ip => ip.status === 'HAS_QUESTIONS').length
        };

        return {
          groupId: group.id,
          groupTitle: group.title,
          totalItems: group.items.length,
          statusCounts,
          completionRate: Math.round(
            (statusCounts.COMPLETED / group.items.length) * 100
          )
        };
      }),
      overallStats: {
        totalStudents: progress.length,
        averageCompletion: progress.length > 0 
          ? Math.round(
              progress.reduce((sum, p) => {
                const userItemProgress = itemProgressByUser[p.userId] || [];
                const completed = userItemProgress.filter(ip => ip.status === 'COMPLETED').length;
                const total = checklist.groups.reduce((sum, group) => sum + group.items.length, 0);
                return sum + (total > 0 ? completed / total : 0);
              }, 0) / progress.length * 100
            )
          : 0,
        mostCompletedGroup: (() => {
          const groupStats = checklist.groups.map(group => {
            const groupProgress = itemProgress.filter(ip => ip.item.groupId === group.id);
            const completed = groupProgress.filter(ip => ip.status === 'COMPLETED').length;
            const total = group.items.length;
            return {
              groupId: group.id,
              groupTitle: group.title,
              completionRate: total > 0 ? (completed / total) * 100 : 0
            };
          });
          return groupStats.reduce((max, current) => 
            current.completionRate > max.completionRate ? current : max
          );
        })(),
        leastCompletedGroup: (() => {
          const groupStats = checklist.groups.map(group => {
            const groupProgress = itemProgress.filter(ip => ip.item.groupId === group.id);
            const completed = groupProgress.filter(ip => ip.status === 'COMPLETED').length;
            const total = group.items.length;
            return {
              groupId: group.id,
              groupTitle: group.title,
              completionRate: total > 0 ? (completed / total) * 100 : 0
            };
          });
          return groupStats.reduce((min, current) => 
            current.completionRate < min.completionRate ? current : min
          );
        })()
      }
    };

    return NextResponse.json(analytics);
  } catch (error: unknown) {
    console.error('Error fetching checklist analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
