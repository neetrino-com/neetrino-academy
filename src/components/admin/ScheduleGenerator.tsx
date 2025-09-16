'use client'

import { useState, useEffect } from 'react'
import { 
  Calendar, 
  Clock, 
  Users, 
  Settings, 
  Plus, 
  Trash2, 
  Eye,
  CheckCircle,
  AlertTriangle,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react'

interface Group {
  id: string
  name: string
  description?: string
  type: string
  students: any[]
}

interface ScheduleDay {
  dayOfWeek: number
  startTime: string
  endTime: string
}

interface ScheduleGeneratorProps {
  groups: Group[]
  onGenerate: (data: {
    groupIds: string[]
    startDate: string
    endDate: string
    scheduleDays: Array<{
      dayOfWeek: number
      startTime: string
      endTime: string
    }>
    title?: string
    location?: string
    isAttendanceRequired?: boolean
  }) => void
  onClose: () => void
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Понедельник', short: 'Пн' },
  { value: 2, label: 'Вторник', short: 'Вт' },
  { value: 3, label: 'Среда', short: 'Ср' },
  { value: 4, label: 'Четверг', short: 'Чт' },
  { value: 5, label: 'Пятница', short: 'Пт' },
  { value: 6, label: 'Суббота', short: 'Сб' },
  { value: 0, label: 'Воскресенье', short: 'Вс' }
]

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00'
]

export default function ScheduleGenerator({ groups, onGenerate, onClose }: ScheduleGeneratorProps) {
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [isAttendanceRequired, setIsAttendanceRequired] = useState(true)
  const [scheduleDays, setScheduleDays] = useState<ScheduleDay[]>([])
  const [previewData, setPreviewData] = useState<{
    groups: Group[]
    period: {
      start: string
      end: string
      duration: number
    }
    scheduleDays: Array<{
      dayOfWeek: number
      startTime: string
      endTime: string
      dayName: string
    }>
    settings: {
      title: string
      location: string
      isAttendanceRequired: boolean
    }
    estimatedEvents: number
  } | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    // Устанавливаем даты по умолчанию
    const today = new Date()
    const nextMonth = new Date(today)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    
    setStartDate(today.toISOString().split('T')[0])
    setEndDate(nextMonth.toISOString().split('T')[0])
  }, [])

  const addScheduleDay = () => {
    setScheduleDays([...scheduleDays, { dayOfWeek: 1, startTime: '09:00', endTime: '10:30' }])
  }

  const removeScheduleDay = (index: number) => {
    setScheduleDays(scheduleDays.filter((_, i) => i !== index))
  }

  const updateScheduleDay = (index: number, field: keyof ScheduleDay, value: string | number) => {
    const updated = [...scheduleDays]
    updated[index] = { ...updated[index], [field]: value }
    setScheduleDays(updated)
  }

  const validateForm = (): string[] => {
    const newErrors: string[] = []

    if (selectedGroups.length === 0) {
      newErrors.push('Выберите хотя бы одну группу')
    }

    if (!startDate || !endDate) {
      newErrors.push('Укажите даты начала и окончания')
    } else {
      const start = new Date(startDate)
      const end = new Date(endDate)
      if (start >= end) {
        newErrors.push('Дата окончания должна быть позже даты начала')
      }
    }

    if (scheduleDays.length === 0) {
      newErrors.push('Добавьте хотя бы один день расписания')
    }

    scheduleDays.forEach((day, index) => {
      if (day.startTime >= day.endTime) {
        newErrors.push(`Время окончания должно быть позже времени начала для дня ${index + 1}`)
      }
    })

    return newErrors
  }

  const generatePreview = () => {
    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    setErrors([])
    setShowPreview(true)

    // Создаем предварительный просмотр
    const preview = {
      groups: groups.filter(g => selectedGroups.includes(g.id)),
      period: {
        start: startDate,
        end: endDate,
        duration: Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
      },
      scheduleDays: scheduleDays.map(day => ({
        ...day,
        dayName: DAYS_OF_WEEK.find(d => d.value === day.dayOfWeek)?.label
      })),
      settings: {
        title: title || 'Занятие группы',
        location,
        isAttendanceRequired
      },
      estimatedEvents: calculateEstimatedEvents()
    }

    setPreviewData(preview)
  }

  const calculateEstimatedEvents = () => {
    if (!startDate || !endDate || scheduleDays.length === 0) return 0

    const start = new Date(startDate)
    const end = new Date(endDate)
    const weeks = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7))
    
    return selectedGroups.length * scheduleDays.length * weeks
  }

  const handleGenerate = async () => {
    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsGenerating(true)
    setErrors([])

    try {
      const generateData = {
        groupIds: selectedGroups,
        startDate,
        endDate,
        scheduleDays,
        title: title || undefined,
        location: location || undefined,
        isAttendanceRequired
      }

      await onGenerate(generateData)
      onClose()
    } catch (error) {
      console.error('Ошибка генерации расписания:', error)
      setErrors(['Ошибка при генерации расписания'])
    } finally {
      setIsGenerating(false)
    }
  }

  const toggleGroup = (groupId: string) => {
    setSelectedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    )
  }

  const selectAllGroups = () => {
    setSelectedGroups(groups.map(g => g.id))
  }

  const deselectAllGroups = () => {
    setSelectedGroups([])
  }

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Генератор расписания</h2>
                <p className="text-blue-100">Создание расписания на длительный период</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Ошибки */}
          {errors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="font-semibold text-red-800">Ошибки валидации</h3>
              </div>
              <ul className="list-disc list-inside text-red-700 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* Левая колонка - Настройки */}
            <div className="space-y-6 flex flex-col h-full">
              {/* Выбор групп - фиксированная панель */}
              <div className="flex-shrink-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Выбор групп
                </h3>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <button
                      onClick={selectAllGroups}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                      Выбрать все
                    </button>
                    <button
                      onClick={deselectAllGroups}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      Снять выбор
                    </button>
                  </div>
                  <div className="h-48 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-2">
                    {groups.map(group => (
                      <label key={group.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedGroups.includes(group.id)}
                          onChange={() => toggleGroup(group.id)}
                          className="rounded border-gray-300"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{group.name}</div>
                          <div className="text-sm text-gray-500">
                            {group.students.length} студентов • {group.type}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Остальные настройки - прокручиваемые */}
              <div className="flex-1 overflow-y-auto space-y-6">
                {/* Период */}
                <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Период обучения
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Дата начала
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Дата окончания
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                {startDate && endDate && (
                  <div className="mt-2 text-sm text-gray-600">
                    Продолжительность: {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))} дней
                  </div>
                )}
              </div>

              {/* Дополнительные настройки */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Дополнительные настройки
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Название занятия
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Например: Занятие по WordPress"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Место проведения
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Например: Аудитория 101"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Обязательная посещаемость
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAttendanceRequired(true)
                          // Очищаем ошибки при изменении
                          if (errors.length > 0) {
                            setErrors([])
                          }
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isAttendanceRequired
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Да
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAttendanceRequired(false)
                          // Очищаем ошибки при изменении
                          if (errors.length > 0) {
                            setErrors([])
                          }
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          !isAttendanceRequired
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Нет
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              </div>
            </div>

            {/* Правая колонка - Расписание */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Расписание занятий
              </h3>
              
              <div className="space-y-4">
                {scheduleDays.map((day, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-gray-900">
                        Занятие {index + 1}
                      </span>
                      <button
                        onClick={() => removeScheduleDay(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          День недели
                        </label>
                        <select
                          value={day.dayOfWeek}
                          onChange={(e) => updateScheduleDay(index, 'dayOfWeek', parseInt(e.target.value))}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {DAYS_OF_WEEK.map(d => (
                            <option key={d.value} value={d.value}>
                              {d.short}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Начало
                        </label>
                        <select
                          value={day.startTime}
                          onChange={(e) => updateScheduleDay(index, 'startTime', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {TIME_SLOTS.map(time => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Окончание
                        </label>
                        <select
                          value={day.endTime}
                          onChange={(e) => updateScheduleDay(index, 'endTime', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {TIME_SLOTS.map(time => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  onClick={addScheduleDay}
                  className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Добавить день расписания
                </button>
              </div>
            </div>
          </div>

          {/* Предварительный просмотр */}
          {previewData && showPreview && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Предварительный просмотр
                </h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <ChevronUp className="w-5 h-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-medium text-blue-900">Группы</div>
                  <div className="text-blue-700">
                    {previewData.groups.length} групп выбрано
                  </div>
                </div>
                <div>
                  <div className="font-medium text-blue-900">Период</div>
                  <div className="text-blue-700">
                    {previewData.period.duration} дней
                  </div>
                </div>
                <div>
                  <div className="font-medium text-blue-900">Занятий</div>
                  <div className="text-blue-700">
                    ~{previewData.estimatedEvents} событий
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer - всегда видимый */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200 flex-shrink-0">
          <div className="text-sm text-gray-600">
            {selectedGroups.length > 0 && scheduleDays.length > 0 && (
              <span>
                Будет создано ~{calculateEstimatedEvents()} занятий для {selectedGroups.length} групп
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={generatePreview}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
            >
              <Eye className="w-4 h-4" />
              Предварительный просмотр
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Генерация...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Создать расписание
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
