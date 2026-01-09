import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { securityLogger } from '@/lib/security-logger'
import { UserRole } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  let session
  try {
    // Проверяем аутентификацию
    session = await auth()
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
    const eventType = searchParams.get('eventType')
    const userId = searchParams.get('userId')
    const riskLevel = searchParams.get('riskLevel')

    // Логируем запрос к логам безопасности
    securityLogger.logAccessAttempt(
      session.user.id,
      userRole,
      '/api/admin/security-logs',
      'GET',
      true,
      'Просмотр логов безопасности'
    )

    let events = securityLogger.getEvents(limit)

    // Фильтруем по типу события
    if (eventType) {
      events = events.filter(event => event.eventType === eventType)
    }

    // Фильтруем по пользователю
    if (userId) {
      events = events.filter(event => event.userId === userId)
    }

    // Фильтруем по уровню риска
    if (riskLevel) {
      events = events.filter(event => event.riskLevel === riskLevel)
    }

    // Получаем метрики безопасности
    const metrics = securityLogger.getMetrics()

    return NextResponse.json({
      success: true,
      events,
      metrics,
      total: events.length
    })

  } catch (error) {
    console.error('[SECURITY] Error fetching security logs:', error)
    
    // Логируем ошибку
    if (session?.user) {
      securityLogger.logEvent({
        eventType: 'SUSPICIOUS_ACTIVITY',
        userId: session.user.id,
        userEmail: session.user.email || '',
        userRole: session.user.role || '',
        status: 'FAILED',
        details: `Ошибка при получении логов безопасности: ${error}`,
        riskLevel: 'MEDIUM'
      })
    }

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

    // Проверяем роль пользователя (только админы могут очищать логи)
    const userRole = session.user.role as UserRole
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { action } = body

    if (action === 'cleanup') {
      // Очищаем старые логи
      securityLogger.cleanup()
      
      // Логируем действие
      securityLogger.logEvent({
        eventType: 'SUSPICIOUS_ACTIVITY',
        userId: session.user.id,
        userEmail: session.user.email || '',
        userRole: userRole,
        status: 'SUCCESS',
        details: 'Очистка старых логов безопасности',
        riskLevel: 'LOW'
      })

      return NextResponse.json({
        success: true,
        message: 'Логи безопасности очищены'
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('[SECURITY] Error in security logs POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
