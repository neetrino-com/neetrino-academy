'use client'

import { useState } from 'react'
import { signIn, signOut, useSession } from 'next-auth/react'

export default function TestLoginPage() {
  const { data: session, status } = useSession()
  const [email, setEmail] = useState('admin@academy.com')
  const [password, setPassword] = useState('admin123')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      })
      
      console.log('🔐 [LOGIN] Результат входа:', result)
      
      if (result?.error) {
        alert(`Ошибка входа: ${result.error}`)
      } else {
        alert('Успешный вход!')
      }
    } catch (error) {
      console.error('🔐 [LOGIN] Ошибка:', error)
      alert('Ошибка при входе')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await signOut({ redirect: false })
    alert('Выход выполнен')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Тест авторизации
        </h1>
        
        {/* Статус сессии */}
        <div className="mb-6 p-4 bg-gray-100 rounded-lg">
          <h2 className="font-semibold mb-2">Статус сессии:</h2>
          <p><strong>Статус:</strong> {status}</p>
          <p><strong>Авторизован:</strong> {session ? 'Да' : 'Нет'}</p>
          {session && (
            <>
              <p><strong>Email:</strong> {session.user?.email}</p>
              <p><strong>Имя:</strong> {session.user?.name}</p>
            </>
          )}
        </div>

        {!session ? (
          /* Форма входа */
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Пароль
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>
        ) : (
          /* Кнопка выхода */
          <div className="space-y-4">
            <button
              onClick={handleLogout}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
            >
              Выйти
            </button>
            
            <a
              href="/admin/groups/group3/schedule"
              className="block w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 text-center"
            >
              Перейти к расписанию группы
            </a>
          </div>
        )}

        {/* Тестовые учетные записи */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">Тестовые учетные записи:</h3>
          <div className="space-y-1 text-sm">
            <p><strong>Администратор:</strong> admin@academy.com / admin123</p>
            <p><strong>Учитель:</strong> teacher1@academy.com / teacher123</p>
            <p><strong>Студент:</strong> student1@academy.com / student123</p>
          </div>
        </div>
      </div>
    </div>
  )
}
