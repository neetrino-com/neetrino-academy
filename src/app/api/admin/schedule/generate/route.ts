import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { months, groups } = await request.json()

    if (!months || !groups || !Array.isArray(groups)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    const startDate = new Date()
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + months)

    const generatedEvents = []
    const conflicts = []

    // Получаем все группы с их расписанием
    const groupsData = await prisma.group.findMany({
      where: { id: { in: groups } },
      include: {
        groupSchedule: true,
        teacher: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Генерируем события для каждой группы
    for (const group of groupsData) {
      if (!group.groupSchedule || group.groupSchedule.length === 0) {
        continue
      }

      for (const schedule of group.groupSchedule) {
        if (!schedule.isActive) continue

        const currentDate = new Date(startDate)
        
        // Находим первый день недели, соответствующий расписанию
        while (currentDate.getDay() !== schedule.dayOfWeek) {
          currentDate.setDate(currentDate.getDate() + 1)
        }

        // Генерируем события на весь период
        while (currentDate <= endDate) {
          const eventDate = new Date(currentDate)
          const startDateTime = new Date(eventDate)
          const [startHour, startMinute] = schedule.startTime.split(':').map(Number)
          startDateTime.setHours(startHour, startMinute, 0, 0)

          const endDateTime = new Date(eventDate)
          const [endHour, endMinute] = schedule.endTime.split(':').map(Number)
          endDateTime.setHours(endHour, endMinute, 0, 0)

          // Проверяем конфликты
          const existingEvents = await prisma.event.findMany({
            where: {
              OR: [
                // Конфликт по учителю
                {
                  group: {
                    teacherId: group.teacherId
                  },
                  startDate: {
                    gte: startDateTime,
                    lt: endDateTime
                  }
                },
                // Конфликт по локации (если указана)
                ...(schedule.location ? [{
                  location: schedule.location,
                  startDate: {
                    gte: startDateTime,
                    lt: endDateTime
                  }
                }] : [])
              ]
            },
            include: {
              group: {
                include: {
                  teacher: true
                }
              }
            }
          })

          if (existingEvents.length > 0) {
            conflicts.push({
              groupName: group.name,
              teacherName: group.teacher?.name || 'Не назначен',
              date: eventDate.toISOString(),
              startTime: schedule.startTime,
              endTime: schedule.endTime,
              location: schedule.location,
              conflicts: existingEvents.map(event => ({
                groupName: event.group.name,
                teacherName: event.group.teacher?.name || 'Не назначен',
                startDate: event.startDate,
                endDate: event.endDate,
                location: event.location
              }))
            })
            continue
          }

          // Создаем событие
          const event = await prisma.event.create({
            data: {
              title: `${group.name} - Занятие`,
              description: `Регулярное занятие группы ${group.name}`,
              startDate: startDateTime,
              endDate: endDateTime,
              location: schedule.location,
              isAttendanceRequired: true,
              attendanceDeadline: new Date(endDateTime.getTime() + 24 * 60 * 60 * 1000), // +1 день
              groupId: group.id,
              type: 'CLASS'
            }
          })

          generatedEvents.push(event)

          // Переходим к следующей неделе
          currentDate.setDate(currentDate.getDate() + 7)
        }
      }
    }

    return NextResponse.json({
      success: true,
      generatedEvents: generatedEvents.length,
      conflicts: conflicts.length,
      details: {
        events: generatedEvents,
        conflicts
      }
    })

  } catch (error) {
    console.error('Error generating schedule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
