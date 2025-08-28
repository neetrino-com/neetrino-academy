import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface Params {
  id: string
}

// Добавить студентов в группу
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
    const { studentIds } = body

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json(
        { error: 'studentIds is required and should be a non-empty array' }, 
        { status: 400 }
      )
    }

    // Проверяем, что группа существует
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        _count: {
          select: { students: true }
        }
      }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Проверяем лимит студентов
    const currentStudentCount = group._count.students
    const newStudentCount = currentStudentCount + studentIds.length

    if (newStudentCount > group.maxStudents) {
      return NextResponse.json(
        { 
          error: `Adding ${studentIds.length} students would exceed the group limit. Current: ${currentStudentCount}, Max: ${group.maxStudents}` 
        }, 
        { status: 400 }
      )
    }

    // Проверяем, что все пользователи существуют и являются студентами
    const students = await prisma.user.findMany({
      where: {
        id: { in: studentIds },
        role: 'STUDENT'
      }
    })

    if (students.length !== studentIds.length) {
      return NextResponse.json(
        { error: 'Some users are not found or are not students' }, 
        { status: 400 }
      )
    }

    // Проверяем, какие студенты уже в группе
    const existingMemberships = await prisma.groupStudent.findMany({
      where: {
        groupId,
        userId: { in: studentIds }
      }
    })

    const existingStudentIds = existingMemberships.map(membership => membership.userId)
    const newStudentIds = studentIds.filter(studentId => !existingStudentIds.includes(studentId))

    if (newStudentIds.length === 0) {
      return NextResponse.json(
        { error: 'All selected students are already in this group' }, 
        { status: 400 }
      )
    }

    // Добавляем студентов в группу
    const memberships = await prisma.groupStudent.createMany({
      data: newStudentIds.map(studentId => ({
        groupId,
        userId: studentId,
        joinedAt: new Date()
      }))
    })

    // Возвращаем информацию о добавленных студентах
    const addedStudents = await prisma.groupStudent.findMany({
      where: {
        groupId,
        userId: { in: newStudentIds }
      },
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
    })

    return NextResponse.json({
      message: `Successfully added ${newStudentIds.length} students to the group`,
      addedStudents,
      skippedCount: existingStudentIds.length
    }, { status: 201 })

  } catch (error) {
    console.error('Error adding students to group:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Получить студентов группы
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: groupId } = await params

    const groupStudents = await prisma.groupStudent.findMany({
      where: { groupId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        joinedAt: 'desc'
      }
    })

    return NextResponse.json(groupStudents)
  } catch (error) {
    console.error('Error fetching group students:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Удалить студента из группы
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
    const studentId = searchParams.get('studentId')

    if (!studentId) {
      return NextResponse.json(
        { error: 'studentId query parameter is required' }, 
        { status: 400 }
      )
    }

    // Проверяем, что студент в группе
    const membership = await prisma.groupStudent.findFirst({
      where: {
        groupId,
        userId: studentId
      }
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Student is not in this group' }, 
        { status: 404 }
      )
    }

    // Удаляем студента из группы
    await prisma.groupStudent.delete({
      where: { id: membership.id }
    })

    return NextResponse.json({ message: 'Student successfully removed from group' })
  } catch (error) {
    console.error('Error removing student from group:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}