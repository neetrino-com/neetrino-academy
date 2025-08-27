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
      }
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
