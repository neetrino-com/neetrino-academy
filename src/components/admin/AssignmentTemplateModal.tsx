'use client'

import { useState, useEffect } from 'react'
import { X, FileText, Save, Loader2 } from 'lucide-react'

interface AssignmentTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editingTemplate?: {
    id: string
    title: string
    description: string | null
    type: string
    maxScore: number | null
  } | null
}

const assignmentTypes = [
  { value: 'HOMEWORK', label: 'Домашнее задание' },
  { value: 'PROJECT', label: 'Проект' },
  { value: 'EXAM', label: 'Экзамен' },
  { value: 'QUIZ', label: 'Тест' },
  { value: 'PRACTICAL', label: 'Практическая работа' },
  { value: 'ESSAY', label: 'Эссе' },
  { value: 'OTHER', label: 'Другое' }
]

export default function AssignmentTemplateModal({
  isOpen,
  onClose,
  onSuccess,
  editingTemplate
}: AssignmentTemplateModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'HOMEWORK',
    maxScore: 100
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Обновляем форму при изменении editingTemplate
  useEffect(() => {
    if (editingTemplate) {
      setFormData({
        title: editingTemplate.title || '',
        description: editingTemplate.description || '',
        type: editingTemplate.type || 'HOMEWORK',
        maxScore: editingTemplate.maxScore || 100
      })
    } else {
      setFormData({
        title: '',
        description: '',
        type: 'HOMEWORK',
        maxScore: 100
      })
    }
    setErrors({})
  }, [editingTemplate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      const url = editingTemplate 
        ? `/api/assignments/templates/${editingTemplate.id}`
        : '/api/assignments/templates'
      
      const method = editingTemplate ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        onSuccess()
        onClose()
        // Сброс формы
        setFormData({
          title: '',
          description: '',
          type: 'HOMEWORK',
          maxScore: 100
        })
      } else {
        const errorData = await response.json()
        if (errorData.details) {
          setErrors(errorData.details.reduce((acc: any, error: any) => {
            acc[error.path[0]] = error.message
            return acc
          }, {}))
        } else {
          setErrors({ general: errorData.error || 'Ошибка сохранения' })
        }
      }
    } catch (error) {
      console.error('Ошибка сохранения шаблона:', error)
      setErrors({ general: 'Ошибка сохранения шаблона' })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Очищаем ошибку для этого поля
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 rounded-xl p-2">
              <FileText className="w-6 h-6 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">
              {editingTemplate ? 'Редактировать шаблон' : 'Создать шаблон задания'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="p-6">
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {errors.general}
            </div>
          )}

          <div className="space-y-6">
            {/* Название */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Название шаблона *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                  errors.title ? 'border-red-300' : 'border-slate-300'
                }`}
                placeholder="Введите название шаблона"
                required
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Описание */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Описание
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                placeholder="Описание задания (необязательно)"
              />
            </div>

            {/* Тип задания */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Тип задания
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                {assignmentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Максимальный балл */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Максимальный балл
              </label>
              <input
                type="number"
                value={formData.maxScore}
                onChange={(e) => handleChange('maxScore', parseInt(e.target.value) || 0)}
                min="1"
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                  errors.maxScore ? 'border-red-300' : 'border-slate-300'
                }`}
                placeholder="100"
                required
              />
              {errors.maxScore && (
                <p className="mt-1 text-sm text-red-600">{errors.maxScore}</p>
              )}
            </div>
          </div>

          {/* Кнопки */}
          <div className="flex gap-3 pt-6 border-t border-slate-200 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-3 rounded-xl font-medium hover:from-amber-600 hover:to-amber-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {editingTemplate ? 'Сохранить изменения' : 'Создать шаблон'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
