import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Отметить вопрос как решенный
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Проверяем, что вопрос существует
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

    // Только автор вопроса или преподаватель может отметить как решенный
    if (question.studentId !== user.id && session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Обновляем статус вопроса
    const updatedQuestion = await prisma.question.update({
      where: { id },
      data: {
        status: 'RESOLVED'
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
  } catch (error) {
    console.error('Error resolving question:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
