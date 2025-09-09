import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface Params {
  id: string
}

export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: groupId } = params
    const userId = session.user.id

    // Проверяем, является ли студент участником группы
    const groupMembership = await prisma.groupStudent.findFirst({
      where: {
        groupId: groupId,
        userId: userId,
        status: 'ACTIVE'
      }
    })

    if (!groupMembership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Получаем информацию о группе
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        students: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          },
          orderBy: {
            joinedAt: 'desc'
          }
        },
        teachers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          },
          orderBy: {
            joinedAt: 'desc'
          }
        },
        courses: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                description: true,
                direction: true,
                level: true,
                isActive: true
              }
            }
          },
          orderBy: {
            assignedAt: 'desc'
          }
        },
        assignments: {
          include: {
            assignment: {
              select: {
                id: true,
                title: true,
                description: true,
                dueDate: true,
                lessonId: true,
                type: true,
                status: true,
                maxScore: true,
                createdBy: true,
                createdAt: true,
                updatedAt: true
              }
            }
          },
          orderBy: {
            assignedAt: 'desc'
          }
        }
      }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    return NextResponse.json(group)
  } catch (error) {
    console.error('Error fetching student group:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
