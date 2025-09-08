import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          include: {
            lessons: {
              orderBy: {
                order: 'asc'
              },
              select: {
                id: true,
                title: true,
                duration: true,
                order: true,
                lectureId: true,
                lecture: {
                  select: {
                    id: true,
                    title: true,
                    description: true
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
                }
              }
            },
            
            _count: {
              select: {
                lessons: true
              }
            }
          },
          orderBy: {
            order: 'asc'
          }
        },
        _count: {
          select: {
            enrollments: true
          }
        }
      }
    })

    if (!course) {
      return NextResponse.json(
        { error: "Курс не найден" },
        { status: 404 }
      )
    }

    return NextResponse.json({ course })
  } catch (error) {
    console.error("Error fetching course:", error)
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    )
  }
}
