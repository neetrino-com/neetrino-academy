'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import StudentSidebar from '@/components/dashboard/StudentSidebar'
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  Edit3, 
  Save,
  X,
  Upload,
  Camera,
  Loader2,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Target,
  Award,
  TrendingUp,
  Clock,
  Users,
  MapPin,
  Phone,
  Settings,
  Star,
  FileText,
  BarChart3
} from 'lucide-react'

interface UserProfile {
  id: string
  name: string
  email: string
  role: 'STUDENT' | 'TEACHER' | 'ADMIN'
  avatar: string | null
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
  // Расширенная информация профиля  
  age: number | null
  gender: string | null
  phone: string | null
  address: string | null
  city: string | null
  country: string | null
  telegram: string | null
  instagram: string | null
  _count: {
    enrollments: number
    assignments: number
    submissions: number
    quizAttempts: number
    groupStudents: number
    groupTeachers: number
    payments: number
  }
}

export default function DashboardProfilePage() {
  const router = useRouter()
  const { data: session, status, update } = useSession()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)
  
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    // Расширенная информация профиля
    age: '' as string,
    gender: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    telegram: '',
    instagram: ''
  })

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
      return
    }

    fetchProfile()
  }, [session, status, router])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/auth/me')
      
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        setEditForm({
          name: data.name || '',
          email: data.email || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
          age: data.age ? data.age.toString() : '',
          gender: data.gender || '',
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
          country: data.country || '',
          telegram: data.telegram || '',
          instagram: data.instagram || ''
        })
      } else {
        const errorData = await response.json()
        setMessage({ type: 'error', text: errorData.error || 'Ошибка загрузки профиля' })
      }
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error)
      setMessage({ type: 'error', text: 'Ошибка загрузки профиля' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!profile) return

    // Валидация
    if (!editForm.name.trim()) {
      setMessage({ type: 'error', text: 'Имя не может быть пустым' })
      return
    }

    if (editForm.newPassword && editForm.newPassword !== editForm.confirmPassword) {
      setMessage({ type: 'error', text: 'Пароли не совпадают' })
      return
    }

    if (editForm.newPassword && editForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Пароль должен содержать минимум 6 символов' })
      return
    }

    try {
      setSaving(true)
      const updateData: any = {
        name: editForm.name.trim(),
        email: editForm.email.trim()
      }

      // Добавляем расширенную информацию профиля
      if (editForm.age) updateData.age = parseInt(editForm.age);
      if (editForm.gender) updateData.gender = editForm.gender;
      if (editForm.phone) updateData.phone = editForm.phone.trim();
      if (editForm.address) updateData.address = editForm.address.trim();
      if (editForm.city) updateData.city = editForm.city.trim();
      if (editForm.country) updateData.country = editForm.country.trim();
      if (editForm.telegram) updateData.telegram = editForm.telegram.trim();
      if (editForm.instagram) updateData.instagram = editForm.instagram.trim();

      if (editForm.newPassword) {
        updateData.currentPassword = editForm.currentPassword
        updateData.newPassword = editForm.newPassword
      }

      const response = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        const updatedProfile = await response.json()
        setProfile(updatedProfile)
        setEditing(false)
        setMessage({ type: 'success', text: 'Профиль успешно обновлен' })
        
        // Обновляем сессию
        await update({
          name: updatedProfile.name,
          email: updatedProfile.email
        })

        // Очищаем поля паролей
        setEditForm(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }))
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Ошибка обновления профиля' })
      }
    } catch (error) {
      console.error('Ошибка сохранения:', error)
      setMessage({ type: 'error', text: 'Ошибка сохранения профиля' })
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Проверяем тип файла
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Можно загружать только изображения' })
      return
    }

    // Проверяем размер файла (макс 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Размер файла не должен превышать 5MB' })
      return
    }

    try {
      setSaving(true)
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await fetch('/api/auth/upload-avatar', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(prev => prev ? { ...prev, avatar: data.avatarUrl } : null)
        setMessage({ type: 'success', text: 'Аватар успешно обновлен' })
        
        // Обновляем сессию
        await update({
          image: data.avatarUrl
        })
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Ошибка загрузки аватара' })
      }
    } catch (error) {
      console.error('Ошибка загрузки аватара:', error)
      setMessage({ type: 'error', text: 'Ошибка загрузки аватара' })
    } finally {
      setSaving(false)
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Администратор'
      case 'TEACHER': return 'Преподаватель'
      case 'STUDENT': return 'Студент'
      default: return role
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800'
      case 'TEACHER': return 'bg-blue-100 text-blue-800'
      case 'STUDENT': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
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

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Автоматически скрываем сообщения через 5 секунд
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex">
        <StudentSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Загрузка профиля...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex">
        <StudentSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Профиль не найден</h2>
            <p className="text-gray-600">Попробуйте обновить страницу</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex">
      {/* Боковая панель */}
      <StudentSidebar />
      
      {/* Основной контент */}
      <div className="flex-1">
        <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            
            {/* Сообщения */}
            {message && (
              <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 ${
                message.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {message.type === 'success' ? 
                  <CheckCircle className="w-5 h-5" /> : 
                  <AlertCircle className="w-5 h-5" />
                }
                <span>{message.text}</span>
                <button
                  onClick={() => setMessage(null)}
                  className="ml-auto p-1 hover:bg-white/50 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Заголовок */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-gradient-to-r from-slate-500 to-gray-600 rounded-2xl">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">Мой профиль</h1>
                  <p className="text-xl text-gray-600">
                    Управляйте личной информацией и настройками аккаунта
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Основная информация */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Личная информация</h2>
                    {!editing ? (
                      <button
                        onClick={() => setEditing(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                      >
                        <Edit3 className="w-4 h-4" />
                        Редактировать
                      </button>
                    ) : (
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setEditing(false)
                            setEditForm({
                              name: profile.name || '',
                              email: profile.email || '',
                              currentPassword: '',
                              newPassword: '',
                              confirmPassword: '',
                              age: profile.age ? profile.age.toString() : '',
                              gender: profile.gender || '',
                              phone: profile.phone || '',
                              address: profile.address || '',
                              city: profile.city || '',
                              country: profile.country || '',
                              telegram: profile.telegram || '',
                              instagram: profile.instagram || ''
                            })
                            setMessage(null)
                          }}
                          className="flex items-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all duration-300 font-medium"
                        >
                          <X className="w-4 h-4" />
                          Отмена
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-xl hover:from-emerald-700 hover:to-teal-800 transition-all duration-300 font-medium disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                        >
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          Сохранить
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Аватар */}
                  <div className="flex items-center gap-6 mb-8">
                    <div className="relative">
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        {profile.avatar ? (
                          <img
                            src={profile.avatar}
                            alt="Аватар"
                            className="w-24 h-24 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-3xl font-bold text-white">
                            {profile.name?.charAt(0) || profile.email.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <label className="absolute -bottom-1 -right-1 p-2 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
                        <Camera className="w-4 h-4" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                          disabled={saving}
                        />
                      </label>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{profile.name || 'Пользователь'}</h3>
                      <p className="text-lg text-gray-600 mb-3">{profile.email}</p>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(profile.role)}`}>
                        {getRoleLabel(profile.role)}
                      </span>
                    </div>
                  </div>

                  {/* Форма редактирования */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Имя
                        </label>
                        {editing ? (
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            placeholder="Введите ваше имя"
                          />
                        ) : (
                          <p className="text-gray-900 text-lg">{profile.name || 'Не указано'}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        {editing ? (
                          <input
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            placeholder="Введите ваш email"
                          />
                        ) : (
                          <p className="text-gray-900 text-lg">{profile.email}</p>
                        )}
                      </div>
                    </div>

                    {/* Расширенная информация профиля */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Возраст
                        </label>
                        {editing ? (
                          <input
                            type="number"
                            min="13"
                            max="120"
                            value={editForm.age}
                            onChange={(e) => setEditForm(prev => ({ ...prev, age: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            placeholder="Ваш возраст"
                          />
                        ) : (
                          <p className="text-gray-900 text-lg">{profile.age || 'Не указано'}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Пол
                        </label>
                        {editing ? (
                          <select
                            value={editForm.gender}
                            onChange={(e) => setEditForm(prev => ({ ...prev, gender: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          >
                            <option value="">Выберите пол</option>
                            <option value="male">Мужской</option>
                            <option value="female">Женский</option>
                            <option value="other">Другой</option>
                          </select>
                        ) : (
                          <p className="text-gray-900 text-lg">
                            {profile.gender === 'male' ? 'Мужской' : 
                             profile.gender === 'female' ? 'Женский' : 
                             profile.gender === 'other' ? 'Другой' : 'Не указано'}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Телефон
                      </label>
                      {editing ? (
                        <input
                          type="tel"
                          value={editForm.phone}
                          onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          placeholder="+374 XX XXX XXX"
                        />
                      ) : (
                        <p className="text-gray-900 text-lg">{profile.phone || 'Не указано'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Адрес
                      </label>
                      {editing ? (
                        <input
                          type="text"
                          value={editForm.address}
                          onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          placeholder="Ваш адрес"
                        />
                      ) : (
                        <p className="text-gray-900 text-lg">{profile.address || 'Не указано'}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Город
                        </label>
                        {editing ? (
                          <input
                            type="text"
                            value={editForm.city}
                            onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            placeholder="Ваш город"
                          />
                        ) : (
                          <p className="text-gray-900 text-lg">{profile.city || 'Не указано'}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Страна
                        </label>
                        {editing ? (
                          <input
                            type="text"
                            value={editForm.country}
                            onChange={(e) => setEditForm(prev => ({ ...prev, country: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            placeholder="Страна"
                          />
                        ) : (
                          <p className="text-gray-900 text-lg">{profile.country || 'Не указано'}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Telegram
                        </label>
                        {editing ? (
                          <input
                            type="text"
                            value={editForm.telegram}
                            onChange={(e) => setEditForm(prev => ({ ...prev, telegram: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            placeholder="@username"
                          />
                        ) : (
                          <p className="text-gray-900 text-lg">{profile.telegram || 'Не указано'}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Instagram
                        </label>
                        {editing ? (
                          <input
                            type="text"
                            value={editForm.instagram}
                            onChange={(e) => setEditForm(prev => ({ ...prev, instagram: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            placeholder="@username"
                          />
                        ) : (
                          <p className="text-gray-900 text-lg">{profile.instagram || 'Не указано'}</p>
                        )}
                      </div>
                    </div>

                    {editing && (
                      <>
                        <hr className="my-8" />
                        <h4 className="text-xl font-semibold text-gray-900 mb-6">Изменение пароля</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Текущий пароль
                            </label>
                            <input
                              type="password"
                              value={editForm.currentPassword}
                              onChange={(e) => setEditForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                              placeholder="Введите текущий пароль"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Новый пароль
                            </label>
                            <input
                              type="password"
                              value={editForm.newPassword}
                              onChange={(e) => setEditForm(prev => ({ ...prev, newPassword: e.target.value }))}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                              placeholder="Введите новый пароль (минимум 6 символов)"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Подтверждение пароля
                            </label>
                            <input
                              type="password"
                              value={editForm.confirmPassword}
                              onChange={(e) => setEditForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                              placeholder="Повторите новый пароль"
                            />
                          </div>
                        </div>

                        <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-xl">
                          Оставьте поля пароля пустыми, если не хотите менять пароль
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Боковая панель */}
              <div className="space-y-6">
                
                {/* Статистика активности */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-100 rounded-xl">
                      <BarChart3 className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Статистика</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                        <span className="text-sm text-gray-600">Курсы</span>
                      </div>
                      <span className="font-bold text-gray-900 text-lg">{profile._count.enrollments || 0}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Target className="w-5 h-5 text-green-600" />
                        <span className="text-sm text-gray-600">Задания</span>
                      </div>
                      <span className="font-bold text-gray-900 text-lg">{profile._count.submissions || 0}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Award className="w-5 h-5 text-amber-600" />
                        <span className="text-sm text-gray-600">Тесты</span>
                      </div>
                      <span className="font-bold text-gray-900 text-lg">{profile._count.quizAttempts || 0}</span>
                    </div>
                    
                    {profile.role !== 'STUDENT' && (
                      <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <Users className="w-5 h-5 text-purple-600" />
                          <span className="text-sm text-gray-600">Группы</span>
                        </div>
                        <span className="font-bold text-gray-900 text-lg">
                          {(profile._count.groupStudents || 0) + (profile._count.groupTeachers || 0)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Информация об аккаунте */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gray-100 rounded-xl">
                      <Shield className="w-6 h-6 text-gray-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Информация об аккаунте</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <div className="text-sm text-gray-600 mb-1">Статус аккаунта</div>
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        profile.isActive 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {profile.isActive ? 'Активен' : 'Неактивен'}
                      </div>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <div className="text-sm text-gray-600 mb-1">Дата регистрации</div>
                      <div className="text-sm font-medium text-gray-900">{formatShortDate(profile.createdAt)}</div>
                    </div>
                    
                    {profile.lastLoginAt && (
                      <div className="p-3 bg-gray-50 rounded-xl">
                        <div className="text-sm text-gray-600 mb-1">Последний вход</div>
                        <div className="text-sm font-medium text-gray-900">{formatDate(profile.lastLoginAt)}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Быстрые действия */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Быстрые действия</h3>
                  <div className="space-y-3">
                    <button className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 group">
                      <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                        <Settings className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="font-medium text-gray-900">Настройки</span>
                    </button>
                    
                    <button className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:border-green-300 hover:shadow-md transition-all duration-200 group">
                      <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="font-medium text-gray-900">Прогресс</span>
                    </button>
                    
                    <button className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-md transition-all duration-200 group">
                      <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                        <BookOpen className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="font-medium text-gray-900">Курсы</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
