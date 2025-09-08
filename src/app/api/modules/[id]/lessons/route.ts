import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: moduleId } = await params

    // Проверяем, существует ли модуль
    const existingModule = await prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        course: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    if (!existingModule) {
      return NextResponse.json(
        { error: "Модуль не найден" },
        { status: 404 }
      )
    }

    // Получаем уроки модуля с заданиями
    const lessons = await prisma.lesson.findMany({
      where: { moduleId },
      orderBy: {
        order: 'asc'
      },
      select: {
        id: true,
        title: true,
        content: true,
        duration: true,
        order: true,
        isActive: true,
        lectureId: true,
        checklistId: true,
        assignments: {
          select: {
            id: true,
            title: true,
            description: true,
            dueDate: true,
            type: true,
            status: true,
            maxScore: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })

    return NextResponse.json({ 
      module: {
        id: existingModule.id,
        title: existingModule.title,
        description: existingModule.description,
        order: existingModule.order,
        course: existingModule.course,
        lessons: lessons
      }
    })
  } catch (error) {
    console.error("Error fetching lessons:", error)
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    )
  }
}
