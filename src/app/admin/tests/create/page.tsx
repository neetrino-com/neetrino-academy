'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, X } from 'lucide-react'
import QuizBuilder from '@/components/admin/QuizBuilder'

export default function CreateQuizPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const handleSave = async (quizData: { title: string; description?: string; timeLimit?: number; passingScore: number; attemptType: 'SINGLE' | 'MULTIPLE'; isActive: boolean; questions: Array<{ question: string; type: string; points: number; order: number; options: Array<{ text: string; isCorrect: boolean; order: number }> }> }) => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/quizzes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(quizData)
      })
      
      if (response.ok) {
        router.push('/admin/tests')
      } else {
        const error = await response.json()
        alert(`Ошибка создания теста: ${error.error}`)
      }
    } catch (error) {
      console.error('Ошибка создания теста:', error)
      alert('Ошибка создания теста')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    router.push('/admin/tests')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Хедер */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                Создание теста
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Создайте новый тест для ваших курсов
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Форма создания теста */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <QuizBuilder
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  )
}
