import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Тестовый API роут для создания курса без авторизации
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { courseData, modules } = data

    console.log('Получены данные для создания курса:', { courseData, modules })

    // Получаем администратора для создания заданий
    const admin = await prisma.user.findFirst({
      where: { email: 'admin@example.com' }
    })

    if (!admin) {
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 500 }
      )
    }

    // Создаём курс со всеми модулями и уроками транзакционно
    const course = await prisma.$transaction(async (tx) => {
      // Создаём курс
      const newCourse = await tx.course.create({
        data: {
          title: courseData.title,
          description: courseData.description || '',
          slug: courseData.title.toLowerCase().replace(/\s+/g, '-'),
          direction: (courseData.direction || 'WORDPRESS') as any,
          level: (courseData.level || 'BEGINNER') as any,
          price: courseData.price ? parseFloat(courseData.price.toString()) : 0,
          isActive: true
        }
      })

      console.log('Курс создан:', newCourse)

      // Создаём модули с уроками
      if (modules && modules.length > 0) {
        for (const module of modules) {
          const newModule = await tx.module.create({
            data: {
              title: module.title || 'Новый модуль',
              description: module.description || '',
              order: module.order || 0,
              courseId: newCourse.id
            }
          })

          console.log('Модуль создан:', newModule)

          // Создаём уроки
          if (module.lessons && module.lessons.length > 0) {
            for (const lesson of module.lessons) {
              await tx.lesson.create({
                data: {
                  title: lesson.title || 'Новый урок',
                  content: lesson.content || '',
                  videoUrl: lesson.videoUrl || '',
                  duration: lesson.duration || 30,
                  order: lesson.order || 0,
                  moduleId: newModule.id
                }
              })
            }
          }

          // Создаём задания
          if (module.assignments && module.assignments.length > 0) {
            for (const assignment of module.assignments) {
              await tx.assignment.create({
                data: {
                  title: assignment.title || 'Новое задание',
                  description: assignment.description || '',
                  dueDate: assignment.dueDate ? new Date(assignment.dueDate) : null,
                  moduleId: newModule.id,
                  createdBy: admin.id
                }
              })
            }
          }
        }
      }

      return newCourse
    })

    console.log('Курс успешно создан:', course)
    return NextResponse.json({ success: true, course })
  } catch (error) {
    console.error('Ошибка создания курса:', error)
    return NextResponse.json(
      { error: 'Failed to create course', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
