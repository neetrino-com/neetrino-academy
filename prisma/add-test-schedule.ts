import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addTestSchedule() {
  try {
    console.log('🔄 Добавление тестовых данных расписания...')

    // Получаем группы
    const groups = await prisma.group.findMany({
      where: { isActive: true }
    })

    console.log(`📋 Найдено групп: ${groups.length}`)

    // Получаем учителей
    const teachers = await prisma.user.findMany({
      where: { role: 'TEACHER', isActive: true }
    })

    console.log(`👨‍🏫 Найдено учителей: ${teachers.length}`)

    if (groups.length === 0 || teachers.length === 0) {
      console.log('❌ Нет групп или учителей для создания расписания')
      return
    }

    // Удаляем существующие записи расписания
    await prisma.groupSchedule.deleteMany({})
    console.log('🗑️ Удалены существующие записи расписания')

    const generatedEntries = []

    for (const group of groups) {
      // Выбираем случайного учителя
      const teacher = teachers[Math.floor(Math.random() * teachers.length)]
      
      // Создаем связь учителя с группой
      await prisma.groupTeacher.upsert({
        where: {
          groupId_userId: {
            groupId: group.id,
            userId: teacher.id
          }
        },
        update: {},
        create: {
          groupId: group.id,
          userId: teacher.id,
          role: 'MAIN'
        }
      })

      // Генерируем 2-3 занятия в неделю
      const daysOfWeek = [1, 2, 3, 4, 5] // Пн-Пт
      const timeSlots = [
        { start: '09:00', end: '10:30' },
        { start: '11:00', end: '12:30' },
        { start: '14:00', end: '15:30' },
        { start: '16:00', end: '17:30' },
        { start: '18:00', end: '19:30' }
      ]

      const numLessons = Math.floor(Math.random() * 2) + 2 // 2-3 занятия
      const selectedDays = daysOfWeek.sort(() => 0.5 - Math.random()).slice(0, numLessons)

      for (const dayOfWeek of selectedDays) {
        const timeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)]
        
        const scheduleEntry = await prisma.groupSchedule.create({
          data: {
            groupId: group.id,
            dayOfWeek,
            startTime: timeSlot.start,
            endTime: timeSlot.end,
            isActive: true
          }
        })

        generatedEntries.push({
          id: scheduleEntry.id,
          groupName: group.name,
          teacherName: teacher.name,
          dayOfWeek,
          startTime: timeSlot.start,
          endTime: timeSlot.end
        })

        console.log(`✅ Создано занятие: ${group.name} - ${teacher.name} - ${getDayName(dayOfWeek)} ${timeSlot.start}-${timeSlot.end}`)
      }
    }

    console.log(`🎉 Готово! Создано ${generatedEntries.length} занятий`)
    console.log('\n📊 Сводка:')
    generatedEntries.forEach(entry => {
      console.log(`  • ${entry.groupName} - ${entry.teacherName} - ${getDayName(entry.dayOfWeek)} ${entry.startTime}-${entry.endTime}`)
    })

  } catch (error) {
    console.error('❌ Ошибка:', error)
  } finally {
    await prisma.$disconnect()
  }
}

function getDayName(dayOfWeek: number): string {
  const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']
  return days[dayOfWeek]
}

addTestSchedule()
