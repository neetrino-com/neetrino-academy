import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET - получить лекцию по ID для студентов
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const lecture = await prisma.lecture.findUnique({
      where: { 
        id: params.id,
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
