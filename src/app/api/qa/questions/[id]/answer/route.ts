import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Ответить на вопрос
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Только преподаватели и админы могут отвечать на вопросы
    if (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { id } = await params
    const { answer } = await request.json()

    if (!answer) {
      return NextResponse.json({ error: 'Answer is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Временно отключено: модель Question не определена в схеме Prisma
    return NextResponse.json({ error: 'Question functionality is temporarily disabled' }, { status: 501 })
    /* // Проверяем, что вопрос существует
    const question = await prisma.question.findUnique({
      where: { id },
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

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    // Обновляем вопрос с ответом
    const updatedQuestion = await prisma.question.update({
      where: { id },
      data: {
        answer,
        teacherId: user.id,
        answeredAt: new Date(),
        status: 'ANSWERED'
      },
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
      }
    })

    // Создаем уведомление для студента
    await prisma.notification.create({
      data: {
        userId: question.studentId,
        type: 'QUESTION_ANSWERED',
        title: 'На ваш вопрос дан ответ',
        message: `${user.name || user.email} ответил на ваш вопрос: "${question.title}"`,
        data: {
          questionId: question.id,
          teacherId: user.id
        }
      }
    })

    return NextResponse.json({
      id: updatedQuestion.id,
      title: updatedQuestion.title,
      content: updatedQuestion.content,
      studentId: updatedQuestion.studentId,
      studentName: updatedQuestion.student.name || updatedQuestion.student.email,
      status: updatedQuestion.status.toLowerCase(),
      createdAt: updatedQuestion.createdAt,
      answeredAt: updatedQuestion.answeredAt,
      answer: updatedQuestion.answer,
      teacherId: updatedQuestion.teacherId,
      teacherName: updatedQuestion.teacher?.name || updatedQuestion.teacher?.email,
      tags: updatedQuestion.tags ? JSON.parse(updatedQuestion.tags) : []
    })
    */
  } catch (error) {
    console.error('Error answering question:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
