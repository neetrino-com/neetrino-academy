import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Схема валидации для оценки
const gradeSubmissionSchema = z.object({
  score: z.number().min(0).max(100, 'Оценка должна быть от 0 до 100'),
  feedback: z.string().optional(),
});

// POST /api/submissions/[id]/grade - оценка сданного задания
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    // Проверяем роль пользователя
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user || (user.role !== 'TEACHER' && user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Недостаточно прав для оценки заданий' },
        { status: 403 }
      );
    }

    const { id } = await params;
    // Проверяем существование сдачи
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        assignment: {
          include: {
            lesson: {
              include: {
                module: {
                  include: {
                    course: true
                  }
                }
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!submission) {
      return NextResponse.json(
        { error: 'Сдача не найдена' },
        { status: 404 }
      );
    }

    // Проверяем, что преподаватель имеет право оценивать это задание
    if (submission.assignment.createdBy !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Недостаточно прав для оценки этого задания' },
        { status: 403 }
      );
    }

    // Проверяем, не оценено ли уже задание
    if (submission.score !== null) {
      return NextResponse.json(
        { error: 'Задание уже оценено' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = gradeSubmissionSchema.parse(body);

    // Обновляем сдачу с оценкой
    const updatedSubmission = await prisma.submission.update({
      where: { id },
      data: {
        score: validatedData.score,
        feedback: validatedData.feedback,
        gradedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignment: {
          include: {
            lesson: {
              include: {
                module: {
                  include: {
                    course: true
                  }
                }
              }
            }
          }
        }
      }
    });

    return NextResponse.json(updatedSubmission);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ошибка валидации', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Ошибка при оценке задания:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
