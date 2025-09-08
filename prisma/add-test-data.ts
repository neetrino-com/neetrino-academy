import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Создание тестовых данных для полного функционала курса...')

  // Найдем первый урок курса
  const course = await prisma.course.findUnique({
    where: { id: 'cmfatm8u7001x7qp987s9wazf' },
    include: {
      modules: {
        include: {
          lessons: {
            orderBy: { order: 'asc' }
          }
        },
        orderBy: { order: 'asc' }
      }
    }
  })

  if (!course) {
    console.error('Курс не найден')
    return
  }

  const firstModule = course.modules[0]
  const firstLesson = firstModule.lessons[0]

  console.log(`Работаем с уроком: ${firstLesson.title}`)

  // 1. Создаем чеклист
  const checklist = await prisma.checklist.create({
    data: {
      title: 'Чеклист по JavaScript ES6+',
      description: 'Проверьте свои знания современного JavaScript',
      direction: 'VIBE_CODING',
      createdBy: course.createdBy!,
      groups: {
        create: {
          title: 'Основы ES6+',
          description: 'Ключевые особенности современного JavaScript',
          order: 1,
          items: {
            create: [
              {
                title: 'Изучить переменные let и const',
                description: 'Понимание разницы между var, let и const',
                order: 1,
                isRequired: true
              },
              {
                title: 'Освоить стрелочные функции',
                description: 'Синтаксис и особенности стрелочных функций',
                order: 2,
                isRequired: true
              },
              {
                title: 'Изучить деструктуризацию',
                description: 'Деструктуризация массивов и объектов',
                order: 3,
                isRequired: true
              },
              {
                title: 'Понять промисы и async/await',
                description: 'Асинхронное программирование в JavaScript',
                order: 4,
                isRequired: true
              },
              {
                title: 'Изучить модули ES6',
                description: 'Импорт и экспорт модулей',
                order: 5,
                isRequired: true
              }
            ]
          }
        }
      }
    }
  })

  console.log(`Создан чеклист: ${checklist.id}`)

  // 2. Создаем лекцию с подробным контентом
  const lecture = await prisma.lecture.create({
    data: {
      title: 'JavaScript ES6+ - Полное руководство',
      description: 'Изучаем современный JavaScript с нуля до продвинутого уровня',
      content: JSON.stringify([
        {
          id: 'intro-text',
          type: 'text',
          content: 'Добро пожаловать в мир современного JavaScript! В этой лекции мы изучим все ключевые особенности ES6+ и более поздних версий JavaScript.',
          metadata: {}
        },
        {
          id: 'variables-section',
          type: 'text',
          content: '## Переменные и области видимости\n\nВ ES6 появились новые способы объявления переменных:\n\n- `let` - блочная область видимости\n- `const` - константа с блочной областью видимости\n- `var` - функциональная область видимости (устаревший способ)\n\n### Примеры:\n\n```javascript\n// let - можно переназначить\nlet name = "Иван";\nname = "Петр"; // OK\n\n// const - нельзя переназначить\nconst age = 25;\n// age = 26; // Ошибка!\n\n// Блочная область видимости\nif (true) {\n  let blockVar = "видна только в блоке";\n  const blockConst = "тоже только в блоке";\n}\n// console.log(blockVar); // Ошибка!\n```',
          metadata: {}
        },
        {
          id: 'arrow-functions',
          type: 'text',
          content: '## Стрелочные функции\n\nСтрелочные функции - это краткий синтаксис для создания функций:\n\n### Синтаксис:\n\n```javascript\n// Обычная функция\nfunction add(a, b) {\n  return a + b;\n}\n\n// Стрелочная функция\nconst add = (a, b) => a + b;\n\n// С одним параметром (скобки не нужны)\nconst square = x => x * x;\n\n// Без параметров\nconst greet = () => "Привет!";\n\n// С телом функции\nconst multiply = (a, b) => {\n  const result = a * b;\n  return result;\n};\n```\n\n### Особенности стрелочных функций:\n\n- Не имеют собственного `this`\n- Не имеют `arguments`\n- Не могут быть конструкторами\n- Всегда анонимные',
          metadata: {}
        },
        {
          id: 'destructuring',
          type: 'text',
          content: '## Деструктуризация\n\nДеструктуризация позволяет извлекать значения из массивов и объектов:\n\n### Деструктуризация массивов:\n\n```javascript\nconst colors = ["red", "green", "blue"];\n\n// Извлечение элементов\nconst [first, second, third] = colors;\nconsole.log(first); // "red"\n\n// Пропуск элементов\nconst [first, , third] = colors;\n\n// Значения по умолчанию\nconst [a, b, c = "yellow"] = ["red", "green"];\n\n// Остаточные элементы\nconst [first, ...rest] = colors;\n```\n\n### Деструктуризация объектов:\n\n```javascript\nconst person = {\n  name: "Иван",\n  age: 30,\n  city: "Москва"\n};\n\n// Извлечение свойств\nconst { name, age } = person;\n\n// Переименование\nconst { name: fullName, age: years } = person;\n\n// Значения по умолчанию\nconst { name, age = 25 } = person;\n\n// Вложенная деструктуризация\nconst user = {\n  profile: {\n    name: "Иван",\n    settings: {\n      theme: "dark"\n    }\n  }\n};\n\nconst { profile: { name, settings: { theme } } } = user;\n```',
          metadata: {}
        },
        {
          id: 'promises-async',
          type: 'text',
          content: '## Промисы и async/await\n\n### Промисы:\n\n```javascript\n// Создание промиса\nconst fetchData = () => {\n  return new Promise((resolve, reject) => {\n    setTimeout(() => {\n      resolve("Данные получены!");\n    }, 1000);\n  });\n};\n\n// Использование промиса\nfetchData()\n  .then(data => {\n    console.log(data);\n    return "Обработано";\n  })\n  .then(result => {\n    console.log(result);\n  })\n  .catch(error => {\n    console.error("Ошибка:", error);\n  });\n```\n\n### async/await:\n\n```javascript\n// async функция всегда возвращает промис\nasync function getData() {\n  try {\n    const data = await fetchData();\n    console.log(data);\n    return "Успешно";\n  } catch (error) {\n    console.error("Ошибка:", error);\n    throw error;\n  }\n}\n\n// Использование\ngetData().then(result => {\n  console.log(result);\n});\n```',
          metadata: {}
        },
        {
          id: 'modules',
          type: 'text',
          content: '## Модули ES6\n\n### Экспорт:\n\n```javascript\n// named export\nexport const PI = 3.14159;\nexport function calculateArea(radius) {\n  return PI * radius * radius;\n}\n\n// default export\nexport default class Circle {\n  constructor(radius) {\n    this.radius = radius;\n  }\n}\n```\n\n### Импорт:\n\n```javascript\n// Импорт именованных экспортов\nimport { PI, calculateArea } from "./math.js";\n\n// Импорт по умолчанию\nimport Circle from "./Circle.js";\n\n// Импорт всего модуля\nimport * as math from "./math.js";\n\n// Импорт с переименованием\nimport { calculateArea as calcArea } from "./math.js";\n```',
          metadata: {}
        },
        {
          id: 'conclusion',
          type: 'text',
          content: '## Заключение\n\nES6+ принес множество улучшений в JavaScript:\n\n- Более читаемый и выразительный код\n- Лучшая работа с асинхронностью\n- Модульная система\n- Улучшенная работа с данными\n\n### Следующие шаги:\n\n1. Практикуйтесь с каждым новым синтаксисом\n2. Изучите современные паттерны\n3. Используйте инструменты разработки (Babel, Webpack)\n4. Следите за новыми возможностями языка\n\nУдачи в изучении современного JavaScript! 🚀',
          metadata: {}
        }
      ]),
      createdBy: course.createdBy!
    }
  })

  console.log(`Создана лекция: ${lecture.id}`)

  // 3. Обновляем урок, добавляя чеклист и лекцию
  const updatedLesson = await prisma.lesson.update({
    where: { id: firstLesson.id },
    data: {
      lectureId: lecture.id,
      checklistId: checklist.id,
      content: JSON.stringify([
        {
          id: 'lesson-intro',
          type: 'text',
          content: 'В этом уроке мы изучим основы современного JavaScript ES6+. Вы узнаете о новых возможностях языка, которые сделают ваш код более читаемым и эффективным.',
          metadata: {}
        },
        {
          id: 'lesson-goals',
          type: 'text',
          content: '## Цели урока:\n\n- Изучить новые способы объявления переменных\n- Освоить стрелочные функции\n- Понять деструктуризацию массивов и объектов\n- Научиться работать с промисами и async/await\n- Изучить модульную систему ES6',
          metadata: {}
        },
        {
          id: 'lesson-materials',
          type: 'text',
          content: '## Материалы урока:\n\n- 📖 Подробная лекция с примерами кода\n- ✅ Интерактивный чеклист для самопроверки\n- 🧪 Тест для проверки знаний\n- 💻 Практическое задание\n- 📚 Дополнительные ресурсы',
          metadata: {}
        }
      ])
    }
  })

  console.log(`Обновлен урок: ${updatedLesson.id}`)

  // 4. Добавляем больше вопросов к тесту
  const existingQuiz = await prisma.quiz.findFirst({
    where: { lessonId: firstLesson.id }
  })

  if (existingQuiz) {
    // Добавляем дополнительные вопросы
    await prisma.quizQuestion.createMany({
      data: [
        {
          question: 'Какая разница между let и const?',
          type: 'MULTIPLE_CHOICE',
          order: 1,
          points: 2,
          quizId: existingQuiz.id,
          options: {
            create: [
              { text: 'let можно переназначить, const нельзя', isCorrect: true, order: 1 },
              { text: 'const можно переназначить, let нельзя', isCorrect: false, order: 2 },
              { text: 'Нет разницы', isCorrect: false, order: 3 },
              { text: 'let имеет функциональную область видимости', isCorrect: false, order: 4 }
            ]
          }
        },
        {
          question: 'Что вернет стрелочная функция: () => 42?',
          type: 'MULTIPLE_CHOICE',
          order: 2,
          points: 1,
          quizId: existingQuiz.id,
          options: {
            create: [
              { text: 'undefined', isCorrect: false, order: 1 },
              { text: '42', isCorrect: true, order: 2 },
              { text: 'null', isCorrect: false, order: 3 },
              { text: 'Ошибку', isCorrect: false, order: 4 }
            ]
          }
        },
        {
          question: 'Как правильно деструктурировать массив [1, 2, 3] чтобы получить первый и третий элементы?',
          type: 'MULTIPLE_CHOICE',
          order: 3,
          points: 2,
          quizId: existingQuiz.id,
          options: {
            create: [
              { text: 'const [first, , third] = [1, 2, 3]', isCorrect: true, order: 1 },
              { text: 'const [first, third] = [1, 2, 3]', isCorrect: false, order: 2 },
              { text: 'const { first, third } = [1, 2, 3]', isCorrect: false, order: 3 },
              { text: 'const first = [1, 2, 3][0], third = [1, 2, 3][2]', isCorrect: false, order: 4 }
            ]
          }
        },
        {
          question: 'Что такое промис в JavaScript?',
          type: 'MULTIPLE_CHOICE',
          order: 4,
          points: 2,
          quizId: existingQuiz.id,
          options: {
            create: [
              { text: 'Объект, представляющий результат асинхронной операции', isCorrect: true, order: 1 },
              { text: 'Синхронная функция', isCorrect: false, order: 2 },
              { text: 'Тип данных', isCorrect: false, order: 3 },
              { text: 'Метод массива', isCorrect: false, order: 4 }
            ]
          }
        },
        {
          question: 'Какой синтаксис используется для импорта по умолчанию?',
          type: 'MULTIPLE_CHOICE',
          order: 5,
          points: 1,
          quizId: existingQuiz.id,
          options: {
            create: [
              { text: 'import Component from "./Component"', isCorrect: true, order: 1 },
              { text: 'import { Component } from "./Component"', isCorrect: false, order: 2 },
              { text: 'import * as Component from "./Component"', isCorrect: false, order: 3 },
              { text: 'import Component, { Component } from "./Component"', isCorrect: false, order: 4 }
            ]
          }
        }
      ]
    })

    console.log('Добавлены дополнительные вопросы к тесту')
  }

  // 5. Добавляем дополнительное задание
  const additionalAssignment = await prisma.assignment.create({
    data: {
      title: 'Практика с ES6+ синтаксисом',
      description: 'Создайте несколько функций используя новый синтаксис ES6+:\n\n1. Стрелочная функция для вычисления факториала\n2. Функция с деструктуризацией для работы с объектами\n3. Асинхронная функция для загрузки данных\n4. Модуль с экспортом/импортом\n\nТребования:\n- Используйте только современный синтаксис\n- Добавьте комментарии к коду\n- Создайте тесты для функций',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // через неделю
      type: 'HOMEWORK',
      status: 'PUBLISHED',
      maxScore: 80,
      createdBy: course.createdBy!,
      lessonId: firstLesson.id
    }
  })

  console.log(`Создано дополнительное задание: ${additionalAssignment.id}`)

  console.log('✅ Тестовые данные успешно созданы!')
  console.log(`📚 Лекция: ${lecture.title}`)
  console.log(`✅ Чеклист: ${checklist.title}`)
  console.log(`🧪 Тест обновлен с дополнительными вопросами`)
  console.log(`💻 Задание: ${additionalAssignment.title}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
