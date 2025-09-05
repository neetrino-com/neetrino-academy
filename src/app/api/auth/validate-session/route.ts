import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sessionManager } from '@/lib/session-manager'

// Кэш для быстрых проверок (в памяти)
const sessionCache = new Map<string, { valid: boolean; timestamp: number }>()

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        valid: false, 
        reason: 'No session' 
      })
    }

    const body = await request.json()
    const { userId, timestamp } = body

    // Проверяем, что запрос от того же пользователя
    if (session.user.id !== userId) {
      return NextResponse.json({ 
        valid: false, 
        reason: 'User ID mismatch' 
      })
    }

    const now = Date.now()
    const cacheKey = userId

    // Проверяем кэш (действителен 2 минуты)
    const cached = sessionCache.get(cacheKey)
    if (cached && (now - cached.timestamp) < 120000) {
      return NextResponse.json({ 
        valid: cached.valid,
        timestamp: cached.timestamp,
        cached: true
      })
    }

    // Используем session manager для проверки
    const isValid = await sessionManager.scheduleUserActivityCheck(userId)

    // Обновляем кэш
    sessionCache.set(cacheKey, { valid: isValid, timestamp: now })

    // Очищаем старые записи из кэша (старше 10 минут)
    for (const [key, value] of sessionCache.entries()) {
      if (now - value.timestamp > 600000) {
        sessionCache.delete(key)
      }
    }

    if (!isValid) {
      console.log(`[SessionValidator] User ${userId} is no longer active`)
      return NextResponse.json({ 
        valid: false, 
        reason: 'User deactivated or deleted' 
      })
    }

    return NextResponse.json({ 
      valid: true,
      timestamp: now,
      cached: false
    })

  } catch (error) {
    console.error('[SessionValidator] Error validating session:', error)
    return NextResponse.json({ 
      valid: false, 
      reason: 'Internal error' 
    }, { status: 500 })
  }
}
