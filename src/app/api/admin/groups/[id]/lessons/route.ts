import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Получить все уроки курсов, назначенных группе
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    // Получаем все уроки курсов, назначенных группе
    const lessons = await prisma.lesson.findMany({
      where: {
        module: {
          course: {
            groupCourses: {
              some: {
                groupId: groupId
              }
            }
          }
        }
      },
      include: {
        module: {
          include: {
            course: {
              select: {
                id: true,
                title: true
              }
            }
          }
        }
      },
      orderBy: [
        {
          module: {
            course: {
              title: 'asc'
            }
          }
        },
        {
          module: {
            order: 'asc'
          }
        },
        {
          order: 'asc'
        }
      ]
    })

    return NextResponse.json(lessons)
  } catch (error) {
    console.error('Error fetching group lessons:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
