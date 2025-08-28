import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const direction = searchParams.get('direction')
    const level = searchParams.get('level')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Строим фильтр
    const where: any = {
      isActive: true,
      isDraft: false // Показываем только опубликованные курсы (не черновики)
    }

    if (direction) {
      where.direction = direction
    }

    if (level) {
      where.level = level
    }

    if (search) {
      where.title = {
        contains: search,
        mode: 'insensitive'
      }
    }

    // Получаем курсы с пагинацией
    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        include: {
          _count: {
            select: {
              modules: true,
              enrollments: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.course.count({ where })
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      courses,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })
  } catch (error) {
    console.error("Error fetching courses:", error)
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    )
  }
}
