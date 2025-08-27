import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Схема валидации для отправки решения
const submitAssignmentSchema = z.object({
  content: z.string().optional(),
  fileUrl: z.string().url().optional(),
}).refine(data => data.content || data.fileUrl, {
  message: 'Необходимо предоставить текст или файл'
});

// POST /api/assignments/[id]/submit - отправка решения задания
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    // Получаем пользователя
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Проверяем существование задания
    const assignment = await prisma.assignment.findUnique({
      where: { id: params.id },
      include: {
        module: {
          include: {
            course: true
          }
        }
      }
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Задание не найдено' },
        { status: 404 }
      );
    }

    // Проверяем, записан ли пользователь на курс
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: assignment.module.course.id
        }
      }
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: 'Вы не записаны на этот курс' },
        { status: 403 }
      );
    }

    // Проверяем дедлайн
    if (assignment.dueDate && new Date() > assignment.dueDate) {
      return NextResponse.json(
        { error: 'Срок сдачи задания истек' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = submitAssignmentSchema.parse(body);

    // Проверяем, не отправлял ли пользователь уже решение
    const existingSubmission = await prisma.submission.findFirst({
      where: {
        userId: user.id,
        assignmentId: params.id
      }
    });

    if (existingSubmission) {
      return NextResponse.json(
        { error: 'Вы уже отправили решение для этого задания' },
        { status: 400 }
      );
    }

    // Создаем сдачу
    const submission = await prisma.submission.create({
      data: {
        userId: user.id,
        assignmentId: params.id,
        content: validatedData.content,
        fileUrl: validatedData.fileUrl,
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
            module: {
              include: {
                course: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ошибка валидации', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Ошибка при отправке решения:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
