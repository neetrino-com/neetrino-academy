import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface Params {
  id: string
}

// Назначить курсы группе
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
    const { courseIds } = body

    if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      return NextResponse.json(
        { error: 'courseIds is required and should be a non-empty array' }, 
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

    // Проверяем, что все курсы существуют и активны
    const courses = await prisma.course.findMany({
      where: {
        id: { in: courseIds },
        isActive: true,
        isDraft: false
      }
    })

    if (courses.length !== courseIds.length) {
      return NextResponse.json(
        { error: 'Some courses are not found or not active' }, 
        { status: 400 }
      )
    }

    // Проверяем, какие курсы уже назначены
    const existingAssignments = await prisma.groupCourse.findMany({
      where: {
        groupId,
        courseId: { in: courseIds }
      }
    })

    const existingCourseIds = existingAssignments.map(assignment => assignment.courseId)
    const newCourseIds = courseIds.filter(courseId => !existingCourseIds.includes(courseId))

    if (newCourseIds.length === 0) {
      return NextResponse.json(
        { error: 'All selected courses are already assigned to this group' }, 
        { status: 400 }
      )
    }

    // Создаем новые назначения
    const assignments = await prisma.groupCourse.createMany({
      data: newCourseIds.map(courseId => ({
        groupId,
        courseId,
        assignedAt: new Date()
      }))
    })

    // Возвращаем информацию о назначенных курсах
    const assignedCourses = await prisma.groupCourse.findMany({
      where: {
        groupId,
        courseId: { in: newCourseIds }
      },
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
    })

    return NextResponse.json({
      message: `Successfully assigned ${newCourseIds.length} courses to the group`,
      assignedCourses,
      skippedCount: existingCourseIds.length
    }, { status: 201 })

  } catch (error) {
    console.error('Error assigning courses to group:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Получить курсы группы
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

    const groupCourses = await prisma.groupCourse.findMany({
      where: { groupId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            direction: true,
            level: true,
            isActive: true,
            _count: {
              select: {
                modules: true,
                enrollments: true
              }
            }
          }
        }
      },
      orderBy: {
        assignedAt: 'desc'
      }
    })

    return NextResponse.json(groupCourses)
  } catch (error) {
    console.error('Error fetching group courses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Удалить курс из группы
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
    const courseId = searchParams.get('courseId')

    if (!courseId) {
      return NextResponse.json(
        { error: 'courseId query parameter is required' }, 
        { status: 400 }
      )
    }

    // Проверяем, что назначение существует
    const assignment = await prisma.groupCourse.findFirst({
      where: {
        groupId,
        courseId
      }
    })

    if (!assignment) {
      return NextResponse.json(
        { error: 'Course assignment not found' }, 
        { status: 404 }
      )
    }

    // Удаляем назначение
    await prisma.groupCourse.delete({
      where: { id: assignment.id }
    })

    return NextResponse.json({ message: 'Course successfully removed from group' })
  } catch (error) {
    console.error('Error removing course from group:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}