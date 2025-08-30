import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/auth/me - получение информации о текущем пользователе
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    console.log('Auth session:', session?.user?.email);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    console.log('Fetching user data for:', session.user.email);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        // Расширенная информация профиля
        age: true,
        gender: true,
        phone: true,
        address: true,
        city: true,
        country: true,
        telegram: true,
        instagram: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            enrollments: true,
            assignments: true,
            submissions: true,
            lessonProgress: true,
            quizAttempts: true,
            payments: true
          }
        }
      }
    });

    console.log('User found:', !!user);

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Ошибка при получении информации о пользователе:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
