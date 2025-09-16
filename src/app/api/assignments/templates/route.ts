import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createTemplateSchema = z.object({
  title: z.string().min(1, 'Название шаблона обязательно'),
  description: z.string().optional(),
  type: z.enum(['HOMEWORK', 'PROJECT', 'EXAM', 'QUIZ', 'PRACTICAL', 'ESSAY', 'OTHER']).default('HOMEWORK'),
  maxScore: z.number().min(1, 'Максимальный балл должен быть больше 0').default(100)
})

// POST /api/assignments/templates - создание шаблона задания
export async function POST(request: NextRequest) {
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
        { error: 'Недостаточно прав для создания шаблонов' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createTemplateSchema.parse(body)

    // Создаем шаблон задания
    const template = await prisma.assignment.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        type: validatedData.type,
        maxScore: validatedData.maxScore,
        isTemplate: true, // Это шаблон
        templateId: null, // Шаблоны не имеют templateId
        createdBy: user.id
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('Ошибка создания шаблона:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ошибка валидации', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// GET /api/assignments/templates - получение шаблонов заданий с пагинацией и фильтрацией
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
        { error: 'Недостаточно прав для просмотра шаблонов' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || ''

    const skip = (page - 1) * limit

    // Строим условия фильтрации
    const where: Record<string, any> = { 
      isTemplate: true 
    }

    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          id: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ]
    }

    if (type && type !== 'ALL') {
      where.type = type
    }

    // Получаем общее количество шаблонов
    const total = await prisma.assignment.count({ where })

    // Получаем шаблоны с пагинацией
    const templates = await prisma.assignment.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            groupAssignments: true, // Сколько раз использовался шаблон
            submissions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    })

    return NextResponse.json({
      templates,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('Ошибка получения шаблонов:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
