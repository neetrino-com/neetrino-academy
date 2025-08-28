'use client'

import { useState, useEffect } from 'react'
import { X, CalendarIcon, Clock, MapPin, Users, FileText } from 'lucide-react'

interface Group {
  id: string
  name: string
}

interface Course {
  id: string
  title: string
}

interface Assignment {
  id: string
  title: string
}

interface EventModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (eventData: any) => void
  eventId?: string
  groupId?: string
}

export default function EventModal({ isOpen, onClose, onSubmit, eventId, groupId }: EventModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'LESSON',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    location: '',
    groupId: groupId || '',
    courseId: '',
    assignmentId: '',
    attendeeIds: [] as string[],
    isRecurring: false,
    recurringRule: {
      frequency: 'weekly',
      interval: 1,
      daysOfWeek: [] as number[],
      endDate: ''
    }
  })

  const [groups, setGroups] = useState<Group[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingEvent, setLoadingEvent] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchGroups()
      if (eventId) {
        fetchEventData()
      } else {
        resetForm()
      }
    }
  }, [isOpen, eventId])

  useEffect(() => {
    if (formData.groupId) {
      fetchGroupCourses()
    }
  }, [formData.groupId])

  useEffect(() => {
    if (formData.courseId) {
      fetchCourseAssignments()
    }
  }, [formData.courseId])

  const resetForm = () => {
    const now = new Date()
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)
    
    setFormData({
      title: '',
      description: '',
      type: 'LESSON',
      startDate: now.toISOString().split('T')[0],
      startTime: now.toTimeString().slice(0, 5),
      endDate: oneHourLater.toISOString().split('T')[0],
      endTime: oneHourLater.toTimeString().slice(0, 5),
      location: '',
      groupId: groupId || '',
      courseId: '',
      assignmentId: '',
      attendeeIds: [],
      isRecurring: false,
      recurringRule: {
        frequency: 'weekly',
        interval: 1,
        daysOfWeek: [],
        endDate: ''
      }
    })
  }

  const fetchEventData = async () => {
    if (!eventId) return

    try {
      setLoadingEvent(true)
      const response = await fetch(`/api/events/${eventId}`)
      if (response.ok) {
        const event = await response.json()
        
        const startDate = new Date(event.startDate)
        const endDate = new Date(event.endDate)
        
        setFormData({
          title: event.title || '',
          description: event.description || '',
          type: event.type || 'LESSON',
          startDate: startDate.toISOString().split('T')[0],
          startTime: startDate.toTimeString().slice(0, 5),
          endDate: endDate.toISOString().split('T')[0],
          endTime: endDate.toTimeString().slice(0, 5),
          location: event.location || '',
          groupId: event.group?.id || '',
          courseId: event.course?.id || '',
          assignmentId: event.assignment?.id || '',
          attendeeIds: event.attendees?.map((a: any) => a.userId) || [],
          isRecurring: event.isRecurring || false,
          recurringRule: event.recurringRule ? JSON.parse(event.recurringRule) : {
            frequency: 'weekly',
            interval: 1,
            daysOfWeek: [],
            endDate: ''
          }
        })
      }
    } catch (error) {
      console.error('Error fetching event:', error)
    } finally {
      setLoadingEvent(false)
    }
  }

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/admin/groups')
      if (response.ok) {
        const data = await response.json()
        setGroups(data)
      }
    } catch (error) {
      console.error('Error fetching groups:', error)
    }
  }

  const fetchGroupCourses = async () => {
    if (!formData.groupId) return

    try {
      const response = await fetch(`/api/admin/groups/${formData.groupId}/courses`)
      if (response.ok) {
        const data = await response.json()
        setCourses(data.map((gc: any) => gc.course))
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    }
  }

  const fetchCourseAssignments = async () => {
    if (!formData.courseId) return

    try {
      const response = await fetch(`/api/admin/groups/${formData.groupId}/assignments`)
      if (response.ok) {
        const data = await response.json()
        const courseAssignments = data.filter((a: any) => {
          // Найти задания, связанные с выбранным курсом через модули
          return a.assignment.module.courseId === formData.courseId
        })
        setAssignments(courseAssignments.map((a: any) => a.assignment))
      }
    } catch (error) {
      console.error('Error fetching assignments:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      alert('Название события обязательно')
      return
    }

    // Объединяем дату и время
    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`)
    const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`)

    if (startDateTime >= endDateTime) {
      alert('Время окончания должно быть после времени начала')
      return
    }

    setLoading(true)
    
    try {
      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        location: formData.location.trim(),
        groupId: formData.groupId || null,
        courseId: formData.courseId || null,
        assignmentId: formData.assignmentId || null,
        attendeeIds: formData.attendeeIds,
        isRecurring: formData.isRecurring,
        recurringRule: formData.isRecurring ? formData.recurringRule : null
      }

      await onSubmit(eventData)
      onClose()
    } catch (error) {
      console.error('Error submitting event:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleRecurringRuleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      recurringRule: {
        ...prev.recurringRule,
        [field]: value
      }
    }))
  }

  if (!isOpen) return null

  if (loadingEvent) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-10 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка события...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-10 backdrop-blur-sm flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-2xl w-[95vw] h-[95vh] flex flex-col">
        {/* Заголовок */}
        <div className="p-6 border-b bg-gray-50 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              {eventId ? 'Редактировать событие' : 'Создать событие'}
            </h2>
            <button
              onClick={onClose}
              className="p-3 hover:bg-red-100 rounded-lg border border-gray-300 hover:border-red-300 hover:text-red-600 transition-all duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Контент */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Основная информация */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Название */}
              <div className="lg:col-span-2">
                <label className="block text-base font-medium text-gray-700 mb-2">
                  Название события *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-6 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Введите название события"
                  required
                />
              </div>

              {/* Тип события */}
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  Тип события
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="w-full px-6 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="LESSON">Занятие</option>
                  <option value="EXAM">Экзамен</option>
                  <option value="DEADLINE">Дедлайн</option>
                  <option value="MEETING">Встреча</option>
                  <option value="WORKSHOP">Мастер-класс</option>
                  <option value="SEMINAR">Семинар</option>
                  <option value="CONSULTATION">Консультация</option>
                  <option value="ANNOUNCEMENT">Объявление</option>
                  <option value="OTHER">Другое</option>
                </select>
              </div>

              {/* Место */}
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  Место проведения
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-6 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Аудитория, ссылка на встречу..."
                />
              </div>
            </div>

            {/* Время и дата */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Начало */}
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  Начало события
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className="w-full px-6 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => handleInputChange('startTime', e.target.value)}
                    className="w-full px-6 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Окончание */}
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  Окончание события
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    className="w-full px-6 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => handleInputChange('endTime', e.target.value)}
                    className="w-full px-6 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Связи */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Группа */}
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  Группа
                </label>
                <select
                  value={formData.groupId}
                  onChange={(e) => handleInputChange('groupId', e.target.value)}
                  className="w-full px-6 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Не выбрана</option>
                  {groups.map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Курс */}
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  Курс
                </label>
                <select
                  value={formData.courseId}
                  onChange={(e) => handleInputChange('courseId', e.target.value)}
                  className="w-full px-6 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!formData.groupId}
                >
                  <option value="">Не выбран</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Задание */}
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  Задание
                </label>
                <select
                  value={formData.assignmentId}
                  onChange={(e) => handleInputChange('assignmentId', e.target.value)}
                  className="w-full px-6 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!formData.courseId}
                >
                  <option value="">Не выбрано</option>
                  {assignments.map(assignment => (
                    <option key={assignment.id} value={assignment.id}>
                      {assignment.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Описание */}
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">
                Описание
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={8}
                className="w-full px-6 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Дополнительная информация о событии..."
              />
            </div>

            {/* Повторяющиеся события */}
            <div>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.isRecurring}
                  onChange={(e) => handleInputChange('isRecurring', e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded"
                />
                <span className="text-base font-medium text-gray-700">
                  Повторяющееся событие
                </span>
              </label>

              {formData.isRecurring && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Частота
                      </label>
                      <select
                        value={formData.recurringRule.frequency}
                        onChange={(e) => handleRecurringRuleChange('frequency', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="daily">Ежедневно</option>
                        <option value="weekly">Еженедельно</option>
                        <option value="monthly">Ежемесячно</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Интервал
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.recurringRule.interval}
                        onChange={(e) => handleRecurringRuleChange('interval', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Окончание повторений
                    </label>
                    <input
                      type="date"
                      value={formData.recurringRule.endDate}
                      onChange={(e) => handleRecurringRuleChange('endDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Футер */}
        <div className="p-6 border-t bg-gray-50 rounded-b-2xl">
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-lg"
            >
              Отмена
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-lg"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              )}
              {eventId ? 'Сохранить изменения' : 'Создать событие'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
