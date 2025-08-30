'use client'

import { useState, useEffect } from 'react'
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  Eye,
  Clock,
  CheckCircle,
  X,
  GripVertical
} from 'lucide-react'

interface QuizQuestion {
  id: string
  question: string
  type: 'MULTIPLE_CHOICE' | 'SINGLE_CHOICE' | 'TRUE_FALSE'
  points: number
  order: number
  options: QuizOption[]
}

interface QuizOption {
  id: string
  text: string
  isCorrect: boolean
  order: number
}

interface QuizBuilderProps {
  lessonId?: string
  onSave: (quiz: QuizData) => void
  onCancel: () => void
  initialQuiz?: QuizData
}

interface QuizData {
  title: string;
  description: string;
  timeLimit: number;
  passingScore: number;
  isActive: boolean;
  lessonId: string;
  questions: QuizQuestion[];
}

export default function QuizBuilder({ lessonId, onSave, onCancel, initialQuiz }: QuizBuilderProps) {
  const [quiz, setQuiz] = useState({
    title: initialQuiz?.title || '',
    description: initialQuiz?.description || '',
    timeLimit: initialQuiz?.timeLimit || 30,
    passingScore: initialQuiz?.passingScore || 70,
    isActive: initialQuiz?.isActive ?? true,
    lessonId: lessonId || initialQuiz?.lessonId || '',
    questions: initialQuiz?.questions || []
  })
  
  const [lessons, setLessons] = useState<Array<{
    id: string
    title: string
    module: {
      title: string
      course: {
        title: string
      }
    }
  }>>([])
  const [loadingLessons, setLoadingLessons] = useState(false)

  const [draggedQuestion, setDraggedQuestion] = useState<string | null>(null)
  const [draggedOption, setDraggedOption] = useState<{questionId: string, optionId: string} | null>(null)

  // Загрузка уроков для выбора (если не указан конкретный урок)
  useEffect(() => {
    if (!lessonId && !initialQuiz?.lessonId) {
      fetchLessons()
    }
  }, [lessonId, initialQuiz])

  const fetchLessons = async () => {
    try {
      setLoadingLessons(true)
      const response = await fetch('/api/admin/lessons')
      if (response.ok) {
        const data = await response.json()
        setLessons(data)
      }
    } catch (error) {
      console.error('Ошибка загрузки уроков:', error)
    } finally {
      setLoadingLessons(false)
    }
  }

  // Добавить вопрос
  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: `question-${Date.now()}`,
      question: '',
      type: 'SINGLE_CHOICE',
      points: 1,
      order: quiz.questions.length,
      options: [
        {
          id: `option-${Date.now()}-1`,
          text: '',
          isCorrect: true,
          order: 0
        },
        {
          id: `option-${Date.now()}-2`,
          text: '',
          isCorrect: false,
          order: 1
        }
      ]
    }
    setQuiz({
      ...quiz,
      questions: [...quiz.questions, newQuestion]
    })
  }

  // Удалить вопрос
  const deleteQuestion = (questionId: string) => {
    setQuiz({
      ...quiz,
      questions: quiz.questions.filter(q => q.id !== questionId)
    })
  }

  // Добавить опцию
  const addOption = (questionId: string) => {
    setQuiz({
      ...quiz,
      questions: quiz.questions.map(q => {
        if (q.id === questionId) {
          return {
            ...q,
            options: [...q.options, {
              id: `option-${Date.now()}`,
              text: '',
              isCorrect: false,
              order: q.options.length
            }]
          }
        }
        return q
      })
    })
  }

  // Удалить опцию
  const deleteOption = (questionId: string, optionId: string) => {
    setQuiz({
      ...quiz,
      questions: quiz.questions.map(q => {
        if (q.id === questionId) {
          return {
            ...q,
            options: q.options.filter(o => o.id !== optionId)
          }
        }
        return q
      })
    })
  }

  // Обновить вопрос
  const updateQuestion = (questionId: string, field: string, value: string | number | boolean) => {
    setQuiz({
      ...quiz,
      questions: quiz.questions.map(q => {
        if (q.id === questionId) {
          return { ...q, [field]: value }
        }
        return q
      })
    })
  }

  // Обновить опцию
  const updateOption = (questionId: string, optionId: string, field: string, value: string | number | boolean) => {
    setQuiz({
      ...quiz,
      questions: quiz.questions.map(q => {
        if (q.id === questionId) {
          return {
            ...q,
            options: q.options.map(o => {
              if (o.id === optionId) {
                return { ...o, [field]: value }
              }
              return o
            })
          }
        }
        return q
      })
    })
  }

  // Drag & Drop для вопросов
  const handleQuestionDragStart = (e: React.DragEvent, questionId: string) => {
    setDraggedQuestion(questionId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleQuestionDrop = (e: React.DragEvent, targetQuestionId: string) => {
    e.preventDefault()
    if (!draggedQuestion || draggedQuestion === targetQuestionId) return

    const draggedIndex = quiz.questions.findIndex(q => q.id === draggedQuestion)
    const targetIndex = quiz.questions.findIndex(q => q.id === targetQuestionId)
    
    const newQuestions = [...quiz.questions]
    const [draggedQuestionObj] = newQuestions.splice(draggedIndex, 1)
    newQuestions.splice(targetIndex, 0, draggedQuestionObj)
    
    setQuiz({
      ...quiz,
      questions: newQuestions.map((q, i) => ({ ...q, order: i }))
    })
    setDraggedQuestion(null)
  }

  // Сохранить тест
  const handleSave = () => {
    if (!quiz.title.trim()) {
      alert('Введите название теста')
      return
    }

    if (!quiz.lessonId) {
      alert('Выберите урок для теста')
      return
    }

    if (quiz.questions.length === 0) {
      alert('Добавьте хотя бы один вопрос')
      return
    }

    // Проверить, что у каждого вопроса есть правильный ответ
    const hasInvalidQuestions = quiz.questions.some(q => {
      if (q.type === 'TRUE_FALSE') return false
      return !q.options.some(o => o.isCorrect)
    })

    if (hasInvalidQuestions) {
      alert('У каждого вопроса должен быть хотя бы один правильный ответ')
      return
    }

    onSave({
      lessonId: quiz.lessonId,
      ...quiz
    })
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800">
              {initialQuiz ? 'Редактирование теста' : 'Создание теста'}
            </h2>
            <button
              onClick={onCancel}
              className="text-slate-500 hover:text-slate-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Основная информация о тесте */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Основная информация</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Название теста</label>
                <input
                  type="text"
                  value={quiz.title}
                  onChange={(e) => setQuiz({...quiz, title: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Введите название теста"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Описание</label>
                <input
                  type="text"
                  value={quiz.description}
                  onChange={(e) => setQuiz({...quiz, description: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Краткое описание теста"
                />
              </div>

              {/* Выбор урока (только если не указан конкретный урок) */}
              {!lessonId && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Урок</label>
                  <select
                    value={quiz.lessonId}
                    onChange={(e) => setQuiz({...quiz, lessonId: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={loadingLessons}
                  >
                    <option value="">Выберите урок для теста</option>
                    {lessons.map(lesson => (
                      <option key={lesson.id} value={lesson.id}>
                        {lesson.module.course.title} → {lesson.module.title} → {lesson.title}
                      </option>
                    ))}
                  </select>
                  {loadingLessons && (
                    <p className="text-sm text-slate-500 mt-1">Загрузка уроков...</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Время на прохождение (минуты)</label>
                <input
                  type="number"
                  value={quiz.timeLimit}
                  onChange={(e) => setQuiz({...quiz, timeLimit: parseInt(e.target.value) || 30})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  min="1"
                  max="180"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Проходной балл (%)</label>
                <input
                  type="number"
                  value={quiz.passingScore}
                  onChange={(e) => setQuiz({...quiz, passingScore: parseInt(e.target.value) || 70})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  min="1"
                  max="100"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={quiz.isActive}
                  onChange={(e) => setQuiz({...quiz, isActive: e.target.checked})}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                />
                <span className="text-sm font-medium text-slate-700">Активный тест</span>
              </label>
            </div>
          </div>

          {/* Вопросы */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Вопросы ({quiz.questions.length})</h3>
              <button
                onClick={addQuestion}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Добавить вопрос
              </button>
            </div>

            {quiz.questions.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <p>Пока нет вопросов</p>
                <p className="text-sm">Нажмите "Добавить вопрос" чтобы начать</p>
              </div>
            ) : (
              <div className="space-y-4">
                {quiz.questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="border border-slate-200 rounded-lg p-4"
                    draggable
                    onDragStart={(e) => handleQuestionDragStart(e, question.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleQuestionDrop(e, question.id)}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <GripVertical className="w-5 h-5 text-slate-400 cursor-move" />
                      <span className="text-sm font-medium text-slate-600">Вопрос {index + 1}</span>
                      <button
                        onClick={() => deleteQuestion(question.id)}
                        className="ml-auto text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      {/* Текст вопроса */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Вопрос</label>
                        <textarea
                          value={question.question}
                          onChange={(e) => updateQuestion(question.id, 'question', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          rows={2}
                          placeholder="Введите вопрос"
                        />
                      </div>

                      {/* Тип вопроса */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Тип вопроса</label>
                          <select
                            value={question.type}
                            onChange={(e) => updateQuestion(question.id, 'type', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            <option value="SINGLE_CHOICE">Один правильный ответ</option>
                            <option value="MULTIPLE_CHOICE">Несколько правильных ответов</option>
                            <option value="TRUE_FALSE">Да/Нет</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Баллы</label>
                          <input
                            type="number"
                            value={question.points}
                            onChange={(e) => updateQuestion(question.id, 'points', parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            min="1"
                            max="10"
                          />
                        </div>
                      </div>

                      {/* Варианты ответов */}
                      {question.type !== 'TRUE_FALSE' && (
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-slate-700">Варианты ответов</label>
                            <button
                              onClick={() => addOption(question.id)}
                              className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              Добавить вариант
                            </button>
                          </div>

                          <div className="space-y-2">
                            {question.options.map((option, optionIndex) => (
                              <div key={option.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded">
                                <input
                                  type={question.type === 'MULTIPLE_CHOICE' ? 'checkbox' : 'radio'}
                                  name={`question-${question.id}`}
                                  checked={option.isCorrect}
                                  onChange={(e) => updateOption(question.id, option.id, 'isCorrect', e.target.checked)}
                                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                                />
                                <input
                                  type="text"
                                  value={option.text}
                                  onChange={(e) => updateOption(question.id, option.id, 'text', e.target.value)}
                                  className="flex-1 px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                  placeholder={`Вариант ${optionIndex + 1}`}
                                />
                                {question.options.length > 2 && (
                                  <button
                                    onClick={() => deleteOption(question.id, option.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Да/Нет для TRUE_FALSE */}
                      {question.type === 'TRUE_FALSE' && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 p-2 bg-slate-50 rounded">
                            <input
                              type="radio"
                              name={`question-${question.id}`}
                              checked={question.options[0]?.isCorrect}
                              onChange={() => {
                                updateOption(question.id, question.options[0].id, 'isCorrect', true)
                                updateOption(question.id, question.options[1].id, 'isCorrect', false)
                              }}
                              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                            />
                            <span className="font-medium">Да</span>
                          </div>
                          <div className="flex items-center gap-3 p-2 bg-slate-50 rounded">
                            <input
                              type="radio"
                              name={`question-${question.id}`}
                              checked={question.options[1]?.isCorrect}
                              onChange={() => {
                                updateOption(question.id, question.options[0].id, 'isCorrect', false)
                                updateOption(question.id, question.options[1].id, 'isCorrect', true)
                              }}
                              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                            />
                            <span className="font-medium">Нет</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="sticky bottom-0 bg-white border-t p-6">
          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Сохранить тест
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
