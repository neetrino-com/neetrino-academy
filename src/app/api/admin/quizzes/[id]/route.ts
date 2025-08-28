import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface Params {
  id: string
}

// Получить тест по ID
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        lesson: {
          include: {
            module: {
              include: {
                course: true
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
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            startedAt: 'desc'
          }
        }
      }
    })

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    return NextResponse.json(quiz)
  } catch (error) {
    console.error('Error fetching quiz:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Обновить тест
export async function PATCH(
  request: NextRequest,
  { params }: { params: Params }
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

    const { id } = await params
    const body = await request.json()

    // Проверяем, что тест существует
    const existingQuiz = await prisma.quiz.findUnique({
      where: { id }
    })

    if (!existingQuiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    // Если это обновление базовых свойств (статус, время, проходной балл и т.д.)
    if ('isActive' in body || 'timeLimit' in body || 'passingScore' in body || 'title' in body || 'description' in body) {
      const updatedQuiz = await prisma.quiz.update({
        where: { id },
        data: {
          ...(body.title && { title: body.title }),
          ...(body.description !== undefined && { description: body.description }),
          ...(body.timeLimit && { timeLimit: body.timeLimit }),
          ...(body.passingScore && { passingScore: body.passingScore }),
          ...(body.isActive !== undefined && { isActive: body.isActive })
        },
        include: {
          lesson: {
            include: {
              module: {
                include: {
                  course: true
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
          }
        }
      })

      return NextResponse.json(updatedQuiz)
    }

    // Если это полное обновление теста с вопросами
    if (body.questions) {
      const result = await prisma.$transaction(async (tx) => {
        // Обновляем основную информацию теста
        const updatedQuiz = await tx.quiz.update({
          where: { id },
          data: {
            title: body.title,
            description: body.description,
            timeLimit: body.timeLimit,
            passingScore: body.passingScore,
            isActive: body.isActive
          }
        })

        // Удаляем все существующие вопросы и варианты ответов
        await tx.quizOption.deleteMany({
          where: {
            question: {
              quizId: id
            }
          }
        })
        
        await tx.quizQuestion.deleteMany({
          where: { quizId: id }
        })

        // Создаем новые вопросы
        for (const question of body.questions) {
          const quizQuestion = await tx.quizQuestion.create({
            data: {
              question: question.question,
              type: question.type,
              order: question.order,
              points: question.points,
              quizId: updatedQuiz.id
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

        return updatedQuiz
      })

      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'No valid update data provided' }, { status: 400 })
  } catch (error) {
    console.error('Error updating quiz:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Удалить тест
export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
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

    const { id } = await params

    // Проверяем, что тест существует
    const existingQuiz = await prisma.quiz.findUnique({
      where: { id }
    })

    if (!existingQuiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    // Удаляем в транзакции (сначала варианты ответов, потом вопросы, попытки, затем тест)
    await prisma.$transaction(async (tx) => {
      // Удаляем варианты ответов
      await tx.quizOption.deleteMany({
        where: {
          question: {
            quizId: id
          }
        }
      })

      // Удаляем вопросы
      await tx.quizQuestion.deleteMany({
        where: { quizId: id }
      })

      // Удаляем попытки прохождения теста
      await tx.quizAttempt.deleteMany({
        where: { quizId: id }
      })

      // Удаляем сам тест
      await tx.quiz.delete({
        where: { id }
      })
    })

    return NextResponse.json({ message: 'Quiz deleted successfully' })
  } catch (error) {
    console.error('Error deleting quiz:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
