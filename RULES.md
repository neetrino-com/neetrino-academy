# Правила разработки проекта Academy

## Поддержка блоков контента

### Типы блоков контента
Система поддерживает следующие типы блоков контента в уроках и лекциях:

1. **text** - Текстовый блок с форматированием
2. **file** - Универсальный блок для загрузки файлов и изображений (поддерживает множественную загрузку)
3. **video** - Видео с встроенным плеером
4. **code** - Блок кода с подсветкой синтаксиса
5. **link** - Внешняя ссылка
6. **checklist** - Чек-лист задач

### Структура блока контента
```typescript
interface UploadedFile {
  id: string;
  url: string;
  name: string;
  size: number;
  type: string;
  publicId?: string;
}

interface ContentBlock {
  id?: string;
  type: 'text' | 'video' | 'code' | 'link' | 'file' | 'checklist';
  content?: string;
  metadata?: {
    url?: string;
    alt?: string;
    filename?: string;
    language?: string;
    description?: string;
    fileSize?: number;
    files?: UploadedFile[];
  };
}
```

### Важные правила

1. **Все страницы отображения контента** (уроки, лекции) должны поддерживать ВСЕ типы блоков
2. **При добавлении нового типа блока** - обновить все компоненты рендеринга
3. **Интерфейс ContentBlock** должен быть единым для всех компонентов
4. **Функция parseLessonContent** должна корректно обрабатывать JSON и fallback на text
5. **Рендеринг блоков** должен быть консистентным между страницами

### Файлы для обновления при добавлении новых типов блоков:
- `src/app/courses/[id]/lessons/[lessonId]/page.tsx`
- `src/app/lectures/[id]/page.tsx`
- `src/components/admin/LessonContentBuilder.tsx`
- `src/components/admin/LectureForm.tsx`

## Стиль кода

- Используйте TypeScript строго
- Следуйте принципам SOLID, DRY, KISS
- Добавляйте JSDoc комментарии к функциям
- Используйте консистентные имена переменных
- Всегда обрабатывайте ошибки

## Git

- Коммиты на русском языке
- Короткие и понятные сообщения
- Включать git username в каждый коммит
- Автокоммиты после завершения задач