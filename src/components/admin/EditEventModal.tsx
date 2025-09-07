'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, Clock, MapPin, Users, User, Save, AlertCircle } from 'lucide-react'

interface EventData {
  id: string
  title: string
  description?: string
  type: string
  startDate: string
  endDate: string
  location?: string
  isAttendanceRequired: boolean
  groupId: string
  groupName: string
  teacherId: string
  teacherName: string
}

interface EditEventModalProps {
  event: EventData | null
  isOpen: boolean
  onClose: () => void
  onSave: (eventData: EventData) => Promise<void>
  groups: Array<{ id: string; name: string }>
  teachers: Array<{ id: string; name: string; email: string }>
}

const EVENT_TYPES = [
  { value: 'LESSON', label: 'Занятие' },
  { value: 'EXAM', label: 'Экзамен' },
  { value: 'MEETING', label: 'Встреча' },
  { value: 'WORKSHOP', label: 'Мастер-класс' },
  { value: 'SEMINAR', label: 'Семинар' },
  { value: 'CONSULTATION', label: 'Консультация' },
  { value: 'ANNOUNCEMENT', label: 'Объявление' },
  { value: 'OTHER', label: 'Другое' }
]

export default function EditEventModal({ 
  event, 
  isOpen, 
  onClose, 
  onSave, 
  groups, 
  teachers 
}: EditEventModalProps) {
  const [formData, setFormData] = useState<EventData>({
    id: '',
    title: '',
    description: '',
    type: 'LESSON',
    startDate: '',
    endDate: '',
    location: '',
    isAttendanceRequired: false,
    groupId: '',
    groupName: '',
    teacherId: '',
    teacherName: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (event && isOpen) {
      setFormData({
        ...event,
        startDate: event.startDate.split('T')[0] + 'T' + event.startDate.split('T')[1]?.substring(0, 5) || '',
        endDate: event.endDate.split('T')[0] + 'T' + event.endDate.split('T')[1]?.substring(0, 5) || ''
      })
      setErrors({})
    }
  }, [event, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Название обязательно'
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Дата начала обязательна'
    }

    if (!formData.endDate) {
      newErrors.endDate = 'Дата окончания обязательна'
    }

    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = 'Дата окончания должна быть позже даты начала'
    }

    if (!formData.groupId) {
      newErrors.groupId = 'Группа обязательна'
    }

    if (!formData.teacherId) {
      newErrors.teacherId = 'Преподаватель обязателен'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Ошибка при сохранении:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGroupChange = (groupId: string) => {
    const group = groups.find(g => g.id === groupId)
    setFormData(prev => ({
      ...prev,
      groupId,
      groupName: group?.name || ''
    }))
  }

  const handleTeacherChange = (teacherId: string) => {
    const teacher = teachers.find(t => t.id === teacherId)
    setFormData(prev => ({
      ...prev,
      teacherId,
      teacherName: teacher?.name || ''
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Редактирование события
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Название события *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.title ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Введите название события"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.title}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Описание
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Описание события (необязательно)"
            />
          </div>

          {/* Type and Group */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Тип события *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {EVENT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Группа *
              </label>
              <select
                value={formData.groupId}
                onChange={(e) => handleGroupChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.groupId ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Выберите группу</option>
                {groups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
              {errors.groupId && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.groupId}
                </p>
              )}
            </div>
          </div>

          {/* Teacher and Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Преподаватель *
              </label>
              <select
                value={formData.teacherId}
                onChange={(e) => handleTeacherChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.teacherId ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Выберите преподавателя</option>
                {teachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
              {errors.teacherId && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.teacherId}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Место проведения
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Аудитория, адрес..."
              />
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Дата и время начала *
              </label>
              <input
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.startDate ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.startDate}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Дата и время окончания *
              </label>
              <input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.endDate ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.endDate}
                </p>
              )}
            </div>
          </div>

          {/* Attendance Required */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="attendanceRequired"
              checked={formData.isAttendanceRequired}
              onChange={(e) => setFormData(prev => ({ ...prev, isAttendanceRequired: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="attendanceRequired" className="ml-2 block text-sm text-gray-700">
              Обязательная посещаемость
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Сохранить
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
