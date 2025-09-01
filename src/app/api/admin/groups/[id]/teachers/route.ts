import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface Params {
  id: string
}

// Добавить преподавателей в группу
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<Params> }
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

    const { id: groupId } = await params
    const body = await request.json()
    const { teacherIds } = body

    if (!teacherIds || !Array.isArray(teacherIds) || teacherIds.length === 0) {
      return NextResponse.json(
        { error: 'teacherIds is required and should be a non-empty array' }, 
        { status: 400 }
      )
    }

    // Проверяем, что группа существует
    const group = await prisma.group.findUnique({
      where: { id: groupId }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Проверяем, что все пользователи существуют и являются преподавателями или админами
    const teachers = await prisma.user.findMany({
      where: {
        id: { in: teacherIds },
        role: { in: ['TEACHER', 'ADMIN'] }
      }
    })

    if (teachers.length !== teacherIds.length) {
      return NextResponse.json(
        { error: 'Some users are not found or are not teachers/admins' }, 
        { status: 400 }
      )
    }

    // Проверяем, какие преподаватели уже в группе
    const existingMemberships = await prisma.groupTeacher.findMany({
      where: {
        groupId,
        userId: { in: teacherIds }
      }
    })

    const existingTeacherIds = existingMemberships.map(membership => membership.userId)
    const newTeacherIds = teacherIds.filter(teacherId => !existingTeacherIds.includes(teacherId))

    if (newTeacherIds.length === 0) {
      return NextResponse.json(
        { error: 'All selected teachers are already in this group' }, 
        { status: 400 }
      )
    }

    // Добавляем преподавателей в группу
    const memberships = await prisma.groupTeacher.createMany({
      data: newTeacherIds.map(teacherId => ({
        groupId,
        userId: teacherId,
        joinedAt: new Date()
      }))
    })

    // Возвращаем информацию о добавленных преподавателях
    const addedTeachers = await prisma.groupTeacher.findMany({
      where: {
        groupId,
        userId: { in: newTeacherIds }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true
          }
        }
      },
      orderBy: {
        joinedAt: 'desc'
      }
    })

    return NextResponse.json({
      message: `Successfully added ${newTeacherIds.length} teachers to the group`,
      addedTeachers,
      skippedCount: existingTeacherIds.length
    }, { status: 201 })

  } catch (error) {
    console.error('Error adding teachers to group:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user || !['ADMIN', 'TEACHER'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: groupId } = await params

    // Проверяем существование группы
    const group = await prisma.group.findUnique({
      where: { id: groupId }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Получаем учителей группы
    const groupTeachers = await prisma.groupTeacher.findMany({
      where: { groupId },
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
        joinedAt: 'asc'
      }
    })

    const teachers = groupTeachers.map(gt => ({
      id: gt.user.id,
      name: gt.user.name,
      email: gt.user.email,
      avatar: gt.user.avatar,
      role: gt.role,
      joinedAt: gt.joinedAt
    }))

    return NextResponse.json(teachers)

  } catch (error) {
    console.error('Error fetching group teachers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Удалить преподавателя из группы
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<Params> }
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

    const { id: groupId } = await params
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacherId')

    if (!teacherId) {
      return NextResponse.json(
        { error: 'teacherId query parameter is required' }, 
        { status: 400 }
      )
    }

    // Проверяем, что преподаватель в группе
    const membership = await prisma.groupTeacher.findFirst({
      where: {
        groupId,
        userId: teacherId
      }
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Teacher is not in this group' }, 
        { status: 404 }
      )
    }

    // Удаляем преподавателя из группы
    await prisma.groupTeacher.delete({
      where: { id: membership.id }
    })

    return NextResponse.json({ message: 'Teacher successfully removed from group' })
  } catch (error) {
    console.error('Error removing teacher from group:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}