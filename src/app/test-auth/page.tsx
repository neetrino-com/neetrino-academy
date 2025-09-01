'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export default function TestAuthPage() {
  const { data: session, status } = useSession()
  const [testResults, setTestResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testScheduleAPI = async () => {
    setLoading(true)
    try {
      console.log('🧪 [TEST] Тестирование API расписания группы group3')
      
      const response = await fetch('/api/admin/groups/group3/schedule')
      console.log('🧪 [TEST] Статус ответа:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('🧪 [TEST] Данные ответа:', data)
        setTestResults({
          success: true,
          status: response.status,
          data: data
        })
      } else {
        const errorData = await response.json()
        console.log('🧪 [TEST] Ошибка:', errorData)
        setTestResults({
          success: false,
          status: response.status,
          error: errorData
        })
      }
    } catch (error) {
      console.error('🧪 [TEST] Ошибка сети:', error)
      setTestResults({
        success: false,
        error: 'Network error'
      })
    } finally {
      setLoading(false)
    }
  }

  const testGeneralScheduleAPI = async () => {
    setLoading(true)
    try {
      console.log('🧪 [TEST] Тестирование общего API расписания')
      
      const response = await fetch('/api/admin/schedule')
      console.log('🧪 [TEST] Статус ответа:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('🧪 [TEST] Данные ответа:', data)
        setTestResults({
          success: true,
          status: response.status,
          data: data
        })
      } else {
        const errorData = await response.json()
        console.log('🧪 [TEST] Ошибка:', errorData)
        setTestResults({
          success: false,
          status: response.status,
          error: errorData
        })
      }
    } catch (error) {
      console.error('🧪 [TEST] Ошибка сети:', error)
      setTestResults({
        success: false,
        error: 'Network error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Тест авторизации и API</h1>
        
        {/* Информация о сессии */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Статус сессии</h2>
          <div className="space-y-2">
            <p><strong>Статус:</strong> {status}</p>
            <p><strong>Авторизован:</strong> {session ? 'Да' : 'Нет'}</p>
            {session && (
              <>
                <p><strong>Email:</strong> {session.user?.email}</p>
                <p><strong>Имя:</strong> {session.user?.name}</p>
              </>
            )}
          </div>
        </div>

        {/* Кнопки тестирования */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Тестирование API</h2>
          <div className="space-y-4">
            <button
              onClick={testScheduleAPI}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Тестирование...' : 'Тест API расписания группы group3'}
            </button>
            
            <button
              onClick={testGeneralScheduleAPI}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 ml-4"
            >
              {loading ? 'Тестирование...' : 'Тест общего API расписания'}
            </button>
          </div>
        </div>

        {/* Результаты тестирования */}
        {testResults && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Результаты тестирования</h2>
            <div className={`p-4 rounded ${testResults.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <p><strong>Успех:</strong> {testResults.success ? 'Да' : 'Нет'}</p>
              {testResults.status && <p><strong>Статус:</strong> {testResults.status}</p>}
              {testResults.error && (
                <div>
                  <p><strong>Ошибка:</strong></p>
                  <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                    {JSON.stringify(testResults.error, null, 2)}
                  </pre>
                </div>
              )}
              {testResults.data && (
                <div>
                  <p><strong>Данные:</strong></p>
                  <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                    {JSON.stringify(testResults.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Ссылки для тестирования */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Ссылки для тестирования</h2>
          <div className="space-y-2">
            <a 
              href="/admin/groups/group3/schedule" 
              className="block text-blue-600 hover:text-blue-800 underline"
              target="_blank"
            >
              Страница расписания группы group3
            </a>
            <a 
              href="/admin/schedule" 
              className="block text-blue-600 hover:text-blue-800 underline"
              target="_blank"
            >
              Общее расписание
            </a>
            <a 
              href="/api/test-schedule" 
              className="block text-blue-600 hover:text-blue-800 underline"
              target="_blank"
            >
              Тестовый API данных
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
