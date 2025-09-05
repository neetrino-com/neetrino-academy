import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['ADMIN', 'TEACHER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const groupId = params.id
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status') // 'active', 'inactive', 'all'
    const dateFilter = searchParams.get('date') // 'past', 'future', 'today', 'all'
    const search = searchParams.get('search') || ''

    // Проверяем существование группы
    const group = await prisma.group.findUnique({
      where: { id: groupId }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Строим фильтры
    const where: any = {
      groupId: groupId
    }

    // Фильтр по статусу
    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }

    // Фильтр по дате
    const now = new Date()
    if (dateFilter === 'past') {
      where.startDate = { lt: now }
    } else if (dateFilter === 'future') {
      where.startDate = { gte: now }
    } else if (dateFilter === 'today') {
      const todayStart = new Date(now)
      todayStart.setHours(0, 0, 0, 0)
      const todayEnd = new Date(now)
      todayEnd.setHours(23, 59, 59, 999)
      where.startDate = { gte: todayStart, lte: todayEnd }
    }

    // Поиск
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { createdBy: { name: { contains: search, mode: 'insensitive' } } }
      ]
    }

    // Получаем события с пагинацией
    const [events, totalCount] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          group: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { startDate: 'asc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.event.count({ where })
    ])

    // Форматируем события
    const formattedEvents = events.map(event => ({
      id: event.id,
      title: event.title,
      start: event.startDate.toISOString(),
      end: event.endDate.toISOString(),
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      groupId: event.groupId,
      groupName: event.group?.name || 'Неизвестная группа',
      teacherId: event.createdById,
      teacherName: event.createdBy?.name || 'Неизвестный учитель',
      location: event.location,
      type: event.type,
      isActive: event.isActive,
      isAttendanceRequired: event.isAttendanceRequired,
      color: getEventColor(event.type, event.group?.type)
    }))

    // Статистика
    const stats = await prisma.event.groupBy({
      by: ['isActive'],
      where: { groupId },
      _count: true
    })

    const activeCount = stats.find(s => s.isActive)?._count || 0
    const inactiveCount = stats.find(s => !s.isActive)?._count || 0

    return NextResponse.json({
      events: formattedEvents,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      },
      stats: {
        total: totalCount,
        active: activeCount,
        inactive: inactiveCount
      }
    })

  } catch (error) {
    console.error('Error fetching group events:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getEventColor(type: string, groupType?: string): string {
  const colors: Record<string, string> = {
    'LESSON': '#3B82F6',
    'LECTURE': '#8B5CF6',
    'PRACTICE': '#10B981',
    'EXAM': '#EF4444',
    'OTHER': '#6B7280'
  }
  return colors[type] || colors['OTHER']
}
