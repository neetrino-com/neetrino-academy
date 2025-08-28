import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Получить все группы
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Проверяем роль пользователя
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user || (user.role !== 'ADMIN' && user.role !== 'TEACHER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const groups = await prisma.group.findMany({
      include: {
        _count: {
          select: {
            students: true,
            teachers: true,
            courses: true,
            assignments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(groups)
  } catch (error) {
    console.error('Error fetching groups:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Создать новую группу
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Проверяем роль пользователя
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user || (user.role !== 'ADMIN' && user.role !== 'TEACHER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      name, 
      description, 
      type, 
      maxStudents, 
      startDate, 
      endDate,
      isActive 
    } = body

    // Валидация обязательных полей
    if (!name || !type || !maxStudents || !startDate) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, maxStudents, startDate' }, 
        { status: 400 }
      )
    }

    // Проверяем, что тип корректный
    const validTypes = ['ONLINE', 'OFFLINE', 'HYBRID']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be ONLINE, OFFLINE, or HYBRID' }, 
        { status: 400 }
      )
    }

    // Создаем группу
    const group = await prisma.group.create({
      data: {
        name,
        description: description || null,
        type,
        maxStudents: parseInt(maxStudents),
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        isActive: isActive !== false // по умолчанию true
      },
      include: {
        _count: {
          select: {
            students: true,
            teachers: true,
            courses: true,
            assignments: true
          }
        }
      }
    })

    return NextResponse.json(group, { status: 201 })
  } catch (error) {
    console.error('Error creating group:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}