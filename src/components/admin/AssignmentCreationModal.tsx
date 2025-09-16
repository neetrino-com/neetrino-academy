'use client'

import { useState, useEffect } from 'react'
import { 
  X, 
  Target, 
  BookOpen, 
  Calendar, 
  FileText,
  Clock,
  CheckCircle,
  Tag,
  Copy
} from 'lucide-react'
import TemplateSelectionModal from './TemplateSelectionModal'

interface Lesson {
  id: string
  title: string
  order: number
  module: {
    id: string
    title: string
    order: number
    course: {
      id: string
      title: string
    }
  }
}

interface AssignmentTemplate {
  id: string
  title: string
  description: string | null
  type: string
  maxScore: number | null
  createdAt: string
  creator: {
    id: string
    name: string
    email: string
  }
  _count: {
    submissions: number
    groupAssignments: number
  }
}

interface AssignmentCreationModalProps {
  isOpen: boolean
  onClose: () => void
  groupId: string
  onAssignmentCreated: () => void
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

export default function AssignmentCreationModal({
  isOpen,
  onClose,
  groupId,
  onAssignmentCreated
}: AssignmentCreationModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    lessonId: '',
    dueDate: '',
    dueTime: '23:59',
    type: 'HOMEWORK'
  })
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingLessons, setLoadingLessons] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<AssignmentTemplate | null>(null)
  const [creationMode, setCreationMode] = useState<'new' | 'template'>('new')

  const fetchGroupLessons = async () => {
    setLoadingLessons(true)
    try {
      const response = await fetch(`/api/admin/groups/${groupId}/lessons`)
      if (response.ok) {
        const lessonsData = await response.json()
        setLessons(lessonsData)
      }
    } catch (error) {
      console.error('Error fetching lessons:', error)
    } finally {
      setLoadingLessons(false)
    }
  }

  // Загружаем уроки группы при открытии модального окна
  useEffect(() => {
    if (isOpen) {
      fetchGroupLessons()
    }
  }, [isOpen, groupId])

  // Заполняем форму данными из шаблона
  useEffect(() => {
    if (selectedTemplate) {
      setFormData(prev => ({
        ...prev,
        title: selectedTemplate.title,
        description: selectedTemplate.description || '',
        type: selectedTemplate.type
      }))
    }
  }, [selectedTemplate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.dueDate) {
      alert('Пожалуйста, заполните все обязательные поля')
      return
    }

    setLoading(true)
    try {
      // Объединяем дату и время в одну дату
      const dueDateTime = new Date(`${formData.dueDate}T${formData.dueTime}:00`)
      
      const response = await fetch(`/api/admin/groups/${groupId}/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          lessonId: formData.lessonId || null, // lessonId теперь опциональный
          dueDate: dueDateTime.toISOString(),
          type: formData.type
        })
      })

      if (response.ok) {
        // Сбрасываем форму
        setFormData({
          title: '',
          description: '',
          lessonId: '',
          dueDate: '',
          dueTime: '23:59',
          type: 'HOMEWORK'
        })
        
        // Закрываем модальное окно и обновляем данные
        onClose()
        onAssignmentCreated()
      } else {
        const error = await response.json()
        alert(`Ошибка создания задания: ${error.error}`)
      }
    } catch (error) {
      console.error('Error creating assignment:', error)
      alert('Ошибка создания задания')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setFormData({
        title: '',
        description: '',
        lessonId: '',
        dueDate: '',
        dueTime: '23:59',
        type: 'HOMEWORK'
      })
      setSelectedTemplate(null)
      setCreationMode('new')
      onClose()
    }
  }

  const handleTemplateSelected = (template: AssignmentTemplate) => {
    setSelectedTemplate(template)
    setCreationMode('template')
    setShowTemplateModal(false)
  }

  const handleCreateNew = () => {
    setCreationMode('new')
    setSelectedTemplate(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-yellow-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <Target className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Создать задание</h2>
              <p className="text-sm text-gray-600">Добавьте новое задание для группы</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 border border-gray-300 hover:border-red-300"
          >
            <X className="w-5 h-5 text-gray-600 hover:text-red-600" />
          </button>
        </div>

        {/* Кнопки выбора способа создания */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-3">
            <button
              onClick={() => setShowTemplateModal(true)}
              className={`flex-1 px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                creationMode === 'template'
                  ? 'bg-orange-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Copy className="w-4 h-4" />
              Выбрать из шаблонов
            </button>
            <button
              onClick={handleCreateNew}
              className={`flex-1 px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                creationMode === 'new'
                  ? 'bg-amber-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              Создать новое
            </button>
          </div>
          {selectedTemplate && (
            <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2 text-orange-800">
                <Copy className="w-4 h-4" />
                <span className="font-medium">Выбран шаблон:</span>
                <span>{selectedTemplate.title}</span>
              </div>
            </div>
          )}
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Название задания */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Название задания *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Введите название задания"
              className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              disabled={loading}
              required
            />
          </div>

          {/* Описание */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Описание
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Опишите задание, требования и критерии оценки..."
              rows={4}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
              disabled={loading}
            />
          </div>

          {/* Тип задания */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Tag className="w-4 h-4 inline mr-2" />
              Тип задания
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              disabled={loading}
            >
              {assignmentTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Выбор урока */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <BookOpen className="w-4 h-4 inline mr-2" />
              Урок курса (необязательно)
            </label>
            {loadingLessons ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600"></div>
                <span className="ml-2 text-gray-600 text-sm">Загрузка уроков...</span>
              </div>
            ) : (
              <select
                value={formData.lessonId}
                onChange={(e) => setFormData(prev => ({ ...prev, lessonId: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="">Без привязки к уроку</option>
                {lessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.module.course.title} → {lesson.module.title} → {lesson.title}
                  </option>
                ))}
              </select>
            )}
            {lessons.length === 0 && !loadingLessons && (
              <p className="text-blue-600 text-xs mt-1">
                ℹ️ У группы нет назначенных курсов с уроками. Задание будет создано без привязки к уроку.
              </p>
            )}
          </div>

          {/* Срок выполнения */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Дата сдачи *
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                disabled={loading}
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Время
              </label>
              <input
                type="time"
                value={formData.dueTime}
                onChange={(e) => setFormData(prev => ({ ...prev, dueTime: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
          </div>

          {/* Кнопки */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  Создание...
                </>
              ) : (
                <>
                  <CheckCircle className="w-3 h-3" />
                  Создать задание
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Модальное окно выбора шаблонов */}
      <TemplateSelectionModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        onTemplateSelected={handleTemplateSelected}
      />
    </div>
  )
}
