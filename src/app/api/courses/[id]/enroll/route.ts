import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { error: "Необходима авторизация" },
        { status: 401 }
      )
    }

    const { id: courseId } = await params
    const userId = session.user.id

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

    // Проверяем, не записан ли уже пользователь на курс
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      }
    })

    if (existingEnrollment) {
      return NextResponse.json(
        { error: "Вы уже записаны на этот курс" },
        { status: 400 }
      )
    }

    // Записываем пользователя на курс
    const enrollment = await prisma.enrollment.create({
      data: {
        userId,
        courseId,
        status: 'ACTIVE'
      },
      include: {
        course: {
          select: {
            title: true,
            description: true
          }
        }
      }
    })

    return NextResponse.json({
      message: "Вы успешно записались на курс",
      enrollment
    }, { status: 201 })
  } catch (error) {
    console.error("Error enrolling in course:", error)
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    )
  }
}
