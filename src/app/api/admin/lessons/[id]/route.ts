import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateLessonSchema = z.object({
  title: z.string().min(1, 'Название урока обязательно'),
  description: z.string().optional().nullable(),
  content: z.string().optional().nullable(), // JSON блоки контента
  thumbnail: z.string().optional().nullable(),
  duration: z.number().optional().nullable(),
  isActive: z.boolean().default(true),
  order: z.number().optional(),
  lectureId: z.string().optional().nullable(),
  checklistId: z.string().optional().nullable()
})

// GET /api/admin/lessons/[id] - получение урока
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
        { error: 'Недостаточно прав' },
        { status: 403 }
      )
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id: (await params).id },
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
        },
        lecture: true,
        checklist: true
      }
    })

    if (!lesson) {
      return NextResponse.json(
        { error: 'Урок не найден' },
        { status: 404 }
      )
    }

    return NextResponse.json(lesson)
  } catch (error) {
    console.error('Ошибка получения урока:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/lessons/[id] - обновление урока
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
        { error: 'Недостаточно прав для редактирования уроков' },
        { status: 403 }
      )
    }

    // Проверяем существование урока
    const existingLesson = await prisma.lesson.findUnique({
      where: { id: (await params).id }
    })

    if (!existingLesson) {
      return NextResponse.json(
        { error: 'Урок не найден' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = updateLessonSchema.parse(body)

    // Обновляем урок
    const lesson = await prisma.lesson.update({
      where: { id: (await params).id },
      data: {
        title: validatedData.title,
        description: validatedData.description,
        content: validatedData.content,
        thumbnail: validatedData.thumbnail,
        duration: validatedData.duration,
        isActive: validatedData.isActive,
        order: validatedData.order,
        lectureId: validatedData.lectureId,
        checklistId: validatedData.checklistId
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
        },
        lecture: true,
        checklist: true
      }
    })

    return NextResponse.json(lesson)
  } catch (error) {
    console.error('Ошибка обновления урока:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Неверные данные', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/lessons/[id] - удаление урока
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
        { error: 'Недостаточно прав для удаления уроков' },
        { status: 403 }
      )
    }

    // Проверяем существование урока
    const existingLesson = await prisma.lesson.findUnique({
      where: { id: (await params).id }
    })

    if (!existingLesson) {
      return NextResponse.json(
        { error: 'Урок не найден' },
        { status: 404 }
      )
    }

    // Удаляем урок
    await prisma.lesson.delete({
      where: { id: (await params).id }
    })

    return NextResponse.json({ message: 'Урок успешно удален' })
  } catch (error) {
    console.error('Ошибка удаления урока:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}