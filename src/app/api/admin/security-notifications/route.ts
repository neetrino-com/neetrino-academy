import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { securityNotificationManager } from '@/lib/security-notifications'
import { UserRole } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  try {
    // Проверяем аутентификацию
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Проверяем роль пользователя
    const userRole = session.user.role as UserRole
    if (!['ADMIN', 'TEACHER'].includes(userRole)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Получаем параметры запроса
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const type = searchParams.get('type')
    const riskLevel = searchParams.get('riskLevel')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    // Логируем запрос к уведомлениям безопасности
    console.log(`[SECURITY] Security notifications accessed by ${userRole} for ${request.url}`)

    let notifications = securityNotificationManager.getNotifications(limit)

    // Фильтруем по типу
    if (type) {
      notifications = notifications.filter(n => n.type === type)
    }

    // Фильтруем по уровню риска
    if (riskLevel) {
      notifications = notifications.filter(n => n.riskLevel === riskLevel)
    }

    // Фильтруем только непрочитанные
    if (unreadOnly) {
      notifications = notifications.filter(n => !n.isRead)
    }

    // Получаем статистику уведомлений
    const stats = securityNotificationManager.getNotificationStats()

    return NextResponse.json({
      success: true,
      notifications,
      stats,
      total: notifications.length
    })

  } catch (error) {
    console.error('[SECURITY] Error fetching security notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Проверяем аутентификацию
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Проверяем роль пользователя (только админы могут управлять уведомлениями)
    const userRole = session.user.role as UserRole
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { action, notificationId, ruleData } = body

    switch (action) {
      case 'markAsRead':
        if (!notificationId) {
          return NextResponse.json({ error: 'Notification ID required' }, { status: 400 })
        }
        securityNotificationManager.markAsRead(notificationId)
        return NextResponse.json({
          success: true,
          message: 'Уведомление отмечено как прочитанное'
        })

      case 'markAllAsRead':
        securityNotificationManager.markAllAsRead()
        return NextResponse.json({
          success: true,
          message: 'Все уведомления отмечены как прочитанные'
        })

      case 'deleteNotification':
        if (!notificationId) {
          return NextResponse.json({ error: 'Notification ID required' }, { status: 400 })
        }
        securityNotificationManager.deleteNotification(notificationId)
        return NextResponse.json({
          success: true,
          message: 'Уведомление удалено'
        })

      case 'addRule':
        if (!ruleData) {
          return NextResponse.json({ error: 'Rule data required' }, { status: 400 })
        }
        const ruleId = securityNotificationManager.addRule(ruleData)
        return NextResponse.json({
          success: true,
          message: 'Правило уведомлений добавлено',
          ruleId
        })

      case 'updateRule':
        if (!notificationId || !ruleData) {
          return NextResponse.json({ error: 'Rule ID and data required' }, { status: 400 })
        }
        const updated = securityNotificationManager.updateRule(notificationId, ruleData)
        if (updated) {
          return NextResponse.json({
            success: true,
            message: 'Правило уведомлений обновлено'
          })
        } else {
          return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
        }

      case 'deleteRule':
        if (!notificationId) {
          return NextResponse.json({ error: 'Rule ID required' }, { status: 400 })
        }
        const deleted = securityNotificationManager.deleteRule(notificationId)
        if (deleted) {
          return NextResponse.json({
            success: true,
            message: 'Правило уведомлений удалено'
          })
        } else {
          return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
        }

      case 'cleanup':
        securityNotificationManager.cleanupOldNotifications()
        return NextResponse.json({
          success: true,
          message: 'Старые уведомления очищены'
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('[SECURITY] Error in security notifications POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
