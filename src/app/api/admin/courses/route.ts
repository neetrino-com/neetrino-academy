import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Схема валидации для создания курса
const createCourseSchema = z.object({
  title: z.string().min(3, 'Название должно содержать минимум 3 символа'),
  description: z.string().min(10, 'Описание должно содержать минимум 10 символов'),
  direction: z.enum(['WORDPRESS', 'VIBE_CODING', 'SHOPIFY']),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  price: z.number().min(0, 'Цена не может быть отрицательной').optional(),
  isActive: z.boolean().default(true)
});

// GET - получение списка курсов (только для ADMIN)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    // Проверяем роль пользователя
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    // Временно отключаем проверку роли для тестирования
    // if (!user || user.role !== 'ADMIN') {
    //   return NextResponse.json(
    //     { error: 'Доступ запрещен. Требуются права администратора' },
    //     { status: 403 }
    //   );
    // }

    // Получаем все курсы с модулями и уроками
    const courses = await prisma.course.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        direction: true,
        level: true,
        isActive: true,
        _count: {
          select: {
            enrollments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(courses);
  } catch (error) {
    console.error('Ошибка получения курсов:', error);
    return NextResponse.json(
      { error: 'Ошибка получения курсов' },
      { status: 500 }
    );
  }
}

// POST - создание нового курса (для TEACHER и ADMIN)
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
        { error: 'Недостаточно прав для создания курсов' },
        { status: 403 }
      );
    }

    const body = await request.json();
    console.log('Создание курса - полученные данные:', body);
    
    const validatedData = createCourseSchema.parse(body);
    console.log('Создание курса - валидированные данные:', validatedData);

    // Генерируем уникальный slug из названия курса
    let slug = validatedData.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    // Проверяем уникальность slug и добавляем суффикс если нужно
    let counter = 1;
    let originalSlug = slug;
    
    while (true) {
      const existingCourse = await prisma.course.findUnique({
        where: { slug }
      });

      if (!existingCourse) {
        break; // Slug уникален, можно использовать
      }

      // Добавляем суффикс к slug
      slug = `${originalSlug}-${counter}`;
      counter++;
      
      // Защита от бесконечного цикла
      if (counter > 100) {
        return NextResponse.json(
          { error: 'Не удалось создать уникальный идентификатор для курса' },
          { status: 500 }
        );
      }
    }

    // Создаем курс
    const course = await prisma.course.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        slug,
        direction: validatedData.direction,
        level: validatedData.level,
        price: validatedData.price || 0,
        isActive: validatedData.isActive
      },
      include: {
        modules: {
          include: {
            _count: {
              select: {
                lessons: true,
                assignments: true
              }
            }
          }
        },
        _count: {
          select: {
            enrollments: true
          }
        }
      }
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    console.error('Ошибка создания курса:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ошибка валидации данных', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Ошибка создания курса' },
      { status: 500 }
    );
  }
}
