import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sessionManager } from '@/lib/session-manager'

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

    // Используем session manager для проверки
    const isValid = await sessionManager.scheduleUserActivityCheck(userId)

    if (!isValid) {
      console.log(`[SessionValidator] User ${userId} is no longer active`)
      return NextResponse.json({ 
        valid: false, 
        reason: 'User deactivated or deleted' 
      })
    }

    return NextResponse.json({ 
      valid: true,
      timestamp: Date.now()
    })

  } catch (error) {
    console.error('[SessionValidator] Error validating session:', error)
    return NextResponse.json({ 
      valid: false, 
      reason: 'Internal error' 
    }, { status: 500 })
  }
}
