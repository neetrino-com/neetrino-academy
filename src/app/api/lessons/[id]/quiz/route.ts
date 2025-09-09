import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/lessons/[id]/quiz - получение теста урока
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { id } = await params;

    const quiz = await prisma.quiz.findUnique({
      where: { lessonId: id },
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
        { quiz: null, userAttempt: null },
        { status: 200 }
      );
    }

    // Получаем все попытки пользователя по этому тесту
    const userAttempts = await prisma.quizAttempt.findMany({
      where: {
        userId: session.user.id,
        quizId: quiz.id
      },
      orderBy: {
        completedAt: 'desc'
      }
    });

    return NextResponse.json({
      quiz,
      userAttempts,
      latestAttempt: userAttempts[0] || null
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { id } = await params;

    const body = await request.json();
    const { answers, assignmentId } = body; // answers: { questionId: string, selectedOptions: string[] }[], assignmentId: string (опционально)

    // Получаем тест с вопросами и правильными ответами
    const quiz = await prisma.quiz.findUnique({
      where: { lessonId: id },
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

    // Убираем проверку на существующую попытку - теперь разрешаем множественные попытки

    // Подсчитываем результаты
    let totalScore = 0;
    let maxScore = 0;

    for (const question of quiz.questions) {
      maxScore += question.points;
      
      const userAnswer = answers.find((a: { questionId: string; selectedOptions: string[] }) => a.questionId === question.id);
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
        assignmentId: assignmentId || null,
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
