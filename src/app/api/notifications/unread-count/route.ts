import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/notifications/unread-count
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ count: 0 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user) {
      return NextResponse.json({ count: 0 })
    }

    const count = await prisma.notification.count({
      where: { userId: user.id, isRead: false }
    })

    return NextResponse.json({ count })
  } catch (error) {
    console.error('Error getting unread notifications count:', error)
    return NextResponse.json({ count: 0 })
  }
}
