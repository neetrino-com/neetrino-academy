import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API /admin/teachers: Начинаем обработку запроса')
    
    const session = await auth()
    console.log('🔍 API /admin/teachers: Session:', session ? 'exists' : 'null')
    
    if (!session?.user) {
      console.log('❌ API /admin/teachers: Unauthorized - нет сессии')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ API /admin/teachers: Пользователь авторизован:', session.user.email)

    const teachers = await prisma.user.findMany({
      where: {
        role: 'TEACHER',
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    console.log(`✅ API /admin/teachers: Найдено учителей: ${teachers.length}`)
    return NextResponse.json(teachers)

  } catch (error) {
    console.error('❌ API /admin/teachers: Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
