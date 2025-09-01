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
      where: { id: groupId }
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

    return NextResponse.json({
      group: {
        id: group.id,
        name: group.name
      },
      schedule: schedule.map(item => ({
        id: item.id,
        dayOfWeek: item.dayOfWeek,
        startTime: item.startTime,
        endTime: item.endTime,
        isActive: item.isActive
      }))
    })

  } catch (error) {
    console.error('Ошибка получения расписания:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Создать или обновить расписание группы
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
    const { schedule } = body

    // Проверяем существование группы
    const group = await prisma.group.findUnique({
      where: { id: groupId }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Валидация данных расписания
    if (!Array.isArray(schedule)) {
      return NextResponse.json({ error: 'Schedule must be an array' }, { status: 400 })
    }

    for (const item of schedule) {
      if (typeof item.dayOfWeek !== 'number' || item.dayOfWeek < 0 || item.dayOfWeek > 6) {
        return NextResponse.json({ error: 'Invalid dayOfWeek' }, { status: 400 })
      }
      if (!item.startTime || !item.endTime) {
        return NextResponse.json({ error: 'startTime and endTime are required' }, { status: 400 })
      }
    }

    // Удаляем старое расписание
    await prisma.groupSchedule.deleteMany({
      where: { groupId: groupId }
    })

    // Создаем новое расписание
    const newSchedule = await prisma.groupSchedule.createMany({
      data: schedule.map(item => ({
        groupId: groupId,
        dayOfWeek: item.dayOfWeek,
        startTime: item.startTime,
        endTime: item.endTime,
        isActive: item.isActive !== false
      }))
    })

    return NextResponse.json({
      success: true,
      message: 'Расписание обновлено',
      count: newSchedule.count
    })

  } catch (error) {
    console.error('Ошибка обновления расписания:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
