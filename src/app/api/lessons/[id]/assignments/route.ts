import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createAssignmentSchema = z.object({
  title: z.string().min(1, 'Название задания обязательно'),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  type: z.enum(['HOMEWORK', 'PROJECT', 'EXAM', 'QUIZ', 'PRACTICAL', 'ESSAY', 'OTHER']).optional().default('HOMEWORK'),
  status: z.enum(['DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED']).optional().default('DRAFT'),
  maxScore: z.number().optional().default(100)
})

// POST /api/lessons/[id]/assignments - создание задания в уроке
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    // Проверяем роль пользователя
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user || (user.role !== 'TEACHER' && user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Недостаточно прав для создания заданий' },
        { status: 403 }
      )
    }

    const { id: lessonId } = await params

    // Проверяем существование урока
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId }
    })

    if (!lesson) {
      return NextResponse.json(
        { error: 'Урок не найден' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = createAssignmentSchema.parse(body)

    // Создаем задание
    const assignment = await prisma.assignment.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        lessonId: lessonId,
        type: validatedData.type,
        status: validatedData.status,
        maxScore: validatedData.maxScore,
        createdBy: user.id
      },
      include: {
        lesson: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    return NextResponse.json(assignment)
  } catch (error) {
    console.error('Ошибка создания задания:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Неверные данные', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// GET /api/lessons/[id]/assignments - получение заданий урока
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: lessonId } = await params

    // Получаем задания урока
    const assignments = await prisma.assignment.findMany({
      where: { lessonId: lessonId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            submissions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(assignments)
  } catch (error) {
    console.error('Ошибка получения заданий:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
