import { NextRequest, NextResponse } from 'next/server'

// Простой тестовый endpoint для проверки работы API
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 [Test API] Test endpoint called')
    console.log('🧪 [Test API] Request URL:', request.url)
    console.log('🧪 [Test API] Request method:', request.method)
    
    return NextResponse.json({ 
      message: 'Test API working',
      timestamp: new Date().toISOString(),
      url: request.url
    })
  } catch (error) {
    console.error('❌ [Test API] Error:', error)
    return NextResponse.json({ error: 'Test API error' }, { status: 500 })
  }
}
