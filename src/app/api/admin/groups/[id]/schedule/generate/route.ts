import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface Params {
  id: string
}

// Генерация событий на основе расписания группы в указанный период
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
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

    const { id: groupId } = await params
    const body = await request.json()
    const { startDate, endDate, title, location, isAttendanceRequired } = body

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 })
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      return NextResponse.json({ error: 'Invalid date range' }, { status: 400 })
    }

    // Проверяем группу
    const group = await prisma.group.findUnique({ where: { id: groupId } })
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Загружаем расписание группы
    const schedule = await prisma.groupSchedule.findMany({
      where: { groupId, isActive: true }
    })

    if (schedule.length === 0) {
      return NextResponse.json({ error: 'Empty schedule' }, { status: 400 })
    }

    // Генерация дат по расписанию
    const eventsToCreate: Array<{
      title: string
      description?: string | null
      type: 'LESSON'
      startDate: Date
      endDate: Date
      location?: string | null
      createdById: string
      groupId: string
      isActive: boolean
      isAttendanceRequired: boolean
    }> = []

    // Вспомогательная функция получения следующей даты дня недели
    const getNextDateForDow = (from: Date, dow: number) => {
      const d = new Date(from)
      const currentDow = d.getDay()
      const diff = (dow - currentDow + 7) % 7
      d.setDate(d.getDate() + diff)
      return d
    }

    // Итерация по каждому дню расписания и построение событий до конца периода
    for (const item of schedule) {
      // Начинаем с ближайшей даты нужного дня недели, >= start
      let cursor = getNextDateForDow(start, item.dayOfWeek)
      while (cursor <= end) {
        // Старт и конец по времени слота
        const [sh, sm] = item.startTime.split(':').map((n) => parseInt(n, 10))
        const [eh, em] = item.endTime.split(':').map((n) => parseInt(n, 10))

        const startAt = new Date(cursor)
        startAt.setHours(sh, sm || 0, 0, 0)
        const endAt = new Date(cursor)
        endAt.setHours(eh, em || 0, 0, 0)

        eventsToCreate.push({
          title: title || 'Занятие группы',
          description: null,
          type: 'LESSON',
          startDate: startAt,
          endDate: endAt,
          location: location || null,
          createdById: user.id,
          groupId,
          isActive: true,
          isAttendanceRequired: Boolean(isAttendanceRequired)
        })

        // Переходим к следующей неделе
        const next = new Date(cursor)
        next.setDate(next.getDate() + 7)
        cursor = next
      }
    }

    // Записываем события батчом
    let created = 0
    for (const e of eventsToCreate) {
      await prisma.event.create({ data: e as any })
      created += 1
    }

    return NextResponse.json({ success: true, created })
  } catch (error) {
    console.error('[Schedule][Generate] Error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


