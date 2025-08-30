import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Начинаем заполнение базы данных...')

  // Создаем админа
  const admin = await prisma.user.upsert({
    where: { email: 'admin@academy.com' },
    update: {},
    create: {
      email: 'admin@academy.com',
      name: 'Администратор',
      role: 'ADMIN',
      password: '$2a$12$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1m', // password
    },
  })

  // Создаем студента
  const student = await prisma.user.upsert({
    where: { email: 'student@academy.com' },
    update: {},
    create: {
      email: 'student@academy.com',
      name: 'Студент Тестовый',
      role: 'STUDENT',
      password: '$2a$12$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1m', // password
      age: 25,
      gender: 'male',
      phone: '+374 55 123 456',
      city: 'Ереван',
      country: 'Армения',
      telegram: '@student_test',
    },
  })

  // Создаем дополнительных студентов для демонстрации
  const student2 = await prisma.user.upsert({
    where: { email: 'anna@academy.com' },
    update: {},
    create: {
      email: 'anna@academy.com',
      name: 'Анна Петрова',
      role: 'STUDENT',
      password: '$2a$12$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1m', // password
      age: 22,
      gender: 'female',
      phone: '+374 77 987 654',
      city: 'Гюмри',
      country: 'Армения',
      instagram: '@anna_petrov',
    },
  })

  const student3 = await prisma.user.upsert({
    where: { email: 'john@academy.com' },
    update: {},
    create: {
      email: 'john@academy.com',
      name: 'John Smith',
      role: 'STUDENT',
      password: '$2a$12$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1m', // password
      age: 28,
      gender: 'male',
      phone: '+374 99 555 123',
      city: 'Ванадзор',
      country: 'Армения',
      address: 'ул. Тиграна Меца, 15',
    },
  })

  // Создаем преподавателя
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@academy.com' },
    update: {},
    create: {
      email: 'teacher@academy.com',
      name: 'Преподаватель Тестовый',
      role: 'TEACHER',
      password: '$2a$12$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1m', // password
    },
  })

  console.log('✅ Пользователи созданы')

  // Создаем 10 лекций (больше для разнообразия)
  const lectures = []
  const lectureTitles = [
    'Введение в программирование',
    'Основы веб-разработки',
    'Базы данных и SQL',
    'JavaScript для начинающих',
    'React и современный фронтенд',
    'Node.js и серверная разработка',
    'Python для веб-разработки',
    'DevOps и развертывание',
    'Мобильная разработка',
    'Машинное обучение'
  ]

  for (let i = 0; i < 10; i++) {
    const lecture = await prisma.lecture.create({
      data: {
        title: lectureTitles[i],
        description: `Подробная лекция по теме "${lectureTitles[i]}" с практическими примерами и теорией.`,
        content: JSON.stringify([
          {
            id: `text-${i}-1`,
            type: 'text',
            content: `Это вводная лекция по теме "${lectureTitles[i]}". Здесь вы изучите основные концепции и принципы.`
          },
          {
            id: `text-${i}-2`,
            type: 'text',
            content: 'В этой части лекции мы рассмотрим практические примеры и кейсы использования изученных концепций.'
          },
          {
            id: `link-${i}-1`,
            type: 'link',
            content: 'Дополнительные материалы',
            metadata: {
              url: 'https://example.com/resources'
            }
          }
        ]),
        isActive: true,
        createdBy: admin.id
      }
    })
    lectures.push(lecture)
  }

  console.log('✅ Лекции созданы')

  // Создаем 10 курсов
  const courseTitles = [
    'Основы программирования на Python',
    'Веб-разработка с нуля',
    'JavaScript для веб-разработчиков',
    'React и современный фронтенд',
    'Node.js и серверная разработка',
    'Базы данных и SQL',
    'DevOps и развертывание приложений',
    'Мобильная разработка на React Native',
    'Машинное обучение и AI',
    'Кибербезопасность для разработчиков'
  ]

  const courses = []
  for (let i = 0; i < 10; i++) {
    const course = await prisma.course.create({
      data: {
        title: courseTitles[i],
        description: `Полный курс по ${courseTitles[i].toLowerCase()}. Изучите теорию и практику под руководством опытных преподавателей.`,
        slug: `course-${i + 1}`,
        direction: 'VIBE_CODING',
        level: 'BEGINNER',
        duration: i % 2 === 0 ? 3 : 1, // Чередуем 3 месяца и 1 месяц
        durationUnit: 'months',
        currency: 'AMD',
        paymentType: i % 2 === 0 ? 'MONTHLY' : 'ONE_TIME', // Чередуем типы оплаты
        monthlyPrice: i % 2 === 0 ? 30000 : null, // Для ежемесячных курсов
        totalPrice: i % 2 === 0 ? null : (i < 5 ? 30000 : 70000), // Для разовых курсов
        price: i % 2 === 0 ? 30000 : (i < 5 ? 30000 : 70000), // Совместимость со старым полем
        isActive: true,
        isDraft: false,
        createdBy: admin.id,
        modules: {
          create: [
            {
              title: 'Введение в курс',
              description: 'Базовые концепции и подготовка к изучению',
              order: 1,
              lessons: {
                create: [
                  {
                    title: 'Знакомство с курсом',
                    content: 'В этом уроке вы познакомитесь с программой курса и узнаете, что вас ожидает.',
                    duration: 15,
                    order: 1,
                    lecture: {
                      connect: { id: lectures[i % 10].id }
                    }
                  },
                  {
                    title: 'Подготовка окружения',
                    content: 'Настройка необходимых инструментов и программ для работы.',
                    duration: 30,
                    order: 2
                  }
                ]
              }
            },
            {
              title: 'Основы и теория',
              description: 'Теоретические основы и базовые концепции',
              order: 2,
              lessons: {
                create: [
                  {
                    title: 'Основные концепции',
                    content: 'Изучение фундаментальных принципов и концепций.',
                    duration: 45,
                    order: 1,
                    lecture: {
                      connect: { id: lectures[(i + 1) % 10].id }
                    }
                  },
                  {
                    title: 'Практические примеры',
                    content: 'Разбор практических примеров и кейсов.',
                    duration: 60,
                    order: 2
                  }
                ]
              }
            },
            {
              title: 'Практика и проекты',
              description: 'Практические задания и мини-проекты',
              order: 3,
              lessons: {
                create: [
                  {
                    title: 'Практическое задание',
                    content: 'Выполнение практического задания для закрепления материала.',
                    duration: 90,
                    order: 1,
                    lecture: {
                      connect: { id: lectures[(i + 2) % 10].id }
                    }
                  },
                  {
                    title: 'Мини-проект',
                    content: 'Создание небольшого проекта для применения полученных знаний.',
                    duration: 120,
                    order: 2
                  }
                ]
              }
            }
          ]
        }
      }
    })
    courses.push(course)
  }

  console.log('✅ Курсы созданы')

  // Создаем задачи для уроков
  const lessons = await prisma.lesson.findMany({
    include: {
      module: true
    }
  })

  for (let i = 0; i < lessons.length; i++) {
    const lesson = lessons[i]
    
    // Создаем задачу для каждого второго урока (чтобы было больше задач)
    if (i % 2 === 0) {
      await prisma.assignment.create({
        data: {
          title: `Задание по уроку: ${lesson.title}`,
          description: `Выполните практическое задание по теме "${lesson.title}". Создайте проект, демонстрирующий понимание изученного материала.`,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // через неделю
          moduleId: lesson.moduleId,
          createdBy: admin.id
        }
      })
    }

    // Создаем тест для каждого третьего урока
    if (i % 3 === 0) {
      await prisma.quiz.create({
        data: {
          title: `Тест по уроку: ${lesson.title}`,
          description: `Проверьте свои знания по теме "${lesson.title}"`,
          timeLimit: 15,
          passingScore: 70,
          lessonId: lesson.id,
          questions: {
            create: [
              {
                question: 'Какой из следующих принципов является основным в программировании?',
                type: 'SINGLE_CHOICE',
                order: 1,
                points: 1,
                options: {
                  create: [
                    { text: 'DRY (Don\'t Repeat Yourself)', isCorrect: true, order: 1 },
                    { text: 'KISS (Keep It Simple, Stupid)', isCorrect: false, order: 2 },
                    { text: 'YAGNI (You Aren\'t Gonna Need It)', isCorrect: false, order: 3 },
                    { text: 'Все вышеперечисленные', isCorrect: false, order: 4 }
                  ]
                }
              },
              {
                question: 'Какие языки программирования вы изучали?',
                type: 'MULTIPLE_CHOICE',
                order: 2,
                points: 2,
                options: {
                  create: [
                    { text: 'Python', isCorrect: true, order: 1 },
                    { text: 'JavaScript', isCorrect: true, order: 2 },
                    { text: 'Java', isCorrect: false, order: 3 },
                    { text: 'C++', isCorrect: false, order: 4 }
                  ]
                }
              }
            ]
          }
        }
      })
    }
  }

  console.log('✅ Задачи и тесты созданы')

  // Записываем студентов на курсы с новыми полями платежей
  const students = [student, student2, student3]
  
  for (let i = 0; i < students.length; i++) {
    const currentStudent = students[i]
    
    // Каждый студент записывается на 2-3 курса
    const coursesToEnroll = courses.slice(i * 2, (i * 2) + 3)
    
    for (const course of coursesToEnroll) {
      const enrollment = await prisma.enrollment.create({
        data: {
          userId: currentStudent.id,
          courseId: course.id,
          status: 'ACTIVE',
          paymentStatus: i === 0 ? 'PAID' : (i === 1 ? 'PENDING' : 'OVERDUE'),
          nextPaymentDue: course.paymentType === 'MONTHLY' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null // Следующий месяц
        }
      })

      // Создаем платежи для каждого курса
      if (course.paymentType === 'MONTHLY') {
        // Ежемесячный курс - создаем несколько платежей
        for (let month = 1; month <= course.duration!; month++) {
          const dueDate = new Date()
          dueDate.setMonth(dueDate.getMonth() + month - 1)
          
          await prisma.payment.create({
            data: {
              userId: currentStudent.id,
              courseId: course.id,
              amount: course.monthlyPrice!,
              currency: 'AMD',
              status: month === 1 && i === 0 ? 'PAID' : (month === 1 && i === 2 ? 'OVERDUE' : 'PENDING'),
              paymentType: 'MONTHLY',
              monthNumber: month,
              dueDate: dueDate,
              paidAt: month === 1 && i === 0 ? new Date() : null,
              paymentMethod: month === 1 && i === 0 ? 'card' : null,
              transactionId: month === 1 && i === 0 ? `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : null,
              notes: `Ежемесячный платеж ${month}/${course.duration} за курс "${course.title}"`
            }
          })
        }
      } else {
        // Разовый курс - один платеж
        await prisma.payment.create({
          data: {
            userId: currentStudent.id,
            courseId: course.id,
            amount: course.totalPrice!,
            currency: 'AMD',
            status: i === 0 ? 'PAID' : (i === 1 ? 'PENDING' : 'OVERDUE'),
            paymentType: 'ONE_TIME',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Через неделю
            paidAt: i === 0 ? new Date() : null,
            paymentMethod: i === 0 ? 'card' : null,
            transactionId: i === 0 ? `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : null,
            notes: `Разовая оплата за весь курс "${course.title}"`
          }
        })
      }
    }
  }

  console.log('✅ Записи на курсы и платежи созданы')

  console.log('🎉 База данных успешно заполнена!')
  console.log('')
  console.log('📋 Данные для входа:')
  console.log('👨‍💼 Админ: admin@academy.com / password')
  console.log('👨‍🏫 Преподаватель: teacher@academy.com / password')
  console.log('👨‍🎓 Студенты:')
  console.log('   - student@academy.com / password (Студент Тестовый, 25 лет)')
  console.log('   - anna@academy.com / password (Анна Петрова, 22 года)')
  console.log('   - john@academy.com / password (John Smith, 28 лет)')
  console.log('')
  console.log('📊 Создано:')
  console.log(`   - ${courses.length} курсов (с ежемесячной и разовой оплатой)`)
  console.log(`   - ${lectures.length} лекций`)
  console.log(`   - ${lessons.length} уроков`)
  console.log(`   - ${Math.floor(lessons.length / 2)} задач`)
  console.log(`   - ${Math.floor(lessons.length / 3)} тестов`)
  console.log(`   - 3 студента с расширенными профилями`)
  console.log(`   - Платежи и записи на курсы с разными статусами`)
  console.log('')
  console.log('💳 Система платежей:')
  console.log('   - Ежемесячные курсы: 30,000 AMD/месяц')
  console.log('   - Разовые курсы: 30,000 или 70,000 AMD за весь период')
  console.log('   - Разные статусы платежей для демонстрации')
  console.log('')
  console.log('🔗 Тестовые ссылки:')
  console.log('   - Админка: http://localhost:3001/app/admin')
  console.log('   - Курсы: http://localhost:3001/courses')
  console.log('   - Лекции: http://localhost:3001/lectures')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
