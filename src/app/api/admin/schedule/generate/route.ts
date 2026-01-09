import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
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

    const { months = 3, groups = [] } = await request.json()

    // Получаем все группы если не указаны конкретные
    const targetGroups = groups.length > 0 
      ? await prisma.group.findMany({ where: { id: { in: groups } } })
      : await prisma.group.findMany({ where: { isActive: true } })

    if (targetGroups.length === 0) {
      return NextResponse.json({ error: 'No groups found' }, { status: 404 })
    }

    // Получаем учителей
    const teachers = await prisma.user.findMany({
      where: { role: 'TEACHER', isActive: true }
    })

    if (teachers.length === 0) {
      return NextResponse.json({ error: 'No teachers found' }, { status: 404 })
    }

    // Генерируем расписание для каждой группы
    const generatedEntries = []

    for (const group of targetGroups) {
      // Выбираем случайного учителя для группы
      const teacher = teachers[Math.floor(Math.random() * teachers.length)]
      
      // Создаем связь учителя с группой если её нет
      const existingTeacher = await prisma.groupTeacher.findFirst({
        where: { groupId: group.id, userId: teacher.id }
      })

      if (!existingTeacher) {
        await prisma.groupTeacher.create({
          data: {
            groupId: group.id,
            userId: teacher.id,
            role: 'MAIN'
          }
        })
      }

      // Генерируем 2-3 занятия в неделю для группы
      const daysOfWeek = [1, 2, 3, 4, 5] // Пн-Пт
      const timeSlots = [
        { start: '09:00', end: '10:30' },
        { start: '11:00', end: '12:30' },
        { start: '14:00', end: '15:30' },
        { start: '16:00', end: '17:30' },
        { start: '18:00', end: '19:30' }
      ]

      const numLessons = Math.floor(Math.random() * 2) + 2 // 2-3 занятия
      const selectedDays = daysOfWeek.sort(() => 0.5 - Math.random()).slice(0, numLessons)

      for (const dayOfWeek of selectedDays) {
        const timeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)]
        
        // Проверяем на конфликты
        const existingConflict = await prisma.groupSchedule.findFirst({
          where: {
            groupId: group.id,
            dayOfWeek,
            isActive: true,
            OR: [
              { startTime: { lte: timeSlot.start }, endTime: { gt: timeSlot.start } },
              { startTime: { lt: timeSlot.end }, endTime: { gte: timeSlot.end } }
            ]
          }
        })

        if (!existingConflict) {
          const scheduleEntry = await prisma.groupSchedule.create({
            data: {
              groupId: group.id,
              dayOfWeek,
              startTime: timeSlot.start,
              endTime: timeSlot.end,
              isActive: true
            }
          })

          generatedEntries.push({
            id: scheduleEntry.id,
            groupId: group.id,
            groupName: group.name,
            teacherId: teacher.id,
            teacherName: teacher.name,
            dayOfWeek,
            startTime: timeSlot.start,
            endTime: timeSlot.end,
            isActive: true
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${generatedEntries.length} schedule entries for ${targetGroups.length} groups`,
      entries: generatedEntries
    })

  } catch (error) {
    console.error('Error generating schedule:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
