import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// POST /api/quizzes/[id]/submit - отправка ответов на тест (универсальный API)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('=== POST /api/quizzes/[id]/submit - Отправка ответов на тест ===')
  
  try {
    const session = await auth()
    if (!session?.user) {
      console.log('❌ Unauthorized: No session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: quizId } = await params
    const body = await request.json()
    const { answers, assignmentId } = body

    console.log('📝 Quiz submission data:', { quizId, assignmentId, answersCount: answers?.length })

    // Получаем тест с вопросами и правильными ответами
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: {
            options: true
          }
        }
      }
    })

    if (!quiz) {
      console.log('❌ Quiz not found:', quizId)
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    console.log('✅ Quiz found:', quiz.title)

    // Подсчитываем результаты
    let totalScore = 0
    let maxScore = 0

    for (const question of quiz.questions) {
      maxScore += question.points
      
      const userAnswer = answers.find((a: { questionId: string; selectedOptions: string[] }) => a.questionId === question.id)
      if (!userAnswer) continue

      const correctOptions = question.options.filter(opt => opt.isCorrect)
      const userSelectedOptions = question.options.filter(opt => 
        userAnswer.selectedOptions.includes(opt.id)
      )

      // Проверяем правильность ответа в зависимости от типа вопроса
      let isCorrect = false
      
      if (question.type === 'SINGLE_CHOICE' || question.type === 'TRUE_FALSE') {
        // Для вопросов с одним ответом
        isCorrect = userSelectedOptions.length === 1 && 
                   correctOptions.length === 1 && 
                   userSelectedOptions[0].id === correctOptions[0].id
      } else if (question.type === 'MULTIPLE_CHOICE') {
        // Для вопросов с множественным выбором
        const userCorrectSelections = userSelectedOptions.filter(opt => opt.isCorrect)
        isCorrect = userCorrectSelections.length === correctOptions.length && 
                   userSelectedOptions.length === correctOptions.length
      }

      if (isCorrect) {
        totalScore += question.points
      }
    }

    const percentageScore = maxScore > 0 ? (totalScore / maxScore) * 100 : 0
    const passed = percentageScore >= quiz.passingScore

    console.log('📊 Quiz results:', { totalScore, maxScore, percentageScore, passed })

    // Проверяем тип теста и существующие попытки
    if (quiz.attemptType === 'SINGLE') {
      const existingAttempt = await prisma.quizAttempt.findFirst({
        where: {
          userId: session.user.id,
          quizId: quiz.id
        }
      })

      if (existingAttempt) {
        console.log('❌ Single attempt quiz already completed:', existingAttempt.id)
        return NextResponse.json({ 
          error: 'Этот тест можно пройти только один раз. Вы уже проходили его ранее.',
          existingAttempt: {
            id: existingAttempt.id,
            score: existingAttempt.score,
            passed: existingAttempt.passed,
            completedAt: existingAttempt.completedAt
          }
        }, { status: 400 })
      }
    }

    // Сохраняем попытку
    const attempt = await prisma.quizAttempt.create({
      data: {
        userId: session.user.id,
        quizId: quiz.id,
        assignmentId: assignmentId || null,
        score: percentageScore,
        maxScore,
        passed,
        completedAt: new Date()
      }
    })

    console.log('✅ Quiz attempt saved:', attempt.id)

    return NextResponse.json({
      attempt,
      score: percentageScore,
      maxScore,
      passed,
      passingScore: quiz.passingScore
    })

  } catch (error) {
    console.error('❌ Error submitting quiz:', error)
    
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    }, { status: 500 })
  }
}

// GET /api/quizzes/[id]/submit - получение информации о тесте и попытках пользователя
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('=== GET /api/quizzes/[id]/submit - Получение информации о тесте ===')
  
  try {
    const session = await auth()
    if (!session?.user) {
      console.log('❌ Unauthorized: No session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: quizId } = await params

    console.log('🔍 Fetching quiz:', quizId)

    // Получаем тест с вопросами
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: {
            options: {
              orderBy: {
                order: 'asc'
              }
            }
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    if (!quiz) {
      console.log('❌ Quiz not found:', quizId)
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    // Получаем все попытки пользователя по этому тесту
    const userAttempts = await prisma.quizAttempt.findMany({
      where: {
        userId: session.user.id,
        quizId: quizId
      },
      orderBy: {
        completedAt: 'desc'
      }
    })

    console.log('✅ Quiz and attempts fetched:', { quizTitle: quiz.title, attemptsCount: userAttempts.length })

    return NextResponse.json({
      quiz,
      userAttempts,
      latestAttempt: userAttempts[0] || null
    })

  } catch (error) {
    console.error('❌ Error fetching quiz:', error)
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    }, { status: 500 })
  }
}
