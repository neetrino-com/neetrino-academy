import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateProgressSchema = z.object({
  itemId: z.string().min(1, 'ID пункта обязателен'),
  status: z.enum(['COMPLETED', 'NOT_COMPLETED', 'NOT_NEEDED', 'HAS_QUESTIONS']),
  comment: z.string().optional(),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

// PUT /api/student/checklists/[id]/progress - обновить прогресс по пункту чеклиста
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Требуется авторизация' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateProgressSchema.parse(body)

    console.log('🔄 Обновляем статус пункта:', { 
      userId: session.user.id, 
      checklistId: id, 
      itemId: validatedData.itemId, 
      status: validatedData.status 
    })

    // Быстрая проверка существования пункта в чеклисте
    const itemExists = await prisma.checklistItem.findFirst({
      where: {
        id: validatedData.itemId,
        group: {
          checklistId: id
        }
      },
      select: { id: true }
    })

    if (!itemExists) {
      console.log('❌ Пункт не найден в чеклисте')
      return NextResponse.json(
        { error: 'Пункт не найден в этом чеклисте' },
        { status: 404 }
      )
    }

    // Обновляем только прогресс по пункту (оптимистично)
    const itemProgress = await prisma.checklistItemProgress.upsert({
      where: {
        userId_itemId: {
          userId: session.user.id,
          itemId: validatedData.itemId
        }
      },
      update: {
        status: validatedData.status,
        comment: validatedData.comment,
        updatedAt: new Date()
      },
      create: {
        userId: session.user.id,
        itemId: validatedData.itemId,
        status: validatedData.status,
        comment: validatedData.comment
      }
    })

    console.log('✅ Статус пункта обновлен:', itemProgress)

    // Асинхронно обновляем общий прогресс (не блокируем ответ)
    setImmediate(async () => {
      try {
        await updateChecklistProgress(session.user.id, id)
      } catch (error) {
        console.error('Ошибка обновления общего прогресса:', error)
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Статус обновлен',
      itemProgress: {
        id: itemProgress.id,
        itemId: itemProgress.itemId,
        status: itemProgress.status,
        updatedAt: itemProgress.updatedAt
      }
    })

  } catch (error) {
    console.error('❌ Ошибка обновления прогресса:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ошибка валидации', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// Функция для обновления общего прогресса чеклиста (вызывается асинхронно)
async function updateChecklistProgress(userId: string, checklistId: string) {
  console.log('🔄 Обновляем общий прогресс чеклиста:', { userId, checklistId })
  
  const allItems = await prisma.checklistItem.findMany({
    where: {
      group: {
        checklistId: checklistId
      }
    },
    include: {
      progress: {
        where: { userId }
      }
    }
  })

  const totalItems = allItems.length
  const completedItems = allItems.filter(item => 
    item.progress[0]?.status === 'COMPLETED' || item.progress[0]?.status === 'NOT_NEEDED'
  ).length

  const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
  const isCompleted = progressPercentage === 100

  console.log('📊 Прогресс чеклиста:', { totalItems, completedItems, progressPercentage, isCompleted })

  // Обновляем общий прогресс чеклиста
  await prisma.checklistProgress.upsert({
    where: {
      userId_checklistId: {
        userId,
        checklistId
      }
    },
    update: {
      progress: progressPercentage,
      completedAt: isCompleted ? new Date() : null
    },
    create: {
      userId,
      checklistId,
      progress: progressPercentage,
      completedAt: isCompleted ? new Date() : null
    }
  })

  // Создаем уведомление при завершении чеклиста
  if (isCompleted) {
    const checklist = await prisma.checklist.findUnique({
      where: { id: checklistId },
      select: { title: true, createdBy: true }
    })

    if (checklist) {
      await prisma.notification.create({
        data: {
          userId: checklist.createdBy,
          type: 'ASSIGNMENT_SUBMITTED',
          title: 'Чеклист завершен',
          message: `Студент завершил чеклист "${checklist.title}"`,
          data: JSON.stringify({
            checklistId,
            studentId: userId
          })
        }
      })
      console.log('🎉 Уведомление о завершении чеклиста создано')
    }
  }
}

// GET /api/student/checklists/[id]/progress - получить прогресс по чеклисту
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Требуется авторизация' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Получаем прогресс по чеклисту
    const progress = await prisma.checklistProgress.findUnique({
      where: {
        userId_checklistId: {
          userId: session.user.id,
          checklistId: id
        }
      },
      include: {
        checklist: {
          select: {
            title: true,
            description: true
          }
        }
      }
    })

    // Если прогресс не найден, создаем пустой прогресс
    if (!progress) {
      return NextResponse.json({
        id: '',
        userId: session.user.id,
        checklistId: id,
        startedAt: new Date().toISOString(),
        completedAt: null,
        progress: 0,
        checklist: {
          title: '',
          description: ''
        },
        itemsProgress: []
      })
    }

    // Получаем детальный прогресс по пунктам
    const itemsProgress = await prisma.checklistItemProgress.findMany({
      where: {
        userId: session.user.id,
        item: {
          group: {
            checklistId: id
          }
        }
      },
      include: {
        item: {
          select: {
            id: true,
            title: true,
            description: true,
            order: true,
            isRequired: true,
            group: {
              select: {
                id: true,
                title: true,
                order: true
              }
            }
          }
        }
      },
      orderBy: {
        item: {
          order: 'asc'
        }
      }
    })

    return NextResponse.json({
      ...progress,
      itemsProgress
    })

  } catch (error) {
    console.error('Ошибка получения прогресса:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
