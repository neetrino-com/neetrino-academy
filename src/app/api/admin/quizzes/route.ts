import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Создать тест
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { lessonId, title, description, timeLimit, passingScore, isActive, questions } = body

    // Проверяем, что урок существует
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId }
    })

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    // Создаем тест в транзакции
    const result = await prisma.$transaction(async (tx) => {
      // Создаем тест
      const quiz = await tx.quiz.create({
        data: {
          title,
          description,
          timeLimit,
          passingScore,
          isActive,
          lessonId
        }
      })

      // Создаем вопросы
      for (const question of questions) {
        const quizQuestion = await tx.quizQuestion.create({
          data: {
            question: question.question,
            type: question.type,
            order: question.order,
            points: question.points,
            quizId: quiz.id
          }
        })

        // Создаем варианты ответов
        for (const option of question.options) {
          await tx.quizOption.create({
            data: {
              text: option.text,
              isCorrect: option.isCorrect,
              order: option.order,
              questionId: quizQuestion.id
            }
          })
        }
      }

      return quiz
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error creating quiz:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Получить все тесты
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const lessonId = searchParams.get('lessonId')

    const where: {
      lessonId?: string;
    } = {}
    if (lessonId) {
      where.lessonId = lessonId
    }

    const quizzes = await prisma.quiz.findMany({
      where,
      include: {
        lesson: {
          select: {
            title: true,
            module: {
              select: {
                title: true,
                course: {
                  select: {
                    title: true
                  }
                }
              }
            }
          }
        },
        questions: {
          include: {
            options: true
          },
          orderBy: {
            order: 'asc'
          }
        },
        attempts: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(quizzes)
  } catch (error) {
    console.error('Error fetching quizzes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
