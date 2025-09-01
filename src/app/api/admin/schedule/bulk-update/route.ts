import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, entryIds } = await request.json()

    if (!action || !entryIds || !Array.isArray(entryIds)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    let result

    switch (action) {
      case 'activate':
        result = await prisma.groupSchedule.updateMany({
          where: { id: { in: entryIds } },
          data: { isActive: true }
        })
        break

      case 'deactivate':
        result = await prisma.groupSchedule.updateMany({
          where: { id: { in: entryIds } },
          data: { isActive: false }
        })
        break

      case 'delete':
        result = await prisma.groupSchedule.deleteMany({
          where: { id: { in: entryIds } }
        })
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      updatedCount: result.count,
      action
    })

  } catch (error) {
    console.error('Error bulk updating schedule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
