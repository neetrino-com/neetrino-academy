'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface CourseFormProps {
  mode: 'create' | 'edit'
  initialData?: {
    title?: string;
    description?: string;
    direction?: string;
    level?: string;
    price?: number;
    isActive?: boolean;
  }
  courseId?: string
  onCourseSubmit?: (data: {
    title: string;
    description: string;
    direction: string;
    level: string;
    price: number;
    isActive: boolean;
  }) => void
}

export function CourseForm({ mode, initialData, courseId, onCourseSubmit }: CourseFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    direction: 'WORDPRESS',
    level: 'BEGINNER',
    price: 0,
    isActive: true
  })

  // Заполняем форму данными при редактировании
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        direction: initialData.direction || 'WORDPRESS',
        level: initialData.level || 'BEGINNER',
        price: initialData.price || 0,
        isActive: initialData.isActive !== undefined ? initialData.isActive : true
      })
    }
  }, [mode, initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Защита от повторной отправки
    if (isLoading) {
      return
    }
    
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const url = mode === 'create' 
        ? '/api/admin/courses' 
        : `/api/admin/courses/${courseId}`

      const method = mode === 'create' ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        // Обрабатываем различные типы ошибок
        if (data.error) {
          if (data.error.includes('уже существует')) {
            throw new Error('Курс с таким названием уже существует. Пожалуйста, выберите другое название.')
          } else if (data.error.includes('валидации')) {
            const details = data.details?.map((err: { message: string }) => err.message).join(', ')
            throw new Error(`Ошибка валидации: ${details || data.error}`)
          } else {
            throw new Error(data.error)
          }
        } else {
          throw new Error(`Ошибка сохранения курса (${response.status})`)
        }
      }

      // Проверяем, что курс действительно создан
      if (response.status === 201 && data.id) {
        console.log('Курс успешно создан:', data)
      }

      setSuccess(mode === 'create' ? 'Курс успешно создан!' : 'Курс успешно обновлен!')
      
      // Если есть callback, вызываем его и НЕ создаем курс
      if (onCourseSubmit) {
        console.log('Передаем данные в callback:', formData)
        onCourseSubmit(formData)
        return // Выходим, не создавая курс
      }
      
      // Если нет callback, создаем курс и перенаправляем
      console.log('Создаем курс без callback')
      setTimeout(() => {
        if (mode === 'create') {
          router.push('/admin/courses')
        } else {
          router.push(`/admin/courses/${courseId}/modules`)
        }
      }, 2000)

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Произошла неизвестная ошибка')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : 
              type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              value
    }))
  }

  return (
    <div className="space-y-6">
      {/* Заголовок формы */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">
          {mode === 'create' ? 'Создание нового курса' : 'Редактирование курса'}
        </h2>
        <p className="text-gray-600 mt-1">
          {mode === 'create' 
            ? 'Заполните информацию о новом курсе' 
            : 'Обновите информацию о курсе'
          }
        </p>
      </div>

      {/* Сообщения об ошибках и успехе */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
          {success}
        </div>
      )}

      {/* Форма */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Название курса */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Название курса *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            minLength={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-600"
            placeholder="Введите название курса"
          />
        </div>

        {/* Описание */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Описание курса *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            minLength={10}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-600"
            placeholder="Опишите содержание и цели курса"
          />
        </div>

        {/* Направление и уровень */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="direction" className="block text-sm font-medium text-gray-700 mb-2">
              Направление *
            </label>
            <select
              id="direction"
              name="direction"
              value={formData.direction}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              <option value="WORDPRESS">WordPress</option>
              <option value="VIBE_CODING">Vibe Coding</option>
              <option value="SHOPIFY">Shopify</option>
            </select>
          </div>

          <div>
            <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-2">
              Уровень сложности *
            </label>
            <select
              id="level"
              name="level"
              value={formData.level}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              <option value="BEGINNER">Начинающий</option>
              <option value="INTERMEDIATE">Средний</option>
              <option value="ADVANCED">Продвинутый</option>
            </select>
          </div>
        </div>

        {/* Цена и активность */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
              Цена курса (₽)
            </label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              min="0"
              step="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-600"
              placeholder="0"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
              Курс активен (доступен для записи)
            </label>
          </div>
        </div>

        {/* Кнопки */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Отмена
          </button>
          
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Сохранение...
              </span>
            ) : (
              mode === 'create' ? 'Создать курс' : 'Сохранить изменения'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
