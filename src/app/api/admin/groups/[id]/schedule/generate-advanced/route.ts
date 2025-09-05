import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['ADMIN', 'TEACHER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const groupId = params.id
    const body = await request.json()
    const { startDate, endDate, scheduleDays, title, location, isAttendanceRequired } = body

    // Валидация
    if (!startDate || !endDate || !scheduleDays || scheduleDays.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Проверяем существование группы
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { teacher: true }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Создаем события для каждого дня расписания
    const events = []
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    // Генерируем события для каждого дня недели
    for (const scheduleDay of scheduleDays) {
      const currentDate = new Date(start)
      
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
            events.push({
              title: title || 'Занятие группы',
              startDate: eventStart,
              endDate: eventEnd,
              groupId: groupId,
              createdById: group.teacher?.id || session.user.id,
              location: location || null,
              type: 'LESSON',
              isActive: true,
              isAttendanceRequired: isAttendanceRequired || false
            })
          }
        }
        
        currentDate.setDate(currentDate.getDate() + 1)
      }
    }

    // Создаем события в базе данных
    const createdEvents = await prisma.event.createMany({
      data: events,
      skipDuplicates: true
    })

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
    console.error('Error generating advanced schedule:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
