'use client'

import { useState, useEffect } from 'react'
import { 
  X, 
  Search, 
  Check, 
  Clock, 
  Award, 
  BookOpen,
  FileText, 
  User,
  Loader2,
  AlertCircle
} from 'lucide-react'

interface Quiz {
  id: string
  title: string
  description: string
  timeLimit: number
  passingScore: number
  isActive: boolean
  createdAt: string
  lesson?: {
    title: string
    module: {
      title: string
      course: {
        title: string
      }
    }
  }
  creator: {
    id: string
    name: string
    email: string
  }
  questions: Array<{
    id: string
    question: string
    type: string
    points: number
  }>
  attempts: Array<{ id: string }>
}

interface QuizSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  groupId: string
  groupName: string
  assignedQuizIds: string[]
  onQuizAssign: (quizIds: string[]) => Promise<void>
}

export default function QuizSelectionModal({
  isOpen,
  onClose,
  groupId,
  groupName,
  assignedQuizIds,
  onQuizAssign
}: QuizSelectionModalProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedQuizzes, setSelectedQuizzes] = useState<string[]>(assignedQuizIds)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (isOpen) {
      fetchQuizzes()
      setSelectedQuizzes(assignedQuizIds)
    }
  }, [isOpen, assignedQuizIds])

  const fetchQuizzes = async () => {
    try {
      setLoading(true)
      setError('')
      
      console.log('🔍 Fetching quizzes for group:', groupId)
      
      const response = await fetch('/api/admin/quizzes')
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Quizzes fetched:', data.length)
        setQuizzes(data)
      } else {
        const errorData = await response.json()
        console.error('❌ Error fetching quizzes:', errorData)
        setError('Ошибка загрузки тестов')
      }
    } catch (error) {
      console.error('❌ Error fetching quizzes:', error)
      setError('Ошибка загрузки тестов')
    } finally {
      setLoading(false)
    }
  }

  const handleQuizToggle = (quizId: string) => {
    setSelectedQuizzes(prev => 
      prev.includes(quizId) 
        ? prev.filter(id => id !== quizId)
        : [...prev, quizId]
    )
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')
      
      console.log('💾 Assigning quizzes to group:', {
        groupId,
        selectedQuizzes,
        previouslyAssigned: assignedQuizIds
      })
      
      await onQuizAssign(selectedQuizzes)
      
      console.log('✅ Quizzes assigned successfully')
      onClose()
    } catch (error) {
      console.error('❌ Error assigning quizzes:', error)
      setError('Ошибка назначения тестов')
    } finally {
      setSaving(false)
    }
  }

  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (quiz.creator?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (quiz.lesson ? 
                           quiz.lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           quiz.lesson.module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           quiz.lesson.module.course.title.toLowerCase().includes(searchTerm.toLowerCase())
                           : false)
    
    return matchesSearch
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-green-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <FileText className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Назначить тесты группе
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Группа: <span className="font-semibold">{groupName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Поиск тестов по названию, создателю или уроку..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800">{error}</span>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
              <span className="ml-2 text-gray-600">Загрузка тестов...</span>
            </div>
          )}

          {/* Quiz List */}
          {!loading && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredQuizzes.map(quiz => (
                <div
                  key={quiz.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedQuizzes.includes(quiz.id)
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => handleQuizToggle(quiz.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-1 ${
                      selectedQuizzes.includes(quiz.id)
                        ? 'border-emerald-500 bg-emerald-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedQuizzes.includes(quiz.id) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 truncate">
                            {quiz.title}
                          </h3>
                          {quiz.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {quiz.description}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          {quiz.isActive ? (
                            <span className="px-2 py-1 text-xs bg-emerald-100 text-emerald-800 rounded-full font-medium">
                              Активен
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded-full font-medium">
                              Неактивен
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quiz Info */}
                      <div className="mt-3 space-y-2">
                        {/* Lesson Info */}
                        <div className="text-sm text-gray-500">
                          {quiz.lesson ? (
                            <div className="flex items-center gap-2">
                              <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs">
                                {quiz.lesson.module.course.title}
                              </span>
                              <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs">
                                {quiz.lesson.module.title}
                              </span>
                              <span className="bg-violet-100 text-violet-700 px-2 py-1 rounded-full text-xs">
                                {quiz.lesson.title}
                              </span>
                            </div>
                          ) : (
                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                              Общий тест (без привязки к уроку)
                            </span>
                          )}
                        </div>

                        {/* Creator and Stats */}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>{quiz.creator?.name || 'Неизвестный автор'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{quiz.timeLimit} мин</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            <span>{quiz.passingScore}%</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            <span>{quiz.questions.length} вопросов</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {filteredQuizzes.length === 0 && !loading && (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm ? 'Тесты не найдены' : 'Пока нет тестов'}
                  </h3>
                  <p className="text-gray-500">
                    {searchTerm 
                      ? 'Попробуйте изменить критерии поиска'
                      : 'Создайте тесты в разделе "Управление тестами"'
                    }
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Selection Summary */}
          {selectedQuizzes.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-600" />
                <span className="font-medium text-emerald-900">
                  Выбрано тестов: {selectedQuizzes.length}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t p-6">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={saving}
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Сохранение...' : 'Назначить тесты'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
