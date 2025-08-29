import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateCourseSchema = z.object({
  courseData: z.object({
    title: z.string().min(3, 'Название должно содержать минимум 3 символа'),
    description: z.string().min(5, 'Описание должно содержать минимум 5 символов'),
    direction: z.enum(['WORDPRESS', 'VIBE_CODING', 'SHOPIFY']),
    level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
    price: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseFloat(val) || 0 : val).optional(),
    duration: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseInt(val) || 4 : val).optional(),
    durationUnit: z.enum(['days', 'weeks', 'months']).optional(),
    currency: z.enum(['RUB', 'USD', 'AMD']).optional(),
    tags: z.array(z.string()).optional(),
    prerequisites: z.array(z.string()).optional(),
    learningOutcomes: z.array(z.string()).optional(),
    isDraft: z.boolean().optional(),
    isActive: z.boolean().optional()
  }),
  modules: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().optional().default(''),
    order: z.number(),
    lessons: z.array(z.object({
      id: z.string(),
      title: z.string(),
      content: z.string().optional().default(''),
      type: z.enum(['video', 'text', 'mixed', 'lecture']).optional().default('text'),
      videoUrl: z.string().nullable().optional().default(null),
      duration: z.number().nullable().optional().default(null),
      order: z.number(),
      lectureId: z.string().nullable().optional().default(null)
    })),
    assignments: z.array(z.object({
      title: z.string(),
      description: z.string().optional().default(''),
      dueDate: z.string().optional(),
      maxScore: z.number().optional()
    })).optional()
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

    // Временно отключаем проверку роли для тестирования
    // if (!user || (user.role !== 'TEACHER' && user.role !== 'ADMIN')) {
    //   return NextResponse.json(
    //     { error: 'Недостаточно прав для просмотра курсов' },
    //     { status: 403 }
    //   )
    // }

    // Обрабатываем параметры правильно для Next.js 15
    const resolvedParams = await params
    const courseId = resolvedParams.id
    
    console.log('GET /api/admin/courses/[id] - Course ID:', courseId)

    // Сначала проверим, есть ли курсы в базе вообще
    const allCourses = await prisma.course.findMany({
      select: { id: true, title: true }
    })
    console.log('Все курсы в базе:', allCourses)

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              include: {
                lecture: {
                  select: {
                    id: true,
                    title: true,
                    description: true
                  }
                }
              }
            },
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

    console.log('Найден курс:', course ? `${course.title} (${course.id})` : 'null')

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

    // Обрабатываем параметры правильно для Next.js 15
    const resolvedParams = await params
    const courseId = resolvedParams.id

    // Проверяем существование курса
    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!existingCourse) {
      return NextResponse.json(
        { error: 'Курс не найден' },
        { status: 404 }
      )
    }

    const body = await request.json()
    console.log('=== PUT /api/admin/courses/[id] вызван ===')
    console.log('Course ID:', courseId)
    console.log('Request body:', JSON.stringify(body, null, 2))
    
    const validatedData = updateCourseSchema.parse(body)
    console.log('Validated data:', JSON.stringify(validatedData, null, 2))

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
        id: { not: courseId }
      }
    })

    if (existingCourseWithSlug) {
      return NextResponse.json(
        { error: 'Курс с таким названием уже существует' },
        { status: 400 }
      )
    }

    // Подготавливаем данные для обновления
    const updateData = {
      title: validatedData.courseData.title,
      description: validatedData.courseData.description,
      slug: newSlug,
      direction: validatedData.courseData.direction,
      level: validatedData.courseData.level,
      price: validatedData.courseData.price || 0,
      duration: validatedData.courseData.duration || existingCourse.duration,
      durationUnit: validatedData.courseData.durationUnit || existingCourse.durationUnit || 'weeks',
      currency: validatedData.courseData.currency || existingCourse.currency || 'RUB',
      isDraft: validatedData.courseData.isDraft !== undefined ? validatedData.courseData.isDraft : existingCourse.isDraft,
      isActive: validatedData.courseData.isActive !== undefined ? validatedData.courseData.isActive : existingCourse.isActive
    }
    
    console.log('Данные для обновления курса:', JSON.stringify(updateData, null, 2))
    console.log('Старые значения: isDraft =', existingCourse.isDraft, ', isActive =', existingCourse.isActive)
    console.log('Новые значения: isDraft =', updateData.isDraft, ', isActive =', updateData.isActive)

    // Обновляем курс
    const course = await prisma.course.update({
      where: { id: courseId },
      data: updateData
    })
    
    console.log('Курс обновлен успешно. Новые значения: isDraft =', course.isDraft, ', isActive =', course.isActive)

        // Если есть модули, обновляем их
    if (validatedData.modules && validatedData.modules.length > 0) {
      // Получаем существующие модули курса
      const existingModules = await prisma.module.findMany({
        where: { courseId: courseId },
        include: { lessons: true }
      })

      // Обновляем или создаем модули
      for (const moduleData of validatedData.modules) {
        let module
        
        // Проверяем, существует ли модуль с таким ID
        const existingModule = existingModules.find(m => m.id === moduleData.id)
        
        if (existingModule) {
          // Обновляем существующий модуль
          module = await prisma.module.update({
            where: { id: moduleData.id },
            data: {
              title: moduleData.title,
              description: moduleData.description || '',
              order: moduleData.order
            }
          })
        } else {
          // Создаем новый модуль
          module = await prisma.module.create({
            data: {
              title: moduleData.title,
              description: moduleData.description || '',
              order: moduleData.order,
              courseId: courseId
            }
          })
        }

        // Обновляем или создаем уроки для модуля
        for (const lessonData of moduleData.lessons) {
          const existingLesson = existingModule?.lessons.find(l => l.id === lessonData.id)
          
          if (existingLesson) {
            // Обновляем существующий урок
            await prisma.lesson.update({
              where: { id: lessonData.id },
              data: {
                title: lessonData.title,
                content: lessonData.content || '',
                videoUrl: lessonData.videoUrl || null,
                duration: lessonData.duration || null,
                order: lessonData.order,
                lectureId: lessonData.lectureId || null
              }
            })
          } else {
            // Создаем новый урок
            await prisma.lesson.create({
              data: {
                title: lessonData.title,
                content: lessonData.content || '',
                videoUrl: lessonData.videoUrl || null,
                duration: lessonData.duration || null,
                order: lessonData.order,
                moduleId: module.id,
                lectureId: lessonData.lectureId || null
              }
            })
          }
        }

        // Обрабатываем задания для модуля
        if (moduleData.assignments && moduleData.assignments.length > 0) {
          console.log(`Обрабатываем ${moduleData.assignments.length} заданий для модуля ${moduleData.title}`)
          
          // Удаляем старые задания модуля
          await prisma.assignment.deleteMany({
            where: { moduleId: module.id }
          })
          
          // Создаем новые задания
          for (const assignmentData of moduleData.assignments) {
            console.log('Создаём задание:', assignmentData.title)
            await prisma.assignment.create({
              data: {
                title: assignmentData.title,
                description: assignmentData.description || '',
                dueDate: assignmentData.dueDate ? new Date(assignmentData.dueDate) : null,
                moduleId: module.id,
                createdBy: user.id
              }
            })
          }
        }
      }

      // Удаляем модули и уроки, которых больше нет в обновленных данных
      const updatedModuleIds = validatedData.modules.map(m => m.id)
      const updatedLessonIds = validatedData.modules.flatMap(m => m.lessons.map(l => l.id))

      // Удаляем уроки, которых больше нет
      await prisma.lesson.deleteMany({
        where: {
          moduleId: { in: updatedModuleIds },
          id: { notIn: updatedLessonIds }
        }
      })

      // Удаляем модули, которых больше нет
      await prisma.module.deleteMany({
        where: {
          courseId: courseId,
          id: { notIn: updatedModuleIds }
        }
      })
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

    return NextResponse.json(updatedCourse)
  } catch (error) {
    console.error('Ошибка обновления курса:', error)
    
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
