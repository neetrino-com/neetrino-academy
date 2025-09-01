import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    console.log('🧪 [DEBUG] Тестирование API расписания группы group3')
    
    // Проверяем существование группы
    const group = await prisma.group.findUnique({
      where: { id: 'group3' },
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
        },
        schedule: true
      }
    })
    
    console.log('🧪 [DEBUG] Группа найдена:', !!group, group?.name)
    
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Получаем расписание группы
    const schedule = await prisma.groupSchedule.findMany({
      where: {
        groupId: 'group3',
        isActive: true
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    })

    console.log('🧪 [DEBUG] Найдено записей расписания:', schedule.length)

    const response = {
      group: {
        id: group.id,
        name: group.name,
        students: group.students.map(gs => ({
          id: gs.user.id,
          name: gs.user.name,
          email: gs.user.email
        }))
      },
      schedule: schedule.map(item => ({
        id: item.id,
        dayOfWeek: item.dayOfWeek,
        startTime: item.startTime,
        endTime: item.endTime,
        isActive: item.isActive
      }))
    }

    console.log('🧪 [DEBUG] Ответ:', JSON.stringify(response, null, 2))
    return NextResponse.json(response)

  } catch (error) {
    console.error('🧪 [DEBUG] Ошибка:', error)
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 })
  }
}
