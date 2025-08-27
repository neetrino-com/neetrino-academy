import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Схема валидации для обновления задания
const updateAssignmentSchema = z.object({
  title: z.string().min(1, 'Название обязательно').optional(),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
});

// GET /api/assignments/[id] - получение конкретного задания
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: params.id },
      include: {
        module: {
          include: {
            course: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        submissions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            submittedAt: 'desc'
          }
        },
        _count: {
          select: {
            submissions: true
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

    return NextResponse.json(assignment);
  } catch (error) {
    console.error('Ошибка при получении задания:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// PUT /api/assignments/[id] - обновление задания
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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
        { error: 'Недостаточно прав для редактирования заданий' },
        { status: 403 }
      );
    }

    // Проверяем существование задания
    const existingAssignment = await prisma.assignment.findUnique({
      where: { id: params.id }
    });

    if (!existingAssignment) {
      return NextResponse.json(
        { error: 'Задание не найдено' },
        { status: 404 }
      );
    }

    // Проверяем, что пользователь является создателем задания или админом
    if (existingAssignment.createdBy !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Недостаточно прав для редактирования этого задания' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateAssignmentSchema.parse(body);

    // Обновляем задание
    const assignment = await prisma.assignment.update({
      where: { id: params.id },
      data: {
        title: validatedData.title,
        description: validatedData.description,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
      },
      include: {
        module: {
          include: {
            course: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(assignment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ошибка валидации', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Ошибка при обновлении задания:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// DELETE /api/assignments/[id] - удаление задания
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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
        { error: 'Недостаточно прав для удаления заданий' },
        { status: 403 }
      );
    }

    // Проверяем существование задания
    const existingAssignment = await prisma.assignment.findUnique({
      where: { id: params.id }
    });

    if (!existingAssignment) {
      return NextResponse.json(
        { error: 'Задание не найдено' },
        { status: 404 }
      );
    }

    // Проверяем, что пользователь является создателем задания или админом
    if (existingAssignment.createdBy !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Недостаточно прав для удаления этого задания' },
        { status: 403 }
      );
    }

    // Удаляем задание (каскадно удалятся и сдачи)
    await prisma.assignment.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Задание успешно удалено' });
  } catch (error) {
    console.error('Ошибка при удалении задания:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
