import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Получаем все чеклисты с базовой информацией
    const checklists = await prisma.checklist.findMany({
      include: {
        groups: {
          include: {
            items: true
          }
        },
        _count: {
          select: {
            progress: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Получаем общую статистику по прогрессу
    const totalProgress = await prisma.checklistProgress.count();
    const totalItemProgress = await prisma.checklistItemProgress.count();

    // Анализируем данные
    const analytics = {
      overview: {
        totalChecklists: checklists.length,
        totalGroups: checklists.reduce((sum, c) => sum + c.groups.length, 0),
        totalItems: checklists.reduce((sum, c) => 
          sum + c.groups.reduce((gSum, g) => gSum + g.items.length, 0), 0
        ),
        totalStudents: totalProgress,
        totalItemProgress: totalItemProgress
      },
      checklists: checklists.map(checklist => {
        const totalItems = checklist.groups.reduce((sum, group) => sum + group.items.length, 0);
        const totalGroups = checklist.groups.length;
        
        return {
          id: checklist.id,
          title: checklist.title,
          direction: checklist.direction,
          totalGroups,
          totalItems,
          studentCount: checklist._count.progress,
          createdAt: checklist.createdAt,
          updatedAt: checklist.updatedAt
        };
      }),
      directions: (() => {
        const directionStats = checklists.reduce((acc, checklist) => {
          if (!acc[checklist.direction]) {
            acc[checklist.direction] = {
              direction: checklist.direction,
              checklistCount: 0,
              totalGroups: 0,
              totalItems: 0,
              totalStudents: 0
            };
          }
          
          acc[checklist.direction].checklistCount++;
          acc[checklist.direction].totalGroups += checklist.groups.length;
          acc[checklist.direction].totalItems += checklist.groups.reduce((sum, g) => sum + g.items.length, 0);
          acc[checklist.direction].totalStudents += checklist._count.progress;
          
          return acc;
        }, {} as Record<string, any>);

        return Object.values(directionStats).sort((a: any, b: any) => b.checklistCount - a.checklistCount);
      })(),
      recentActivity: (() => {
        const allProgress = checklists.flatMap(c => 
          Array(c._count.progress).fill(null).map(() => ({
            checklistId: c.id,
            checklistTitle: c.title,
            direction: c.direction,
            updatedAt: c.updatedAt
          }))
        );
        
        return allProgress
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 10);
      })(),
      performance: {
        mostPopularChecklist: (() => {
          if (checklists.length === 0) return null;
          return checklists.reduce((max, current) => 
            current._count.progress > max._count.progress ? current : max
          );
        })(),
        mostComprehensiveChecklist: (() => {
          if (checklists.length === 0) return null;
          return checklists.reduce((max, current) => {
            const currentItems = current.groups.reduce((sum, g) => sum + g.items.length, 0);
            const maxItems = max.groups.reduce((sum, g) => sum + g.items.length, 0);
            return currentItems > maxItems ? current : max;
          });
        })(),
        averageItemsPerChecklist: checklists.length > 0 
          ? Math.round(
              checklists.reduce((sum, c) => 
                sum + c.groups.reduce((gSum, g) => gSum + g.items.length, 0), 0
              ) / checklists.length
            )
          : 0,
        averageGroupsPerChecklist: checklists.length > 0
          ? Math.round(
              checklists.reduce((sum, c) => sum + c.groups.length, 0) / checklists.length
            )
          : 0
      }
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching checklists analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
