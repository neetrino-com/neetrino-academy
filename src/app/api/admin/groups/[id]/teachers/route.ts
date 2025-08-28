import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Добавить учителя в группу
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
    const { userId, role } = body

    if (!userId || !role) {
      return NextResponse.json({ error: 'User ID and role are required' }, { status: 400 })
    }

    // Проверяем, что группа существует
    const group = await prisma.group.findUnique({
      where: { id: params.id }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Проверяем, что пользователь является учителем
    const teacher = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!teacher || teacher.role !== 'TEACHER') {
      return NextResponse.json({ error: 'User must be a teacher' }, { status: 400 })
    }

    // Проверяем, что учитель еще не в группе
    const existingMembership = await prisma.groupTeacher.findUnique({
      where: {
        groupId_userId: {
          groupId: params.id,
          userId
        }
      }
    })

    if (existingMembership) {
      return NextResponse.json({ error: 'Teacher is already in this group' }, { status: 400 })
    }

    // Добавляем учителя в группу
    const groupTeacher = await prisma.groupTeacher.create({
      data: {
        groupId: params.id,
        userId,
        role
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

    return NextResponse.json(groupTeacher)
  } catch (error) {
    console.error('Error adding teacher to group:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
