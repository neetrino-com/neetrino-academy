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

    let data
    try {
      data = await request.json()
    } catch (parseError) {
      console.error('Ошибка парсинга JSON:', parseError)
      return NextResponse.json(
        { error: 'Неверный формат данных JSON' },
        { status: 400 }
      )
    }
    
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
        price: courseData.price ? new Decimal(courseData.price.toString()) : new Decimal(0),
        paymentType: courseData.paymentType || 'ONE_TIME',
        monthlyPrice: courseData.monthlyPrice ? new Decimal(courseData.monthlyPrice.toString()) : new Decimal(0),
        totalPrice: courseData.totalPrice ? new Decimal(courseData.totalPrice.toString()) : new Decimal(0),
        duration: courseData.duration || 4,
        durationUnit: courseData.durationUnit || 'weeks',
        currency: courseData.currency || 'RUB',
        isDraft: courseData.isDraft || false,
        isActive: courseData.isActive !== undefined ? courseData.isActive : !courseData.isDraft,
        createdBy: user.id
      }
      
      // Дополнительная валидация перед созданием
      if (!courseCreateData.title || courseCreateData.title.length < 3) {
        throw new Error('Название курса должно содержать минимум 3 символа')
      }
      
      if (!['WORDPRESS', 'VIBE_CODING', 'SHOPIFY'].includes(courseCreateData.direction)) {
        throw new Error(`Неверное направление курса: ${courseCreateData.direction}`)
      }
      
      if (!['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(courseCreateData.level)) {
        throw new Error(`Неверный уровень курса: ${courseCreateData.level}`)
      }
      
      console.log('Данные для создания курса:', JSON.stringify(courseCreateData, null, 2))
      
      // Проверяем базу данных перед созданием
      console.log('Проверяем подключение к БД...')
      const testConnection = await tx.user.findFirst()
      console.log('Подключение к БД успешно, найден пользователь:', testConnection ? 'да' : 'нет')
      
      // Создаём курс
      console.log('Пытаемся создать курс...')
      let newCourse
      try {
        newCourse = await tx.course.create({
          data: courseCreateData,
          include: {
            creator: true
          }
        })
        console.log('Курс создан успешно, ID:', newCourse.id)
      } catch (courseError) {
        console.error('=== ОШИБКА СОЗДАНИЯ КУРСА ===')
        console.error('Course creation error:', courseError)
        console.error('Course data that failed:', courseCreateData)
        throw courseError
      }

      // Создаём модули с уроками
      for (let i = 0; i < modules.length; i++) {
        const moduleData = modules[i]
        console.log(`Создаём модуль ${i + 1}:`, moduleData.title)
        
        const newModule = await tx.module.create({
          data: {
            title: moduleData.title,
            description: moduleData.description || '',
            order: moduleData.order,
            courseId: newCourse.id
          }
        })
        
        console.log(`Модуль создан, ID: ${newModule.id}`)

        // Создаём уроки
        if (moduleData.lessons && moduleData.lessons.length > 0) {
          for (let j = 0; j < moduleData.lessons.length; j++) {
            const lesson = moduleData.lessons[j]
            console.log(`  Создаём урок ${j + 1}:`, lesson.title)
            
            await tx.lesson.create({
              data: {
                title: lesson.title,
                description: lesson.description || '',
                content: lesson.content || null,
                duration: lesson.duration || null,
                order: lesson.order,
                moduleId: newModule.id,
                lectureId: lesson.lectureId || null,
                checklistId: lesson.checklistId || null
              }
            })
          }
        }

        // Создаём задания (если есть)
        if (moduleData.assignments && moduleData.assignments.length > 0) {
          console.log(`Создаём ${moduleData.assignments.length} заданий для модуля ${moduleData.title}`)
          for (const assignment of moduleData.assignments) {
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

    console.log('=== Курс создан успешно ===')
    console.log('Course ID:', course.id)
    console.log('Course title:', course.title)
    
    return NextResponse.json(course)
  } catch (error) {
    console.error('=== BUILDER ERROR ===')
    console.error('Builder error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    })
    
    // Проверяем тип ошибки для лучшей диагностики
    if (error instanceof Error) {
      if (error.message.includes('Prisma')) {
        console.error('Это ошибка Prisma/БД')
      }
      if (error.message.includes('Unique constraint')) {
        console.error('Ошибка уникальности - возможно курс с таким названием уже существует')
        return NextResponse.json(
          { error: 'Курс с таким названием уже существует' },
          { status: 400 }
        )
      }
      if (error.message.includes('Foreign key constraint')) {
        console.error('Ошибка внешнего ключа - возможно связанная запись не найдена')
        return NextResponse.json(
          { error: 'Ошибка связи данных. Проверьте корректность выбранных элементов.' },
          { status: 400 }
        )
      }
    }
    
    // Возвращаем более подробную информацию об ошибке
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { 
        error: 'Не удалось создать курс', 
        details: errorMessage,
        type: error instanceof Error ? error.name : 'Unknown',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}


