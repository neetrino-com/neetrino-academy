import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createLessonSchema = z.object({
  title: z.string().min(1, 'Название урока обязательно'),
  description: z.string().optional(),
  content: z.string().optional(), // JSON блоки контента
  thumbnail: z.string().optional(),
  duration: z.number().optional().nullable(),
  isActive: z.boolean().default(true),
  order: z.number().optional(),
  lectureId: z.string().optional(),
  checklistId: z.string().optional()
})

// GET /api/admin/modules/[id]/lessons - получение уроков модуля
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
        { error: 'Недостаточно прав для просмотра уроков' },
        { status: 403 }
      )
    }

    // Проверяем существование модуля
    const module = await prisma.module.findUnique({
      where: { id: (await params).id }
    })

    if (!module) {
      return NextResponse.json(
        { error: 'Модуль не найден' },
        { status: 404 }
      )
    }

    // Получаем уроки модуля
    const lessons = await prisma.lesson.findMany({
      where: { moduleId: (await params).id },
      include: {
        lecture: {
          select: {
            id: true,
            title: true,
            description: true
          }
        }
      },
      orderBy: { order: 'asc' }
    })

    return NextResponse.json(lessons)
  } catch (error) {
    console.error('Ошибка получения уроков:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// POST /api/admin/modules/[id]/lessons - создание нового урока
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
        { error: 'Недостаточно прав для создания уроков' },
        { status: 403 }
      )
    }

    // Проверяем существование модуля
    const module = await prisma.module.findUnique({
      where: { id: (await params).id },
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

    if (!module) {
      return NextResponse.json(
        { error: 'Модуль не найден' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = createLessonSchema.parse(body)

    // Автоматически определяем порядок урока если не указан
    let order = validatedData.order
    if (!order) {
      const lastLesson = await prisma.lesson.findFirst({
        where: { moduleId: (await params).id },
        orderBy: { order: 'desc' }
      })
      order = (lastLesson?.order || 0) + 1
    }

    // Создаем урок
    const lesson = await prisma.lesson.create({
      data: {
        title: validatedData.title,
        description: validatedData.description || null,
        content: validatedData.content || null,
        thumbnail: validatedData.thumbnail || null,
        duration: validatedData.duration,
        isActive: validatedData.isActive,
        order: order,
        moduleId: (await params).id,
        lectureId: validatedData.lectureId || null,
        checklistId: validatedData.checklistId || null
      },
      include: {
        module: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                slug: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(lesson, { status: 201 })
  } catch (error) {
    console.error('Ошибка создания урока:', error)
    
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
