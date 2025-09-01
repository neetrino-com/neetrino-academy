import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Test Auth: Начинаем проверку авторизации')
    
    const session = await auth()
    console.log('🔍 Test Auth: Session:', session ? 'exists' : 'null')
    
    if (session?.user) {
      console.log('✅ Test Auth: Пользователь авторизован:', session.user.email)
      return NextResponse.json({ 
        authenticated: true, 
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role
        }
      })
    } else {
      console.log('❌ Test Auth: Пользователь не авторизован')
      return NextResponse.json({ 
        authenticated: false, 
        message: 'No session found' 
      })
    }

  } catch (error) {
    console.error('❌ Test Auth: Ошибка:', error)
    return NextResponse.json({ 
      authenticated: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
