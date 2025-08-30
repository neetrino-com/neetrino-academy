import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createItemSchema = z.object({
  title: z.string().min(1, 'Название пункта обязательно'),
  description: z.string().optional(),
  order: z.number(),
  isRequired: z.boolean().default(true),
})

interface RouteParams {
  params: Promise<{ groupId: string }>
}

// GET /api/admin/checklists/groups/[groupId]/items - получить пункты группы
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    
    if (!session?.user || !['ADMIN', 'TEACHER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Недостаточно прав доступа' },
        { status: 403 }
      )
    }

    const { groupId } = await params

    // Проверяем существование группы
    const group = await prisma.checklistGroup.findUnique({
      where: { id: groupId },
      include: {
        checklist: true
      }
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Группа не найдена' },
        { status: 404 }
      )
    }

    const items = await prisma.checklistItem.findMany({
      where: { groupId },
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { progress: true }
        }
      }
    })

    return NextResponse.json(items)

  } catch (error: unknown) {
    console.error('Ошибка получения пунктов группы:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// POST /api/admin/checklists/groups/[groupId]/items - создать новый пункт
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    
    if (!session?.user || !['ADMIN', 'TEACHER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Недостаточно прав доступа' },
        { status: 403 }
      )
    }

    const { groupId } = await params
    const body = await request.json()
    const validatedData = createItemSchema.parse(body)

    // Проверяем существование группы и права
    const group = await prisma.checklistGroup.findUnique({
      where: { id: groupId },
      include: {
        checklist: true
      }
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Группа не найдена' },
        { status: 404 }
      )
    }

    // Проверяем права на редактирование
    if (session.user.role !== 'ADMIN' && group.checklist.createdBy !== session.user.id) {
      return NextResponse.json(
        { error: 'Недостаточно прав для редактирования этого чеклиста' },
        { status: 403 }
      )
    }

    const item = await prisma.checklistItem.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        order: validatedData.order,
        isRequired: validatedData.isRequired,
        groupId
      },
      include: {
        _count: {
          select: { progress: true }
        }
      }
    })

    return NextResponse.json({
      message: 'Пункт успешно создан',
      item
    }, { status: 201 })

  } catch (error: unknown) {
    console.error('Ошибка создания пункта:', error)
    
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
