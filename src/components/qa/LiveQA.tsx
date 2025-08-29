'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { 
  HelpCircle, 
  Send, 
  MessageSquare, 
  User, 
  Clock,
  CheckCircle,
  X,
  Search,
  Filter
} from 'lucide-react'
import { useTranslation } from '@/hooks/useLanguage'

interface Question {
  id: string
  title: string
  content: string
  studentId: string
  studentName: string
  status: 'pending' | 'answered' | 'resolved'
  createdAt: string
  answeredAt?: string
  answer?: string
  teacherId?: string
  teacherName?: string
  tags: string[]
}

export function LiveQA() {
  const { data: session } = useSession()
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [newQuestion, setNewQuestion] = useState({ title: '', content: '' })
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [newAnswer, setNewAnswer] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'answered' | 'resolved'>('all')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'my' | 'all'>('my')
  const questionsEndRef = useRef<HTMLDivElement>(null)

  // Загружаем вопросы при открытии
  useEffect(() => {
    if (isOpen && session?.user) {
      fetchQuestions()
    }
  }, [isOpen, session, activeTab])

  // Автоскролл к последнему вопросу
  useEffect(() => {
    questionsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [questions])

  const fetchQuestions = async () => {
    try {
      setLoading(true)
      const endpoint = activeTab === 'my' ? '/api/qa/my-questions' : '/api/qa/questions'
      const response = await fetch(endpoint)
      if (response.ok) {
        const data = await response.json()
        setQuestions(data)
      }
    } catch (error) {
      console.error('Ошибка загрузки вопросов:', error)
    } finally {
      setLoading(false)
    }
  }

  const submitQuestion = async () => {
    if (!newQuestion.title.trim() || !newQuestion.content.trim()) return

    try {
      const response = await fetch('/api/qa/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQuestion)
      })

      if (response.ok) {
        setNewQuestion({ title: '', content: '' })
        fetchQuestions()
      }
    } catch (error) {
      console.error('Ошибка отправки вопроса:', error)
    }
  }

  const submitAnswer = async () => {
    if (!newAnswer.trim() || !selectedQuestion) return

    try {
      const response = await fetch(`/api/qa/questions/${selectedQuestion.id}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: newAnswer })
      })

      if (response.ok) {
        setNewAnswer('')
        setSelectedQuestion(null)
        fetchQuestions()
      }
    } catch (error) {
      console.error('Ошибка отправки ответа:', error)
    }
  }

  const markAsResolved = async (questionId: string) => {
    try {
      const response = await fetch(`/api/qa/questions/${questionId}/resolve`, {
        method: 'POST'
      })

      if (response.ok) {
        fetchQuestions()
      }
    } catch (error) {
      console.error('Ошибка обновления статуса:', error)
    }
  }

  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         question.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || question.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const isTeacher = session?.user?.role === 'TEACHER' || session?.user?.role === 'ADMIN'

  return (
    <>
      {/* Кнопка открытия Q&A */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-full shadow-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 z-50 flex items-center justify-center"
      >
        <HelpCircle className="w-6 h-6" />
        {questions.some(q => q.status === 'pending') && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {questions.filter(q => q.status === 'pending').length}
          </span>
        )}
      </button>

      {/* Боковая панель Q&A */}
      {isOpen && (
        <div className="fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col">
          {/* Заголовок */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
            <h2 className="text-lg font-semibold">{t('qa.title')}</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Табы */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('my')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === 'my'
                  ? 'text-emerald-600 border-b-2 border-emerald-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('qa.myQuestions')}
            </button>
            {isTeacher && (
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                  activeTab === 'all'
                    ? 'text-emerald-600 border-b-2 border-emerald-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t('qa.allQuestions')}
              </button>
            )}
          </div>

          {/* Поиск и фильтры */}
          <div className="p-4 border-b border-gray-200 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('qa.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex space-x-2">
              {['all', 'pending', 'answered', 'resolved'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status as any)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    statusFilter === status
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t(`qa.status.${status}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            {/* Список вопросов */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {filteredQuestions.map((question) => (
                    <div
                      key={question.id}
                      onClick={() => setSelectedQuestion(question)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedQuestion?.id === question.id
                          ? 'border-emerald-300 bg-emerald-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-gray-900 text-sm line-clamp-2">
                          {question.title}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            question.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            question.status === 'answered' ? 'bg-blue-100 text-blue-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {t(`qa.status.${question.status}`)}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {question.content}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-2">
                          <User className="w-3 h-3" />
                          <span>{question.studentName}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(question.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={questionsEndRef} />
                </div>
              )}
            </div>

            {/* Форма нового вопроса */}
            {activeTab === 'my' && (
              <div className="p-4 border-t border-gray-200">
                <h3 className="font-medium text-gray-900 mb-3">{t('qa.askQuestion')}</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder={t('qa.questionTitle')}
                    value={newQuestion.title}
                    onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  <textarea
                    placeholder={t('qa.questionContent')}
                    value={newQuestion.content}
                    onChange={(e) => setNewQuestion({ ...newQuestion, content: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  <button
                    onClick={submitQuestion}
                    disabled={!newQuestion.title.trim() || !newQuestion.content.trim()}
                    className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {t('qa.submitQuestion')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Модальное окно для просмотра вопроса */}
      {selectedQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">{selectedQuestion.title}</h2>
                <button
                  onClick={() => setSelectedQuestion(null)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">{t('qa.question')}</h3>
                  <p className="text-gray-700">{selectedQuestion.content}</p>
                  <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                    <span>{selectedQuestion.studentName}</span>
                    <span>{new Date(selectedQuestion.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                {selectedQuestion.answer && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">{t('qa.answer')}</h3>
                    <p className="text-gray-700">{selectedQuestion.answer}</p>
                    <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                      <span>{selectedQuestion.teacherName}</span>
                      <span>{selectedQuestion.answeredAt && new Date(selectedQuestion.answeredAt).toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {isTeacher && selectedQuestion.status === 'pending' && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">{t('qa.yourAnswer')}</h3>
                    <textarea
                      placeholder={t('qa.answerPlaceholder')}
                      value={newAnswer}
                      onChange={(e) => setNewAnswer(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                    <div className="flex space-x-2 mt-2">
                      <button
                        onClick={submitAnswer}
                        disabled={!newAnswer.trim()}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {t('qa.submitAnswer')}
                      </button>
                    </div>
                  </div>
                )}

                {selectedQuestion.status === 'answered' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => markAsResolved(selectedQuestion.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      {t('qa.markResolved')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
