import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Массовые операции с пользователями
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
    const { action, userIds, data } = body

    if (!action || !userIds || !Array.isArray(userIds)) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }

    let result
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    switch (action) {
      case 'activate':
        result = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { isActive: true }
        })
        
        // Логируем действие
        await prisma.auditLog.create({
          data: {
            userId: currentUser.id,
            action: 'BULK_ACTIVATE_USERS',
            entity: 'User',
            details: JSON.stringify({ 
              targetUserIds: userIds, 
              count: result.count 
            }),
            ipAddress,
            userAgent
          }
        })
        break

      case 'deactivate':
        result = await prisma.user.updateMany({
          where: { 
            id: { in: userIds },
            // Защита от деактивации собственного аккаунта
            NOT: { id: currentUser.id }
          },
          data: { isActive: false }
        })
        
        await prisma.auditLog.create({
          data: {
            userId: currentUser.id,
            action: 'BULK_DEACTIVATE_USERS',
            entity: 'User',
            details: JSON.stringify({ 
              targetUserIds: userIds, 
              count: result.count 
            }),
            ipAddress,
            userAgent
          }
        })
        break

      case 'promote_teacher':
        result = await prisma.user.updateMany({
          where: { 
            id: { in: userIds },
            role: 'STUDENT' // Только студентов можно повысить до преподавателей
          },
          data: { role: 'TEACHER' }
        })
        
        await prisma.auditLog.create({
          data: {
            userId: currentUser.id,
            action: 'BULK_PROMOTE_TO_TEACHER',
            entity: 'User',
            details: JSON.stringify({ 
              targetUserIds: userIds, 
              count: result.count 
            }),
            ipAddress,
            userAgent
          }
        })
        break

      case 'demote_student':
        result = await prisma.user.updateMany({
          where: { 
            id: { in: userIds },
            role: 'TEACHER', // Только преподавателей можно понизить до студентов
            NOT: { id: currentUser.id } // Защита от понижения собственного аккаунта
          },
          data: { role: 'STUDENT' }
        })
        
        await prisma.auditLog.create({
          data: {
            userId: currentUser.id,
            action: 'BULK_DEMOTE_TO_STUDENT',
            entity: 'User',
            details: JSON.stringify({ 
              targetUserIds: userIds, 
              count: result.count 
            }),
            ipAddress,
            userAgent
          }
        })
        break

      case 'send_notification':
        // Создаем уведомления для выбранных пользователей
        const notificationData = data?.notification
        if (!notificationData || !notificationData.title || !notificationData.message) {
          return NextResponse.json({ error: 'Missing notification data' }, { status: 400 })
        }

        const notifications = userIds.map((userId: string) => ({
          userId,
          type: 'ANNOUNCEMENT' as const,
          title: notificationData.title,
          message: notificationData.message,
          isRead: false
        }))

        result = await prisma.notification.createMany({
          data: notifications
        })
        
        await prisma.auditLog.create({
          data: {
            userId: currentUser.id,
            action: 'BULK_SEND_NOTIFICATION',
            entity: 'User',
            details: JSON.stringify({ 
              targetUserIds: userIds, 
              count: result.count,
              notificationTitle: notificationData.title
            }),
            ipAddress,
            userAgent
          }
        })
        break

      case 'delete':
        // Мягкое удаление - просто деактивируем пользователей
        result = await prisma.user.updateMany({
          where: { 
            id: { in: userIds },
            NOT: { id: currentUser.id } // Защита от удаления собственного аккаунта
          },
          data: { 
            isActive: false,
            // Можно добавить поле deletedAt если нужно
          }
        })
        
        await prisma.auditLog.create({
          data: {
            userId: currentUser.id,
            action: 'BULK_SOFT_DELETE_USERS',
            entity: 'User',
            details: JSON.stringify({ 
              targetUserIds: userIds, 
              count: result.count 
            }),
            ipAddress,
            userAgent
          }
        })
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully processed ${result?.count || 0} users`,
      count: result?.count || 0
    })

  } catch (error) {
    console.error('Error in bulk user operation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
