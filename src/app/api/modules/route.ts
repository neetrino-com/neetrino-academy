import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/modules - получение списка модулей
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    const whereClause: {
      courseId?: string;
    } = {};

    // Фильтрация по курсу
    if (courseId) {
      whereClause.courseId = courseId;
    }

    const modules = await prisma.module.findMany({
      where: whereClause,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        },
        _count: {
          select: {
            lessons: true,
            assignments: true
          }
        }
      },
      orderBy: {
        order: 'asc'
      }
    });

    return NextResponse.json(modules);
  } catch (error) {
    console.error('Ошибка при получении модулей:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
