import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/assignments - получение только шаблонов заданий с фильтрацией
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    // Проверяем роль пользователя
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user || (user.role !== 'TEACHER' && user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Недостаточно прав для просмотра заданий' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') // поиск по названию
    const type = searchParams.get('type') // тип задания
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Строим фильтр для базы данных - ТОЛЬКО ШАБЛОНЫ
    const where: any = {
      isTemplate: true // Всегда только шаблоны
    }

    // Поиск по названию
    if (search) {
      where.title = {
        contains: search,
        mode: 'insensitive'
      }
    }

    // Фильтр по типу задания
    if (type) {
      where.type = type
    }

    // Получаем шаблоны заданий с пагинацией
    const [assignments, total] = await Promise.all([
      prisma.assignment.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          lesson: {
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
                      title: true
                    }
                  }
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
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.assignment.count({ where })
    ])

    return NextResponse.json({
      assignments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Ошибка получения шаблонов заданий:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
