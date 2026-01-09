import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createGroupSchema = z.object({
  title: z.string().min(1, 'Название группы обязательно'),
  description: z.string().optional(),
  order: z.number(),
  isCollapsed: z.boolean().default(false),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/admin/checklists/[id]/groups - получить группы чеклиста
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

    // Проверяем существование чеклиста
    const checklist = await prisma.checklist.findUnique({
      where: { id }
    })

    if (!checklist) {
      return NextResponse.json(
        { error: 'Чеклист не найден' },
        { status: 404 }
      )
    }

    const groups = await prisma.checklistGroup.findMany({
      where: { checklistId: id },
      orderBy: { order: 'asc' },
      include: {
        items: {
          orderBy: { order: 'asc' },
          include: {
            _count: {
              select: { progress: true }
            }
          }
        },
        _count: {
          select: { items: true }
        }
      }
    })

    return NextResponse.json(groups)

  } catch (error: unknown) {
    console.error('Ошибка получения групп чеклиста:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// POST /api/admin/checklists/[id]/groups - создать новую группу
export async function POST(request: NextRequest, { params }: RouteParams) {
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
    const validatedData = createGroupSchema.parse(body)

    // Проверяем существование чеклиста и права
    const checklist = await prisma.checklist.findUnique({
      where: { id }
    })

    if (!checklist) {
      return NextResponse.json(
        { error: 'Чеклист не найден' },
        { status: 404 }
      )
    }

    // Проверяем права на редактирование
    if (session.user.role !== 'ADMIN' && checklist.createdBy !== session.user.id) {
      return NextResponse.json(
        { error: 'Недостаточно прав для редактирования этого чеклиста' },
        { status: 403 }
      )
    }

    const group = await prisma.checklistGroup.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        order: validatedData.order,
        isCollapsed: validatedData.isCollapsed,
        checklistId: id
      },
      include: {
        items: {
          orderBy: { order: 'asc' }
        },
        _count: {
          select: { items: true }
        }
      }
    })

    return NextResponse.json({
      message: 'Группа успешно создана',
      group
    }, { status: 201 })

  } catch (error: unknown) {
    console.error('Ошибка создания группы:', error)
    
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
