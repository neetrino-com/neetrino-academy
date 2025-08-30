'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
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
  Users
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

export default function ProfilePage() {
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

    // Все пользователи могут редактировать свой профиль

    fetchProfile()
  }, [session, status, router])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/auth/me')
      
      console.log('Profile API response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Profile data received:', data)
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
        console.error('Profile API error:', response.status, errorData)
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Загрузка профиля...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Профиль не найден</h2>
          <p className="text-gray-600">Попробуйте обновить страницу</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Сообщения */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Мой профиль</h1>
          <p className="text-gray-600">Управление личной информацией и настройками аккаунта</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Основная информация */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Личная информация</h2>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    Редактировать
                  </button>
                ) : (
                  <div className="flex gap-2">
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
                      className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Отмена
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Сохранить
                    </button>
                  </div>
                )}
              </div>

              {/* Аватар */}
              <div className="flex items-center gap-6 mb-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    {profile.avatar ? (
                      <img
                        src={profile.avatar}
                        alt="Аватар"
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-white">
                        {profile.name?.charAt(0) || profile.email.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <label className="absolute -bottom-1 -right-1 p-2 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
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
                  <h3 className="text-lg font-semibold text-gray-900">{profile.name || 'Пользователь'}</h3>
                  <p className="text-gray-600">{profile.email}</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${getRoleColor(profile.role)}`}>
                    {getRoleLabel(profile.role)}
                  </span>
                </div>
              </div>

              {/* Форма редактирования */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Имя
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Введите ваше имя"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.name || 'Не указано'}</p>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Введите ваш email"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.email}</p>
                  )}
                </div>

                {/* Расширенная информация профиля */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ваш возраст"
                      />
                    ) : (
                      <p className="text-gray-900">{profile.age || 'Не указано'}</p>
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Выберите пол</option>
                        <option value="male">Мужской</option>
                        <option value="female">Женский</option>
                        <option value="other">Другой</option>
                      </select>
                    ) : (
                      <p className="text-gray-900">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="+374 XX XXX XXX"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.phone || 'Не указано'}</p>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ваш адрес"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.address || 'Не указано'}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Город
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={editForm.city}
                        onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ваш город"
                      />
                    ) : (
                      <p className="text-gray-900">{profile.city || 'Не указано'}</p>
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Страна"
                      />
                    ) : (
                      <p className="text-gray-900">{profile.country || 'Не указано'}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telegram
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={editForm.telegram}
                        onChange={(e) => setEditForm(prev => ({ ...prev, telegram: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="@username"
                      />
                    ) : (
                      <p className="text-gray-900">{profile.telegram || 'Не указано'}</p>
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="@username"
                      />
                    ) : (
                      <p className="text-gray-900">{profile.instagram || 'Не указано'}</p>
                    )}
                  </div>
                </div>

                {editing && (
                  <>
                    <hr className="my-6" />
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Изменение пароля</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Текущий пароль
                      </label>
                      <input
                        type="password"
                        value={editForm.currentPassword}
                        onChange={(e) => setEditForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Повторите новый пароль"
                      />
                    </div>

                    <p className="text-sm text-gray-500">
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Статистика</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-gray-600">Курсы</span>
                  </div>
                                      <span className="font-medium text-gray-900">{profile._count.enrollments || 0}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-gray-600">Задания</span>
                  </div>
                                      <span className="font-medium text-gray-900">{profile._count.submissions || 0}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm text-gray-600">Тесты</span>
                  </div>
                                      <span className="font-medium text-gray-900">{profile._count.quizAttempts || 0}</span>
                </div>
                
                {profile.role !== 'STUDENT' && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-purple-600" />
                      <span className="text-sm text-gray-600">Группы</span>
                    </div>
                    <span className="font-medium text-gray-900">
                      {(profile._count.groupStudents || 0) + (profile._count.groupTeachers || 0)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Информация об аккаунте */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Информация об аккаунте</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600">Статус аккаунта</div>
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                    profile.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {profile.isActive ? 'Активен' : 'Неактивен'}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600">Дата регистрации</div>
                  <div className="text-sm font-medium text-gray-900">{formatShortDate(profile.createdAt)}</div>
                </div>
                
                {profile.lastLoginAt && (
                  <div>
                    <div className="text-sm text-gray-600">Последний вход</div>
                    <div className="text-sm font-medium text-gray-900">{formatDate(profile.lastLoginAt)}</div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
