import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Начинаем заполнение базы данных...')

  // Создаем тестового пользователя
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Тестовый пользователь',
      password: '$2b$12$QhIQOiMRnMAy2T9UEzcaq.QrAuBxVg82.ihMbxgaO0InyJxmxbn2m', // password: test123
      role: 'STUDENT'
    }
  })

  console.log(`✅ Тестовый пользователь создан: ${testUser.email}`)

  // Создаем тестового преподавателя
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@example.com' },
    update: {},
    create: {
      email: 'teacher@example.com',
      name: 'Преподаватель',
      password: '$2b$12$QhIQOiMRnMAy2T9UEzcaq.QrAuBxVg82.ihMbxgaO0InyJxmxbn2m', // password: test123
      role: 'TEACHER'
    }
  })

  console.log(`✅ Преподаватель создан: ${teacher.email}`)

  // Создаем тестовые курсы
  const courses = [
    {
      title: 'WordPress для начинающих',
      description: 'Изучите основы создания сайтов на WordPress. От установки до публикации первого сайта.',
      slug: 'wordpress-beginner',
      direction: 'WORDPRESS',
      level: 'BEGINNER',
      price: 0,
      isActive: true
    },
    {
      title: 'Создание тем WordPress',
      description: 'Научитесь создавать собственные темы для WordPress с нуля.',
      slug: 'wordpress-themes',
      direction: 'WORDPRESS',
      level: 'INTERMEDIATE',
      price: 15000,
      isActive: true
    },
    {
      title: 'Разработка плагинов WordPress',
      description: 'Создавайте функциональные плагины для расширения возможностей WordPress.',
      slug: 'wordpress-plugins',
      direction: 'WORDPRESS',
      level: 'ADVANCED',
      price: 25000,
      isActive: true
    },
    {
      title: 'Vibe Coding - Основы',
      description: 'Современная веб-разработка с использованием AI-инструментов и новейших технологий.',
      slug: 'vibe-coding-basics',
      direction: 'VIBE_CODING',
      level: 'BEGINNER',
      price: 0,
      isActive: true
    },
    {
      title: 'Vibe Coding - Продвинутый',
      description: 'Продвинутые техники разработки с AI-ассистентами и автоматизацией.',
      slug: 'vibe-coding-advanced',
      direction: 'VIBE_CODING',
      level: 'ADVANCED',
      price: 30000,
      isActive: true
    },
    {
      title: 'Shopify для начинающих',
      description: 'Создавайте интернет-магазины на платформе Shopify.',
      slug: 'shopify-beginner',
      direction: 'SHOPIFY',
      level: 'BEGINNER',
      price: 12000,
      isActive: true
    },
    {
      title: 'Разработка приложений Shopify',
      description: 'Создавайте собственные приложения для расширения функциональности Shopify.',
      slug: 'shopify-apps',
      direction: 'SHOPIFY',
      level: 'ADVANCED',
      price: 35000,
      isActive: true
    }
  ]

  for (const courseData of courses) {
    const course = await prisma.course.upsert({
      where: { slug: courseData.slug },
      update: {},
      create: courseData as any
    })

    console.log(`✅ Курс создан: ${course.title}`)

    // Создаем модули для каждого курса
    const modules = [
      {
        title: 'Введение в курс',
        description: 'Обзор курса и настройка окружения',
        order: 1
      },
      {
        title: 'Основы и теория',
        description: 'Теоретические основы и базовые концепции',
        order: 2
      },
      {
        title: 'Практические задания',
        description: 'Выполнение практических заданий',
        order: 3
      },
      {
        title: 'Финальный проект',
        description: 'Создание итогового проекта',
        order: 4
      }
    ]

    for (const moduleData of modules) {
      const module = await prisma.module.create({
        data: {
          ...moduleData,
          courseId: course.id
        }
      })

      console.log(`  📚 Модуль создан: ${module.title}`)

      // Создаем уроки для каждого модуля с правильным URL видео
      const lessons = [
        {
          title: 'Урок 1: Введение в курс',
          content: 'В этом уроке мы познакомимся с основами курса, изучим структуру обучения и настроим рабочее окружение для эффективного изучения материала.',
          videoUrl: 'https://www.youtube.com/watch?v=QkPEj2xYqHo', // Правильный URL
          duration: 30,
          order: 1
        },
        {
          title: 'Урок 2: Основные концепции',
          content: 'Изучим основные концепции и принципы, которые будут использоваться на протяжении всего курса. Разберем ключевые термины и определения.',
          videoUrl: 'https://www.youtube.com/watch?v=QkPEj2xYqHo', // Правильный URL
          duration: 45,
          order: 2
        },
        {
          title: 'Урок 3: Практическое применение',
          content: 'Применим полученные знания на практике. Выполним несколько упражнений и создадим первый проект, используя изученные концепции.',
          videoUrl: 'https://www.youtube.com/watch?v=QkPEj2xYqHo', // Правильный URL
          duration: 60,
          order: 3
        }
      ]

      for (const lessonData of lessons) {
        const lesson = await prisma.lesson.create({
          data: {
            ...lessonData,
            moduleId: module.id
          }
        })

        console.log(`    📖 Урок создан: ${lesson.title}`)

        // Создаем тест для каждого урока
        {
          const quiz = await prisma.quiz.create({
            data: {
              title: `Тест по уроку: ${lessonData.title}`,
              description: `Проверьте свои знания по материалу урока "${lessonData.title}"`,
              lessonId: lesson.id,
              timeLimit: 15, // 15 минут
              passingScore: 70
            }
          })

          console.log(`    🧪 Тест создан для урока: ${lessonData.title}`)

          // Создаем вопросы для теста
          const questions = [
            {
              question: 'Какой основной принцип изучается в этом уроке?',
              type: 'SINGLE_CHOICE',
              order: 1,
              points: 1,
              options: [
                { text: 'Правильный ответ', isCorrect: true, order: 1 },
                { text: 'Неправильный ответ 1', isCorrect: false, order: 2 },
                { text: 'Неправильный ответ 2', isCorrect: false, order: 3 },
                { text: 'Неправильный ответ 3', isCorrect: false, order: 4 }
              ]
            },
            {
              question: 'Какие инструменты используются в этом уроке?',
              type: 'MULTIPLE_CHOICE',
              order: 2,
              points: 2,
              options: [
                { text: 'Правильный инструмент 1', isCorrect: true, order: 1 },
                { text: 'Правильный инструмент 2', isCorrect: true, order: 2 },
                { text: 'Неправильный инструмент', isCorrect: false, order: 3 },
                { text: 'Еще один правильный', isCorrect: true, order: 4 }
              ]
            },
            {
              question: 'Верно ли утверждение о том, что изученный материал важен для дальнейшего обучения?',
              type: 'TRUE_FALSE',
              order: 3,
              points: 1,
              options: [
                { text: 'Да', isCorrect: true, order: 1 },
                { text: 'Нет', isCorrect: false, order: 2 }
              ]
            }
          ]

          for (const questionData of questions) {
            const question = await prisma.quizQuestion.create({
              data: {
                question: questionData.question,
                type: questionData.type,
                order: questionData.order,
                points: questionData.points,
                quizId: quiz.id
              }
            })

            // Создаем варианты ответов
            for (const optionData of questionData.options) {
              await prisma.quizOption.create({
                data: {
                  text: optionData.text,
                  isCorrect: optionData.isCorrect,
                  order: optionData.order,
                  questionId: question.id
                }
              })
            }
          }

          console.log(`    📝 Вопросы созданы для теста`)
        }
      }
    }
  }

  // Создаем тестовые задания
  console.log('📝 Создаем тестовые задания...')
  
  // Получаем все модули для создания заданий
  const allModules = await prisma.module.findMany({
    include: {
      course: true
    }
  })

  const assignments = [
    {
      title: 'Создание простого сайта',
      description: 'Создайте простой сайт на WordPress с использованием стандартной темы. Сайт должен содержать главную страницу, страницу "О нас" и контактную форму. Загрузите скриншоты готового сайта и опишите процесс создания.',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // через 7 дней
      moduleId: allModules[0]?.id,
      createdBy: teacher.id
    },
    {
      title: 'Разработка кастомной темы',
      description: 'Создайте кастомную тему WordPress с нуля. Тема должна включать header, footer, sidebar и основные шаблоны страниц. Предоставьте исходный код темы и описание функциональности.',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // через 14 дней
      moduleId: allModules[1]?.id,
      createdBy: teacher.id
    },
    {
      title: 'Создание плагина',
      description: 'Разработайте простой плагин WordPress, который добавляет виджет с текущим временем в сайдбар. Плагин должен быть безопасным и следовать лучшим практикам разработки.',
      dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // через 21 день
      moduleId: allModules[2]?.id,
      createdBy: teacher.id
    },
    {
      title: 'Анализ кода',
      description: 'Проанализируйте предоставленный код и найдите потенциальные проблемы безопасности и производительности. Предоставьте подробный отчет с рекомендациями по улучшению.',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // через 5 дней
      moduleId: allModules[3]?.id,
      createdBy: teacher.id
    }
  ]

  for (const assignmentData of assignments) {
    if (assignmentData.moduleId) {
      const assignment = await prisma.assignment.create({
        data: assignmentData
      })
      console.log(`✅ Задание создано: ${assignment.title}`)
    }
  }

  console.log('🎉 База данных успешно заполнена!')
}

main()
  .catch((e) => {
    console.error('❌ Ошибка при заполнении базы данных:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
