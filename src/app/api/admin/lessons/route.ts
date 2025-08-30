import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Создать новый урок
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Проверяем роль пользователя
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user || (user.role !== 'ADMIN' && user.role !== 'TEACHER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, content, thumbnail, duration, isActive, order, moduleId, lectureId, checklistId } = body

    // Валидация обязательных полей
    if (!title || !moduleId) {
      return NextResponse.json({ 
        error: 'Missing required fields: title, moduleId' 
      }, { status: 400 })
    }

    // Проверяем существование модуля
    const existingModule = await prisma.module.findUnique({
      where: { id: moduleId }
    })

    if (!existingModule) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    // Автоматически определяем порядок урока если не указан
    let lessonOrder = order
    if (!lessonOrder) {
      const lastLesson = await prisma.lesson.findFirst({
        where: { moduleId },
        orderBy: { order: 'desc' }
      })
      lessonOrder = (lastLesson?.order || 0) + 1
    }

    // Создаем урок
    const lesson = await prisma.lesson.create({
      data: {
        title,
        description: description || null,
        content: content || null,
        thumbnail: thumbnail || null,
        duration: duration || null,
        isActive: isActive !== undefined ? isActive : true,
        order: lessonOrder,
        moduleId,
        lectureId: lectureId || null,
        checklistId: checklistId || null
      },
      include: {
        module: {
          include: {
            course: true
          }
        },
        lecture: true,
        checklist: true
      }
    })

    return NextResponse.json(lesson, { status: 201 })
  } catch (error) {
    console.error('Error creating lesson:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Получить все уроки для выбора в тестах
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Проверяем роль пользователя
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user || (user.role !== 'ADMIN' && user.role !== 'TEACHER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const lessons = await prisma.lesson.findMany({
      select: {
        id: true,
        title: true,
        module: {
          select: {
            title: true,
            course: {
              select: {
                title: true
              }
            }
          }
        }
      },
      orderBy: [
        { module: { course: { title: 'asc' } } },
        { module: { title: 'asc' } },
        { order: 'asc' }
      ]
    })

    return NextResponse.json(lessons)
  } catch (error) {
    console.error('Error fetching lessons:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
