import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createLessonSchema = z.object({
  title: z.string().min(1, 'Название урока обязательно'),
  content: z.string().optional(),
  videoUrl: z.string().url().optional().or(z.literal('')),
  duration: z.number().min(0, 'Длительность не может быть отрицательной'),
  order: z.number().min(1, 'Порядок должен быть больше 0')
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

    // Создаем урок
    const lesson = await prisma.lesson.create({
      data: {
        title: validatedData.title,
        content: validatedData.content,
        videoUrl: validatedData.videoUrl || null,
        duration: validatedData.duration,
        order: validatedData.order,
        moduleId: (await params).id
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
