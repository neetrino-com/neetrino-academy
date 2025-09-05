import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface ScheduleDay {
  dayOfWeek: number // 0-6 (воскресенье-суббота)
  startTime: string // "HH:MM"
  endTime: string   // "HH:MM"
}

interface GenerateAdvancedRequest {
  groupIds: string[]
  startDate: string // "YYYY-MM-DD"
  endDate: string   // "YYYY-MM-DD"
  scheduleDays: ScheduleDay[]
  title?: string
  location?: string
  isAttendanceRequired?: boolean
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 [Advanced Schedule] Начало генерации расписания')
    
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user || !['ADMIN', 'TEACHER'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body: GenerateAdvancedRequest = await request.json()
    const { groupIds, startDate, endDate, scheduleDays, title, location, isAttendanceRequired } = body

    // Валидация входных данных
    if (!groupIds || groupIds.length === 0) {
      return NextResponse.json({ error: 'Group IDs are required' }, { status: 400 })
    }

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Start date and end date are required' }, { status: 400 })
    }

    if (!scheduleDays || scheduleDays.length === 0) {
      return NextResponse.json({ error: 'Schedule days are required' }, { status: 400 })
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return NextResponse.json({ error: 'Invalid date range' }, { status: 400 })
    }

    // Проверяем существование групп
    const groups = await prisma.group.findMany({
      where: { 
        id: { in: groupIds },
        isActive: true 
      },
      include: {
        teachers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (groups.length === 0) {
      return NextResponse.json({ error: 'No active groups found' }, { status: 404 })
    }

    console.log(`📋 [Advanced Schedule] Найдено групп: ${groups.length}`)

    // Получаем учителей
    const teachers = await prisma.user.findMany({
      where: { role: 'TEACHER', isActive: true }
    })

    if (teachers.length === 0) {
      return NextResponse.json({ error: 'No teachers found' }, { status: 404 })
    }

    const generatedEvents = []
    const generatedSchedules = []

    // Генерируем расписание для каждой группы
    for (const group of groups) {
      console.log(`📅 [Advanced Schedule] Обработка группы: ${group.name}`)

      // Выбираем учителя для группы (первый из назначенных или случайный)
      let selectedTeacher = group.teachers[0]?.user
      if (!selectedTeacher) {
        selectedTeacher = teachers[Math.floor(Math.random() * teachers.length)]
        
        // Создаем связь учителя с группой
        await prisma.groupTeacher.create({
          data: {
            groupId: group.id,
            userId: selectedTeacher.id,
            role: 'MAIN'
          }
        })
      }

      // Генерируем события для каждого дня расписания
      for (const scheduleDay of scheduleDays) {
        console.log(`📝 [Advanced Schedule] День недели: ${scheduleDay.dayOfWeek}, время: ${scheduleDay.startTime}-${scheduleDay.endTime}`)

        // Находим все даты этого дня недели в указанном периоде
        const dates = getDatesForDayOfWeek(start, end, scheduleDay.dayOfWeek)
        
        for (const date of dates) {
          // Создаем время начала и окончания
          const [startHour, startMinute] = scheduleDay.startTime.split(':').map(Number)
          const [endHour, endMinute] = scheduleDay.endTime.split(':').map(Number)
          
          const startDateTime = new Date(date)
          startDateTime.setHours(startHour, startMinute, 0, 0)
          
          const endDateTime = new Date(date)
          endDateTime.setHours(endHour, endMinute, 0, 0)

          // Проверяем на конфликты времени
          const conflict = await checkTimeConflict(
            selectedTeacher.id,
            startDateTime,
            endDateTime,
            group.id
          )

          if (conflict) {
            console.log(`⚠️ [Advanced Schedule] Конфликт времени для ${group.name} на ${date.toISOString().split('T')[0]}`)
            continue
          }

          // Создаем событие в календаре
          const event = await prisma.event.create({
            data: {
              title: title || `Занятие группы ${group.name}`,
              description: `Регулярное занятие группы ${group.name}`,
              type: 'LESSON',
              startDate: startDateTime,
              endDate: endDateTime,
              location: location || null,
              createdById: user.id,
              groupId: group.id,
              isActive: true,
              isAttendanceRequired: Boolean(isAttendanceRequired)
            }
          })

          // Создаем запись в расписании группы (для совместимости)
          const scheduleEntry = await prisma.groupSchedule.create({
            data: {
              groupId: group.id,
              dayOfWeek: scheduleDay.dayOfWeek,
              startTime: scheduleDay.startTime,
              endTime: scheduleDay.endTime,
              isActive: true
            }
          })

          generatedEvents.push({
            id: event.id,
            title: event.title,
            startDate: event.startDate,
            endDate: event.endDate,
            groupId: group.id,
            groupName: group.name,
            teacherId: selectedTeacher.id,
            teacherName: selectedTeacher.name
          })

          generatedSchedules.push({
            id: scheduleEntry.id,
            groupId: group.id,
            groupName: group.name,
            dayOfWeek: scheduleDay.dayOfWeek,
            startTime: scheduleDay.startTime,
            endTime: scheduleDay.endTime,
            isActive: true
          })
        }
      }
    }

    console.log(`✅ [Advanced Schedule] Создано событий: ${generatedEvents.length}, записей расписания: ${generatedSchedules.length}`)

    return NextResponse.json({
      success: true,
      message: `Создано ${generatedEvents.length} занятий для ${groups.length} групп`,
      events: generatedEvents,
      schedules: generatedSchedules,
      summary: {
        groupsCount: groups.length,
        eventsCount: generatedEvents.length,
        schedulesCount: generatedSchedules.length,
        period: {
          start: startDate,
          end: endDate
        }
      }
    })

  } catch (error) {
    console.error('❌ [Advanced Schedule] Ошибка генерации:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Вспомогательная функция для получения дат определенного дня недели
function getDatesForDayOfWeek(startDate: Date, endDate: Date, dayOfWeek: number): Date[] {
  const dates: Date[] = []
  const current = new Date(startDate)
  
  // Находим первое вхождение нужного дня недели
  while (current.getDay() !== dayOfWeek && current <= endDate) {
    current.setDate(current.getDate() + 1)
  }
  
  // Добавляем все даты этого дня недели в периоде
  while (current <= endDate) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 7) // Следующая неделя
  }
  
  return dates
}

// Проверка конфликтов времени
async function checkTimeConflict(
  teacherId: string,
  startDateTime: Date,
  endDateTime: Date,
  groupId: string
): Promise<boolean> {
  // Проверяем конфликты с существующими событиями
  const conflictingEvent = await prisma.event.findFirst({
    where: {
      createdById: teacherId,
      isActive: true,
      OR: [
        {
          startDate: { lt: endDateTime },
          endDate: { gt: startDateTime }
        }
      ]
    }
  })

  if (conflictingEvent) {
    return true
  }

  // Проверяем конфликты с расписанием группы
  const conflictingSchedule = await prisma.groupSchedule.findFirst({
    where: {
      groupId: groupId,
      isActive: true,
      dayOfWeek: startDateTime.getDay(),
      OR: [
        {
          startTime: { lte: startDateTime.toTimeString().slice(0, 5) },
          endTime: { gt: startDateTime.toTimeString().slice(0, 5) }
        },
        {
          startTime: { lt: endDateTime.toTimeString().slice(0, 5) },
          endTime: { gte: endDateTime.toTimeString().slice(0, 5) }
        }
      ]
    }
  })

  return !!conflictingSchedule
}
