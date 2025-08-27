'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

export default function TestCoursePage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const testCreateCourse = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const testData = {
        title: `Тестовый курс ${Date.now()}`,
        description: 'Это тестовый курс для проверки функциональности',
        direction: 'WORDPRESS',
        level: 'BEGINNER',
        price: 0,
        isActive: true
      }

      console.log('Отправляем данные:', testData)

      const response = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      })

      console.log('Статус ответа:', response.status)
      console.log('Заголовки ответа:', Object.fromEntries(response.headers.entries()))

      const data = await response.json()
      console.log('Данные ответа:', data)

      if (!response.ok) {
        throw new Error(data.error || `Ошибка ${response.status}`)
      }

      setSuccess(true)
      console.log('Курс успешно создан:', data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка')
      console.error('Ошибка создания курса:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Тест создания курса</h1>
        
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Информация о пользователе</h2>
          <div className="space-y-2 mb-6">
            <p><strong>Email:</strong> {session.user.email}</p>
            <p><strong>Роль:</strong> {session.user.role}</p>
            <p><strong>Имя:</strong> {session.user.name}</p>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              <strong>Ошибка:</strong> {error}
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
              <strong>Успех!</strong> Курс был успешно создан.
            </div>
          )}

          <button
            onClick={testCreateCourse}
            disabled={loading}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Создание...' : 'Создать тестовый курс'}
          </button>
        </div>
      </div>
    </div>
  )
}
