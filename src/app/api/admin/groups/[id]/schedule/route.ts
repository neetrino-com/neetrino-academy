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
    console.log('🔍 [GET] Запрос расписания группы')
    
    const session = await auth()
    console.log('👤 [GET] Сессия:', session?.user?.email)
    console.log('👤 [GET] Полная сессия:', JSON.stringify(session, null, 2))
    
    if (!session?.user) {
      console.log('❌ [GET] Не авторизован')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    console.log('👤 [GET] Пользователь:', user?.role, user?.id)

    if (!user || !['ADMIN', 'TEACHER'].includes(user.role)) {
      console.log('❌ [GET] Нет прав доступа:', user?.role)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: groupId } = await params
    console.log('📋 [GET] ID группы:', groupId)

    // Проверяем существование группы
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        students: {
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

    console.log('📋 [GET] Группа найдена:', !!group, group?.name)

    if (!group) {
      console.log('❌ [GET] Группа не найдена')
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

    console.log('📅 [GET] Найдено записей расписания:', schedule.length)

    const response = {
      group: {
        id: group.id,
        name: group.name,
        students: group.students.map(gs => ({
          id: gs.user.id,
          name: gs.user.name,
          email: gs.user.email
        }))
      },
      schedule: schedule.map(item => ({
        id: item.id,
        dayOfWeek: item.dayOfWeek,
        startTime: item.startTime,
        endTime: item.endTime,
        isActive: item.isActive
      }))
    }

    console.log('✅ [GET] Ответ:', JSON.stringify(response, null, 2))
    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ [GET] Ошибка получения расписания:', error)
    console.error('❌ [GET] Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
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
