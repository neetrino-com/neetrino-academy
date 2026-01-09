import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const copyTemplateSchema = z.object({
  dueDate: z.string().optional(), // Дата сдачи для нового задания
  lessonId: z.string().optional(), // ID урока (если нужно привязать к уроку)
  groupId: z.string().optional()   // ID группы (если копируем в группу)
})

// POST /api/assignments/templates/[id]/copy - копирование шаблона в задание
export async function POST(
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
        { error: 'Недостаточно прав для копирования шаблонов' },
        { status: 403 }
      )
    }

    const { id: templateId } = await params
    const body = await request.json()
    const validatedData = copyTemplateSchema.parse(body)

    // Получаем шаблон
    const template = await prisma.assignment.findFirst({
      where: { 
        id: templateId,
        isTemplate: true 
      }
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Шаблон не найден' },
        { status: 404 }
      )
    }

    // Создаем новое задание на основе шаблона
    const newAssignment = await prisma.assignment.create({
      data: {
        title: template.title,
        description: template.description,
        type: template.type,
        maxScore: template.maxScore,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        lessonId: validatedData.lessonId || null,
        isTemplate: false, // Это обычное задание
        templateId: templateId, // Ссылка на шаблон
        createdBy: user.id
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
            title: true
          }
        }
      }
    })

    // Если указана группа, назначаем задание группе
    if (validatedData.groupId) {
      await prisma.groupAssignment.create({
        data: {
          groupId: validatedData.groupId,
          assignmentId: newAssignment.id,
          dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : new Date()
        }
      })
    }

    return NextResponse.json({
      message: 'Задание успешно создано из шаблона',
      assignment: newAssignment
    })
  } catch (error) {
    console.error('Ошибка копирования шаблона:', error)
    
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
