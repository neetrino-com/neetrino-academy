'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  ArrowLeft,
  Save,
  Users, 
  Calendar,
  Settings,
  Loader2,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react'

interface GroupFormData {
  name: string
  description: string
  type: 'ONLINE' | 'OFFLINE' | 'HYBRID'
  maxStudents: number
  startDate: string
  endDate: string
  isActive: boolean
}

export default function CreateGroup() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const [formData, setFormData] = useState<GroupFormData>({
    name: '',
    description: '',
    type: 'ONLINE',
    maxStudents: 30,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    isActive: true
  })

  // Редирект, если не авторизован
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (!session) {
    router.push('/login')
    return null
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Название группы обязательно'
    }

    if (!formData.type) {
      newErrors.type = 'Выберите тип группы'
    }

    if (!formData.maxStudents || formData.maxStudents < 1) {
      newErrors.maxStudents = 'Максимальное количество студентов должно быть больше 0'
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Дата начала обучения обязательна'
    }

    if (formData.endDate && formData.endDate <= formData.startDate) {
      newErrors.endDate = 'Дата окончания должна быть после даты начала'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/admin/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const group = await response.json()
        router.push(`/admin/groups/${group.id}`)
      } else {
        const error = await response.json()
        setErrors({ submit: error.error || 'Ошибка создания группы' })
      }
    } catch (error) {
      console.error('Error creating group:', error)
      setErrors({ submit: 'Ошибка создания группы' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof GroupFormData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Очищаем ошибку для этого поля
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Хедер */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/groups')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Создание новой группы
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Настройте параметры новой учебной группы
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Основная информация */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-emerald-100 rounded-lg p-2">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Основная информация</h2>
                <p className="text-sm text-gray-600">Название и описание группы</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Название группы */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Название группы *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                    errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                  placeholder="Например: Frontend разработка - группа 1"
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Описание */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Описание группы
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
                  placeholder="Краткое описание целей и особенностей группы..."
                />
              </div>
            </div>
          </div>

          {/* Настройки группы */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-100 rounded-lg p-2">
                <Settings className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Настройки группы</h2>
                <p className="text-sm text-gray-600">Тип обучения и ограничения</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Тип группы */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Тип обучения *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value as 'ONLINE' | 'OFFLINE' | 'HYBRID')}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                    errors.type ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                >
                  <option value="ONLINE">Онлайн обучение</option>
                  <option value="OFFLINE">Оффлайн обучение</option>
                  <option value="HYBRID">Гибридное обучение</option>
                </select>
                {errors.type && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {errors.type}
                  </p>
                )}
              </div>

              {/* Максимальное количество студентов */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Максимальное количество студентов *
                </label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={formData.maxStudents}
                  onChange={(e) => handleInputChange('maxStudents', parseInt(e.target.value) || 0)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                    errors.maxStudents ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                  placeholder="30"
                />
                {errors.maxStudents && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {errors.maxStudents}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Расписание */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-purple-100 rounded-lg p-2">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Расписание</h2>
                <p className="text-sm text-gray-600">Даты начала и окончания обучения</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Дата начала */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Дата начала обучения *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                    errors.startDate ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                />
                {errors.startDate && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {errors.startDate}
                  </p>
                )}
              </div>

              {/* Дата окончания */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Дата окончания обучения
                  <span className="text-gray-500 font-normal ml-1">(необязательно)</span>
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                    errors.endDate ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                />
                {errors.endDate && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {errors.endDate}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800 font-medium">Совет по планированию</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Если дата окончания не указана, группа будет считаться постоянной. 
                    Вы сможете изменить эти настройки позже.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Статус группы */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 p-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Статус группы</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Активная группа будет доступна для записи студентов
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                <span className="ml-3 text-sm font-medium text-gray-700">
                  {formData.isActive ? 'Активна' : 'Неактивна'}
                </span>
              </label>
            </div>
          </div>

          {/* Ошибка отправки */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-sm text-red-800 font-medium">{errors.submit}</p>
              </div>
            </div>
          )}

          {/* Кнопки действий */}
          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={() => router.push('/admin/groups')}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200"
              disabled={loading}
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Создание...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Создать группу
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
