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

    // Временно отключено: модель Question не определена в схеме Prisma
    const questions: any[] = []
    const formattedQuestions = questions.map((question: any) => ({
      id: question.id,
      title: question.title,
      content: question.content,
      studentId: question.studentId,
      studentName: question.student?.name || question.student?.email,
      status: question.status?.toLowerCase() || 'pending',
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

    // Временно отключено: модель Question не определена в схеме Prisma
    return NextResponse.json({ error: 'Question functionality is temporarily disabled' }, { status: 501 })
  } catch (error) {
    console.error('Error creating question:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
