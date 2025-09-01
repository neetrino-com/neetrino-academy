import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Test DB: Проверяем подключение к базе данных')
    
    // Проверяем подключение к базе
    await prisma.$connect()
    console.log('✅ Test DB: Подключение к базе успешно')
    
    // Проверяем количество пользователей
    const totalUsers = await prisma.user.count()
    console.log(`✅ Test DB: Всего пользователей: ${totalUsers}`)
    
    // Проверяем учителей
    const teachers = await prisma.user.findMany({
      where: {
        role: 'TEACHER'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true
      }
    })
    
    console.log(`✅ Test DB: Найдено учителей: ${teachers.length}`)
    console.log('Учителя:', teachers)
    
    // Проверяем активных учителей
    const activeTeachers = await prisma.user.findMany({
      where: {
        role: 'TEACHER',
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    })
    
    console.log(`✅ Test DB: Активных учителей: ${activeTeachers.length}`)
    
    return NextResponse.json({
      success: true,
      totalUsers,
      teachers: teachers.length,
      activeTeachers: activeTeachers.length,
      teacherList: teachers
    })

  } catch (error) {
    console.error('❌ Test DB: Ошибка:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
