import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Decimal } from '@prisma/client/runtime/library'

// Создание курса через конструктор
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Проверяем роль пользователя
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Доступ запрещен. Требуются права администратора' },
        { status: 403 }
      )
    }

    const data = await request.json()
    const { courseData, modules } = data

    // Создаём курс со всеми модулями и уроками транзакционно
    const course = await prisma.$transaction(async (tx) => {
      // Создаём курс
      const newCourse = await tx.course.create({
        data: {
          title: courseData.title,
          description: courseData.description || '',
          slug: courseData.title.toLowerCase().replace(/\s+/g, '-'),
          direction: courseData.direction,
          level: courseData.level,
          price: new Decimal(courseData.price || 0),
          duration: courseData.duration || 4,
          createdBy: user.id
        },
        include: {
          creator: true
        }
      })

      // Создаём модули с уроками
      for (const module of modules) {
        const newModule = await tx.module.create({
          data: {
            title: module.title,
            description: module.description || '',
            order: module.order,
            courseId: newCourse.id
          }
        })

        // Создаём уроки
        for (const lesson of module.lessons) {
          await tx.lesson.create({
            data: {
              title: lesson.title,
              content: lesson.content || '',
              videoUrl: lesson.videoUrl || null,
              duration: lesson.duration || null,
              order: lesson.order,
              moduleId: newModule.id
            }
          })
        }

        // Создаём задания
        for (const assignment of module.assignments) {
          await tx.assignment.create({
            data: {
              title: assignment.title,
              description: assignment.description || '',
              dueDate: assignment.dueDate ? new Date(assignment.dueDate) : null,
              moduleId: newModule.id,
              createdBy: user.id
            }
          })
        }
      }

      return newCourse
    })

    return NextResponse.json(course)
  } catch (error) {
    console.error('Builder error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { error: 'Failed to create course', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Получение шаблонов курсов
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Проверяем роль пользователя
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Доступ запрещен. Требуются права администратора' },
        { status: 403 }
      )
    }

    const templates = await prisma.courseTemplate.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error('Templates error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}
