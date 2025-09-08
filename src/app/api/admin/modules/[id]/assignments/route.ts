import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/admin/modules/[id]/assignments - получение заданий модуля
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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
        { error: 'Недостаточно прав для просмотра заданий' },
        { status: 403 }
      )
    }

    // Проверяем существование модуля
    const existingModule = await prisma.module.findUnique({
      where: { id: (await params).id }
    })

    if (!existingModule) {
      return NextResponse.json(
        { error: 'Модуль не найден' },
        { status: 404 }
      )
    }

    // Получаем задания модуля через уроки
    const assignments = await prisma.assignment.findMany({
      where: { 
        lesson: {
          moduleId: (await params).id
        }
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        lesson: {
          select: {
            id: true,
            title: true,
            order: true
          }
        },
        _count: {
          select: {
            submissions: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json(assignments)
  } catch (error) {
    console.error('Ошибка получения заданий модуля:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
