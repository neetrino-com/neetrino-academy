# 🤖 AI CONTEXT - NEETRINO ACADEMY

## 📋 ТЕХНИЧЕСКИЙ КОНТЕКСТ ДЛЯ AI МОДЕЛЕЙ

### **ПРОЕКТ: Neetrino Academy**
**Тип**: Онлайн платформа обучения  
**Технологии**: Next.js 15, TypeScript, Prisma, NextAuth.js, Tailwind CSS  
**Статус**: MVP в разработке (аутентификация готова)  
**База данных**: SQLite (разработка)  

---

## 🏗️ АРХИТЕКТУРА ПРОЕКТА

### **Frontend (Next.js 15 App Router)**
```
src/
├── app/                    # App Router
│   ├── (auth)/            # Группа роутов аутентификации
│   ├── (dashboard)/       # Группа роутов дашборда  
│   ├── (admin)/           # Группа роутов админки
│   ├── api/               # API роуты
│   ├── globals.css        # Глобальные стили
│   ├── layout.tsx         # Корневой layout
│   └── page.tsx           # Главная страница
├── components/            # React компоненты
│   ├── ui/               # Базовые UI компоненты
│   ├── forms/            # Формы (LoginForm, RegisterForm)
│   ├── layout/           # Layout компоненты (Header)
│   ├── dashboard/        # Компоненты дашборда
│   ├── courses/          # Компоненты курсов
│   └── admin/            # Компоненты админки
├── lib/                  # Утилиты и конфигурация
│   ├── auth.ts           # NextAuth конфигурация
│   ├── db.ts             # Prisma клиент
│   └── utils.ts          # Общие утилиты
├── hooks/                # Кастомные React хуки
├── stores/               # Zustand сторы
└── types/                # TypeScript типы
```

### **Backend (API Routes)**
```
src/app/api/
├── auth/
│   ├── [...nextauth]/    # NextAuth API
│   └── register/         # API регистрации
├── courses/              # API курсов (будущее)
├── users/                # API пользователей (будущее)
└── dashboard/            # API дашборда (будущее)
```

### **База данных (Prisma + SQLite)**
```sql
-- Основные модели
User (id, email, name, password, role, avatar, createdAt, updatedAt)
Course (id, title, description, slug, direction, level, price, isActive, createdAt, updatedAt)
Module (id, title, description, order, courseId, createdAt, updatedAt)
Lesson (id, title, content, videoUrl, duration, order, moduleId, createdAt, updatedAt)
Assignment (id, title, description, dueDate, moduleId, createdBy, createdAt, updatedAt)
LessonProgress (id, userId, lessonId, completed, progress, createdAt, updatedAt)
Enrollment (id, userId, courseId, status, enrolledAt)
Submission (id, userId, assignmentId, content, fileUrl, score, feedback, submittedAt, gradedAt)
Message (id, content, userId, courseId, createdAt)
Achievement (id, userId, type, title, description, earnedAt)

-- Enums
UserRole: STUDENT, TEACHER, ADMIN
Direction: WORDPRESS, VIBE_CODING, SHOPIFY
Level: BEGINNER, INTERMEDIATE, ADVANCED
EnrollmentStatus: ACTIVE, COMPLETED, CANCELLED
AchievementType: COURSE_COMPLETED, ASSIGNMENT_SUBMITTED, PERFECT_SCORE, STREAK_7_DAYS, STREAK_30_DAYS
```

---

## 🔧 ТЕХНИЧЕСКИЕ ДЕТАЛИ

### **Зависимости (package.json)**
```json
{
  "dependencies": {
    "next": "15.5.1",
    "react": "^18",
    "react-dom": "^18",
    "typescript": "^5",
    "@prisma/client": "^6.14.0",
    "next-auth": "^5.0.0-beta.0",
    "@auth/prisma-adapter": "^1.0.0",
    "bcryptjs": "^2.4.3",
    "zod": "^3.22.0",
    "zustand": "^4.4.0",
    "framer-motion": "^10.16.0",
    "tailwindcss": "^3.3.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "@types/bcryptjs": "^2.4.0",
    "prisma": "^6.14.0",
    "eslint": "^8",
    "eslint-config-next": "15.5.1"
  }
}
```

### **Конфигурация Next.js**
```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
};

export default nextConfig;
```

### **Конфигурация TypeScript**
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### **Конфигурация Tailwind**
```javascript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## 🔐 АУТЕНТИФИКАЦИЯ (NextAuth.js v5)

### **Конфигурация**
```typescript
// src/lib/auth.ts
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      // Конфигурация провайдера
    })
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    signUp: "/register",
  },
  callbacks: {
    // JWT и Session колбэки
  }
});
```

### **Переменные окружения**
```env
# .env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="neetrino-academy-secret-key-2024"
```

### **API роуты**
- `GET/POST /api/auth/[...nextauth]` - NextAuth API
- `POST /api/auth/register` - Регистрация пользователей

---

## 🎨 ДИЗАЙН СИСТЕМА

### **Цветовая палитра**
```css
/* Primary Colors */
--blue-600: #2563eb;
--purple-600: #9333ea;
--green-600: #16a34a;

/* Semantic Colors */
--success: #16a34a;
--warning: #ca8a04;
--error: #dc2626;

/* Neutral Colors */
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-600: #4b5563;
--gray-900: #111827;
```

### **Типографика**
```css
/* Headings */
h1: text-4xl md:text-6xl font-bold
h2: text-3xl font-bold
h3: text-xl font-semibold

/* Body */
p: text-gray-600
span: text-sm

/* Links */
a: text-blue-600 hover:text-blue-700
```

### **Компоненты**
```css
/* Cards */
.card: bg-white rounded-lg shadow-md p-6

/* Buttons */
.btn-primary: bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700
.btn-secondary: border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50

/* Forms */
.input: border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500
```

---

## 📊 ТЕКУЩИЙ СТАТУС

### **✅ Завершено**
- [x] Настройка проекта Next.js 15
- [x] Установка и настройка Prisma
- [x] Создание схемы базы данных
- [x] Настройка NextAuth.js v5
- [x] Система регистрации и входа
- [x] Базовые компоненты (Header, формы)
- [x] Главная страница

### **🔄 В процессе**
- [ ] Исправление ошибок Prisma Client
- [ ] Создание дашборда
- [ ] Система курсов

### **⏳ Планируется**
- [ ] API для курсов
- [ ] Система прогресса
- [ ] Админ панель
- [ ] Система платежей

---

## 🚨 ИЗВЕСТНЫЕ ПРОБЛЕМЫ

### **1. Prisma Client Error**
```
Error: @prisma/client did not initialize yet. Please run "prisma generate"
```
**Статус**: Требует исправления  
**Приоритет**: Высокий  

### **2. Порт конфликт**
Сервер запускается на порту 3002 вместо 3000  
**Статус**: Известная проблема  
**Приоритет**: Средний  

### **3. Импорты**
Некоторые импорты могут не работать  
**Статус**: Требует проверки  
**Приоритет**: Средний  

---

## 🎯 СЛЕДУЮЩИЕ ШАГИ

### **Немедленные действия**
1. Исправить Prisma Client ошибку
2. Создать дашборд студента
3. Создать страницу курсов
4. Создать API для курсов

### **Команды для выполнения**
```bash
# Исправить Prisma
npx prisma generate
npx prisma db push

# Запустить сервер
npm run dev

# Проверить базу данных
npx prisma studio
```

---

## 📚 РЕСУРСЫ

### **Документация**
- [Next.js 15 App Router](https://nextjs.org/docs/app)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js v5](https://next-auth.js.org/)
- [Tailwind CSS](https://tailwindcss.com/docs)

### **Полезные ссылки**
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)

---

## 💡 РЕКОМЕНДАЦИИ ДЛЯ AI

1. **Всегда проверяйте** существующие файлы перед созданием новых
2. **Следуйте структуре** проекта строго
3. **Используйте TypeScript** для всех файлов
4. **Тестируйте функциональность** после изменений
5. **Документируйте** изменения в PROJECT_TIMELINE.md
6. **Используйте существующие** компоненты и стили
7. **Проверяйте консоль** на ошибки
8. **Следуйте принципам** SOLID и DRY
