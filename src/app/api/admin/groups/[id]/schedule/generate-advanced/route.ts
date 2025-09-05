import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || !['ADMIN', 'TEACHER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: groupId } = await params
    const body = await request.json()
    const { startDate, endDate, scheduleDays, title, location, isAttendanceRequired } = body

    console.log('🔍 Генерация расписания - полученные данные:', {
      groupId,
      startDate,
      endDate,
      scheduleDays,
      title,
      location,
      isAttendanceRequired
    })

    // Валидация
    if (!startDate || !endDate || !scheduleDays || scheduleDays.length === 0) {
      console.error('❌ Отсутствуют обязательные поля:', { startDate, endDate, scheduleDays })
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Проверяем существование группы
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { 
        teachers: {
          where: { role: 'MAIN' },
          include: { user: true }
        }
      }
    })

    if (!group) {
      console.error('❌ Группа не найдена:', groupId)
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Определяем создателя событий
    const createdById = group.teachers[0]?.userId || session.user.id
    console.log('👤 Создатель событий:', { createdById, groupTeachers: group.teachers.length })

    // Создаем события для каждого дня расписания
    const events = []
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    console.log('📅 Период генерации:', { 
      start: start.toISOString(), 
      end: end.toISOString(),
      daysCount: Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    })
    
    // Генерируем события для каждого дня недели
    for (const scheduleDay of scheduleDays) {
      console.log('🔄 Обработка дня расписания:', scheduleDay)
      const currentDate = new Date(start)
      let dayEventsCount = 0
      
      while (currentDate <= end) {
        // Проверяем, соответствует ли день недели
        if (currentDate.getDay() === scheduleDay.dayOfWeek) {
          const eventStart = new Date(currentDate)
          const [hours, minutes] = scheduleDay.startTime.split(':').map(Number)
          eventStart.setHours(hours, minutes, 0, 0)

          const eventEnd = new Date(currentDate)
          const [endHours, endMinutes] = scheduleDay.endTime.split(':').map(Number)
          eventEnd.setHours(endHours, endMinutes, 0, 0)

          // Проверяем, что событие в будущем
          if (eventStart > new Date()) {
            const eventData = {
              title: title || 'Занятие группы',
              startDate: eventStart,
              endDate: eventEnd,
              groupId: groupId,
              createdById: createdById,
              location: location || null,
              type: 'LESSON' as const,
              isActive: true,
              isAttendanceRequired: isAttendanceRequired || false
            }
            
            events.push(eventData)
            dayEventsCount++
            
            console.log('✅ Создано событие:', {
              title: eventData.title,
              startDate: eventData.startDate.toISOString(),
              endDate: eventData.endDate.toISOString(),
              dayOfWeek: currentDate.getDay()
            })
          }
        }
        
        currentDate.setDate(currentDate.getDate() + 1)
      }
      
      console.log(`📊 Для дня ${scheduleDay.dayOfWeek} создано ${dayEventsCount} событий`)
    }

    console.log(`🎯 Всего событий для создания: ${events.length}`)

    if (events.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Нет событий для создания (все даты в прошлом)',
        eventsCreated: 0,
        group: {
          id: group.id,
          name: group.name
        }
      })
    }

    // Создаем события в базе данных
    const createdEvents = await prisma.event.createMany({
      data: events,
      skipDuplicates: true
    })

    console.log('✅ События созданы в базе данных:', createdEvents)

    return NextResponse.json({
      success: true,
      message: `Создано ${createdEvents.count} занятий для группы ${group.name}`,
      eventsCreated: createdEvents.count,
      group: {
        id: group.id,
        name: group.name
      }
    })

  } catch (error) {
    console.error('❌ Ошибка генерации расписания:', error)
    
    // Детальная информация об ошибке для отладки
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'UnknownError'
    }
    
    console.error('🔍 Детали ошибки:', errorDetails)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      { status: 500 }
    )
  }
}
