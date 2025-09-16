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

// GET /api/assignments/templates - получение всех шаблонов заданий
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

    // Получаем все шаблоны заданий
    const templates = await prisma.assignment.findMany({
      where: { 
        isTemplate: true 
      },
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
            groupAssignments: true // Сколько раз использовался шаблон
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error('Ошибка получения шаблонов:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
