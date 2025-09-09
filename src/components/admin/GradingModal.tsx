'use client'

import { useState } from 'react'
import { 
  X, 
  Star,
  FileText,
  User,
  BookOpen,
  Calendar,
  Download,
  Send,
  CheckCircle,
  Eye
} from 'lucide-react'

interface Submission {
  id: string
  content: string | null
  fileUrl: string | null
  submittedAt: string
  score: number | null
  feedback: string | null
  gradedAt: string | null
  user: {
    id: string
    name: string
    email: string
    avatar: string | null
  }
  assignment: {
    id: string
    title: string
    description: string | null
    dueDate: string
    module: {
      title: string
      course: {
        id: string
        title: string
        direction: string
      }
    }
  }
  groups: Array<{
    id: string
    name: string
  }>
}

interface GradingModalProps {
  submission: Submission
  onClose: () => void
  onSuccess: () => void
}

export default function GradingModal({ submission, onClose, onSuccess }: GradingModalProps) {
  const [score, setScore] = useState<number>(submission.score || 100)
  const [feedback, setFeedback] = useState(submission.feedback || '')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    console.log('🚀 [GradingModal] Starting submission grading process')
    console.log('📊 [GradingModal] Score:', score, 'Feedback:', feedback)
    console.log('👤 [GradingModal] Submission ID:', submission.id)
    
    if (score < 0 || score > 100) {
      console.log('❌ [GradingModal] Invalid score:', score)
      alert('Оценка должна быть от 0 до 100')
      return
    }

    setLoading(true)
    try {
      // Используем абсолютный URL с правильным портом
      const url = `${window.location.origin}/api/teacher/submissions/${submission.id}/grade`
      const requestBody = {
        score: score,
        feedback: feedback.trim()
      }
      
      console.log('🌐 [GradingModal] Making request to:', url)
      console.log('📦 [GradingModal] Request body:', requestBody)
      console.log('🌍 [GradingModal] Current location:', window.location.href)
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      })

      console.log('📡 [GradingModal] Response status:', response.status)
      console.log('📡 [GradingModal] Response ok:', response.ok)
      console.log('📡 [GradingModal] Response URL:', response.url)

      if (response.ok) {
        const result = await response.json()
        console.log('✅ [GradingModal] Success response:', result)
        alert(result.message)
        onSuccess()
      } else {
        const errorText = await response.text()
        console.log('❌ [GradingModal] Error response text:', errorText)
        
        let errorData
        try {
          errorData = JSON.parse(errorText)
          console.log('❌ [GradingModal] Parsed error data:', errorData)
        } catch (parseError) {
          console.log('❌ [GradingModal] Failed to parse error response as JSON:', parseError)
          errorData = { error: errorText }
        }
        
        alert(`Ошибка: ${errorData.error || 'Неизвестная ошибка'}`)
      }
    } catch (error) {
      console.error('💥 [GradingModal] Network or other error:', error)
      console.error('💥 [GradingModal] Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
      alert('Произошла ошибка при отправке оценки')
    } finally {
      console.log('🏁 [GradingModal] Process completed, setting loading to false')
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] h-[95vh] overflow-hidden flex flex-col">
        {/* Заголовок */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                {submission.gradedAt ? 'Изменить оценку' : 'Оценить задание'}
              </h2>
              <p className="text-gray-600">Оценка сдачи от {submission.user.name}</p>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-3 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="h-full grid grid-cols-1 lg:grid-cols-10 gap-6 p-6">
            {/* Левая сторона - Задание и решение студента (70%) */}
            <div className="lg:col-span-7 space-y-4 overflow-y-auto">
              {/* Информация о задании */}
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 border border-indigo-100">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{submission.assignment.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <BookOpen className="w-4 h-4" />
                      <span>{submission.assignment.module?.course?.title || 'Курс не указан'}</span>
                      <span>•</span>
                      <span>{submission.assignment.module?.title || 'Модуль не указан'}</span>
                    </div>
                  </div>
                </div>
                
                {submission.assignment.description && (
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-white/50">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                      Описание задания
                    </h4>
                    <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                      {submission.assignment.description.split('\n').map((line, index) => (
                        <p key={index} className="mb-2">{line}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Решение студента */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-100">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Решение студента</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Сдано: {formatDate(submission.submittedAt)}</span>
                    </div>
                  </div>
                </div>

                {submission.content ? (
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 mb-4 border border-white/50">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Текст решения
                    </h4>
                    <div className="bg-white rounded-lg p-4 border border-gray-100">
                      <pre className="whitespace-pre-wrap text-gray-700 font-sans text-sm leading-relaxed">
                        {submission.content}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-4 mb-4">
                    <p className="text-yellow-800 text-sm font-medium">
                      Студент не добавил текстовое решение
                    </p>
                  </div>
                )}

                {submission.fileUrl && (
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-white/50">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Прикрепленный файл
                    </h4>
                    <a
                      href={submission.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <Download className="w-5 h-5" />
                      <span className="font-medium">Скачать файл</span>
                    </a>
                  </div>
                )}
              </div>

            </div>

            {/* Правая сторона - Информация о задании и форма оценки (30%) */}
            <div className="lg:col-span-3 space-y-4 overflow-y-auto">
              {/* Форма оценивания */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center shadow-md">
                    <Star className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Оценка и обратная связь</h3>
                </div>

                <div className="space-y-6">
                  {/* Оценка */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Оценка (0-100)
                    </label>
                    <div className="flex items-center gap-4 mb-4">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={score}
                        onChange={(e) => setScore(parseFloat(e.target.value) || 0)}
                        className="w-24 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-center text-xl font-bold"
                        disabled={loading}
                      />
                      <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${getScoreColor(score)}`}>
                        {score >= 80 ? 'Отлично' : score >= 60 ? 'Хорошо' : 'Требует доработки'}
                      </span>
                    </div>
                    
                    {/* Быстрые кнопки оценок */}
                    <div className="grid grid-cols-4 gap-2">
                      {[100, 90, 80, 70, 60, 50, 30, 0].map((value) => (
                        <button
                          key={value}
                          onClick={() => setScore(value)}
                          className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                            score === value 
                              ? 'bg-orange-600 text-white shadow-md scale-105' 
                              : 'bg-white text-gray-700 hover:bg-orange-100 hover:scale-105'
                          }`}
                          disabled={loading}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Комментарий */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Комментарий
                    </label>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Что выполнено хорошо, что нужно улучшить..."
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none text-sm"
                      disabled={loading}
                    />
                  </div>

                  {/* Кнопки */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={onClose}
                      disabled={loading}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 text-sm font-semibold disabled:opacity-50"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg hover:from-orange-700 hover:to-amber-700 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 text-sm font-semibold shadow-md hover:shadow-lg"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Сохранение...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          {submission.gradedAt ? 'Обновить' : 'Оценить'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Информация о студенте */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                    <span className="text-white font-bold text-lg">
                      {submission.user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">{submission.user.name}</p>
                    <p className="text-xs text-gray-600">{submission.user.email}</p>
                    {submission.groups.length > 0 && (
                      <div className="mt-1">
                        <div className="flex flex-wrap gap-1">
                          {submission.groups.map(g => (
                            <span key={g.id} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                              {g.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Информация о задании */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-md">
                    <BookOpen className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">Детали задания</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-white/50">
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <BookOpen className="w-3 h-3" />
                      <span className="font-medium text-xs">Курс</span>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm">
                      {submission.assignment.module?.course?.title || 'Курс не указан'}
                    </p>
                  </div>

                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-white/50">
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <FileText className="w-3 h-3" />
                      <span className="font-medium text-xs">Модуль</span>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm">
                      {submission.assignment.module?.title || 'Модуль не указан'}
                    </p>
                  </div>

                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-white/50">
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <Calendar className="w-3 h-3" />
                      <span className="font-medium text-xs">Дедлайн</span>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm">
                      {formatDate(submission.assignment.dueDate)}
                    </p>
                  </div>

                  {submission.gradedAt && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-white/50">
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <CheckCircle className="w-3 h-3" />
                        <span className="font-medium text-xs">Проверено</span>
                      </div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {formatDate(submission.gradedAt)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Текущая оценка */}
              {submission.gradedAt && submission.score !== null && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-md">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900">Текущая оценка</h3>
                  </div>
                  
                  <div className="text-center">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl text-2xl font-bold shadow-md ${getScoreColor(submission.score)}`}>
                      {submission.score}
                    </div>
                    <p className="text-xs text-gray-600 mt-1 font-medium">из 100 баллов</p>
                  </div>

                  {submission.feedback && (
                    <div className="mt-3 p-3 bg-white/80 backdrop-blur-sm rounded-lg border border-white/50">
                      <p className="text-xs text-gray-700">
                        <strong>Комментарий:</strong><br />
                        {submission.feedback}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
