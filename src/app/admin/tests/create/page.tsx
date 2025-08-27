'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  ArrowLeft, 
  Plus, 
  Save, 
  X, 
  CheckCircle, 
  AlertCircle,
  Settings,
  FileText
} from 'lucide-react'

interface Lesson {
  id: string
  title: string
  module: {
    id: string
    title: string
    course: {
      id: string
      title: string
    }
  }
}

interface Question {
  id: string
  text: string
  type: 'SINGLE' | 'MULTIPLE' | 'BOOLEAN'
  options: string[]
  correctAnswer: string | string[]
}

export default function CreateTestPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [lessons, setLessons] = useState<Lesson[]>([])
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    lessonId: '',
    timeLimit: 30,
    passingScore: 70
  })

  const [questions, setQuestions] = useState<Partial<Question>[]>([])

  useEffect(() => {
    fetchLessons()
  }, [])

  const fetchLessons = async () => {
    try {
      const response = await fetch('/api/lessons')
      if (response.ok) {
        const data = await response.json()
        setLessons(data)
      }
    } catch (err) {
      console.error('Ошибка загрузки уроков:', err)
    }
  }

  const addQuestion = () => {
    const newQuestion: Partial<Question> = {
      text: '',
      type: 'SINGLE',
      options: ['', '', '', ''],
      correctAnswer: ''
    }
    setQuestions([...questions, newQuestion])
  }

  const updateQuestion = (index: number, data: Partial<Question>) => {
    const updatedQuestions = [...questions]
    updatedQuestions[index] = { ...updatedQuestions[index], ...data }
    setQuestions(updatedQuestions)
  }

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const addOption = (questionIndex: number) => {
    const updatedQuestions = [...questions]
    if (!updatedQuestions[questionIndex].options) {
      updatedQuestions[questionIndex].options = []
    }
    updatedQuestions[questionIndex].options!.push('')
    setQuestions(updatedQuestions)
  }

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updatedQuestions = [...questions]
    updatedQuestions[questionIndex].options![optionIndex] = value
    setQuestions(updatedQuestions)
  }

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updatedQuestions = [...questions]
    updatedQuestions[questionIndex].options!.splice(optionIndex, 1)
    setQuestions(updatedQuestions)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Валидация
      if (!formData.title || !formData.lessonId) {
        throw new Error('Заполните все обязательные поля')
      }

      if (questions.length === 0) {
        throw new Error('Добавьте хотя бы один вопрос')
      }

      // Проверяем, что все вопросы заполнены
      for (const question of questions) {
        if (!question.text) {
          throw new Error('Все вопросы должны иметь текст')
        }
        if (question.type !== 'BOOLEAN' && (!question.options || question.options.length < 2)) {
          throw new Error('Вопросы должны иметь минимум 2 варианта ответа')
        }
        if (!question.correctAnswer) {
          throw new Error('Все вопросы должны иметь правильный ответ')
        }
      }

      // Создаем тест
      const response = await fetch('/api/tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          questions: questions.map((q, index) => ({
            ...q,
            id: `question_${index}`,
            order: index + 1
          }))
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Ошибка создания теста')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/admin')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'timeLimit' || name === 'passingScore' ? Number(value) : value
    }))
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        {/* Заголовок */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Назад
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Создать новый тест
              </h1>
              <p className="mt-2 text-gray-600">
                Создайте тест для проверки знаний студентов
              </p>
            </div>
          </div>
        </div>

        {/* Ошибка */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Успех */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <p className="text-green-700">Тест успешно создан! Перенаправление...</p>
            </div>
          </div>
        )}

        {/* Форма */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Информация о тесте
            </h2>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* Основная информация */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Название теста *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-600"
                  placeholder="Введите название теста"
                />
              </div>

              <div>
                <label htmlFor="lessonId" className="block text-sm font-medium text-gray-700 mb-2">
                  Выберите урок *
                </label>
                <select
                  id="lessonId"
                  name="lessonId"
                  required
                  value={formData.lessonId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                >
                  <option value="">Выберите урок</option>
                  {lessons.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.module.course.title} - {lesson.module.title} - {lesson.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Описание теста
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-vertical text-gray-900 placeholder-gray-600"
                placeholder="Опишите тест и его цели"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="timeLimit" className="block text-sm font-medium text-gray-700 mb-2">
                  Время на прохождение (минуты)
                </label>
                <input
                  type="number"
                  id="timeLimit"
                  name="timeLimit"
                  min="1"
                  max="180"
                  value={formData.timeLimit}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                />
              </div>

              <div>
                <label htmlFor="passingScore" className="block text-sm font-medium text-gray-700 mb-2">
                  Проходной балл (%)
                </label>
                <input
                  type="number"
                  id="passingScore"
                  name="passingScore"
                  min="1"
                  max="100"
                  value={formData.passingScore}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                />
              </div>
            </div>

            {/* Вопросы */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Вопросы теста ({questions.length})
                </h3>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Добавить вопрос
                </button>
              </div>

              {questions.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Вопросы не добавлены
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Добавьте вопросы для создания теста
                  </p>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Добавить первый вопрос
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {questions.map((question, questionIndex) => (
                    <div key={questionIndex} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-md font-medium text-gray-900">
                          Вопрос {questionIndex + 1}
                        </h4>
                        <button
                          type="button"
                          onClick={() => removeQuestion(questionIndex)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Текст вопроса *
                          </label>
                          <textarea
                            value={question.text || ''}
                            onChange={(e) => updateQuestion(questionIndex, { text: e.target.value })}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-600"
                            placeholder="Введите текст вопроса"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Тип вопроса
                          </label>
                          <select
                            value={question.type || 'SINGLE'}
                            onChange={(e) => updateQuestion(questionIndex, { 
                              type: e.target.value as 'SINGLE' | 'MULTIPLE' | 'BOOLEAN',
                              options: e.target.value === 'BOOLEAN' ? ['Да', 'Нет'] : ['', '', '', ''],
                              correctAnswer: ''
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                          >
                            <option value="SINGLE">Один правильный ответ</option>
                            <option value="MULTIPLE">Несколько правильных ответов</option>
                            <option value="BOOLEAN">Да/Нет</option>
                          </select>
                        </div>

                        {question.type !== 'BOOLEAN' && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="block text-sm font-medium text-gray-700">
                                Варианты ответов *
                              </label>
                              <button
                                type="button"
                                onClick={() => addOption(questionIndex)}
                                className="text-sm text-blue-600 hover:text-blue-800"
                              >
                                + Добавить вариант
                              </button>
                            </div>
                            
                            <div className="space-y-2">
                              {question.options?.map((option, optionIndex) => (
                                <div key={optionIndex} className="flex items-center gap-2">
                                  <input
                                    type={question.type === 'MULTIPLE' ? 'checkbox' : 'radio'}
                                    name={`correct_${questionIndex}`}
                                    value={optionIndex.toString()}
                                    checked={
                                      question.type === 'MULTIPLE'
                                        ? Array.isArray(question.correctAnswer) && question.correctAnswer.includes(optionIndex.toString())
                                        : question.correctAnswer === optionIndex.toString()
                                    }
                                    onChange={(e) => {
                                      if (question.type === 'MULTIPLE') {
                                        const currentAnswers = Array.isArray(question.correctAnswer) ? question.correctAnswer : []
                                        const newAnswers = e.target.checked
                                          ? [...currentAnswers, optionIndex.toString()]
                                          : currentAnswers.filter(a => a !== optionIndex.toString())
                                        updateQuestion(questionIndex, { correctAnswer: newAnswers })
                                      } else {
                                        updateQuestion(questionIndex, { correctAnswer: optionIndex.toString() })
                                      }
                                    }}
                                    className="text-blue-600 focus:ring-blue-500"
                                  />
                                  <input
                                    type="text"
                                    value={option}
                                    onChange={(e) => updateOption(questionIndex, optionIndex, e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-600"
                                    placeholder={`Вариант ${optionIndex + 1}`}
                                  />
                                  {question.options!.length > 2 && (
                                    <button
                                      type="button"
                                      onClick={() => removeOption(questionIndex, optionIndex)}
                                      className="text-red-600 hover:text-red-800"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {question.type === 'BOOLEAN' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Правильный ответ
                            </label>
                            <div className="flex items-center gap-4">
                              <label className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`correct_${questionIndex}`}
                                  value="0"
                                  checked={question.correctAnswer === '0'}
                                  onChange={(e) => updateQuestion(questionIndex, { correctAnswer: e.target.value })}
                                  className="text-blue-600 focus:ring-blue-500"
                                />
                                <span>Да</span>
                              </label>
                              <label className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`correct_${questionIndex}`}
                                  value="1"
                                  checked={question.correctAnswer === '1'}
                                  onChange={(e) => updateQuestion(questionIndex, { correctAnswer: e.target.value })}
                                  className="text-blue-600 focus:ring-blue-500"
                                />
                                <span>Нет</span>
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Кнопки */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.push('/admin')}
                className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Создание...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Создать тест
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Подсказки */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">
            💡 Советы по созданию эффективного теста
          </h3>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Используйте четкие и понятные формулировки вопросов</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Добавьте разнообразные типы вопросов для лучшего тестирования</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Установите реалистичное время на прохождение теста</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Привяжите тест к соответствующему уроку</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
