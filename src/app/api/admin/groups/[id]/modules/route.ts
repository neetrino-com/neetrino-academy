import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface Params {
  id: string
}

// Получить все модули курсов, назначенных группе
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: groupId } = await params

    // Проверяем, что группа существует
    const group = await prisma.group.findUnique({
      where: { id: groupId }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Получаем все модули курсов, назначенных группе
    const modules = await prisma.module.findMany({
      where: {
        course: {
          groupCourses: {
            some: {
              groupId: groupId
            }
          }
        }
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            direction: true,
            level: true
          }
        },
        _count: {
          select: {
            lessons: true
          }
        }
      },
      orderBy: [
        {
          course: {
            title: 'asc'
          }
        },
        {
          order: 'asc'
        }
      ]
    })

    return NextResponse.json(modules)
  } catch (error) {
    console.error('Error fetching group modules:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
