import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Схема валидации для создания задания
const createAssignmentSchema = z.object({
  title: z.string().min(1, 'Название обязательно'),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  moduleId: z.string().min(1, 'ID модуля обязателен'),
});

// GET /api/assignments - получение списка заданий
export async function GET(request: NextRequest) {
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
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get('moduleId');
    const courseId = searchParams.get('courseId');

    const whereClause: Record<string, any> = {};

    // Фильтрация по модулю
    if (moduleId) {
      whereClause.moduleId = moduleId;
    }

    // Фильтрация по курсу
    if (courseId) {
      whereClause.module = {
        courseId: courseId
      };
    }

    // Если пользователь студент, показываем только задания для курсов, на которые он подписан
    if (user.role === 'STUDENT') {
      // Получаем курсы, на которые подписан пользователь
      const enrollments = await prisma.enrollment.findMany({
        where: { userId: user.id },
        select: { courseId: true }
      });

      const enrolledCourseIds = enrollments.map(e => e.courseId);

      whereClause.module = {
        ...whereClause.module,
        courseId: {
          in: enrolledCourseIds
        }
      };
    }

    const assignments = await prisma.assignment.findMany({
      where: whereClause,
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
          }
        },
        _count: {
          select: {
            submissions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error('Ошибка при получении заданий:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// POST /api/assignments - создание нового задания
export async function POST(request: NextRequest) {
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
        { error: 'Недостаточно прав для создания заданий' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createAssignmentSchema.parse(body);

    // Проверяем существование модуля
    const moduleData = await prisma.module.findUnique({
      where: { id: validatedData.moduleId }
    });

    if (!moduleData) {
      return NextResponse.json(
        { error: 'Модуль не найден' },
        { status: 404 }
      );
    }

    // Создаем задание
    const assignment = await prisma.assignment.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        moduleId: validatedData.moduleId,
        createdBy: user.id,
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

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ошибка валидации', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Ошибка при создании задания:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
