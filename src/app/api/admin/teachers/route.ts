import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔍 Поиск учителей в базе данных...')

    const teachers = await prisma.user.findMany({
      where: {
        role: 'TEACHER',
        isActive: true
      },
      include: {
        groups: {
          include: {
            students: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    console.log(`✅ Найдено учителей: ${teachers.length}`)
    console.log('Учителя:', teachers.map(t => ({ id: t.id, name: t.name, email: t.email })))

    return NextResponse.json(teachers)

  } catch (error) {
    console.error('❌ Error fetching teachers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
