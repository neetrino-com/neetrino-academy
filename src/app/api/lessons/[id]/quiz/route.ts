import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/lessons/[id]/quiz - получение теста урока
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const quiz = await prisma.quiz.findUnique({
      where: { lessonId: params.id },
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
    });

    if (!quiz) {
      return NextResponse.json(
        { error: 'Тест для этого урока не найден' },
        { status: 404 }
      );
    }

    // Проверяем, проходил ли пользователь этот тест
    const userAttempt = await prisma.quizAttempt.findUnique({
      where: {
        userId_quizId: {
          userId: session.user.id,
          quizId: quiz.id
        }
      }
    });

    return NextResponse.json({
      quiz,
      userAttempt
    });
  } catch (error) {
    console.error('Ошибка при получении теста:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// POST /api/lessons/[id]/quiz - отправка ответов на тест
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const body = await request.json();
    const { answers } = body; // answers: { questionId: string, selectedOptions: string[] }[]

    // Получаем тест с вопросами и правильными ответами
    const quiz = await prisma.quiz.findUnique({
      where: { lessonId: params.id },
      include: {
        questions: {
          include: {
            options: true
          }
        }
      }
    });

    if (!quiz) {
      return NextResponse.json(
        { error: 'Тест не найден' },
        { status: 404 }
      );
    }

    // Проверяем, не проходил ли пользователь тест ранее
    const existingAttempt = await prisma.quizAttempt.findUnique({
      where: {
        userId_quizId: {
          userId: session.user.id,
          quizId: quiz.id
        }
      }
    });

    if (existingAttempt) {
      return NextResponse.json(
        { error: 'Вы уже проходили этот тест' },
        { status: 400 }
      );
    }

    // Подсчитываем результаты
    let totalScore = 0;
    let maxScore = 0;

    for (const question of quiz.questions) {
      maxScore += question.points;
      
      const userAnswer = answers.find((a: any) => a.questionId === question.id);
      if (!userAnswer) continue;

      const correctOptions = question.options.filter(opt => opt.isCorrect);
      const userSelectedOptions = question.options.filter(opt => 
        userAnswer.selectedOptions.includes(opt.id)
      );

      // Проверяем правильность ответа в зависимости от типа вопроса
      let isCorrect = false;
      
      if (question.type === 'SINGLE_CHOICE' || question.type === 'TRUE_FALSE') {
        // Для вопросов с одним ответом
        isCorrect = userSelectedOptions.length === 1 && 
                   correctOptions.length === 1 && 
                   userSelectedOptions[0].id === correctOptions[0].id;
      } else if (question.type === 'MULTIPLE_CHOICE') {
        // Для вопросов с множественным выбором
        const userCorrectSelections = userSelectedOptions.filter(opt => opt.isCorrect);
        isCorrect = userCorrectSelections.length === correctOptions.length && 
                   userSelectedOptions.length === correctOptions.length;
      }

      if (isCorrect) {
        totalScore += question.points;
      }
    }

    const percentageScore = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const passed = percentageScore >= quiz.passingScore;

    // Сохраняем попытку
    const attempt = await prisma.quizAttempt.create({
      data: {
        userId: session.user.id,
        quizId: quiz.id,
        score: percentageScore,
        maxScore,
        passed,
        completedAt: new Date()
      }
    });

    return NextResponse.json({
      attempt,
      score: percentageScore,
      maxScore,
      passed,
      passingScore: quiz.passingScore
    });
  } catch (error) {
    console.error('Ошибка при отправке теста:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
