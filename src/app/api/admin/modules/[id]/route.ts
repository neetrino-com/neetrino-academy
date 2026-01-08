import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateModuleSchema = z.object({
  title: z.string().min(1, 'Название модуля обязательно'),
  description: z.string().optional(),
  order: z.number().min(1, 'Порядок должен быть больше 0')
})

// GET /api/admin/modules/[id] - получение модуля
export async function GET(
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
        { error: 'Недостаточно прав для просмотра модулей' },
        { status: 403 }
      )
    }

    const { id } = await params;
    const existingModule = await prisma.module.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        },
        lessons: {
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!existingModule) {
      return NextResponse.json(
        { error: 'Модуль не найден' },
        { status: 404 }
      )
    }

    return NextResponse.json(existingModule)
  } catch (error) {
    console.error('Ошибка получения модуля:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/modules/[id] - обновление модуля
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
        { error: 'Недостаточно прав для редактирования модулей' },
        { status: 403 }
      )
    }

    const { id } = await params;
    // Проверяем существование модуля
    const existingModule = await prisma.module.findUnique({
      where: { id }
    })

    if (!existingModule) {
      return NextResponse.json(
        { error: 'Модуль не найден' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = updateModuleSchema.parse(body)

    // Обновляем модуль
    const updatedModule = await prisma.module.update({
      where: { id },
      data: {
        title: validatedData.title,
        description: validatedData.description,
        order: validatedData.order
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        }
      }
    })

    return NextResponse.json(updatedModule)
  } catch (error) {
    console.error('Ошибка обновления модуля:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Неверные данные', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/modules/[id] - удаление модуля
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
        { error: 'Недостаточно прав для удаления модулей' },
        { status: 403 }
      )
    }

    const { id } = await params;
    // Проверяем существование модуля
    const existingModule = await prisma.module.findUnique({
      where: { id }
    })

    if (!existingModule) {
      return NextResponse.json(
        { error: 'Модуль не найден' },
        { status: 404 }
      )
    }

    // Удаляем модуль (каскадно удалятся и все уроки)
    await prisma.module.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Модуль успешно удален' })
  } catch (error) {
    console.error('Ошибка удаления модуля:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
