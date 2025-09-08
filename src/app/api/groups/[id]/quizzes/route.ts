import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createGroupQuizSchema = z.object({
  title: z.string().min(1, 'Название теста обязательно'),
  description: z.string().optional(),
  timeLimit: z.number().optional(),
  passingScore: z.number().min(0).max(100).optional().default(70),
  isActive: z.boolean().optional().default(true)
})

// POST /api/groups/[id]/quizzes - создание группового теста
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
        { error: 'Недостаточно прав для создания тестов' },
        { status: 403 }
      )
    }

    const { id: groupId } = await params

    // Проверяем существование группы
    const group = await prisma.group.findUnique({
      where: { id: groupId }
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Группа не найдена' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = createGroupQuizSchema.parse(body)

    // Создаем групповой тест
    const quiz = await prisma.groupQuiz.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        groupId: groupId,
        timeLimit: validatedData.timeLimit,
        passingScore: validatedData.passingScore,
        isActive: validatedData.isActive,
        createdBy: user.id
      },
      include: {
        group: {
          select: {
            id: true,
            name: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(quiz)
  } catch (error) {
    console.error('Ошибка создания группового теста:', error)
    
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

// GET /api/groups/[id]/quizzes - получение групповых тестов
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params

    // Получаем групповые тесты
    const quizzes = await prisma.groupQuiz.findMany({
      where: { groupId: groupId },
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
            attempts: true,
            questions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(quizzes)
  } catch (error) {
    console.error('Ошибка получения групповых тестов:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
