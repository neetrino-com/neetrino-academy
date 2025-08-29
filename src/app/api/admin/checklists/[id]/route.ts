import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateChecklistSchema = z.object({
  title: z.string().min(1, 'Название обязательно'),
  description: z.string().optional(),
  direction: z.enum(['WORDPRESS', 'VIBE_CODING', 'SHOPIFY']),
  thumbnail: z.string().optional(),
  isActive: z.boolean(),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/admin/checklists/[id] - получить чеклист по ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    
    if (!session?.user || !['ADMIN', 'TEACHER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Недостаточно прав доступа' },
        { status: 403 }
      )
    }

    const { id } = await params

    const checklist = await prisma.checklist.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        groups: {
          orderBy: { order: 'asc' },
          include: {
            items: {
              orderBy: { order: 'asc' },
              include: {
                _count: {
                  select: { progress: true }
                }
              }
            }
          }
        },
        _count: {
          select: {
            lessons: true,
            progress: true
          }
        }
      }
    })

    if (!checklist) {
      return NextResponse.json(
        { error: 'Чеклист не найден' },
        { status: 404 }
      )
    }

    return NextResponse.json(checklist)

  } catch (error) {
    console.error('Ошибка получения чеклиста:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/checklists/[id] - обновить чеклист
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    
    if (!session?.user || !['ADMIN', 'TEACHER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Недостаточно прав доступа' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateChecklistSchema.parse(body)

    // Проверяем существование чеклиста
    const existingChecklist = await prisma.checklist.findUnique({
      where: { id }
    })

    if (!existingChecklist) {
      return NextResponse.json(
        { error: 'Чеклист не найден' },
        { status: 404 }
      )
    }

    // Проверяем права на редактирование (только создатель или админ)
    if (session.user.role !== 'ADMIN' && existingChecklist.createdBy !== session.user.id) {
      return NextResponse.json(
        { error: 'Недостаточно прав для редактирования этого чеклиста' },
        { status: 403 }
      )
    }

    const updatedChecklist = await prisma.checklist.update({
      where: { id },
      data: {
        title: validatedData.title,
        description: validatedData.description,
        direction: validatedData.direction,
        thumbnail: validatedData.thumbnail,
        isActive: validatedData.isActive,
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
        groups: {
          orderBy: { order: 'asc' },
          include: {
            items: {
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Чеклист успешно обновлен',
      checklist: updatedChecklist
    })

  } catch (error) {
    console.error('Ошибка обновления чеклиста:', error)
    
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

// DELETE /api/admin/checklists/[id] - удалить чеклист
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    
    if (!session?.user || !['ADMIN', 'TEACHER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Недостаточно прав доступа' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Проверяем существование чеклиста
    const existingChecklist = await prisma.checklist.findUnique({
      where: { id },
      include: {
        _count: {
          select: { lessons: true }
        }
      }
    })

    if (!existingChecklist) {
      return NextResponse.json(
        { error: 'Чеклист не найден' },
        { status: 404 }
      )
    }

    // Проверяем права на удаление (только создатель или админ)
    if (session.user.role !== 'ADMIN' && existingChecklist.createdBy !== session.user.id) {
      return NextResponse.json(
        { error: 'Недостаточно прав для удаления этого чеклиста' },
        { status: 403 }
      )
    }

    // Проверяем, используется ли чеклист в уроках
    if (existingChecklist._count.lessons > 0) {
      return NextResponse.json(
        { 
          error: 'Нельзя удалить чеклист, который используется в уроках',
          details: `Чеклист используется в ${existingChecklist._count.lessons} уроках`
        },
        { status: 400 }
      )
    }

    // Удаляем чеклист (каскадное удаление групп и пунктов произойдет автоматически)
    await prisma.checklist.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Чеклист успешно удален'
    })

  } catch (error) {
    console.error('Ошибка удаления чеклиста:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
