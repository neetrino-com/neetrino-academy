'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ModuleFormProps {
  courseId: string
  module?: {
    id: string
    title: string
    description: string
    order: number
  }
  onSuccess?: () => void
}

export function ModuleForm({ courseId, module, onSuccess }: ModuleFormProps) {
  const [formData, setFormData] = useState({
    title: module?.title || '',
    description: module?.description || '',
    order: module?.order || 1
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.name === 'order' ? parseInt(e.target.value) : e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const url = module 
        ? `/api/admin/modules/${module.id}`
        : `/api/admin/courses/${courseId}/modules`
      
      const method = module ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Ошибка при сохранении модуля')
      } else {
        if (onSuccess) {
          onSuccess()
        } else {
          router.push(`/admin/courses/${courseId}`)
        }
      }
    } catch (error) {
      console.error('Error saving module:', error)
      setError('Произошла ошибка при сохранении модуля')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {module ? 'Редактировать модуль' : 'Создать новый модуль'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        )}
        
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Название модуля *
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            value={formData.title}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Введите название модуля"
          />
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Описание
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Введите описание модуля"
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

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Сохранение...' : (module ? 'Обновить модуль' : 'Создать модуль')}
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
