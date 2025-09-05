import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user || !['ADMIN', 'TEACHER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const groupId = params.id
    const body = await request.json()
    const { eventIds } = body

    if (!eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
      return NextResponse.json({ error: 'No event IDs provided' }, { status: 400 })
    }

    // Проверяем существование группы
    const group = await prisma.group.findUnique({
      where: { id: groupId }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Удаляем только будущие события этой группы
    const now = new Date()
    const result = await prisma.event.deleteMany({
      where: {
        id: { in: eventIds },
        groupId: groupId,
        startDate: { gte: now } // Только будущие события
      }
    })

    return NextResponse.json({
      success: true,
      message: `Удалено ${result.count} будущих занятий группы ${group.name}`,
      deletedCount: result.count,
      group: {
        id: group.id,
        name: group.name
      }
    })

  } catch (error) {
    console.error('Error bulk deleting future events:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
