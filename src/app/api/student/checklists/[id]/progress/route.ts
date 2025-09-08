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

    // Проверяем существование чеклиста и пункта
    const checklist = await prisma.checklist.findUnique({
      where: { id, isActive: true },
      include: {
        groups: {
          include: {
            items: {
              where: { id: validatedData.itemId }
            }
          }
        }
      }
    })

    if (!checklist) {
      return NextResponse.json(
        { error: 'Чеклист не найден или неактивен' },
        { status: 404 }
      )
    }

    // Проверяем, что пункт принадлежит этому чеклисту
    const item = checklist.groups.flatMap(g => g.items).find(i => i.id === validatedData.itemId)
    if (!item) {
      return NextResponse.json(
        { error: 'Пункт не найден в этом чеклисте' },
        { status: 404 }
      )
    }

    // Создаем или обновляем прогресс по пункту
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

    // Пересчитываем общий прогресс чеклиста
    const allItems = await prisma.checklistItem.findMany({
      where: {
        group: {
          checklistId: id
        }
      },
      include: {
        progress: {
          where: { userId: session.user.id }
        }
      }
    })

    const totalItems = allItems.length
    const completedItems = allItems.filter(item => 
      item.progress[0]?.status === 'COMPLETED' || item.progress[0]?.status === 'NOT_NEEDED'
    ).length

    const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
    const isCompleted = progressPercentage === 100

    // Обновляем общий прогресс чеклиста
    await prisma.checklistProgress.upsert({
      where: {
        userId_checklistId: {
          userId: session.user.id,
          checklistId: id
        }
      },
      update: {
        progress: progressPercentage,
        completedAt: isCompleted ? new Date() : null
      },
      create: {
        userId: session.user.id,
        checklistId: id,
        progress: progressPercentage,
        completedAt: isCompleted ? new Date() : null
      }
    })

    // Создаем уведомление при завершении чеклиста
    if (isCompleted) {
      await prisma.notification.create({
        data: {
          userId: checklist.createdBy,
          type: 'ASSIGNMENT_SUBMITTED', // Используем существующий тип
          title: 'Чеклист завершен',
          message: `Студент ${session.user.name} завершил чеклист "${checklist.title}"`,
          data: JSON.stringify({
            checklistId: id,
            studentId: session.user.id,
            studentName: session.user.name
          })
        }
      })
    }

    return NextResponse.json({
      message: 'Прогресс обновлен',
      itemProgress,
      checklistProgress: {
        totalItems,
        completedItems,
        progress: progressPercentage,
        isCompleted
      }
    })

  } catch (error) {
    console.error('Ошибка обновления прогресса:', error)
    
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
