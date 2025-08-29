import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET - получить простой список лекций для выбора
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || !['ADMIN', 'TEACHER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const isActive = searchParams.get('isActive') !== 'false'; // По умолчанию только активные

    const where = {
      isActive,
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const lectures = await prisma.lecture.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        thumbnail: true,
        createdAt: true,
        _count: {
          select: {
            lessons: true,
          },
        },
      },
      orderBy: { title: 'asc' },
    });

    return NextResponse.json(lectures);
  } catch (error) {
    console.error('Error fetching lectures list:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
