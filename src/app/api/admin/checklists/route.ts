import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Схема валидации для создания чеклиста
const createChecklistSchema = z.object({
  title: z.string().min(1, 'Название обязательно'),
  description: z.string().optional(),
  direction: z.enum(['WORDPRESS', 'VIBE_CODING', 'SHOPIFY']),
  thumbnail: z.string().optional(),
  isActive: z.boolean().default(true),
  groups: z.array(z.object({
    title: z.string().min(1, 'Название группы обязательно'),
    description: z.string().optional(),
    order: z.number(),
    isCollapsed: z.boolean().default(false),
    items: z.array(z.object({
      title: z.string().min(1, 'Название пункта обязательно'),
      description: z.string().optional(),
      order: z.number(),
      isRequired: z.boolean().default(true),
    }))
  })).optional()
})

// GET /api/admin/checklists - получить список чеклистов
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || !['ADMIN', 'TEACHER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Недостаточно прав доступа' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const direction = searchParams.get('direction') || ''
    const isActive = searchParams.get('isActive')

    const skip = (page - 1) * limit

    // Построение условий фильтрации
    const where: {
      OR?: Array<{
        title?: { contains: string; mode: 'insensitive' };
        description?: { contains: string; mode: 'insensitive' };
      }>;
      direction?: string;
      isActive?: boolean;
    } = {}
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (direction) {
      where.direction = direction
    }
    
    if (isActive !== null && isActive !== '') {
      where.isActive = isActive === 'true'
    }

    // Подсчет общего количества
    const total = await prisma.checklist.count({ where })

    // Получение чеклистов с пагинацией
    const checklists = await prisma.checklist.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        groups: {
          include: {
            _count: {
              select: { items: true }
            }
          }
        },
        _count: {
          select: {
            lessons: true,
            progress: true
          }
        }
      }
    })

    const pagination = {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }

    return NextResponse.json({
      checklists,
      pagination
    })

  } catch (error) {
    console.error('Ошибка получения чеклистов:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// POST /api/admin/checklists - создать новый чеклист
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || !['ADMIN', 'TEACHER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Недостаточно прав доступа' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createChecklistSchema.parse(body)

    // Создание чеклиста с группами и пунктами
    const checklist = await prisma.checklist.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        direction: validatedData.direction,
        thumbnail: validatedData.thumbnail,
        isActive: validatedData.isActive,
        createdBy: session.user.id,
        groups: validatedData.groups ? {
          create: validatedData.groups.map(group => ({
            title: group.title,
            description: group.description,
            order: group.order,
            isCollapsed: group.isCollapsed,
            items: {
              create: group.items.map(item => ({
                title: item.title,
                description: item.description,
                order: item.order,
                isRequired: item.isRequired
              }))
            }
          }))
        } : undefined
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        groups: {
          include: {
            items: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Чеклист успешно создан',
      checklist
    }, { status: 201 })

  } catch (error) {
    console.error('Ошибка создания чеклиста:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ошибка валидации', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
