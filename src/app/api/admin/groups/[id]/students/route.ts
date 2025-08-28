import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Добавить студента в группу
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Проверяем, что группа существует
    const group = await prisma.group.findUnique({
      where: { id: params.id }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Проверяем, что пользователь является студентом
    const student = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!student || student.role !== 'STUDENT') {
      return NextResponse.json({ error: 'User must be a student' }, { status: 400 })
    }

    // Проверяем, что студент еще не в группе
    const existingMembership = await prisma.groupStudent.findUnique({
      where: {
        groupId_userId: {
          groupId: params.id,
          userId
        }
      }
    })

    if (existingMembership) {
      return NextResponse.json({ error: 'Student is already in this group' }, { status: 400 })
    }

    // Проверяем лимит студентов
    const currentStudentsCount = await prisma.groupStudent.count({
      where: { groupId: params.id }
    })

    if (currentStudentsCount >= group.maxStudents) {
      return NextResponse.json({ error: 'Group is full' }, { status: 400 })
    }

    // Добавляем студента в группу
    const groupStudent = await prisma.groupStudent.create({
      data: {
        groupId: params.id,
        userId,
        status: 'ACTIVE'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(groupStudent)
  } catch (error) {
    console.error('Error adding student to group:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
