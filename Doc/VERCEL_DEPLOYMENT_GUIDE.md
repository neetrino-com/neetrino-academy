# Инструкция по деплою на Vercel

## Проблема с кнопкой Deploy

Если кнопка "Deploy" не работает, проверьте следующие настройки:

## 1. Root Directory (Корневая директория)

**❌ Неправильно:** `src/app`  
**✅ Правильно:** `.` (точка - корень проекта) или оставить пустым

**Почему:** 
- `package.json` находится в корне проекта
- `next.config.ts` находится в корне проекта
- `prisma/` находится в корне проекта
- Vercel должен видеть всю структуру проекта

**Как исправить:**
1. В настройках проекта Vercel найдите поле "Root Directory" (в UI, не в vercel.json)
2. Измените значение с `src/app` на `.` (точка)
3. Или оставьте поле пустым
4. **Важно:** Root Directory настраивается в UI Vercel, а не в файле vercel.json

## 2. Build Settings (Настройки сборки)

### Build Command
```
npm run build
```

### Output Directory
```
.next
```

### Install Command
```
npm install
```

### Framework Preset
```
Next.js
```

## 3. Environment Variables (Переменные окружения)

Обязательно добавьте следующие переменные в настройках проекта Vercel:

### Обязательные переменные:

```env
# Database
DATABASE_URL=postgresql://neondb_owner:npg_RBpZ2AhwM7Uk@ep-calm-cloud-a4vmkbu3-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require

# NextAuth.js
NEXTAUTH_URL=https://your-project.vercel.app
NEXTAUTH_SECRET=your-secret-key-here-generate-new-one

# Cloudinary (если используется)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name

# OAuth Providers (опционально)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email (опционально)
RESEND_API_KEY=your-resend-api-key

# Payments (опционально)
STRIPE_PUBLISHABLE_KEY=your-stripe-key
STRIPE_SECRET_KEY=your-stripe-secret
```

### Как добавить переменные:
1. В настройках проекта Vercel перейдите в "Settings" → "Environment Variables"
2. Добавьте каждую переменную отдельно
3. Выберите окружения: Production, Preview, Development
4. Нажмите "Save"

## 4. Генерация NEXTAUTH_SECRET

**Важно:** Сгенерируйте новый секретный ключ для production:

```bash
openssl rand -base64 32
```

Или используйте онлайн генератор: https://generate-secret.vercel.app/32

## 5. Обновление NEXTAUTH_URL

После деплоя обновите `NEXTAUTH_URL` на реальный URL вашего проекта:
```
https://neetrino-academy.vercel.app
```
(или ваш кастомный домен)

## 6. Prisma и база данных

### Настройка Prisma для Vercel:

1. **Post-install скрипт** (добавьте в `package.json`):
```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "vercel-build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

2. **Или используйте Build Command:**
```
prisma generate && npm run build
```

### Миграции базы данных:

Миграции должны быть применены вручную на production базе данных или через скрипт.

## 7. Проверка перед деплоем

### ✅ Чеклист:

- [ ] Root Directory установлен в `.` (корень)
- [ ] Build Command: `npm run build`
- [ ] Все Environment Variables добавлены
- [ ] `NEXTAUTH_SECRET` сгенерирован и добавлен
- [ ] `NEXTAUTH_URL` указывает на правильный домен
- [ ] `DATABASE_URL` указывает на production базу данных
- [ ] Prisma настроен для генерации клиента
- [ ] Все зависимости установлены

## 8. Решение проблем

### Проблема: "Build failed"

**Решение:**
1. Проверьте логи сборки в Vercel
2. Убедитесь, что все зависимости установлены
3. Проверьте, что `package.json` корректен
4. Убедитесь, что Root Directory правильный

### Проблема: "Module not found"

**Решение:**
1. Проверьте, что все файлы закоммичены в Git
2. Убедитесь, что `.gitignore` не исключает нужные файлы
3. Проверьте пути импортов

### Проблема: "Database connection failed"

**Решение:**
1. Проверьте `DATABASE_URL` в Environment Variables
2. Убедитесь, что база данных доступна из интернета
3. Проверьте SSL настройки для Neon PostgreSQL

### Проблема: "NextAuth error"

**Решение:**
1. Проверьте `NEXTAUTH_URL` - должен быть полный URL
2. Проверьте `NEXTAUTH_SECRET` - должен быть установлен
3. Убедитесь, что URL совпадает с доменом проекта

## 9. После успешного деплоя

1. **Проверьте работу приложения:**
   - Откройте URL проекта
   - Проверьте авторизацию
   - Проверьте работу с базой данных

2. **Настройте кастомный домен** (опционально):
   - Settings → Domains
   - Добавьте ваш домен

3. **Настройте автоматический деплой:**
   - По умолчанию Vercel деплоит при каждом push в `main`
   - Можно настроить деплой из других веток

## 10. Команды для локальной проверки

Перед деплоем проверьте локально:

```bash
# Установка зависимостей
npm install

# Генерация Prisma Client
npx prisma generate

# Сборка проекта
npm run build

# Запуск production версии
npm start
```

## Дополнительные настройки

### Отключение Turbopack для production (если есть проблемы)

В `package.json` измените:
```json
{
  "scripts": {
    "build": "next build"
  }
}
```

### Настройка кэширования

Vercel автоматически кэширует:
- `node_modules`
- `.next` директорию
- Prisma Client

## Контакты и поддержка

Если проблемы остаются:
1. Проверьте логи в Vercel Dashboard
2. Проверьте документацию Vercel: https://vercel.com/docs
3. Проверьте документацию Next.js: https://nextjs.org/docs

---

**Дата создания:** 2026-01-08  
**Версия:** 1.0
