'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface LessonFormProps {
  moduleId: string
  lesson?: {
    id: string
    title: string
    content: string
    videoUrl: string
    duration: number
    order: number
  }
  onSuccess?: () => void
}

export function LessonForm({ moduleId, lesson, onSuccess }: LessonFormProps) {
  const [formData, setFormData] = useState({
    title: lesson?.title || '',
    content: lesson?.content || '',
    videoUrl: lesson?.videoUrl || '',
    duration: lesson?.duration || 0,
    order: lesson?.order || 1
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.name === 'duration' || e.target.name === 'order' 
        ? parseInt(e.target.value) || 0 
        : e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const url = lesson 
        ? `/api/admin/lessons/${lesson.id}`
        : `/api/admin/modules/${moduleId}/lessons`
      
      const method = lesson ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Ошибка при сохранении урока')
      } else {
        if (onSuccess) {
          onSuccess()
        } else {
          router.push(`/admin/modules/${moduleId}`)
        }
      }
    } catch (error) {
      console.error('Error saving lesson:', error)
      setError('Произошла ошибка при сохранении урока')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {lesson ? 'Редактировать урок' : 'Создать новый урок'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        )}
        
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Название урока *
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            value={formData.title}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Введите название урока"
          />
        </div>
        
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            Содержание урока
          </label>
          <textarea
            id="content"
            name="content"
            rows={6}
            value={formData.content}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Введите содержание урока (HTML поддерживается)"
          />
        </div>
        
        <div>
          <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 mb-2">
            URL видео
          </label>
          <input
            id="videoUrl"
            name="videoUrl"
            type="url"
            value={formData.videoUrl}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://www.youtube.com/watch?v=..."
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
              Длительность (минуты)
            </label>
            <input
              id="duration"
              name="duration"
              type="number"
              min="0"
              value={formData.duration}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
            />
          </div>
          
          <div>
            <label htmlFor="order" className="block text-sm font-medium text-gray-700 mb-2">
              Порядок *
            </label>
            <input
              id="order"
              name="order"
              type="number"
              min="1"
              required
              value={formData.order}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="1"
            />
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Сохранение...' : (lesson ? 'Обновить урок' : 'Создать урок')}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  )
}
