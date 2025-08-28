import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createModuleSchema = z.object({
  title: z.string().min(1, 'Название модуля обязательно'),
  description: z.string().optional(),
  order: z.number().min(1, 'Порядок должен быть больше 0')
})

// GET /api/admin/courses/[id]/modules - получение модулей курса
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { error: 'Недостаточно прав для просмотра модулей' },
        { status: 403 }
      )
    }

    // Проверяем существование курса
    const course = await prisma.course.findUnique({
      where: { id: params.id }
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Курс не найден' },
        { status: 404 }
      )
    }

    // Получаем модули курса
    const modules = await prisma.module.findMany({
      where: { courseId: params.id },
      orderBy: { order: 'asc' }
    })

    return NextResponse.json(modules)
  } catch (error) {
    console.error('Ошибка получения модулей:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// POST /api/admin/courses/[id]/modules - создание нового модуля
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { error: 'Недостаточно прав для создания модулей' },
        { status: 403 }
      )
    }

    // Проверяем существование курса
    const course = await prisma.course.findUnique({
      where: { id: params.id }
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Курс не найден' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = createModuleSchema.parse(body)

    // Создаем модуль
    const module = await prisma.module.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        order: validatedData.order,
        courseId: params.id
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        }
      }
    })

    return NextResponse.json(module, { status: 201 })
  } catch (error) {
    console.error('Ошибка создания модуля:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Неверные данные', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
