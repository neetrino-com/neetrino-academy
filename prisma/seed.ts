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
        duration: Math.floor(Math.random() * 40) + 20, // 20-60 часов
        price: Math.floor(Math.random() * 5000) + 1000, // 1000-6000 рублей
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
                    lectureId: lectures[i % 10].id // Прикрепляем лекцию к первому уроку
                  },
                  {
                    title: 'Подготовка окружения',
                    content: 'Настройка необходимых инструментов и программ для работы.',
                    duration: 30,
                    order: 2,
                    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
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
                    lectureId: lectures[(i + 1) % 10].id // Прикрепляем лекцию ко второму уроку
                  },
                  {
                    title: 'Практические примеры',
                    content: 'Разбор практических примеров и кейсов.',
                    duration: 60,
                    order: 2,
                    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
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
                    lectureId: lectures[(i + 2) % 10].id // Прикрепляем лекцию к третьему уроку
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

  // Записываем студента на все курсы
  for (const course of courses) {
    await prisma.enrollment.create({
      data: {
        userId: student.id,
        courseId: course.id,
        status: 'ACTIVE'
      }
    })
  }

  console.log('✅ Записи на курсы созданы')

  console.log('🎉 База данных успешно заполнена!')
  console.log('')
  console.log('📋 Данные для входа:')
  console.log('👨‍💼 Админ: admin@academy.com / password')
  console.log('👨‍🏫 Преподаватель: teacher@academy.com / password')
  console.log('👨‍🎓 Студент: student@academy.com / password')
  console.log('')
  console.log('📊 Создано:')
  console.log(`   - ${courses.length} курсов`)
  console.log(`   - ${lectures.length} лекций`)
  console.log(`   - ${lessons.length} уроков`)
  console.log(`   - ${Math.floor(lessons.length / 2)} задач`)
  console.log(`   - ${Math.floor(lessons.length / 3)} тестов`)
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
