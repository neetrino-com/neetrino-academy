import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { serializePrismaData } from '@/lib/utils'

// Получить вопросы конкретного студента
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const questions = await prisma.question.findMany({
      where: {
        studentId: user.id
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
    console.error('Error fetching my questions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
