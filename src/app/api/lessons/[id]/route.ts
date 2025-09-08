import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: lessonId } = await params

    // Получаем урок с информацией о модуле, курсе, лекции, заданиях и тестах
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: {
              select: {
                id: true,
                title: true
              }
            }
          }
        },
        lecture: {
          select: {
            id: true,
            title: true,
            description: true,
            content: true
          }
        },
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
        },
        quiz: {
          select: {
            id: true,
            title: true,
            description: true,
            timeLimit: true,
            passingScore: true
          }
        }
      }
    })

    if (!lesson) {
      return NextResponse.json(
        { error: "Урок не найден" },
        { status: 404 }
      )
    }

    return NextResponse.json({ lesson })
  } catch (error) {
    console.error("Error fetching lesson:", error)
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    )
  }
}
