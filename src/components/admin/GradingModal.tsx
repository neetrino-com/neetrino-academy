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
  const [score, setScore] = useState<number>(submission.score || 5)
  const [feedback, setFeedback] = useState(submission.feedback || '')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (score < 0 || score > 5) {
      alert('Оценка должна быть от 0 до 5')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/teacher/submissions/${submission.id}/grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          score: score,
          feedback: feedback.trim()
        })
      })

      if (response.ok) {
        const result = await response.json()
        alert(result.message)
        onSuccess()
      } else {
        const error = await response.json()
        alert(`Ошибка: ${error.error}`)
      }
    } catch (error) {
      console.error('Ошибка выставления оценки:', error)
      alert('Ошибка выставления оценки')
    } finally {
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
    if (score >= 4) return 'text-green-600 bg-green-100'
    if (score >= 3) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[95vh] overflow-y-auto">
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

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Основное содержимое */}
            <div className="lg:col-span-2 space-y-6">
              {/* Информация о задании */}
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{submission.assignment.title}</h3>
                    <p className="text-gray-600">
                      {submission.assignment.module.course.title} • {submission.assignment.module.title}
                    </p>
                  </div>
                </div>
                
                {submission.assignment.description && (
                  <div className="bg-white rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Описание задания:</h4>
                    <div className="prose prose-sm max-w-none text-gray-700">
                      {submission.assignment.description.split('\n').map((line, index) => (
                        <p key={index} className="mb-2">{line}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Решение студента */}
              <div className="bg-white rounded-xl border p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Решение студента</h3>
                    <p className="text-gray-600">Сдано: {formatDate(submission.submittedAt)}</p>
                  </div>
                </div>

                {submission.content ? (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-gray-900 mb-3">Текст решения:</h4>
                    <div className="bg-white rounded-lg p-4 border">
                      <pre className="whitespace-pre-wrap text-gray-700 font-sans text-sm leading-relaxed">
                        {submission.content}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <p className="text-yellow-800 text-sm">
                      Студент не добавил текстовое решение
                    </p>
                  </div>
                )}

                {submission.fileUrl && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Прикрепленный файл:</h4>
                    <a
                      href={submission.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Скачать файл
                    </a>
                  </div>
                )}
              </div>

              {/* Форма оценивания */}
              <div className="bg-white rounded-xl border p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Star className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Оценка и обратная связь</h3>
                    <p className="text-gray-600">Поставьте оценку и добавьте комментарий</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Оценка */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Оценка (от 0 до 5)
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="number"
                        min="0"
                        max="5"
                        step="0.1"
                        value={score}
                        onChange={(e) => setScore(parseFloat(e.target.value) || 0)}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center text-lg font-semibold"
                        disabled={loading}
                      />
                      <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getScoreColor(score)}`}>
                        {score >= 4 ? 'Отлично' : score >= 3 ? 'Хорошо' : 'Требует доработки'}
                      </span>
                    </div>
                    
                    {/* Быстрые кнопки оценок */}
                    <div className="flex gap-2 mt-3">
                      {[5, 4, 3, 2, 1, 0].map((value) => (
                        <button
                          key={value}
                          onClick={() => setScore(value)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            score === value 
                              ? 'bg-indigo-600 text-white' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Комментарий для студента
                    </label>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Напишите подробный комментарий: что выполнено хорошо, что нужно улучшить, рекомендации..."
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                      disabled={loading}
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      Конструктивная обратная связь поможет студенту улучшить свои навыки
                    </p>
                  </div>

                  {/* Кнопки */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={onClose}
                      disabled={loading}
                      className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Сохранение...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          {submission.gradedAt ? 'Обновить оценку' : 'Поставить оценку'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Боковая панель */}
            <div className="space-y-6">
              {/* Информация о студенте */}
              <div className="bg-white rounded-xl border p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Студент</h3>
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">
                      {submission.user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{submission.user.name}</p>
                    <p className="text-sm text-gray-600">{submission.user.email}</p>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-600">Группы</p>
                    <p className="font-medium text-gray-900">
                      {submission.groups.map(g => g.name).join(', ')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Информация о задании */}
              <div className="bg-white rounded-xl border p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Информация</h3>
                
                <div className="space-y-4 text-sm">
                  <div>
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <BookOpen className="w-4 h-4" />
                      Курс
                    </div>
                    <p className="font-medium text-gray-900">
                      {submission.assignment.module.course.title}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <FileText className="w-4 h-4" />
                      Модуль
                    </div>
                    <p className="font-medium text-gray-900">
                      {submission.assignment.module.title}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <Calendar className="w-4 h-4" />
                      Дедлайн
                    </div>
                    <p className="font-medium text-gray-900">
                      {formatDate(submission.assignment.dueDate)}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <Calendar className="w-4 h-4" />
                      Сдано
                    </div>
                    <p className="font-medium text-gray-900">
                      {formatDate(submission.submittedAt)}
                    </p>
                  </div>

                  {submission.gradedAt && (
                    <div>
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <CheckCircle className="w-4 h-4" />
                        Проверено
                      </div>
                      <p className="font-medium text-gray-900">
                        {formatDate(submission.gradedAt)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Текущая оценка */}
              {submission.gradedAt && submission.score !== null && (
                <div className="bg-white rounded-xl border p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Текущая оценка</h3>
                  
                  <div className="text-center">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full text-2xl font-bold ${getScoreColor(submission.score)}`}>
                      {submission.score}
                    </div>
                    <p className="text-sm text-gray-600 mt-2">из 5 баллов</p>
                  </div>

                  {submission.feedback && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>Ваш комментарий:</strong><br />
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
