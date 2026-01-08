import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Получить группу по ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const group = await prisma.group.findUnique({
      where: { id },
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
    console.error('Error fetching group:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Обновить группу
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Проверяем роль пользователя
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user || (user.role !== 'ADMIN' && user.role !== 'TEACHER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    // Проверяем, что группа существует
    const existingGroup = await prisma.group.findUnique({
      where: { id }
    })

    if (!existingGroup) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Подготавливаем данные для обновления
    const updateData: {
      name?: string;
      description?: string;
      type?: 'ONLINE' | 'OFFLINE' | 'HYBRID';
      maxStudents?: number;
      startDate?: Date;
      endDate?: Date | null;
      isActive?: boolean;
    } = {}
    
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.type !== undefined) {
      const validTypes = ['ONLINE', 'OFFLINE', 'HYBRID']
      if (!validTypes.includes(body.type)) {
        return NextResponse.json(
          { error: 'Invalid type. Must be ONLINE, OFFLINE, or HYBRID' }, 
          { status: 400 }
        )
      }
      updateData.type = body.type
    }
    if (body.maxStudents !== undefined) updateData.maxStudents = parseInt(body.maxStudents)
    if (body.startDate !== undefined) updateData.startDate = new Date(body.startDate)
    if (body.endDate !== undefined) updateData.endDate = body.endDate ? new Date(body.endDate) : null
    if (body.isActive !== undefined) updateData.isActive = body.isActive

    const updatedGroup = await prisma.group.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            students: true,
            teachers: true,
            courses: true,
            assignments: true
          }
        }
      }
    })

    return NextResponse.json(updatedGroup)
  } catch (error) {
    console.error('Error updating group:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Удалить группу
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Проверяем роль пользователя
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user || (user.role !== 'ADMIN' && user.role !== 'TEACHER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    // Проверяем, что группа существует
    const existingGroup = await prisma.group.findUnique({
      where: { id }
    })

    if (!existingGroup) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Удаляем группу (каскадное удаление настроено в схеме Prisma)
    await prisma.group.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Group deleted successfully' })
  } catch (error) {
    console.error('Error deleting group:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
