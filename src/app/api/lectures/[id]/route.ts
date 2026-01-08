import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET - получить лекцию по ID для студентов
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const lecture = await prisma.lecture.findUnique({
      where: { 
        id,
        isActive: true // Только активные лекции
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        lessons: {
          select: {
            id: true,
            title: true,
            module: {
              select: {
                id: true,
                title: true,
                course: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            lessons: true,
          },
        },
      },
    });

    if (!lecture) {
      return NextResponse.json({ error: 'Lecture not found' }, { status: 404 });
    }

    // Проверяем доступ к лекции через уроки
    const userId = session.user.id;
    let hasAccess = false;

    // Проверяем, есть ли у пользователя доступ к любому из уроков, связанных с лекцией
    for (const lesson of lecture.lessons) {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: userId,
            courseId: lesson.module.course.id
          }
        }
      });

      if (enrollment) {
        hasAccess = true;
        break;
      }
    }

    // Если лекция не связана с уроками, разрешаем доступ всем авторизованным пользователям
    if (lecture.lessons.length === 0) {
      hasAccess = true;
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Парсим JSON контент
    let parsedContent;
    try {
      parsedContent = JSON.parse(lecture.content);
    } catch (error) {
      console.error('Error parsing lecture content:', error);
      parsedContent = [];
    }

    const parsedLecture = {
      ...lecture,
      content: parsedContent,
    };

    return NextResponse.json({ lecture: parsedLecture });
  } catch (error) {
    console.error('Error fetching lecture:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
