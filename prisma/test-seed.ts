import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Начинаем заполнение базы тестовыми данными...')

  // 1. Создание тестовых пользователей
  console.log('👥 Создаем пользователей...')
  
  const adminPassword = await bcrypt.hash('admin123', 12)
  const teacherPassword = await bcrypt.hash('teacher123', 12)
  const studentPassword = await bcrypt.hash('student123', 12)

  // Администраторы
  const admin1 = await prisma.user.upsert({
    where: { email: 'admin@academy.com' },
    update: {},
    create: {
      email: 'admin@academy.com',
      name: 'Главный Администратор',
      password: adminPassword,
      role: 'ADMIN',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
    }
  })

  const admin2 = await prisma.user.upsert({
    where: { email: 'admin2@academy.com' },
    update: {},
    create: {
      email: 'admin2@academy.com',
      name: 'Анна Админова',
      password: adminPassword,
      role: 'ADMIN',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b9bb3f90?w=150&h=150&fit=crop&crop=face'
    }
  })

  // Учителя
  const teacher1 = await prisma.user.upsert({
    where: { email: 'teacher1@academy.com' },
    update: {},
    create: {
      email: 'teacher1@academy.com',
      name: 'Иван Преподавателев',
      password: teacherPassword,
      role: 'TEACHER',
      avatar: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=150&h=150&fit=crop&crop=face'
    }
  })

  const teacher2 = await prisma.user.upsert({
    where: { email: 'teacher2@academy.com' },
    update: {},
    create: {
      email: 'teacher2@academy.com',
      name: 'Мария Кодерская',
      password: teacherPassword,
      role: 'TEACHER',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face'
    }
  })

  const teacher3 = await prisma.user.upsert({
    where: { email: 'teacher3@academy.com' },
    update: {},
    create: {
      email: 'teacher3@academy.com',
      name: 'Алексей Шопифайский',
      password: teacherPassword,
      role: 'TEACHER',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
    }
  })

  // Студенты
  const students = []
  for (let i = 1; i <= 40; i++) {
    const student = await prisma.user.upsert({
      where: { email: `student${i}@academy.com` },
      update: {},
      create: {
        email: `student${i}@academy.com`,
        name: `Студент ${i}`,
        password: studentPassword,
        role: 'STUDENT',
        avatar: `https://images.unsplash.com/photo-${1500000000000 + i * 1000000}?w=150&h=150&fit=crop&crop=face`
      }
    })
    students.push(student)
  }

  console.log('✅ Пользователи созданы!')

  // 2. Создание лекций
  console.log('📚 Создаем лекции...')
  
  const lecture1 = await prisma.lecture.upsert({
    where: { id: 'lecture1' },
    update: {},
    create: {
      id: 'lecture1',
      title: 'Основы WordPress разработки',
      description: 'Полное руководство по созданию сайтов на WordPress',
      thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=200&fit=crop',
      content: JSON.stringify([
        {
          id: 'block1',
          type: 'text',
          content: 'WordPress - это самая популярная система управления контентом в мире. В этой лекции мы изучим основы разработки на WordPress.',
          metadata: {}
        },
        {
          id: 'block2',
          type: 'image',
          content: 'Архитектура WordPress',
          metadata: {
            url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&h=300&fit=crop',
            alt: 'WordPress архитектура'
          }
        },
        {
          id: 'block3',
          type: 'code',
          content: 'php',
          metadata: {
            url: `<?php
function my_theme_setup() {
    add_theme_support('post-thumbnails');
    add_theme_support('menus');
}
add_action('after_setup_theme', 'my_theme_setup');`
          }
        }
      ]),
      createdBy: admin1.id,
      isActive: true
    }
  })

  const lecture2 = await prisma.lecture.upsert({
    where: { id: 'lecture2' },
    update: {},
    create: {
      id: 'lecture2',
      title: 'JavaScript для начинающих',
      description: 'Изучаем основы современного JavaScript',
      thumbnail: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=400&h=200&fit=crop',
      content: JSON.stringify([
        {
          id: 'block1',
          type: 'text',
          content: 'JavaScript - это язык программирования, который делает веб-страницы интерактивными.',
          metadata: {}
        },
        {
          id: 'block2',
          type: 'video',
          content: 'Введение в JavaScript',
          metadata: {
            url: 'https://www.youtube.com/watch?v=W6NZfCO5SIk',
            description: 'Основы JavaScript за 10 минут'
          }
        },
        {
          id: 'block3',
          type: 'code',
          content: 'javascript',
          metadata: {
            url: `// Переменные в JavaScript
let name = 'Студент';
const age = 25;
var isStudent = true;

// Функции
function greet(name) {
    return \`Привет, \${name}!\`;
}

console.log(greet(name));`
          }
        }
      ]),
      createdBy: teacher2.id,
      isActive: true
    }
  })

  const lecture3 = await prisma.lecture.upsert({
    where: { id: 'lecture3' },
    update: {},
    create: {
      id: 'lecture3',
      title: 'Shopify App Development',
      description: 'Создание приложений для Shopify Store',
      thumbnail: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=200&fit=crop',
      content: JSON.stringify([
        {
          id: 'block1',
          type: 'text',
          content: 'Shopify предоставляет мощный API для создания приложений, которые расширяют функциональность интернет-магазинов.',
          metadata: {}
        },
        {
          id: 'block2',
          type: 'link',
          content: 'Shopify API Documentation',
          metadata: {
            url: 'https://shopify.dev/docs',
            description: 'Официальная документация Shopify API'
          }
        }
      ]),
      createdBy: teacher3.id,
      isActive: true
    }
  })

  console.log('✅ Лекции созданы!')

  // 3. Создание чеклистов
  console.log('✅ Создаем чеклисты...')
  
  const checklist1 = await prisma.checklist.upsert({
    where: { id: 'checklist1' },
    update: {},
    create: {
      id: 'checklist1',
      title: 'WordPress Site Launch Checklist',
      description: 'Полный чеклист для запуска WordPress сайта в продакшн',
      direction: 'WORDPRESS',
      thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=300&h=200&fit=crop',
      isActive: true,
      createdBy: teacher1.id,
      groups: {
        create: [
          {
            title: 'Подготовка к запуску',
            description: 'Основные настройки перед запуском',
            order: 0,
            isCollapsed: false,
            items: {
              create: [
                {
                  title: 'Установить SSL сертификат',
                  description: 'Настроить HTTPS для безопасности',
                  order: 0,
                  isRequired: true
                },
                {
                  title: 'Настроить резервное копирование',
                  description: 'Автоматические бэкапы базы данных и файлов',
                  order: 1,
                  isRequired: true
                },
                {
                  title: 'Оптимизировать изображения',
                  description: 'Сжать все изображения для быстрой загрузки',
                  order: 2,
                  isRequired: false
                }
              ]
            }
          },
          {
            title: 'SEO оптимизация',
            description: 'Настройки для поисковых систем',
            order: 1,
            isCollapsed: false,
            items: {
              create: [
                {
                  title: 'Установить Yoast SEO',
                  description: 'Плагин для SEO оптимизации',
                  order: 0,
                  isRequired: true
                },
                {
                  title: 'Настроить метатеги',
                  description: 'Title, description для всех страниц',
                  order: 1,
                  isRequired: true
                },
                {
                  title: 'Создать sitemap.xml',
                  description: 'Карта сайта для поисковиков',
                  order: 2,
                  isRequired: true
                }
              ]
            }
          }
        ]
      }
    }
  })

  const checklist2 = await prisma.checklist.upsert({
    where: { id: 'checklist2' },
    update: {},
    create: {
      id: 'checklist2',
      title: 'Frontend Development Checklist',
      description: 'Чеклист для фронтенд разработки',
      direction: 'VIBE_CODING',
      thumbnail: 'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=300&h=200&fit=crop',
      isActive: true,
      createdBy: teacher2.id,
      groups: {
        create: [
          {
            title: 'HTML Structure',
            description: 'Структура HTML документа',
            order: 0,
            isCollapsed: false,
            items: {
              create: [
                {
                  title: 'Валидный HTML5',
                  description: 'Проверить код на W3C валидаторе',
                  order: 0,
                  isRequired: true
                },
                {
                  title: 'Семантическая разметка',
                  description: 'Использовать правильные теги (header, main, footer)',
                  order: 1,
                  isRequired: true
                }
              ]
            }
          },
          {
            title: 'CSS Styling',
            description: 'Стили и адаптивность',
            order: 1,
            isCollapsed: false,
            items: {
              create: [
                {
                  title: 'Адаптивный дизайн',
                  description: 'Responsive design для всех устройств',
                  order: 0,
                  isRequired: true
                },
                {
                  title: 'CSS Grid / Flexbox',
                  description: 'Современные способы верстки',
                  order: 1,
                  isRequired: false
                }
              ]
            }
          }
        ]
      }
    }
  })

  console.log('✅ Чеклисты созданы!')

  // 4. Создание курсов
  console.log('📖 Создаем курсы...')

  const course1 = await prisma.course.upsert({
    where: { slug: 'wordpress-developer-pro' },
    update: {},
    create: {
      title: 'WordPress Developer Pro',
      description: 'Полный курс разработки на WordPress от новичка до профессионала',
      slug: 'wordpress-developer-pro',
      direction: 'WORDPRESS',
      level: 'BEGINNER',
      price: 25000,
      duration: 12,
      thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500&h=300&fit=crop',
      isActive: true,
      createdBy: teacher1.id,
      modules: {
        create: [
          {
            title: 'Введение в WordPress',
            description: 'Основы работы с WordPress CMS',
            order: 1,
            lessons: {
              create: [
                {
                  title: 'Что такое WordPress?',
                  description: 'История и возможности WordPress',
                  content: JSON.stringify([
                    {
                      id: 'intro-text',
                      type: 'text',
                      content: 'WordPress — это система управления контентом (CMS), которая позволяет создавать и управлять веб-сайтами без глубоких знаний программирования.',
                      metadata: {}
                    },
                    {
                      id: 'wp-stats',
                      type: 'text',
                      content: '• Более 40% всех сайтов в интернете работают на WordPress\n• Бесплатная и открытая система\n• Огромное сообщество разработчиков\n• Тысячи бесплатных тем и плагинов',
                      metadata: {}
                    }
                  ]),
                  thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=200&fit=crop',
                  duration: 15,
                  order: 1,
                  isActive: true,
                  lectureId: lecture1.id
                },
                {
                  title: 'Установка WordPress',
                  description: 'Локальная и хостинговая установка',
                  content: JSON.stringify([
                    {
                      id: 'install-local',
                      type: 'text',
                      content: 'Для разработки WordPress сайтов рекомендуется сначала установить локальную среду разработки.',
                      metadata: {}
                    },
                    {
                      id: 'tools-list',
                      type: 'checklist',
                      content: 'Необходимые инструменты',
                      metadata: {
                        description: '• XAMPP или MAMP\n• WordPress файлы\n• Текстовый редактор\n• Браузер для тестирования'
                      }
                    },
                    {
                      id: 'install-video',
                      type: 'video',
                      content: 'Видеоурок по установке',
                      metadata: {
                        url: 'https://www.youtube.com/watch?v=kYY88h5J86A',
                        description: 'Пошаговая установка WordPress'
                      }
                    }
                  ]),
                  duration: 25,
                  order: 2,
                  isActive: true
                },
                {
                  title: 'Административная панель WordPress',
                  description: 'Изучаем интерфейс админки',
                  content: JSON.stringify([
                    {
                      id: 'admin-intro',
                      type: 'text',
                      content: 'Административная панель WordPress - это центр управления вашим сайтом.',
                      metadata: {}
                    },
                    {
                      id: 'admin-sections',
                      type: 'text',
                      content: 'Основные разделы:\n• Дашборд - общая информация\n• Записи - управление статьями\n• Медиафайлы - изображения и документы\n• Страницы - статические страницы\n• Комментарии - отзывы пользователей\n• Внешний вид - темы и виджеты\n• Плагины - расширения функциональности\n• Пользователи - управление аккаунтами\n• Инструменты - дополнительные функции\n• Настройки - конфигурация сайта',
                      metadata: {}
                    }
                  ]),
                  duration: 20,
                  order: 3,
                  isActive: true
                }
              ]
            }
          },
          {
            title: 'Темы и кастомизация',
            description: 'Создание и настройка тем WordPress',
            order: 2,
            lessons: {
              create: [
                {
                  title: 'Структура темы WordPress',
                  description: 'Изучаем файлы темы и их назначение',
                  content: JSON.stringify([
                    {
                      id: 'theme-files',
                      type: 'text',
                      content: 'Тема WordPress состоит из множества файлов, каждый из которых отвечает за определенную функциональность.',
                      metadata: {}
                    },
                    {
                      id: 'file-structure',
                      type: 'code',
                      content: 'php',
                      metadata: {
                        url: `wp-content/themes/my-theme/
├── style.css
├── index.php
├── functions.php
├── header.php
├── footer.php
├── sidebar.php
├── single.php
├── page.php
└── screenshot.png`
                      }
                    },
                    {
                      id: 'functions-example',
                      type: 'code',
                      content: 'php',
                      metadata: {
                        url: `<?php
// functions.php
function my_theme_setup() {
    add_theme_support('post-thumbnails');
    add_theme_support('custom-logo');
    register_nav_menus(array(
        'primary' => 'Главное меню',
    ));
}
add_action('after_setup_theme', 'my_theme_setup');`
                      }
                    }
                  ]),
                  duration: 30,
                  order: 1,
                  isActive: true
                }
              ]
            }
          }
        ]
      }
    }
  })

  const course2 = await prisma.course.upsert({
    where: { slug: 'vibe-coding-frontend' },
    update: {},
    create: {
      title: 'Vibe Coding: Frontend Master',
      description: 'Современная фронтенд разработка с React, TypeScript и Next.js',
      slug: 'vibe-coding-frontend',
      direction: 'VIBE_CODING',
      level: 'INTERMEDIATE',
      price: 35000,
      duration: 16,
      thumbnail: 'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=500&h=300&fit=crop',
      isActive: true,
      createdBy: teacher2.id,
      modules: {
        create: [
          {
            title: 'JavaScript ES6+',
            description: 'Современный JavaScript для фронтенда',
            order: 1,
            lessons: {
              create: [
                {
                  title: 'Переменные и функции',
                  description: 'Let, const, arrow functions, деструктуризация',
                  content: JSON.stringify([
                    {
                      id: 'variables',
                      type: 'text',
                      content: 'В современном JavaScript появились новые способы объявления переменных и создания функций.',
                      metadata: {}
                    },
                    {
                      id: 'let-const',
                      type: 'code',
                      content: 'javascript',
                      metadata: {
                        url: `// Переменные
let name = 'Иван'; // можно изменить
const age = 25; // константа
var oldStyle = 'устаревший способ';

// Arrow functions
const greet = (name) => {
    return \`Привет, \${name}!\`;
};

// Сокращенная запись
const add = (a, b) => a + b;

// Деструктуризация
const user = { name: 'Анна', age: 30 };
const { name, age } = user;`
                      }
                    },
                    {
                      id: 'practice-link',
                      type: 'link',
                      content: 'Практические задания на CodePen',
                      metadata: {
                        url: 'https://codepen.io/',
                        description: 'Попробуйте написать код самостоятельно'
                      }
                    }
                  ]),
                  duration: 35,
                  order: 1,
                  isActive: true,
                  lectureId: lecture2.id
                },
                {
                  title: 'Работа с массивами и объектами',
                  description: 'Map, filter, reduce и другие методы',
                  content: JSON.stringify([
                    {
                      id: 'array-methods',
                      type: 'text',
                      content: 'JavaScript предоставляет мощные методы для работы с массивами, которые делают код более читаемым и функциональным.',
                      metadata: {}
                    },
                    {
                      id: 'methods-example',
                      type: 'code',
                      content: 'javascript',
                      metadata: {
                        url: `const numbers = [1, 2, 3, 4, 5];

// Map - преобразование каждого элемента
const doubled = numbers.map(n => n * 2);
// [2, 4, 6, 8, 10]

// Filter - фильтрация
const evens = numbers.filter(n => n % 2 === 0);
// [2, 4]

// Reduce - сведение к одному значению
const sum = numbers.reduce((acc, n) => acc + n, 0);
// 15

// Chaining - цепочка методов
const result = numbers
    .filter(n => n > 2)
    .map(n => n * 3)
    .reduce((acc, n) => acc + n, 0);`
                      }
                    }
                  ]),
                  duration: 40,
                  order: 2,
                  isActive: true
                },
                {
                  title: 'Асинхронное программирование',
                  description: 'Promises, async/await, fetch API',
                  content: JSON.stringify([
                    {
                      id: 'async-intro',
                      type: 'text',
                      content: 'Асинхронное программирование позволяет выполнять операции без блокировки основного потока выполнения.',
                      metadata: {}
                    },
                    {
                      id: 'promises-example',
                      type: 'code',
                      content: 'javascript',
                      metadata: {
                        url: `// Promises
const fetchData = () => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve('Данные получены!');
        }, 1000);
    });
};

// async/await
const getData = async () => {
    try {
        const data = await fetchData();
        console.log(data);
    } catch (error) {
        console.error('Ошибка:', error);
    }
};

// Fetch API
const fetchUser = async (id) => {
    const response = await fetch(\`/api/users/\${id}\`);
    const user = await response.json();
    return user;
};`
                      }
                    }
                  ]),
                  duration: 35,
                  order: 3,
                  isActive: true
                }
              ]
            }
          },
          {
            title: 'React Основы',
            description: 'Компоненты, состояние, пропсы',
            order: 2,
            lessons: {
              create: [
                {
                  title: 'Создание компонентов',
                  description: 'Функциональные и классовые компоненты',
                  content: JSON.stringify([
                    {
                      id: 'react-intro',
                      type: 'text',
                      content: 'React — это библиотека для создания пользовательских интерфейсов. Основной концепцией являются компоненты.',
                      metadata: {}
                    },
                    {
                      id: 'component-example',
                      type: 'code',
                      content: 'jsx',
                      metadata: {
                        url: `// Функциональный компонент
function Welcome({ name }) {
    return <h1>Привет, {name}!</h1>;
}

// Компонент с хуками
import { useState } from 'react';

function Counter() {
    const [count, setCount] = useState(0);
    
    return (
        <div>
            <p>Счетчик: {count}</p>
            <button onClick={() => setCount(count + 1)}>
                Увеличить
            </button>
        </div>
    );
}

// Использование
function App() {
    return (
        <div>
            <Welcome name="Студент" />
            <Counter />
        </div>
    );
}`
                      }
                    }
                  ]),
                  duration: 45,
                  order: 1,
                  isActive: true
                },
                {
                  title: 'Хуки React',
                  description: 'useState, useEffect, useContext и другие',
                  content: JSON.stringify([
                    {
                      id: 'hooks-intro',
                      type: 'text',
                      content: 'Хуки позволяют использовать состояние и другие возможности React в функциональных компонентах.',
                      metadata: {}
                    },
                    {
                      id: 'hooks-examples',
                      type: 'code',
                      content: 'jsx',
                      metadata: {
                        url: `import { useState, useEffect, useContext } from 'react';

// useState - управление состоянием
function Counter() {
    const [count, setCount] = useState(0);
    return <button onClick={() => setCount(count + 1)}>{count}</button>;
}

// useEffect - побочные эффекты
function DataFetcher() {
    const [data, setData] = useState(null);
    
    useEffect(() => {
        fetch('/api/data')
            .then(res => res.json())
            .then(setData);
    }, []); // Пустой массив = выполнить только при монтировании
    
    return <div>{data ? data.message : 'Загрузка...'}</div>;
}

// useContext - работа с контекстом
const ThemeContext = createContext();

function ThemedButton() {
    const theme = useContext(ThemeContext);
    return <button style={{ background: theme.primary }}>Кнопка</button>;
}`
                      }
                    }
                  ]),
                  duration: 50,
                  order: 2,
                  isActive: true
                }
              ]
            }
          }
        ]
      }
    }
  })

  const course3 = await prisma.course.upsert({
    where: { slug: 'shopify-apps-development' },
    update: {},
    create: {
      title: 'Shopify Apps Development',
      description: 'Создание приложений для Shopify магазинов',
      slug: 'shopify-apps-development',
      direction: 'SHOPIFY',
      level: 'ADVANCED',
      price: 45000,
      duration: 20,
      thumbnail: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=500&h=300&fit=crop',
      isActive: true,
      createdBy: teacher3.id,
      modules: {
        create: [
          {
            title: 'Shopify API Basics',
            description: 'Основы работы с Shopify API',
            order: 1,
            lessons: {
              create: [
                {
                  title: 'REST Admin API',
                  description: 'Работа с REST API Shopify',
                  content: JSON.stringify([
                    {
                      id: 'api-intro',
                      type: 'text',
                      content: 'Shopify предоставляет мощный REST API для взаимодействия с данными магазина.',
                      metadata: {}
                    },
                    {
                      id: 'api-example',
                      type: 'code',
                      content: 'javascript',
                      metadata: {
                        url: `// Получение списка продуктов
fetch('/admin/api/2023-04/products.json', {
    method: 'GET',
    headers: {
        'X-Shopify-Access-Token': 'your-access-token',
        'Content-Type': 'application/json'
    }
})
.then(response => response.json())
.then(data => {
    console.log('Продукты:', data.products);
});

// Создание нового продукта
const newProduct = {
    product: {
        title: 'Новый товар',
        body_html: '<p>Описание товара</p>',
        vendor: 'Мой магазин',
        product_type: 'Электроника'
    }
};

fetch('/admin/api/2023-04/products.json', {
    method: 'POST',
    headers: {
        'X-Shopify-Access-Token': 'your-access-token',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(newProduct)
});`
                      }
                    },
                    {
                      id: 'api-docs',
                      type: 'link',
                      content: 'Документация Shopify API',
                      metadata: {
                        url: 'https://shopify.dev/docs/admin-api/rest/reference',
                        description: 'Полная документация по REST API'
                      }
                    }
                  ]),
                  duration: 50,
                  order: 1,
                  isActive: true,
                  lectureId: lecture3.id
                },
                {
                  title: 'GraphQL Admin API',
                  description: 'Работа с GraphQL API Shopify',
                  content: JSON.stringify([
                    {
                      id: 'graphql-intro',
                      type: 'text',
                      content: 'GraphQL API предоставляет более гибкий способ работы с данными Shopify.',
                      metadata: {}
                    },
                    {
                      id: 'graphql-example',
                      type: 'code',
                      content: 'javascript',
                      metadata: {
                        url: `// GraphQL запрос для получения продуктов
const query = \`
  query getProducts($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          title
          description
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
\`;

// Выполнение запроса
fetch('/admin/api/2023-04/graphql.json', {
    method: 'POST',
    headers: {
        'X-Shopify-Access-Token': 'your-access-token',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        query,
        variables: { first: 10 }
    })
})
.then(response => response.json())
.then(data => {
    console.log('Продукты:', data.data.products.edges);
});`
                      }
                    }
                  ]),
                  duration: 45,
                  order: 2,
                  isActive: true
                }
              ]
            }
          }
        ]
      }
    }
  })

  console.log('✅ Курсы созданы!')

  // 5. Создание групп
  console.log('👥 Создаем группы...')

  const group1 = await prisma.group.upsert({
    where: { id: 'group1' },
    update: {},
    create: {
      id: 'group1',
      name: 'WordPress Pro 2024-1',
      description: 'Группа изучения WordPress разработки',
      type: 'ONLINE',
      maxStudents: 25,
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-06-15'),
      isActive: true,
      courses: {
        create: [{ courseId: course1.id }]
      },
      teachers: {
        create: [
          { userId: teacher1.id, role: 'MAIN' },
          { userId: admin1.id, role: 'ASSISTANT' }
        ]
      },
      students: {
        create: students.slice(0, 10).map(student => ({
          userId: student.id,
          status: 'ACTIVE'
        }))
      }
    }
  })

  const group2 = await prisma.group.upsert({
    where: { id: 'group2' },
    update: {},
    create: {
      id: 'group2',
      name: 'Frontend Masters 2024',
      description: 'Интенсивное изучение современного фронтенда',
      type: 'HYBRID',
      maxStudents: 20,
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-08-01'),
      isActive: true,
      courses: {
        create: [{ courseId: course2.id }]
      },
      teachers: {
        create: [
          { userId: teacher2.id, role: 'MAIN' }
        ]
      },
      students: {
        create: students.slice(10, 18).map(student => ({
          userId: student.id,
          status: 'ACTIVE'
        }))
      }
    }
  })

  const group3 = await prisma.group.upsert({
    where: { id: 'group3' },
    update: {},
    create: {
      id: 'group3',
      name: 'Shopify Developers Elite',
      description: 'Продвинутая разработка для Shopify',
      type: 'OFFLINE',
      maxStudents: 15,
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-11-01'),
      isActive: true,
      courses: {
        create: [{ courseId: course3.id }]
      },
      teachers: {
        create: [
          { userId: teacher3.id, role: 'MAIN' },
          { userId: teacher2.id, role: 'ASSISTANT' }
        ]
      },
      students: {
        create: students.slice(15, 20).map(student => ({
          userId: student.id,
          status: 'ACTIVE'
        }))
      }
    }
  })

  console.log('✅ Группы созданы!')

  // 6. Расписание групп и генерация событий на 8 недель
  console.log('🗓️ Создаем расписание групп и события...')

  // Базовое расписание: Пн/Ср/Сб 19:00-21:00 для group1, Вт/Чт 19:00-21:00 для group2, Сб 11:00-14:00 для group3
  const scheduleData = [
    { groupId: 'group1', dayOfWeek: 1, startTime: '19:00', endTime: '21:00', isActive: true },
    { groupId: 'group1', dayOfWeek: 3, startTime: '19:00', endTime: '21:00', isActive: true },
    { groupId: 'group1', dayOfWeek: 6, startTime: '11:00', endTime: '13:00', isActive: true },
    { groupId: 'group2', dayOfWeek: 2, startTime: '19:00', endTime: '21:00', isActive: true },
    { groupId: 'group2', dayOfWeek: 4, startTime: '19:00', endTime: '21:00', isActive: true },
    { groupId: 'group3', dayOfWeek: 6, startTime: '11:00', endTime: '14:00', isActive: true }
  ]

  // Создаем расписание по одному элементу, чтобы избежать дублирования
  for (const schedule of scheduleData) {
    await prisma.groupSchedule.upsert({
      where: {
        groupId_dayOfWeek_startTime: {
          groupId: schedule.groupId,
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime
        }
      },
      update: schedule,
      create: schedule
    })
  }

  // Генерация событий на 8 недель вперёд для каждой группы
  const start = new Date()
  const addDays = (d: Date, days: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + days)
  const groupIds = ['group1', 'group2', 'group3']
  const schedules = await prisma.groupSchedule.findMany({ where: { groupId: { in: groupIds } }, orderBy: { dayOfWeek: 'asc' } })

  for (const gid of groupIds) {
    const group = await prisma.group.findUnique({ where: { id: gid } })
    const groupStudents = await prisma.groupStudent.findMany({ where: { groupId: gid } })
    const groupSchedules = schedules.filter(s => s.groupId === gid)

    for (let week = 0; week < 8; week++) {
      for (const sch of groupSchedules) {
        // Находим ближайшую дату в текущей неделе для заданного дня недели
        const today = new Date()
        const monday = addDays(today, -((today.getDay() + 6) % 7) + week * 7) // понедельник недели + смещение недель
        const eventDate = addDays(monday, sch.dayOfWeek === 0 ? 6 : sch.dayOfWeek - 1) // наша схема 0=вс → 6, 1=пн → 0

        const [sh, sm] = sch.startTime.split(':').map(n => parseInt(n, 10))
        const [eh, em] = sch.endTime.split(':').map(n => parseInt(n, 10))

        const startDate = new Date(eventDate); startDate.setHours(sh, sm || 0, 0, 0)
        const endDate = new Date(eventDate); endDate.setHours(eh, em || 0, 0, 0)

        const ev = await prisma.event.create({
          data: {
            title: `Занятие группы ${group?.name}`,
            description: 'Плановое занятие по расписанию',
            type: 'LESSON',
            startDate,
            endDate,
            location: gid === 'group3' ? 'Аудитория 101' : 'Онлайн (Zoom) #'+gid,
            createdById: (await prisma.user.findFirst({ where: { role: 'ADMIN' } }))!.id,
            groupId: gid,
            isActive: true,
            isAttendanceRequired: true
          }
        })

        // Добавляем участников события
        for (const gs of groupStudents) {
          await prisma.eventAttendee.create({
            data: {
              eventId: ev.id,
              userId: gs.userId,
              status: Math.random() > 0.2 ? 'ATTENDED' : 'ABSENT'
            }
          })
        }
      }
    }
  }

  console.log('✅ Расписание и события созданы!')

  // 7. Создание записей студентов на курсы
  console.log('📝 Записываем студентов на курсы...')

  // Записываем всех студентов группы 1 на курс WordPress
  for (const student of students.slice(0, 10)) {
    await prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId: student.id,
          courseId: course1.id
        }
      },
      update: {},
      create: {
        userId: student.id,
        courseId: course1.id,
        status: 'ACTIVE',
        enrolledAt: new Date()
      }
    })
  }

  // Записываем студентов группы 2 на Frontend курс
  for (const student of students.slice(10, 18)) {
    await prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId: student.id,
          courseId: course2.id
        }
      },
      update: {},
      create: {
        userId: student.id,
        courseId: course2.id,
        status: 'ACTIVE',
        enrolledAt: new Date()
      }
    })
  }

  // Записываем студентов группы 3 на Shopify курс
  for (const student of students.slice(15, 20)) {
    await prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId: student.id,
          courseId: course3.id
        }
      },
      update: {},
      create: {
        userId: student.id,
        courseId: course3.id,
        status: 'ACTIVE',
        enrolledAt: new Date()
      }
    })
  }

  console.log('✅ Студенты записаны на курсы!')

  // 7. Создание заданий
  console.log('📋 Создаем задания...')

  // Задания для WordPress курса
  const wpLessons = await prisma.lesson.findMany({
    where: {
      module: {
        courseId: course1.id
      }
    },
    orderBy: { order: 'asc' }
  })

  if (wpLessons.length > 0) {
    // Создаем по одному заданию для каждого урока
    for (let i = 0; i < wpLessons.length; i++) {
      const lesson = wpLessons[i]
      const assignmentTitles = [
        'Создание первой темы WordPress',
        'Установка и настройка WordPress',
        'Работа с плагинами WordPress',
        'Настройка темы и виджетов'
      ]
      
      await prisma.assignment.create({
        data: {
          title: assignmentTitles[i] || `Задание ${i + 1}`,
          description: `Описание задания для урока "${lesson.title}". Выполните все требования и загрузите результат.`,
          dueDate: new Date(Date.now() + (i + 1) * 7 * 24 * 60 * 60 * 1000), // через неделю для каждого урока
          lessonId: lesson.id,
          type: i === 0 ? 'PROJECT' : 'HOMEWORK',
          status: 'PUBLISHED',
          maxScore: 100,
          createdBy: teacher1.id
        }
      })
    }
  }

  // Задания для Frontend курса
  const frontendLessons = await prisma.lesson.findMany({
    where: {
      module: {
        courseId: course2.id
      }
    },
    orderBy: { order: 'asc' }
  })

  if (frontendLessons.length > 0) {
    // Создаем по одному заданию для каждого урока
    for (let i = 0; i < frontendLessons.length; i++) {
      const lesson = frontendLessons[i]
      const assignmentTitles = [
        'React Counter приложение',
        'Практика с массивами JavaScript',
        'Компоненты и пропсы React',
        'Управление состоянием в React'
      ]
      
      await prisma.assignment.create({
        data: {
          title: assignmentTitles[i] || `Задание ${i + 1}`,
          description: `Описание задания для урока "${lesson.title}". Выполните все требования и загрузите результат.`,
          dueDate: new Date(Date.now() + (i + 1) * 5 * 24 * 60 * 60 * 1000), // через 5 дней для каждого урока
          lessonId: lesson.id,
          type: i === 0 ? 'PROJECT' : 'HOMEWORK',
          status: 'PUBLISHED',
          maxScore: 100,
          createdBy: teacher2.id
        }
      })
    }
  }

  // Задания для Shopify курса
  const shopifyLessons = await prisma.lesson.findMany({
    where: {
      module: {
        courseId: course3.id
      }
    },
    orderBy: { order: 'asc' }
  })

  if (shopifyLessons.length > 0) {
    // Создаем по одному заданию для каждого урока
    for (let i = 0; i < shopifyLessons.length; i++) {
      const lesson = shopifyLessons[i]
      const assignmentTitles = [
        'Shopify App с REST API',
        'Работа с продуктами Shopify',
        'Настройка темы Shopify',
        'Интеграция с внешними сервисами'
      ]
      
      await prisma.assignment.create({
        data: {
          title: assignmentTitles[i] || `Задание ${i + 1}`,
          description: `Описание задания для урока "${lesson.title}". Выполните все требования и загрузите результат.`,
          dueDate: new Date(Date.now() + (i + 1) * 10 * 24 * 60 * 60 * 1000), // через 10 дней для каждого урока
          lessonId: lesson.id,
          type: i === 0 ? 'PROJECT' : 'HOMEWORK',
          status: 'PUBLISHED',
          maxScore: 100,
          createdBy: teacher3.id
        }
      })
    }
  }

  console.log('✅ Задания созданы!')

  // 7.5. Создание тестов для уроков
  console.log('🧪 Создаем тесты для уроков...')

  // Тест для WordPress урока
  if (wpLessons.length > 0) {
    const wpQuiz = await prisma.quiz.upsert({
      where: { lessonId: wpLessons[0].id },
      update: {},
      create: {
        title: 'Тест по основам WordPress',
        description: 'Проверьте свои знания основ WordPress',
        timeLimit: 15, // 15 минут
        passingScore: 70,
        isActive: true,
        lessonId: wpLessons[0].id,
        questions: {
          create: [
            {
              question: 'Что такое WordPress?',
              type: 'SINGLE_CHOICE',
              points: 10,
              order: 1,
              options: {
                create: [
                  {
                    text: 'Система управления контентом',
                    isCorrect: true,
                    order: 1
                  },
                  {
                    text: 'Язык программирования',
                    isCorrect: false,
                    order: 2
                  },
                  {
                    text: 'База данных',
                    isCorrect: false,
                    order: 3
                  },
                  {
                    text: 'Веб-сервер',
                    isCorrect: false,
                    order: 4
                  }
                ]
              }
            },
            {
              question: 'Какие файлы обязательны для темы WordPress?',
              type: 'MULTIPLE_CHOICE',
              points: 15,
              order: 2,
              options: {
                create: [
                  {
                    text: 'style.css',
                    isCorrect: true,
                    order: 1
                  },
                  {
                    text: 'index.php',
                    isCorrect: true,
                    order: 2
                  },
                  {
                    text: 'functions.php',
                    isCorrect: false,
                    order: 3
                  },
                  {
                    text: 'header.php',
                    isCorrect: false,
                    order: 4
                  }
                ]
              }
            },
            {
              question: 'WordPress использует PHP для работы',
              type: 'TRUE_FALSE',
              points: 10,
              order: 3,
              options: {
                create: [
                  {
                    text: 'Правда',
                    isCorrect: true,
                    order: 1
                  },
                  {
                    text: 'Ложь',
                    isCorrect: false,
                    order: 2
                  }
                ]
              }
            }
          ]
        }
      }
    })
    console.log(`✅ Создан тест для WordPress: ${wpQuiz.title}`)
  }

  // Тест для Frontend урока
  if (frontendLessons.length > 0) {
    const frontendQuiz = await prisma.quiz.upsert({
      where: { lessonId: frontendLessons[0].id },
      update: {},
      create: {
        title: 'Тест по JavaScript ES6+',
        description: 'Проверьте знания современного JavaScript',
        timeLimit: 20,
        passingScore: 75,
        isActive: true,
        lessonId: frontendLessons[0].id,
        questions: {
          create: [
            {
              question: 'Что такое let в JavaScript?',
              type: 'SINGLE_CHOICE',
              points: 10,
              order: 1,
              options: {
                create: [
                  {
                    text: 'Ключевое слово для объявления переменной с блочной областью видимости',
                    isCorrect: true,
                    order: 1
                  },
                  {
                    text: 'Функция для создания объектов',
                    isCorrect: false,
                    order: 2
                  },
                  {
                    text: 'Метод массива',
                    isCorrect: false,
                    order: 3
                  }
                ]
              }
            },
            {
              question: 'Какие из перечисленных являются arrow functions?',
              type: 'MULTIPLE_CHOICE',
              points: 15,
              order: 2,
              options: {
                create: [
                  {
                    text: 'const add = (a, b) => a + b',
                    isCorrect: true,
                    order: 1
                  },
                  {
                    text: 'function add(a, b) { return a + b; }',
                    isCorrect: false,
                    order: 2
                  },
                  {
                    text: 'const greet = name => `Hello ${name}`',
                    isCorrect: true,
                    order: 3
                  },
                  {
                    text: 'var add = function(a, b) { return a + b; }',
                    isCorrect: false,
                    order: 4
                  }
                ]
              }
            }
          ]
        }
      }
    })
    console.log(`✅ Создан тест для Frontend: ${frontendQuiz.title}`)
  }

  // Тест для Shopify урока
  if (shopifyLessons.length > 0) {
    const shopifyQuiz = await prisma.quiz.upsert({
      where: { lessonId: shopifyLessons[0].id },
      update: {},
      create: {
        title: 'Тест по Shopify REST API',
        description: 'Проверьте знания работы с Shopify API',
        timeLimit: 25,
        passingScore: 80,
        isActive: true,
        lessonId: shopifyLessons[0].id,
        questions: {
          create: [
            {
              question: 'Какой базовый URL используется для Shopify REST API?',
              type: 'SINGLE_CHOICE',
              points: 10,
              order: 1,
              options: {
                create: [
                  {
                    text: 'https://your-shop.myshopify.com/admin/api/2023-04/',
                    isCorrect: true,
                    order: 1
                  },
                  {
                    text: 'https://api.shopify.com/v1/',
                    isCorrect: false,
                    order: 2
                  },
                  {
                    text: 'https://your-shop.com/api/',
                    isCorrect: false,
                    order: 3
                  }
                ]
              }
            },
            {
              question: 'Какие методы HTTP используются в Shopify REST API?',
              type: 'MULTIPLE_CHOICE',
              points: 15,
              order: 2,
              options: {
                create: [
                  {
                    text: 'GET',
                    isCorrect: true,
                    order: 1
                  },
                  {
                    text: 'POST',
                    isCorrect: true,
                    order: 2
                  },
                  {
                    text: 'PUT',
                    isCorrect: true,
                    order: 3
                  },
                  {
                    text: 'DELETE',
                    isCorrect: true,
                    order: 4
                  }
                ]
              }
            }
          ]
        }
      }
    })
    console.log(`✅ Создан тест для Shopify: ${shopifyQuiz.title}`)
  }

  console.log('✅ Тесты для уроков созданы!')

  // 8. Создание уведомлений
  console.log('🔔 Создаем уведомления...')

  // Уведомления для всех студентов
  for (const student of students.slice(0, 15)) {
    await prisma.notification.create({
      data: {
        title: 'Добро пожаловать в академию!',
        message: 'Поздравляем с началом обучения. Желаем успехов в изучении новых технологий!',
        type: 'COURSE_ASSIGNED',
        userId: student.id,
        isRead: false
      }
    })

    // Некоторым студентам добавляем уведомления о заданиях
    if (Math.random() > 0.5) {
      await prisma.notification.create({
        data: {
          title: 'Новое задание доступно',
          message: 'Для вас доступно новое практическое задание. Не забудьте выполнить его до дедлайна.',
          type: 'NEW_ASSIGNMENT',
          userId: student.id,
          isRead: false
        }
      })
    }
  }

  console.log('✅ Уведомления созданы!')

  // 9. Создание прогресса обучения
  console.log('📊 Создаем прогресс обучения...')

  // Прогресс для WordPress студентов
  const wpLessonsForProgress = await prisma.lesson.findMany({
    where: {
      module: {
        courseId: course1.id
      }
    }
  })

  for (const student of students.slice(0, 10)) {
    for (let i = 0; i < wpLessonsForProgress.length; i++) {
      // Случайный прогресс - некоторые уроки завершены, некоторые нет
      if (Math.random() > 0.3) {
        await prisma.lessonProgress.upsert({
          where: {
            userId_lessonId: {
              userId: student.id,
              lessonId: wpLessonsForProgress[i].id
            }
          },
          update: {},
          create: {
            userId: student.id,
            lessonId: wpLessonsForProgress[i].id,
            completed: Math.random() > 0.2, // 80% завершены
            progress: Math.random() * 100 // прогресс от 0 до 100%
          }
        })
      }
    }
  }

  console.log('✅ Прогресс обучения создан!')

  console.log('🎉 База данных заполнена тестовыми данными!')
  console.log('\n📋 Тестовые учетные записи:')
  console.log('🔑 Администраторы:')
  console.log('   admin@academy.com / admin123')
  console.log('   admin2@academy.com / admin123')
  console.log('\n👨‍🏫 Учителя:')
  console.log('   teacher1@academy.com / teacher123 (WordPress)')
  console.log('   teacher2@academy.com / teacher123 (Frontend)')
  console.log('   teacher3@academy.com / teacher123 (Shopify)')
  console.log('\n🎓 Студенты:')
  console.log('   student1@academy.com / student123')
  console.log('   student2@academy.com / student123')
  console.log('   ... student40@academy.com / student123')
  console.log('\n🌐 Запущен на: http://localhost:3001')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Ошибка при заполнении данными:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
