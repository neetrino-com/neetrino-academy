'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { withStaffProtection, type WithRoleProtectionProps } from '@/components/auth/withRoleProtection'
import QuizBuilder from '@/components/admin/QuizBuilder'
import { 
  Plus, 
  Edit, 
  Eye, 
  Trash2,
  Users, 
  Clock,
  BarChart3,
  Loader2,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  PlayCircle,
  TestTube,
  Award,
  BookOpen
} from 'lucide-react'

interface Quiz {
  id: string
  title: string
  description: string
  timeLimit: number
  passingScore: number
  isActive: boolean
  createdAt: string
  lesson: {
    title: string
    module: {
      title: string
      course: {
        title: string
      }
    }
  }
  questions: Array<{
    id: string
    question: string
    type: string
    points: number
  }>
  attempts: Array<{ id: string }>
  _count?: {
    attempts: number
    questions: number
  }
}

interface QuizStats {
  total: number
  active: number
  inactive: number
  averageAttempts: number
}

function TestsManagementComponent({ userRole, isLoading }: WithRoleProtectionProps) {
  const router = useRouter()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [showQuizBuilder, setShowQuizBuilder] = useState(false)
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all') // all, active, inactive
  const [stats, setStats] = useState<QuizStats>({
    total: 0,
    active: 0,
    inactive: 0,
    averageAttempts: 0
  })

  useEffect(() => {
    if (isLoading) return
    
    if (!userRole) {
      return
    }

    fetchQuizzes()
  }, [userRole, isLoading])

  const fetchQuizzes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/quizzes')
      if (response.ok) {
        const data = await response.json()
        setQuizzes(data)
        
        // Подсчёт статистики
        const totalAttempts = data.reduce((acc: number, quiz: Quiz) => acc + quiz.attempts.length, 0)
        setStats({
          total: data.length,
          active: data.filter((q: Quiz) => q.isActive).length,
          inactive: data.filter((q: Quiz) => !q.isActive).length,
          averageAttempts: data.length > 0 ? Math.round(totalAttempts / data.length) : 0
        })
      }
    } catch (error) {
      console.error('Ошибка загрузки тестов:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteQuiz = async (quizId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот тест? Это действие нельзя отменить.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/quizzes/${quizId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await fetchQuizzes()
      } else {
        alert('Ошибка при удалении теста')
      }
    } catch (error) {
      console.error('Ошибка удаления теста:', error)
      alert('Ошибка при удалении теста')
    }
  }

  const toggleQuizStatus = async (quizId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/quizzes/${quizId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isActive: !currentStatus
        })
      })
      
      if (response.ok) {
        await fetchQuizzes()
      } else {
        alert('Ошибка при изменении статуса теста')
      }
    } catch (error) {
      console.error('Ошибка изменения статуса теста:', error)
      alert('Ошибка при изменении статуса теста')
    }
  }

  // Фильтрация тестов
  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quiz.lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quiz.lesson.module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quiz.lesson.module.course.title.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filter === 'all' || 
                         (filter === 'active' && quiz.isActive) ||
                         (filter === 'inactive' && !quiz.isActive)
    
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Хедер */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                Управление тестами
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Создавайте, редактируйте и анализируйте тесты для ваших курсов
              </p>
            </div>
            <button
              onClick={() => {
                setEditingQuiz(null)
                setShowQuizBuilder(true)
              }}
              className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg hover:from-violet-700 hover:to-purple-700 flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-4 h-4" />
              Создать тест
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Статистика */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-violet-600 font-semibold">Всего тестов</p>
                <p className="text-3xl font-bold mt-1 text-gray-900">{stats.total}</p>
              </div>
              <TestTube className="w-8 h-8 text-violet-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600 font-semibold">Активных</p>
                <p className="text-3xl font-bold mt-1 text-gray-900">{stats.active}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 font-semibold">Неактивных</p>
                <p className="text-3xl font-bold mt-1 text-gray-900">{stats.inactive}</p>
              </div>
              <XCircle className="w-8 h-8 text-amber-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-indigo-600 font-semibold">Среднее попыток</p>
                <p className="text-3xl font-bold mt-1 text-gray-900">{stats.averageAttempts}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
        </div>

        {/* Поиск и фильтры */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Поиск тестов по названию, уроку, модулю или курсу..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              <option value="all">Все тесты</option>
              <option value="active">Активные</option>
              <option value="inactive">Неактивные</option>
            </select>
          </div>
        </div>

        {/* Список тестов */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">
              Тесты ({filteredQuizzes.length})
            </h2>
          </div>

          <div className="divide-y divide-gray-100">
            {filteredQuizzes.map(quiz => (
              <div key={quiz.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-gray-900 text-lg">{quiz.title}</h3>
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
                    
                    {quiz.description && (
                      <p className="text-gray-600 mb-3">{quiz.description}</p>
                    )}
                    
                    {/* Информация о курсе и уроке */}
                    <div className="text-sm text-gray-500 mb-3">
                      <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs mr-2">
                        {quiz.lesson.module.course.title}
                      </span>
                      <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs mr-2">
                        {quiz.lesson.module.title}
                      </span>
                      <span className="bg-violet-100 text-violet-700 px-2 py-1 rounded-full text-xs">
                        {quiz.lesson.title}
                      </span>
                    </div>

                    {/* Характеристики теста */}
                    <div className="flex gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{quiz.timeLimit} мин</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Award className="w-4 h-4" />
                        <span>{quiz.passingScore}% для прохождения</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        <span>{quiz.questions.length} вопросов</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{quiz.attempts.length} попыток</span>
                      </div>
                    </div>
                  </div>

                  {/* Действия */}
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => {
                        setEditingQuiz(quiz)
                        setShowQuizBuilder(true)
                      }}
                      className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-all duration-200 hover:scale-110"
                      title="Редактировать"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => router.push(`/admin/tests/${quiz.id}/results`)}
                      className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-all duration-200 hover:scale-110"
                      title="Просмотр результатов"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => toggleQuizStatus(quiz.id, quiz.isActive)}
                      className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
                        quiz.isActive 
                          ? 'text-amber-600 hover:bg-amber-100' 
                          : 'text-emerald-600 hover:bg-emerald-100'
                      }`}
                      title={quiz.isActive ? 'Деактивировать' : 'Активировать'}
                    >
                      {quiz.isActive ? <XCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                    </button>
                    
                    <button
                      onClick={() => deleteQuiz(quiz.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all duration-200 hover:scale-110"
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredQuizzes.length === 0 && (
              <div className="p-12 text-center">
                <TestTube className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || filter !== 'all' ? 'Тесты не найдены' : 'Пока нет тестов'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || filter !== 'all' 
                    ? 'Попробуйте изменить критерии поиска или фильтрации'
                    : 'Создайте свой первый тест для начала работы'
                  }
                </p>
                {!searchTerm && filter === 'all' && (
                  <button
                    onClick={() => {
                      setEditingQuiz(null)
                      setShowQuizBuilder(true)
                    }}
                    className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-violet-400 hover:bg-violet-50 transition-colors"
                  >
                    Создать первый тест
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Модальное окно QuizBuilder */}
      {showQuizBuilder && (
        <QuizBuilder
          lessonId=""
          initialQuiz={editingQuiz}
          onSave={async (quizData) => {
            try {
              let response
              
              if (editingQuiz) {
                // Редактирование существующего теста
                response = await fetch(`/api/admin/quizzes/${editingQuiz.id}`, {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(quizData)
                })
              } else {
                // Создание нового теста
                response = await fetch('/api/admin/quizzes', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(quizData)
                })
              }
              
              if (response.ok) {
                setShowQuizBuilder(false)
                setEditingQuiz(null)
                await fetchQuizzes()
              } else {
                const error = await response.json()
                alert(`Ошибка сохранения теста: ${error.error}`)
              }
            } catch (error) {
              console.error('Ошибка сохранения теста:', error)
              alert('Ошибка сохранения теста')
            }
          }}
          onCancel={() => {
            setShowQuizBuilder(false)
            setEditingQuiz(null)
          }}
        />
      )}
    </div>
  )
}

// Экспортируем защищенный компонент
export default withStaffProtection(TestsManagementComponent, {
  fallback: null,
  showAccessDenied: true
})
