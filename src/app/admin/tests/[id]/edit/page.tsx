'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save, X } from 'lucide-react'
import QuizBuilder from '@/components/admin/QuizBuilder'

interface QuizData {
  id: string
  title: string
  description: string
  timeLimit: number
  passingScore: number
  attemptType: 'SINGLE' | 'MULTIPLE'
  isActive: boolean
  questions: Array<{
    id: string
    question: string
    type: string
    points: number
    order: number
    options?: Array<{
      id: string
      text: string
      isCorrect: boolean
      order: number
    }>
  }>
  quizLessons?: Array<{
    lesson: {
      id: string
      title: string
      module: {
        title: string
        course: {
          title: string
        }
      }
    }
  }>
}

export default function EditQuizPage() {
  const params = useParams()
  const router = useRouter()
  const quizId = params.id as string
  
  const [quiz, setQuiz] = useState<QuizData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchQuiz()
  }, [quizId])

  const fetchQuiz = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/quizzes/${quizId}`)
      
      if (response.ok) {
        const data = await response.json()
        setQuiz(data)
      } else {
        alert('Ошибка загрузки теста')
        router.push('/admin/tests')
      }
    } catch (error) {
      console.error('Ошибка загрузки теста:', error)
      alert('Ошибка загрузки теста')
      router.push('/admin/tests')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (quizData: Partial<QuizData> & { title: string; questions: QuizData['questions'] }) => {
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/quizzes/${quizId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(quizData)
      })
      
      if (response.ok) {
        router.push('/admin/tests')
      } else {
        const errorData = await response.json()
        const errorMessage = errorData.details ? 
          `${errorData.error}: ${errorData.details}` : 
          errorData.error || 'Неизвестная ошибка'
        alert(`Ошибка обновления теста: ${errorMessage}`)
      }
    } catch (error) {
      console.error('Ошибка обновления теста:', error)
      alert('Ошибка обновления теста')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    router.push('/admin/tests')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка теста...</p>
        </div>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Тест не найден</p>
          <button
            onClick={handleCancel}
            className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
          >
            Вернуться к списку тестов
          </button>
        </div>
      </div>
    )
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
                Редактирование теста
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {quiz.title}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Форма редактирования теста */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <QuizBuilder
            initialQuiz={quiz ? {
              ...quiz,
              questions: quiz.questions.map(q => ({
                ...q,
                type: (q.type === 'MULTIPLE_CHOICE' || q.type === 'SINGLE_CHOICE' || q.type === 'TRUE_FALSE') 
                  ? q.type 
                  : 'MULTIPLE_CHOICE' as 'MULTIPLE_CHOICE' | 'SINGLE_CHOICE' | 'TRUE_FALSE',
                options: q.options || []
              }))
            } : undefined}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  )
}
