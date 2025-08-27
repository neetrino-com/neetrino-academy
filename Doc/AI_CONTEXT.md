# AI Context - Neetrino Academy

## Проект
**Название**: Neetrino Academy - Онлайн платформа обучения  
**Тип**: Веб-приложение для онлайн обучения  
**Статус**: MVP с базовым функционалом (~70% готовности)

## Технологии

### Frontend
- **Next.js 15** с App Router
- **TypeScript** для типизации
- **Tailwind CSS** для стилизации
- **React Hook Form** для управления формами

### Backend
- **Next.js API Routes** для серверной логики
- **Prisma ORM** для работы с базой данных
- **NextAuth.js v5** для аутентификации
- **bcrypt** для хеширования паролей

### База данных
- **SQLite** (разработка)
- **Prisma Schema** для определения моделей

## Архитектура

### Структура папок
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API маршруты
│   ├── courses/           # Страницы курсов
│   ├── dashboard/         # Дашборд пользователя
│   ├── login/             # Страница входа
│   └── register/          # Страница регистрации
├── components/            # React компоненты
│   ├── courses/          # Компоненты курсов
│   ├── forms/            # Формы
│   ├── layout/           # Компоненты макета
│   └── ui/               # UI компоненты
├── lib/                  # Утилиты и конфигурация
├── types/                # TypeScript типы
└── stores/               # Zustand стейт менеджер
```

### Модели данных

#### Основные модели
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String
  role      Role     @default(STUDENT)
  avatar    String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  enrollments      Enrollment[]
  lessonProgresses LessonProgress[]
  quizAttempts     QuizAttempt[]
}

model Course {
  id          String   @id @default(cuid())
  title       String
  description String
  slug        String   @unique
  direction   Direction
  level       Level
  price       Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  modules     Module[]
  enrollments Enrollment[]
  quiz        Quiz?
}

model Module {
  id          String   @id @default(cuid())
  title       String
  description String
  order       Int
  courseId    String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  course      Course     @relation(fields: [courseId], references: [id])
  lessons     Lesson[]
  assignments Assignment[]
}

model Lesson {
  id        String   @id @default(cuid())
  title     String
  content   String
  videoUrl  String?
  duration  Int      @default(30)
  order     Int
  moduleId  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  module           Module           @relation(fields: [moduleId], references: [id])
  lessonProgresses LessonProgress[]
  quiz             Quiz?
}
```

#### Модели для тестов
```prisma
model Quiz {
  id        String   @id @default(cuid())
  title     String
  lessonId  String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  lesson        Lesson         @relation(fields: [lessonId], references: [id])
  questions     QuizQuestion[]
  attempts      QuizAttempt[]
}

model QuizQuestion {
  id       String       @id @default(cuid())
  text     String
  type     QuestionType
  quizId   String
  order    Int
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt
  
  quiz    Quiz         @relation(fields: [quizId], references: [id])
  options QuizOption[]
}

model QuizOption {
  id       String   @id @default(cuid())
  text     String
  isCorrect Boolean @default(false)
  questionId String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  question QuizQuestion @relation(fields: [questionId], references: [id])
}

model QuizAttempt {
  id       String   @id @default(cuid())
  userId   String
  quizId   String
  score    Int
  maxScore Int
  completedAt DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id])
  quiz Quiz @relation(fields: [quizId], references: [id])
}
```

## Зависимости

### Основные пакеты
```json
{
  "next": "^15.0.0",
  "react": "^18.0.0",
  "react-dom": "^18.0.0",
  "typescript": "^5.0.0",
  "@prisma/client": "^6.14.0",
  "next-auth": "^5.0.0",
  "bcryptjs": "^2.4.3",
  "tailwindcss": "^3.4.0",
  "react-hook-form": "^7.48.0"
}
```

### Dev зависимости
```json
{
  "prisma": "^6.14.0",
  "tsx": "^4.7.0",
  "eslint": "^8.0.0",
  "@types/bcryptjs": "^2.4.6"
}
```

## Конфигурация

### Next.js
- App Router включен
- TypeScript строгий режим
- ESLint настроен
- Tailwind CSS интегрирован

### Prisma
- SQLite для разработки
- Автоматические миграции
- Seed данные включены

### NextAuth.js
- JWT стратегия
- Credentials Provider
- Защищенные маршруты
- Роли пользователей (STUDENT, ADMIN)

## Текущий статус

### ✅ Завершено
- **Аутентификация**: Полностью работает с правильным хешированием
- **Видео плеер**: YouTube iframe интеграция с улучшенными параметрами
- **Система тестов**: Полностью функциональная с таймером
- **Отслеживание прогресса**: Автоматическое завершение уроков
- **API маршруты**: Все основные endpoints работают
- **UI компоненты**: Современный интерфейс с Tailwind CSS

### 🔄 В разработке
- Система домашних заданий
- Загрузка файлов
- Система сертификатов

### 🎯 Следующие шаги
1. **Система домашних заданий** (приоритет 1)
2. **Загрузка файлов** (приоритет 1)
3. **Система оценки** (приоритет 2)
4. **Сертификаты** (приоритет 3)

## Известные проблемы

### ✅ Решено
- **Видео плеер**: Исправлены проблемы с URL и блокировщиками рекламы
- **Аутентификация**: Исправлено хеширование паролей
- **База данных**: Исправлены EPERM ошибки и Foreign key constraints

### 🔧 Технические детали

#### Видео плеер
- Использует YouTube iframe API
- Поддерживает извлечение ID из различных форматов URL
- Включает параметры для обхода блокировщиков рекламы
- Отладочные логи для диагностики проблем

#### Система тестов
- Поддерживает множественный и единичный выбор
- Таймер с обратным отсчетом
- Автоматический подсчет результатов
- Сохранение попыток в базе данных

#### Аутентификация
- NextAuth.js с JWT стратегией
- bcrypt для хеширования паролей (12 раундов)
- Защищенные маршруты
- Тестовый пользователь: test@example.com / test123

## Доступные URL

### Основные страницы
- `/` - Главная страница
- `/login` - Вход в систему
- `/register` - Регистрация
- `/dashboard` - Дашборд пользователя

### Курсы
- `/courses` - Список курсов
- `/courses/[id]` - Детальная страница курса
- `/courses/[id]/modules/[moduleId]` - Страница модуля
- `/courses/[id]/lessons/[lessonId]` - Страница урока

### API
- `/api/auth/*` - Аутентификация
- `/api/courses/*` - Курсы
- `/api/modules/*` - Модули
- `/api/lessons/*` - Уроки

## Тестовые данные

### Пользователь
```json
{
  "email": "test@example.com",
  "password": "test123",
  "name": "Тестовый пользователь",
  "role": "STUDENT"
}
```

### Курсы
- WordPress для начинающих (бесплатный)
- Создание тем WordPress (15,000₽)
- Разработка плагинов WordPress (25,000₽)
- Vibe Coding - Основы (бесплатный)
- Vibe Coding - Продвинутый (30,000₽)
- Shopify для начинающих (12,000₽)
- Разработка приложений Shopify (35,000₽)

## Команды разработки

```bash
# Запуск сервера
npm run dev

# База данных
npx prisma studio
npx prisma generate
npx prisma db push
npm run db:seed

# Сборка
npm run build
npm run start

# Линтинг
npm run lint
```

## Важные файлы

### Конфигурация
- `next.config.ts` - конфигурация Next.js
- `prisma/schema.prisma` - схема базы данных
- `tailwind.config.js` - конфигурация Tailwind
- `tsconfig.json` - конфигурация TypeScript

### Основные компоненты
- `src/components/ui/VideoPlayer.tsx` - видео плеер
- `src/components/Quiz.tsx` - система тестов
- `src/lib/auth.ts` - конфигурация аутентификации
- `src/lib/db.ts` - подключение к базе данных

### API маршруты
- `src/app/api/auth/[...nextauth]/route.ts` - аутентификация
- `src/app/api/courses/route.ts` - курсы
- `src/app/api/lessons/[id]/complete/route.ts` - завершение уроков

## Следующие задачи

### Приоритет 1: Система домашних заданий
1. Создать модели Assignment и AssignmentSubmission
2. API для создания заданий преподавателями
3. Интерфейс для отправки решений студентами
4. Система оценки заданий

### Приоритет 2: Загрузка файлов
1. Интеграция с Cloudinary или AWS S3
2. Компонент для загрузки файлов
3. Предварительный просмотр файлов
4. Валидация типов файлов

### Приоритет 3: Система сертификатов
1. Генерация PDF сертификатов
2. Шаблоны сертификатов
3. API для выдачи сертификатов
4. Страница сертификатов пользователя

---

**Последнее обновление**: 27.08.2025  
**Версия**: MVP с базовым функционалом  
**Статус**: Готов к дальнейшей разработке
