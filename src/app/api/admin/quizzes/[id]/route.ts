import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Обновить тест
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Проверяем роль пользователя
    if (session.user.role !== 'ADMIN' && session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    
    console.log('=== DEBUG: Обновляем тест ===')
    console.log('Quiz ID:', id)
    console.log('Quiz data:', JSON.stringify(body, null, 2))

    const { title, description, timeLimit, passingScore, attemptType, isActive, questions } = body

    const result = await prisma.$transaction(async (tx) => {
      // Сначала получаем текущий тест
      const currentQuiz = await tx.quiz.findUnique({
        where: { id }
      })

      if (!currentQuiz) {
        throw new Error('Quiz not found')
      }

      // Обновляем основной тест
      const quiz = await tx.quiz.update({
        where: { id },
        data: {
          title,
          description,
          timeLimit: timeLimit || 30,
          passingScore: passingScore || 70,
          attemptType: attemptType || 'SINGLE',
          isActive: isActive !== undefined ? isActive : true
        }
      })

      // Удаляем старые вопросы и варианты
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
    console.error('Error updating quiz:', error)
    console.error('Quiz data received:', JSON.stringify(body, null, 2))
    
    // Более детальная обработка ошибок
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json({ 
          error: 'Урок уже имеет тест. Выберите другой урок или удалите существующий тест.' 
        }, { status: 400 })
      }
      if (error.message === 'Quiz not found') {
        return NextResponse.json({ 
          error: 'Тест не найден' 
        }, { status: 404 })
      }
    }
    
    return NextResponse.json({ 
      error: 'Внутренняя ошибка сервера',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Получить тест по ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
        questions: {
          include: {
            options: true
          },
          orderBy: { order: 'asc' }
        },
        quizLessons: {
          include: {
            lesson: {
              select: {
                id: true,
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
            }
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

// Удалить тест
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Проверяем роль пользователя
    if (session.user.role !== 'ADMIN' && session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

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
      
      // Удаляем тест
      await tx.quiz.delete({
        where: { id }
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting quiz:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}