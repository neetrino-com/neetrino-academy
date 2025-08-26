import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { error: "Необходима авторизация" },
        { status: 401 }
      )
    }

    const userId = session.user.id

    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId,
        status: 'ACTIVE'
      },
      include: {
        course: {
          include: {
            modules: {
              include: {
                lessons: {
                  include: {
                    progress: {
                      where: {
                        userId
                      }
                    }
                  }
                }
              }
            },
            _count: {
              select: {
                modules: true
              }
            }
          }
        }
      },
      orderBy: {
        enrolledAt: 'desc'
      }
    })

    // Вычисляем прогресс для каждого курса
    const coursesWithProgress = enrollments.map(enrollment => {
      const course = enrollment.course
      const totalLessons = course.modules.reduce((acc, module) => {
        return acc + module.lessons.length
      }, 0)
      
      const completedLessons = course.modules.reduce((acc, module) => {
        return acc + module.lessons.filter(lesson => 
          lesson.progress.some(p => p.completed)
        ).length
      }, 0)

      const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0

      return {
        ...enrollment,
        course: {
          ...course,
          progress: Math.round(progress),
          completedLessons,
          totalLessons
        }
      }
    })

    return NextResponse.json({
      courses: coursesWithProgress
    })
  } catch (error) {
    console.error("Error fetching user courses:", error)
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    )
  }
}
