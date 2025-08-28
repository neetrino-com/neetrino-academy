import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'TEACHER')) {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    const { courseId } = await request.json()
    
    if (!courseId) {
      return NextResponse.json({ error: 'ID курса обязателен' }, { status: 400 })
    }

    // Проверяем существование группы
    const group = await prisma.group.findUnique({
      where: { id: params.id }
    })

    if (!group) {
      return NextResponse.json({ error: 'Группа не найдена' }, { status: 404 })
    }

    // Проверяем существование курса
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course) {
      return NextResponse.json({ error: 'Курс не найден' }, { status: 404 })
    }

    // Проверяем, не привязан ли уже курс к этой группе
    const existingGroupCourse = await prisma.groupCourse.findFirst({
      where: {
        groupId: params.id,
        courseId: courseId
      }
    })

    if (existingGroupCourse) {
      return NextResponse.json({ error: 'Курс уже привязан к этой группе' }, { status: 400 })
    }

    // Добавляем курс к группе
    const groupCourse = await prisma.groupCourse.create({
      data: {
        groupId: params.id,
        courseId: courseId,
        assignedAt: new Date(),
        assignedBy: session.user.id
      },
      include: {
        course: true,
        group: true
      }
    })

    return NextResponse.json(groupCourse, { status: 201 })

  } catch (error) {
    console.error('Ошибка добавления курса к группе:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'TEACHER')) {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    // Получаем все курсы группы
    const groupCourses = await prisma.groupCourse.findMany({
      where: { groupId: params.id },
      include: {
        course: {
          include: {
            modules: {
              include: {
                lessons: true
              }
            }
          }
        }
      },
      orderBy: { assignedAt: 'desc' }
    })

    return NextResponse.json(groupCourses)

  } catch (error) {
    console.error('Ошибка получения курсов группы:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
