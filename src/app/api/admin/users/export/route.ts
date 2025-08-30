import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Экспорт пользователей в CSV
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Проверяем роль пользователя
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'
    const userIds = searchParams.get('userIds')?.split(',')

    // Формируем условия для выборки
    const whereCondition: {
      id?: { in: string[] };
    } = {}
    if (userIds && userIds.length > 0) {
      whereCondition.id = { in: userIds }
    }

    // Получаем пользователей с дополнительной статистикой
    const users = await prisma.user.findMany({
      where: whereCondition,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            enrollments: true,
            assignments: true,
            submissions: true,
            quizAttempts: true,
            groupStudents: true,
            groupTeachers: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Логируем экспорт
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: 'EXPORT_USERS',
        entity: 'User',
        details: JSON.stringify({ 
          count: users.length,
          format,
          partial: !!userIds
        }),
        ipAddress,
        userAgent
      }
    })

    if (format === 'json') {
      return NextResponse.json({
        users,
        exportedAt: new Date().toISOString(),
        exportedBy: currentUser.email,
        count: users.length
      })
    }

    // Формируем CSV
    const csvHeaders = [
      'ID',
      'Имя',
      'Email',
      'Роль',
      'Статус',
      'Последний вход',
      'Дата регистрации',
      'Курсы',
      'Задания',
      'Отправленные работы',
      'Попытки тестов',
      'Групп (студент)',
      'Групп (преподаватель)'
    ].join(',')

    const csvRows = users.map(user => [
      user.id,
      `"${user.name || ''}"`,
      user.email,
      user.role,
      user.isActive ? 'Активен' : 'Неактивен',
      user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('ru-RU') : '',
      new Date(user.createdAt).toLocaleDateString('ru-RU'),
      user._count.enrollments,
      user._count.assignments,
      user._count.submissions,
      user._count.quizAttempts,
      user._count.groupStudents,
      user._count.groupTeachers
    ].join(','))

    const csvContent = [csvHeaders, ...csvRows].join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })

  } catch (error) {
    console.error('Error exporting users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Экспорт выбранных пользователей
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Проверяем роль пользователя
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { userIds, format = 'csv' } = body

    if (!userIds || !Array.isArray(userIds)) {
      return NextResponse.json({ error: 'Invalid userIds' }, { status: 400 })
    }

    // Перенаправляем на GET с параметрами
    const queryParams = new URLSearchParams({
      format,
      userIds: userIds.join(',')
    })

    const url = new URL(request.url)
    url.search = queryParams.toString()

    return NextResponse.redirect(url, 302)

  } catch (error) {
    console.error('Error in POST export:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
