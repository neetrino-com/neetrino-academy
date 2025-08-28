import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateCourseSchema = z.object({
  courseData: z.object({
    title: z.string().min(3, 'Название должно содержать минимум 3 символа'),
    description: z.string().min(10, 'Описание должно содержать минимум 10 символов'),
    direction: z.enum(['WORDPRESS', 'VIBE_CODING', 'SHOPIFY']),
    level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
    price: z.number().min(0, 'Цена не может быть отрицательной').optional(),
    duration: z.number().optional(),
    tags: z.array(z.string()).optional(),
    prerequisites: z.array(z.string()).optional(),
    learningOutcomes: z.array(z.string()).optional(),
    isDraft: z.boolean().optional(),
    isActive: z.boolean().optional()
  }),
  modules: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    order: z.number(),
    lessons: z.array(z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      content: z.string(),
      type: z.enum(['video', 'text', 'mixed']),
      videoUrl: z.string().optional(),
      duration: z.number().optional(),
      order: z.number()
    }))
  })).optional()
})

// GET /api/admin/courses/[id] - получение курса
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
        { error: 'Недостаточно прав для просмотра курсов' },
        { status: 403 }
      )
    }

    const course = await prisma.course.findUnique({
      where: { id: (await params).id },
      include: {
        modules: {
          include: {
            _count: {
              select: {
                lessons: true,
                assignments: true
              }
            }
          },
          orderBy: { order: 'asc' }
        },
        _count: {
          select: {
            enrollments: true
          }
        }
      }
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Курс не найден' },
        { status: 404 }
      )
    }

    return NextResponse.json(course)
  } catch (error) {
    console.error('Ошибка получения курса:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/courses/[id] - обновление курса
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
        { error: 'Недостаточно прав для редактирования курсов' },
        { status: 403 }
      )
    }

    // Проверяем существование курса
    const existingCourse = await prisma.course.findUnique({
      where: { id: (await params).id }
    })

    if (!existingCourse) {
      return NextResponse.json(
        { error: 'Курс не найден' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = updateCourseSchema.parse(body)

    // Генерируем новый slug из названия курса
    const newSlug = validatedData.courseData.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    // Проверяем уникальность slug (исключая текущий курс)
    const existingCourseWithSlug = await prisma.course.findFirst({
      where: { 
        slug: newSlug,
        id: { not: (await params).id }
      }
    })

    if (existingCourseWithSlug) {
      return NextResponse.json(
        { error: 'Курс с таким названием уже существует' },
        { status: 400 }
      )
    }

    // Обновляем курс
    const course = await prisma.course.update({
      where: { id: (await params).id },
      data: {
        title: validatedData.courseData.title,
        description: validatedData.courseData.description,
        slug: newSlug,
        direction: validatedData.courseData.direction,
        level: validatedData.courseData.level,
        price: validatedData.courseData.price || 0,
        duration: validatedData.courseData.duration || 4,
        isDraft: validatedData.courseData.isDraft || false,
        isActive: validatedData.courseData.isActive || false
      }
    })

    // Если есть модули, обновляем их
    if (validatedData.modules && validatedData.modules.length > 0) {
      // Удаляем старые модули и уроки
      await prisma.lesson.deleteMany({
        where: {
          module: {
            courseId: (await params).id
          }
        }
      })
      
      await prisma.module.deleteMany({
        where: { courseId: (await params).id }
      })

      // Создаем новые модули и уроки
      for (const moduleData of validatedData.modules) {
        const module = await prisma.module.create({
          data: {
            title: moduleData.title,
            description: moduleData.description,
            order: moduleData.order,
            courseId: (await params).id
          }
        })

        // Создаем уроки для модуля
        for (const lessonData of moduleData.lessons) {
          await prisma.lesson.create({
            data: {
              title: lessonData.title,
              description: lessonData.description,
              content: lessonData.content,
              videoUrl: lessonData.videoUrl,
              duration: lessonData.duration,
              order: lessonData.order,
              moduleId: module.id
            }
          })
        }
      }
    }

    // Получаем обновленный курс с модулями
    const updatedCourse = await prisma.course.findUnique({
      where: { id: (await params).id },
      include: {
        modules: {
          include: {
            _count: {
              select: {
                lessons: true,
                assignments: true
              }
            }
          },
          orderBy: { order: 'asc' }
        },
        _count: {
          select: {
            enrollments: true
          }
        }
      }
    })

    return NextResponse.json(course)
  } catch (error) {
    console.error('Ошибка обновления курса:', error)
    
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

// DELETE /api/admin/courses/[id] - удаление курса
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

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Недостаточно прав для удаления курсов' },
        { status: 403 }
      )
    }

    // Проверяем существование курса
    const existingCourse = await prisma.course.findUnique({
      where: { id: (await params).id }
    })

    if (!existingCourse) {
      return NextResponse.json(
        { error: 'Курс не найден' },
        { status: 404 }
      )
    }

    // Удаляем курс (каскадно удалятся и все модули, уроки, задания)
    await prisma.course.delete({
      where: { id: (await params).id }
    })

    return NextResponse.json({ message: 'Курс успешно удален' })
  } catch (error) {
    console.error('Ошибка удаления курса:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
