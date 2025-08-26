import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const moduleId = params.id

    // Проверяем, существует ли модуль
    const module = await prisma.module.findUnique({
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

    if (!module) {
      return NextResponse.json(
        { error: "Модуль не найден" },
        { status: 404 }
      )
    }

    // Получаем уроки модуля
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
        videoUrl: true,
        resources: true
      }
    })

    return NextResponse.json({ 
      lessons,
      module: {
        id: module.id,
        title: module.title,
        description: module.description,
        course: module.course
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
