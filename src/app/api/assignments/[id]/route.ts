import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

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
        lesson: {
          include: {
            module: {
              include: {
                course: true
              }
            }
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
        groupAssignments: {
          include: {
            group: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            submissions: true,
            groupAssignments: true
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

// PUT /api/assignments/[id] - редактирование задания
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

    const body = await request.json();
    const { title, description, dueDate, lessonId, type, maxScore } = body;

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

    // Обновляем задание
    const updatedAssignment = await prisma.assignment.update({
      where: { id: params.id },
      data: {
        title: title || existingAssignment.title,
        description: description !== undefined ? description : existingAssignment.description,
        dueDate: dueDate ? new Date(dueDate) : existingAssignment.dueDate,
        lessonId: lessonId || existingAssignment.lessonId,
        type: type || existingAssignment.type,
        maxScore: maxScore !== undefined ? (maxScore ? parseInt(maxScore.toString()) : null) : existingAssignment.maxScore,
      },
      include: {
        lesson: {
          include: {
            module: {
              include: {
                course: true
              }
            }
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

    return NextResponse.json(updatedAssignment);
  } catch (error) {
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

    // Удаляем задание (каскадно удалятся и все сдачи)
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
