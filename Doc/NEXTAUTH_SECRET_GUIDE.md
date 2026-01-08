# Полное руководство по NEXTAUTH_SECRET

## Что такое NEXTAUTH_SECRET?

`NEXTAUTH_SECRET` — это секретный ключ, который используется библиотекой NextAuth.js для:
- **Шифрования JWT токенов** (токены сессий пользователей)
- **Подписи cookies** (защита от подделки)
- **Безопасной передачи данных** между клиентом и сервером

**Без этого ключа NextAuth не сможет работать!**

## Где используется NEXTAUTH_SECRET?

### 1. В коде проекта

NextAuth автоматически читает эту переменную из окружения:

```typescript
// src/lib/auth.ts
export const { handlers, auth, signIn, signOut } = NextAuth({
  // NextAuth автоматически использует process.env.NEXTAUTH_SECRET
  // для шифрования токенов и подписи cookies
})
```

**Вы не видите явного использования в коде**, потому что NextAuth делает это автоматически внутри библиотеки.

### 2. Где хранится

#### Локально (на вашем компьютере):
- Файл `.env` в корне проекта
- **НЕ коммитится в Git** (добавлен в `.gitignore`)

#### На сервере (Vercel):
- Environment Variables в настройках проекта Vercel
- **НЕ виден в коде** - хранится безопасно на сервере

## Как создать NEXTAUTH_SECRET?

### Способ 1: Через командную строку (рекомендуется)

**macOS/Linux:**
```bash
openssl rand -base64 32
```

**Windows (PowerShell):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**Результат будет примерно таким:**
```
aB3dE5fG7hI9jK1lM3nO5pQ7rS9tU1vW3xY5zA7bC9dE1fG3hI5jK7lM9nO1pQ3=
```

### Способ 2: Онлайн генератор

Используйте: https://generate-secret.vercel.app/32

**⚠️ ВАЖНО:** После генерации скопируйте ключ сразу - он больше не будет показан!

### Способ 3: Node.js скрипт

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Где нужно использовать NEXTAUTH_SECRET?

### 1. Локальная разработка (`.env` файл)

Создайте или откройте файл `.env` в корне проекта:

```env
# Database
DATABASE_URL="postgresql://neondb_owner:npg_RBpZ2AhwM7Uk@ep-calm-cloud-a4vmkbu3-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="ваш-сгенерированный-секрет-ключ-здесь"
```

**Пример:**
```env
NEXTAUTH_SECRET="aB3dE5fG7hI9jK1lM3nO5pQ7rS9tU1vW3xY5zA7bC9dE1fG3hI5jK7lM9nO1pQ3="
```

### 2. Production сервер (Vercel)

1. Откройте проект в Vercel Dashboard
2. Перейдите в **Settings** → **Environment Variables**
3. Нажмите **Add New**
4. Заполните:
   - **Key:** `NEXTAUTH_SECRET`
   - **Value:** ваш сгенерированный секретный ключ
   - **Environment:** выберите Production, Preview, Development (или все)
5. Нажмите **Save**

## Отличия локального и серверного NEXTAUTH_SECRET

### Локальный (Development)

**Файл:** `.env`  
**Значение:** Может быть простым для разработки (но лучше использовать настоящий)

```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="development-secret-key-12345"
```

**Особенности:**
- Используется только на вашем компьютере
- Можно перезапустить сервер и изменить
- Не влияет на других разработчиков
- **НЕ должен попадать в Git!**

### Серверный (Production)

**Место:** Environment Variables в Vercel  
**Значение:** Должен быть **уникальным и безопасным**

```env
NEXTAUTH_URL="https://neetrino-academy.vercel.app"
NEXTAUTH_SECRET="aB3dE5fG7hI9jK1lM3nO5pQ7rS9tU1vW3xY5zA7bC9dE1fG3hI5jK7lM9nO1pQ3="
```

**Особенности:**
- Используется на production сервере
- **КРИТИЧЕСКИ ВАЖНО:** Должен быть уникальным и сложным
- Если изменить - все пользователи будут разлогинены
- Хранится безопасно на сервере Vercel
- **НЕ виден в коде или репозитории**

## Почему нужны разные ключи?

### Безопасность

1. **Если локальный ключ скомпрометирован** - production не пострадает
2. **Если production ключ скомпрометирован** - можно изменить только его
3. **Разделение окружений** - разработка и production изолированы

### Практические причины

1. **Локальный:** Можно использовать простой ключ для быстрой разработки
2. **Production:** Должен быть максимально безопасным (32+ символа, случайный)

## Что произойдет, если не установить NEXTAUTH_SECRET?

### Локально:
- NextAuth выдаст предупреждение
- Приложение может работать, но с ограничениями
- Токены могут быть небезопасными

### На сервере (Vercel):
- **Приложение НЕ ЗАПУСТИТСЯ**
- Ошибка: `NEXTAUTH_SECRET is not set`
- Деплой может провалиться

## Проверка правильности настройки

### Локально:

1. Проверьте файл `.env`:
```bash
cat .env | grep NEXTAUTH_SECRET
```

2. Запустите приложение:
```bash
npm run dev
```

3. Если видите предупреждение - добавьте `NEXTAUTH_SECRET` в `.env`

### На сервере (Vercel):

1. Откройте Vercel Dashboard
2. Settings → Environment Variables
3. Убедитесь, что `NEXTAUTH_SECRET` есть в списке
4. Проверьте логи деплоя - не должно быть ошибок про NEXTAUTH_SECRET

## Пример полной настройки

### Локальный `.env`:

```env
# Database
DATABASE_URL="postgresql://neondb_owner:npg_RBpZ2AhwM7Uk@ep-calm-cloud-a4vmkbu3-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"

# NextAuth.js - Локальная разработка
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="local-dev-secret-key-12345678901234567890"

# Cloudinary (если используется)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
```

### Vercel Environment Variables:

```
NEXTAUTH_URL = https://neetrino-academy.vercel.app
NEXTAUTH_SECRET = aB3dE5fG7hI9jK1lM3nO5pQ7rS9tU1vW3xY5zA7bC9dE1fG3hI5jK7lM9nO1pQ3=
DATABASE_URL = postgresql://neondb_owner:npg_RBpZ2AhwM7Uk@ep-calm-cloud-a4vmkbu3-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
```

## Часто задаваемые вопросы

### Q: Можно ли использовать один ключ для локального и production?

**A:** Технически можно, но **НЕ рекомендуется** по соображениям безопасности.

### Q: Что делать, если забыл production ключ?

**A:** 
1. Сгенерируйте новый ключ
2. Добавьте его в Vercel Environment Variables
3. Передеплойте проект
4. **Все пользователи будут разлогинены** (им нужно будет войти заново)

### Q: Как часто нужно менять ключ?

**A:** 
- **Локальный:** Можно не менять
- **Production:** Меняйте только если подозреваете компрометацию

### Q: Можно ли использовать простой ключ типа "12345"?

**A:** 
- **Локально:** Можно для разработки (но лучше использовать настоящий)
- **Production:** **НИКОГДА!** Используйте только сгенерированный безопасный ключ

### Q: Где NextAuth использует этот ключ в коде?

**A:** NextAuth использует его внутри библиотеки автоматически. Вы не увидите явного использования в вашем коде, но библиотека читает `process.env.NEXTAUTH_SECRET` для:
- Шифрования JWT токенов
- Подписи cookies
- Валидации сессий

## Шаги для настройки на Vercel

1. **Сгенерируйте ключ:**
   ```bash
   openssl rand -base64 32
   ```

2. **Скопируйте результат** (например: `aB3dE5fG7hI9jK1lM3nO5pQ7rS9tU1vW3xY5zA7bC9dE1fG3hI5jK7lM9nO1pQ3=`)

3. **В Vercel Dashboard:**
   - Settings → Environment Variables
   - Add New
   - Key: `NEXTAUTH_SECRET`
   - Value: вставьте скопированный ключ
   - Environment: Production, Preview, Development
   - Save

4. **Передеплойте проект** (если он уже задеплоен)

## Проверка работы

После настройки проверьте:

1. **Локально:** Запустите `npm run dev` и войдите в систему
2. **Production:** Откройте ваш сайт на Vercel и войдите в систему
3. **Проверьте cookies:** В DevTools должны быть безопасные cookies с подписью

---

**Дата создания:** 2026-01-08  
**Версия:** 1.0
