'use client'

import { useState } from 'react'

export default function TestPage() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const testRegistration = async () => {
    setLoading(true)
    setResult('')

    try {
      const testData = {
        name: 'Test User',
        email: `test${Date.now()}@example.com`,
        password: '123456'
      }

      console.log('Тестируем регистрацию с данными:', testData)

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      })

      const data = await response.json()

      setResult(JSON.stringify({
        status: response.status,
        statusText: response.statusText,
        data
      }, null, 2))

      console.log('Результат теста:', { status: response.status, data })
    } catch (error) {
      setResult(`Ошибка: ${error}`)
      console.error('Ошибка теста:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Тест API Регистрации
        </h1>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <button
            onClick={testRegistration}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Тестирование...' : 'Тест регистрации'}
          </button>
          
          {result && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Результат:</h3>
              <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm">
                {result}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
