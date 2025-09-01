import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    console.log('🧪 [TEST] Проверка данных расписания')
    
    // Получаем все группы
    const groups = await prisma.group.findMany({
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
    
    console.log('🧪 [TEST] Найдено групп:', groups.length)
    
    // Получаем все записи расписания
    const schedules = await prisma.groupSchedule.findMany({
      include: {
        group: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
    
    console.log('🧪 [TEST] Найдено записей расписания:', schedules.length)
    
    return NextResponse.json({
      groups: groups.map(group => ({
        id: group.id,
        name: group.name,
        studentsCount: group.students.length,
        scheduleCount: group.schedule.length,
        students: group.students.map(gs => ({
          id: gs.user.id,
          name: gs.user.name,
          email: gs.user.email
        }))
      })),
      schedules: schedules.map(schedule => ({
        id: schedule.id,
        groupId: schedule.groupId,
        groupName: schedule.group.name,
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        isActive: schedule.isActive
      }))
    })
    
  } catch (error) {
    console.error('🧪 [TEST] Ошибка:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
