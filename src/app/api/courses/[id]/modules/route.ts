import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params

    // Проверяем, существует ли курс
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course) {
      return NextResponse.json(
        { error: "Курс не найден" },
        { status: 404 }
      )
    }

    // Получаем модули курса с уроками
    const modules = await prisma.module.findMany({
      where: { courseId },
      include: {
        lessons: {
          orderBy: {
            order: 'asc'
          },
          select: {
            id: true,
            title: true,
            duration: true,
            order: true
          }
        },
        _count: {
          select: {
            lessons: true,
            assignments: true
          }
        }
      },
      orderBy: {
        order: 'asc'
      }
    })

    return NextResponse.json({ modules })
  } catch (error) {
    console.error("Error fetching modules:", error)
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    )
  }
}
