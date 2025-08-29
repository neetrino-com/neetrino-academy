import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Decimal } from '@prisma/client/runtime/library'

// Создание курса через конструктор
export async function POST(request: NextRequest) {
  console.log('=== POST /api/admin/builder вызван ===')
  try {
    const session = await auth()
    console.log('Session:', session?.user?.email ? `Пользователь: ${session.user.email}` : 'Не авторизован')
    
    if (!session?.user?.email) {
      console.error('Ошибка авторизации: нет сессии или email')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Проверяем роль пользователя
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    
    console.log('Пользователь найден:', user ? `ID: ${user.id}, Role: ${user.role}` : 'Не найден')

    if (!user || user.role !== 'ADMIN') {
      console.error('Ошибка доступа: пользователь не администратор')
      return NextResponse.json(
        { error: 'Доступ запрещен. Требуются права администратора' },
        { status: 403 }
      )
    }

    const data = await request.json()
    const { courseData, modules } = data
    
    // Подробное логирование входящих данных
    console.log('=== Builder API - Входящие данные ===')
    console.log('courseData:', JSON.stringify(courseData, null, 2))
    console.log('modules:', JSON.stringify(modules, null, 2))
    console.log('==========================================')
    
    // Проверяем обязательные поля
    if (!courseData || !courseData.title || !courseData.description) {
      console.error('Отсутствуют обязательные поля courseData')
      return NextResponse.json(
        { error: 'Отсутствуют обязательные поля курса (title, description)' },
        { status: 400 }
      )
    }
    
    if (!modules || !Array.isArray(modules) || modules.length === 0) {
      console.error('Отсутствуют модули')
      return NextResponse.json(
        { error: 'Курс должен содержать хотя бы один модуль' },
        { status: 400 }
      )
    }

    // Создаём курс со всеми модулями и уроками транзакционно
    const course = await prisma.$transaction(async (tx) => {
      console.log('=== Начинаем транзакцию создания курса ===')
      
      // Подготавливаем данные для создания курса
      const courseCreateData = {
        title: courseData.title,
        description: courseData.description || '',
        slug: courseData.title.toLowerCase().replace(/\s+/g, '-'),
        direction: courseData.direction,
        level: courseData.level,
        price: new Decimal(courseData.price || 0),
        duration: courseData.duration || 4,
        isDraft: courseData.isDraft || false,
        isActive: courseData.isActive !== undefined ? courseData.isActive : !courseData.isDraft,
        createdBy: user.id
      }
      
      console.log('Данные для создания курса:', JSON.stringify(courseCreateData, null, 2))
      
      // Создаём курс
      const newCourse = await tx.course.create({
        data: courseCreateData,
        include: {
          creator: true
        }
      })
      
      console.log('Курс создан успешно, ID:', newCourse.id)

      // Создаём модули с уроками
      for (let i = 0; i < modules.length; i++) {
        const module = modules[i]
        console.log(`Создаём модуль ${i + 1}:`, module.title)
        
        const newModule = await tx.module.create({
          data: {
            title: module.title,
            description: module.description || '',
            order: module.order,
            courseId: newCourse.id
          }
        })
        
        console.log(`Модуль создан, ID: ${newModule.id}`)

        // Создаём уроки
        if (module.lessons && module.lessons.length > 0) {
          for (let j = 0; j < module.lessons.length; j++) {
            const lesson = module.lessons[j]
            console.log(`  Создаём урок ${j + 1}:`, lesson.title)
            
            await tx.lesson.create({
              data: {
                title: lesson.title,
                content: lesson.content || '',
                videoUrl: lesson.videoUrl || null,
                duration: lesson.duration || null,
                order: lesson.order,
                moduleId: newModule.id,
                lectureId: lesson.lectureId || null,
                checklistId: lesson.checklistId || null,
                type: lesson.type || 'LECTURE'
              }
            })
          }
        }

        // Создаём задания (если есть)
        if (module.assignments && module.assignments.length > 0) {
          console.log(`Создаём ${module.assignments.length} заданий для модуля ${module.title}`)
          for (const assignment of module.assignments) {
            console.log('Создаём задание:', assignment.title)
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
      }

      return newCourse
    })

    return NextResponse.json(course)
  } catch (error) {
    console.error('Builder error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    })
    
    // Возвращаем более подробную информацию об ошибке
    return NextResponse.json(
      { 
        error: 'Failed to create course', 
        details: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof Error ? error.name : 'Unknown',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}


