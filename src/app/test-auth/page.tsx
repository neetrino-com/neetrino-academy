'use client'

import { useState, useEffect } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'

export default function TestAuthPage() {
  const { data: session, status } = useSession()
  const [testResult, setTestResult] = useState('')
  const [loading, setLoading] = useState(false)

  const testLogin = async () => {
    setLoading(true)
    try {
      const result = await signIn('credentials', {
        email: 'admin@example.com',
        password: 'test123',
        redirect: false,
      })
      
      if (result?.error) {
        setTestResult(`Ошибка входа: ${result.error}`)
      } else {
        setTestResult('Вход выполнен успешно!')
      }
    } catch (error) {
      setTestResult(`Ошибка: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const testCreateCourse = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/builder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseData: {
            title: 'Тестовый курс',
            description: 'Описание тестового курса',
            direction: 'WordPress',
            level: 'Начальный',
            price: 100,
            duration: 4
          },
          modules: []
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        setTestResult(`Курс создан успешно! ID: ${data.id}`)
      } else {
        setTestResult(`Ошибка создания курса: ${data.error || response.statusText}`)
      }
    } catch (error) {
      setTestResult(`Ошибка запроса: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const testModules = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/modules')
      const data = await response.json()
      
      if (response.ok) {
        setTestResult(`Модули загружены: ${data.length} модулей`)
      } else {
        setTestResult(`Ошибка загрузки модулей: ${data.error || response.statusText}`)
      }
    } catch (error) {
      setTestResult(`Ошибка запроса модулей: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Тестирование авторизации и API</h1>
        
        <div className="bg-white rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Статус сессии</h2>
          <div className="space-y-2">
            <p><strong>Статус:</strong> {status}</p>
            <p><strong>Email:</strong> {session?.user?.email || 'Не авторизован'}</p>
            <p><strong>Имя:</strong> {session?.user?.name || 'Не авторизован'}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Тестирование</h2>
          <div className="space-y-4">
            <button
              onClick={testLogin}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Тестирование...' : 'Тест входа (admin@example.com)'}
            </button>
            
            <button
              onClick={testCreateCourse}
              disabled={loading || !session}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 ml-2"
            >
              {loading ? 'Создание...' : 'Создать тестовый курс'}
            </button>
            
            <button
              onClick={testModules}
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 ml-2"
            >
              {loading ? 'Загрузка...' : 'Тест загрузки модулей'}
            </button>
            
            {session && (
              <button
                onClick={() => signOut()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 ml-2"
              >
                Выйти
              </button>
            )}
          </div>
        </div>

        {testResult && (
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Результат теста</h2>
            <div className="bg-gray-100 p-4 rounded-lg">
              <pre className="whitespace-pre-wrap">{testResult}</pre>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Инструкции</h2>
          <div className="space-y-2 text-sm">
            <p>1. Нажмите "Тест входа" для авторизации как администратор</p>
            <p>2. После успешного входа нажмите "Создать тестовый курс"</p>
            <p>3. Нажмите "Тест загрузки модулей" для проверки API модулей</p>
            <p><strong>Данные для входа:</strong> admin@example.com / test123</p>
          </div>
        </div>
      </div>
    </div>
  )
}
