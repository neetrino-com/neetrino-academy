'use client'

import { useState } from 'react'
import { 
  Calendar, 
  Clock, 
  Settings, 
  Plus, 
  Trash2, 
  Eye,
  CheckCircle,
  AlertTriangle,
  X,
  Sparkles
} from 'lucide-react'
import { getEventTypeOptions, EVENT_TYPES } from '@/lib/event-types'

interface Group {
  id: string
  name: string
  students: {
    id: string
    name: string
  }[]
}

interface ScheduleDay {
  dayOfWeek: number
  startTime: string
  endTime: string
}

interface GroupScheduleGeneratorProps {
  group: Group
  onGenerate: (data: {
    startDate: string
    endDate: string
    scheduleDays: Array<{
      dayOfWeek: number
      startTime: string
      endTime: string
    }>
    title?: string
    location?: string
    type?: string
    isAttendanceRequired?: boolean
  }) => Promise<void>
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

export default function GroupScheduleGenerator({ group, onGenerate, onClose }: GroupScheduleGeneratorProps) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [type, setType] = useState(EVENT_TYPES.LESSON)
  const [isAttendanceRequired, setIsAttendanceRequired] = useState(false)
  const [scheduleDays, setScheduleDays] = useState<ScheduleDay[]>([])
  const [previewData, setPreviewData] = useState<{
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
      type: string
      isAttendanceRequired: boolean
    }
    estimatedEvents: number
  } | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  // Устанавливаем даты по умолчанию
  useState(() => {
    const today = new Date()
    const nextMonth = new Date(today)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    
    setStartDate(today.toISOString().split('T')[0])
    setEndDate(nextMonth.toISOString().split('T')[0])
  })

  const addScheduleDay = () => {
    setScheduleDays([...scheduleDays, { dayOfWeek: 1, startTime: '09:00', endTime: '10:30' }])
    // Очищаем ошибки при добавлении нового дня
    if (errors.length > 0) {
      setErrors([])
    }
  }

  const removeScheduleDay = (index: number) => {
    setScheduleDays(scheduleDays.filter((_, i) => i !== index))
    // Очищаем ошибки при удалении дня
    if (errors.length > 0) {
      setErrors([])
    }
  }

  const updateScheduleDay = (index: number, field: keyof ScheduleDay, value: string | number) => {
    const updated = [...scheduleDays]
    updated[index] = { ...updated[index], [field]: value }
    setScheduleDays(updated)
    // Очищаем ошибки при изменении дня
    if (errors.length > 0) {
      setErrors([])
    }
  }

  const validateForm = (): string[] => {
    const newErrors: string[] = []

    // Проверка дат
    if (!startDate || !endDate) {
      newErrors.push('Укажите даты начала и окончания')
    } else {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Сбрасываем время для сравнения только дат
      
      if (start >= end) {
        newErrors.push('Дата окончания должна быть позже даты начала')
      }
      
      if (start < today) {
        newErrors.push('Дата начала не может быть в прошлом')
      }
      
      // Проверяем, что период не слишком длинный (максимум 1 год)
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      if (daysDiff > 365) {
        newErrors.push('Период обучения не может превышать 1 год')
      }
    }

    // Проверка расписания
    if (scheduleDays.length === 0) {
      newErrors.push('Добавьте хотя бы один день расписания')
    }

    // Проверка каждого дня расписания
    scheduleDays.forEach((day, index) => {
      if (day.startTime >= day.endTime) {
        newErrors.push(`Время окончания должно быть позже времени начала для занятия ${index + 1}`)
      }
      
      // Проверяем, что занятие не слишком короткое (минимум 30 минут)
      const startTime = new Date(`1970-01-01T${day.startTime}:00`)
      const endTime = new Date(`1970-01-01T${day.endTime}:00`)
      const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60)
      
      if (durationMinutes < 30) {
        newErrors.push(`Занятие ${index + 1} должно длиться минимум 30 минут`)
      }
      
      // Проверяем, что занятие не слишком длинное (максимум 4 часа)
      if (durationMinutes > 240) {
        newErrors.push(`Занятие ${index + 1} не должно длиться более 4 часов`)
      }
    })

    // Проверка на дубликаты дней недели
    const dayOfWeeks = scheduleDays.map(day => day.dayOfWeek)
    const uniqueDays = new Set(dayOfWeeks)
    if (dayOfWeeks.length !== uniqueDays.size) {
      newErrors.push('Нельзя добавлять несколько занятий в один день недели')
    }

    return newErrors
  }

  const generatePreview = () => {
    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    // Очищаем ошибки и показываем предварительный просмотр
    setErrors([])
    setShowPreview(true)

    // Создаем предварительный просмотр
    const preview = {
      period: {
        start: startDate,
        end: endDate,
        duration: Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
      },
      scheduleDays: scheduleDays.map(day => ({
        ...day,
        dayName: DAYS_OF_WEEK.find(d => d.value === day.dayOfWeek)?.label || ''
      })),
      settings: {
        title: title || 'Занятие группы',
        location,
        type,
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
    
    return scheduleDays.length * weeks
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
        startDate,
        endDate,
        scheduleDays,
        title: title || undefined,
        location: location || undefined,
        type,
        isAttendanceRequired
      }

      console.log('🚀 Отправка данных для генерации расписания:', generateData)
      await onGenerate(generateData)
      onClose()
    } catch (error) {
      console.error('❌ Ошибка генерации расписания:', error)
      
      // Более детальная обработка ошибок
      let errorMessage = 'Ошибка при генерации расписания'
      
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String(error.message)
      }
      
      setErrors([errorMessage])
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Генератор расписания</h2>
                <p className="text-blue-100">Группа: {group.name}</p>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Левая колонка - Настройки */}
            <div className="space-y-6">
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
                      onChange={(e) => {
                        setStartDate(e.target.value)
                        // Очищаем ошибки при изменении даты
                        if (errors.length > 0) {
                          setErrors([])
                        }
                      }}
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
                      onChange={(e) => {
                        setEndDate(e.target.value)
                        // Очищаем ошибки при изменении даты
                        if (errors.length > 0) {
                          setErrors([])
                        }
                      }}
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
                      onChange={(e) => {
                        setTitle(e.target.value)
                        // Очищаем ошибки при изменении названия
                        if (errors.length > 0) {
                          setErrors([])
                        }
                      }}
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
                      onChange={(e) => {
                        setLocation(e.target.value)
                        // Очищаем ошибки при изменении места
                        if (errors.length > 0) {
                          setErrors([])
                        }
                      }}
                      placeholder="Например: Аудитория 101"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Тип события
                    </label>
                    <select
                      value={type}
                      onChange={(e) => {
                        setType(e.target.value)
                        // Очищаем ошибки при изменении типа
                        if (errors.length > 0) {
                          setErrors([])
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {getEventTypeOptions().map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isAttendanceRequired}
                      onChange={(e) => {
                        setIsAttendanceRequired(e.target.checked)
                        // Очищаем ошибки при изменении чекбокса
                        if (errors.length > 0) {
                          setErrors([])
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Обязательная посещаемость</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Правая колонка - Расписание */}
            <div className="flex flex-col h-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Расписание занятий
              </h3>
              
              <div className="flex-1 overflow-y-auto space-y-4 max-h-96">
                {scheduleDays.map((day, index) => (
                  <div key={index} className="p-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900 text-sm">
                        Занятие {index + 1}
                      </span>
                      <button
                        onClick={() => removeScheduleDay(index)}
                        className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                        title="Удалить занятие"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          День недели
                        </label>
                        <select
                          value={day.dayOfWeek}
                          onChange={(e) => updateScheduleDay(index, 'dayOfWeek', parseInt(e.target.value))}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-medium text-blue-900">Период</div>
                  <div className="text-blue-700">
                    {previewData.period.duration} дней
                  </div>
                </div>
                <div>
                  <div className="font-medium text-blue-900">Дней в неделю</div>
                  <div className="text-blue-700">
                    {previewData.scheduleDays.length} дней
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
            {scheduleDays.length > 0 && (
              <span>
                Будет создано ~{calculateEstimatedEvents()} занятий для группы {group.name}
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
