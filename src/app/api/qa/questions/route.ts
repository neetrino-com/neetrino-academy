import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { serializePrismaData } from '@/lib/utils'

// Получить все вопросы (для преподавателей)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Только преподаватели и админы могут видеть все вопросы
    if (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const questions = await prisma.question.findMany({
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        teacher: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const formattedQuestions = questions.map(question => ({
      id: question.id,
      title: question.title,
      content: question.content,
      studentId: question.studentId,
      studentName: question.student.name || question.student.email,
      status: question.status.toLowerCase(),
      createdAt: question.createdAt,
      answeredAt: question.answeredAt,
      answer: question.answer,
      teacherId: question.teacherId,
      teacherName: question.teacher?.name || question.teacher?.email,
      tags: question.tags ? JSON.parse(question.tags) : []
    }))

    return NextResponse.json(serializePrismaData(formattedQuestions))
  } catch (error) {
    console.error('Error fetching questions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Создать новый вопрос
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, content, tags = [] } = await request.json()
    
    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const question = await prisma.question.create({
      data: {
        title,
        content,
        studentId: user.id,
        tags: JSON.stringify(tags)
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Создаем уведомления для всех преподавателей
    const teachers = await prisma.user.findMany({
      where: {
        role: { in: ['TEACHER', 'ADMIN'] }
      }
    })

    const notifications = teachers.map(teacher => ({
      userId: teacher.id,
      type: 'NEW_QUESTION',
      title: 'Новый вопрос от студента',
      message: `${user.name || user.email}: ${title}`,
      data: {
        questionId: question.id,
        studentId: user.id
      }
    }))

    await prisma.notification.createMany({
      data: notifications
    })

    return NextResponse.json({
      id: question.id,
      title: question.title,
      content: question.content,
      studentId: question.studentId,
      studentName: question.student.name || question.student.email,
      status: question.status.toLowerCase(),
      createdAt: question.createdAt,
      tags: JSON.parse(question.tags || '[]')
    })
  } catch (error) {
    console.error('Error creating question:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
