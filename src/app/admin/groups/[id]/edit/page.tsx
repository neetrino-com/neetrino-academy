'use client'

import { useState, useEffect, use } from 'react'
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
  Info,
  Eye
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

interface Group extends GroupFormData {
  id: string
  createdAt: string
  _count?: {
    students: number
    teachers: number
    courses: number
  }
}

interface EditGroupProps {
  params: Promise<{
    id: string
  }>
}

export default function EditGroup({ params }: EditGroupProps) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(false)
  const [loadingGroup, setLoadingGroup] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [group, setGroup] = useState<Group | null>(null)
  
  // Развертываем промис params
  const resolvedParams = use(params)
  
  const [formData, setFormData] = useState<GroupFormData>({
    name: '',
    description: '',
    type: 'ONLINE',
    maxStudents: 30,
    startDate: '',
    endDate: '',
    isActive: true
  })

  // Загрузка данных группы
  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
      return
    }

    fetchGroup()
  }, [session, status, router, resolvedParams.id])

  const fetchGroup = async () => {
    try {
      setLoadingGroup(true)
      const response = await fetch(`/api/admin/groups/${resolvedParams.id}`)
      
      if (response.ok) {
        const groupData = await response.json()
        setGroup(groupData)
        
        // Заполняем форму данными группы
        setFormData({
          name: groupData.name,
          description: groupData.description || '',
          type: groupData.type,
          maxStudents: groupData.maxStudents,
          startDate: groupData.startDate.split('T')[0],
          endDate: groupData.endDate ? groupData.endDate.split('T')[0] : '',
          isActive: groupData.isActive
        })
      } else {
        setErrors({ fetch: 'Группа не найдена' })
      }
    } catch (error) {
      console.error('Error fetching group:', error)
      setErrors({ fetch: 'Ошибка загрузки группы' })
    } finally {
      setLoadingGroup(false)
    }
  }

  // Редирект, если загружается
  if (status === 'loading' || loadingGroup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">
            {status === 'loading' ? 'Проверка авторизации...' : 'Загрузка группы...'}
          </p>
        </div>
      </div>
    )
  }

  if (!session) {
    router.push('/login')
    return null
  }

  if (errors.fetch) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Ошибка</h2>
          <p className="text-gray-600 mb-4">{errors.fetch}</p>
          <button
            onClick={() => router.push('/admin/groups')}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Вернуться к группам
          </button>
        </div>
      </div>
    )
  }

  if (!group) {
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

    // Проверяем, что новый лимит не меньше текущего количества студентов
    if (group._count?.students && formData.maxStudents < group._count.students) {
      newErrors.maxStudents = `Нельзя установить лимит меньше текущего количества студентов (${group._count.students})`
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
      const response = await fetch(`/api/admin/groups/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        router.push(`/admin/groups/${resolvedParams.id}`)
      } else {
        const error = await response.json()
        setErrors({ submit: error.error || 'Ошибка обновления группы' })
      }
    } catch (error) {
      console.error('Error updating group:', error)
      setErrors({ submit: 'Ошибка обновления группы' })
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Хедер */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin/groups')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Редактирование группы
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {group.name} • Создана {formatDate(group.createdAt)}
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push(`/admin/groups/${resolvedParams.id}`)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-all duration-200"
            >
              <Eye className="w-4 h-4" />
              Просмотр
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Информация о группе */}
        {group._count && (
          <div className="mb-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200">
            <h3 className="text-lg font-bold text-emerald-800 mb-3">Текущее состояние группы</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-emerald-700">{group._count.students}</p>
                <p className="text-sm text-emerald-600">Студентов</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-700">{group._count.teachers}</p>
                <p className="text-sm text-emerald-600">Преподавателей</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-700">{group._count.courses}</p>
                <p className="text-sm text-emerald-600">Курсов</p>
              </div>
            </div>
          </div>
        )}

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
                  min={group._count?.students || 1}
                  max="200"
                  value={formData.maxStudents}
                  onChange={(e) => handleInputChange('maxStudents', parseInt(e.target.value) || 0)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                    errors.maxStudents ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                  placeholder="30"
                />
                {group._count?.students && (
                  <p className="mt-1 text-xs text-gray-500">
                    Текущее количество студентов: {group._count.students}
                  </p>
                )}
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
              onClick={() => router.push(`/admin/groups/${resolvedParams.id}`)}
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
                  Сохранение...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Сохранить изменения
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
