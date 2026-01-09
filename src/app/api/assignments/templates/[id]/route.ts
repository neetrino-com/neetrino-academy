import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateTemplateSchema = z.object({
  title: z.string().min(1, 'Название шаблона обязательно').optional(),
  description: z.string().optional(),
  type: z.enum(['HOMEWORK', 'PROJECT', 'EXAM', 'QUIZ', 'PRACTICAL', 'ESSAY', 'OTHER']).optional(),
  maxScore: z.number().min(1, 'Максимальный балл должен быть больше 0').optional()
})

// GET /api/assignments/templates/[id] - получение конкретного шаблона
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { id } = await params

    // Получаем шаблон задания
    const template = await prisma.assignment.findFirst({
      where: { 
        id: id,
        isTemplate: true 
      },
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
            groupAssignments: true // Сколько раз использовался шаблон
          }
        }
      }
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Шаблон не найден' },
        { status: 404 }
      )
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error('Ошибка получения шаблона:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// PUT /api/assignments/templates/[id] - обновление шаблона
export async function PUT(
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
        { error: 'Недостаточно прав для обновления шаблонов' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateTemplateSchema.parse(body)

    // Проверяем, что шаблон существует
    const existingTemplate = await prisma.assignment.findFirst({
      where: { 
        id: id,
        isTemplate: true 
      }
    })

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Шаблон не найден' },
        { status: 404 }
      )
    }

    // Обновляем шаблон
    const updatedTemplate = await prisma.assignment.update({
      where: { id: id },
      data: {
        ...validatedData,
        updatedAt: new Date()
      },
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
            groupAssignments: true
          }
        }
      }
    })

    return NextResponse.json(updatedTemplate)
  } catch (error) {
    console.error('Ошибка обновления шаблона:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ошибка валидации', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// DELETE /api/assignments/templates/[id] - удаление шаблона
export async function DELETE(
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
        { error: 'Недостаточно прав для удаления шаблонов' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Проверяем, что шаблон существует
    const existingTemplate = await prisma.assignment.findFirst({
      where: { 
        id: id,
        isTemplate: true 
      }
    })

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Шаблон не найден' },
        { status: 404 }
      )
    }

    // Проверяем, используется ли шаблон
    const usageCount = await prisma.assignment.count({
      where: {
        templateId: id
      }
    })

    if (usageCount > 0) {
      return NextResponse.json(
        { error: 'Нельзя удалить шаблон, который используется в заданиях' },
        { status: 400 }
      )
    }

    // Удаляем шаблон
    await prisma.assignment.delete({
      where: { id: id }
    })

    return NextResponse.json({ message: 'Шаблон успешно удален' })
  } catch (error) {
    console.error('Ошибка удаления шаблона:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
