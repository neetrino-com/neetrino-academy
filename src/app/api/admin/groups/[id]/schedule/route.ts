import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface Params {
  id: string
}

// Получить расписание группы
export async function GET(
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

    // Проверяем существование группы
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        students: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Получаем расписание группы
    const schedule = await prisma.groupSchedule.findMany({
      where: {
        groupId: groupId,
        isActive: true
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    })

    const response = {
      group: {
        id: group.id,
        name: group.name,
        students: group.students
      },
      schedule: schedule.map(item => ({
        id: item.id,
        dayOfWeek: item.dayOfWeek,
        startTime: item.startTime,
        endTime: item.endTime,
        isActive: item.isActive
      }))
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Ошибка получения расписания:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Создать новую запись расписания
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
    const { dayOfWeek, startTime, endTime } = body

    // Проверяем существование группы
    const group = await prisma.group.findUnique({
      where: { id: groupId }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Валидация данных
    if (typeof dayOfWeek !== 'number' || dayOfWeek < 0 || dayOfWeek > 6) {
      return NextResponse.json({ error: 'Invalid dayOfWeek' }, { status: 400 })
    }
    if (!startTime || !endTime) {
      return NextResponse.json({ error: 'startTime and endTime are required' }, { status: 400 })
    }

    // Проверяем, нет ли уже записи на это время в этот день
    const existingSchedule = await prisma.groupSchedule.findFirst({
      where: {
        groupId: groupId,
        dayOfWeek: dayOfWeek,
        isActive: true
      }
    })

    if (existingSchedule) {
      return NextResponse.json({ error: 'Schedule already exists for this day' }, { status: 400 })
    }

    // Создаем новую запись расписания
    const newSchedule = await prisma.groupSchedule.create({
      data: {
        groupId: groupId,
        dayOfWeek: dayOfWeek,
        startTime: startTime,
        endTime: endTime,
        isActive: true
      }
    })

    const response = {
      success: true,
      message: 'Запись расписания добавлена',
      schedule: {
        id: newSchedule.id,
        dayOfWeek: newSchedule.dayOfWeek,
        startTime: newSchedule.startTime,
        endTime: newSchedule.endTime,
        isActive: newSchedule.isActive
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Ошибка создания расписания:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Удалить запись расписания
export async function DELETE(
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
    const { scheduleId } = body

    if (!scheduleId) {
      return NextResponse.json({ error: 'scheduleId is required' }, { status: 400 })
    }

    // Проверяем существование записи расписания
    const scheduleEntry = await prisma.groupSchedule.findFirst({
      where: {
        id: scheduleId,
        groupId: groupId
      }
    })

    if (!scheduleEntry) {
      return NextResponse.json({ error: 'Schedule entry not found' }, { status: 404 })
    }

    // Удаляем запись расписания
    await prisma.groupSchedule.delete({
      where: { id: scheduleId }
    })

    const response = {
      success: true,
      message: 'Запись расписания удалена'
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Ошибка удаления расписания:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
