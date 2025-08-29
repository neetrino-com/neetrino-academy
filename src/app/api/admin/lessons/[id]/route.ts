import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateLessonSchema = z.object({
  title: z.string().min(1, 'Название урока обязательно'),
  content: z.string().optional(),
  videoUrl: z.string().url().optional().or(z.literal('')),
  duration: z.number().min(0, 'Длительность не может быть отрицательной'),
  order: z.number().min(1, 'Порядок должен быть больше 0'),
  lectureId: z.string().optional(),
  checklistId: z.string().optional(),
  type: z.enum(['LECTURE', 'CHECKLIST', 'ASSIGNMENT', 'TEST']).optional()
})

// GET /api/admin/lessons/[id] - получение урока
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

    const lesson = await prisma.lesson.findUnique({
      where: { id: params.id },
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
        lecture: {
          select: {
            id: true,
            title: true,
            description: true
          }
        },
        checklist: {
          select: {
            id: true,
            title: true,
            description: true,
            direction: true
          }
        }
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
        { error: 'Недостаточно прав для редактирования уроков' },
        { status: 403 }
      )
    }

    // Проверяем существование урока
    const existingLesson = await prisma.lesson.findUnique({
      where: { id: params.id }
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
      where: { id: params.id },
      data: {
        title: validatedData.title,
        content: validatedData.content,
        videoUrl: validatedData.videoUrl || null,
        duration: validatedData.duration,
        order: validatedData.order,
        lectureId: validatedData.lectureId || null,
        checklistId: validatedData.checklistId || null,
        type: validatedData.type || 'LECTURE'
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
        lecture: {
          select: {
            id: true,
            title: true,
            description: true
          }
        },
        checklist: {
          select: {
            id: true,
            title: true,
            description: true,
            direction: true
          }
        }
      }
    })

    return NextResponse.json(lesson)
  } catch (error) {
    console.error('Ошибка обновления урока:', error)
    
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

// DELETE /api/admin/lessons/[id] - удаление урока
export async function DELETE(
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
        { error: 'Недостаточно прав для удаления уроков' },
        { status: 403 }
      )
    }

    // Проверяем существование урока
    const existingLesson = await prisma.lesson.findUnique({
      where: { id: params.id }
    })

    if (!existingLesson) {
      return NextResponse.json(
        { error: 'Урок не найден' },
        { status: 404 }
      )
    }

    // Удаляем урок (каскадно удалятся и все связанные данные)
    await prisma.lesson.delete({
      where: { id: params.id }
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
