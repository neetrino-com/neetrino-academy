'use client'

import { useState, useEffect } from 'react'
import { CourseCard } from '@/components/courses/CourseCard'

interface Course {
  id: string
  title: string
  description?: string | null
  direction: string
  level: string
  price?: number | null
  _count: {
    modules: number
    enrollments: number
  }
}

interface CoursesResponse {
  courses: Course[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  error?: string
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pagination, setPagination] = useState<any>(null)
  const [filters, setFilters] = useState({
    direction: '',
    level: '',
    search: ''
  })
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null)

  const fetchCourses = async (page = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12'
      })

      if (filters.direction) {
        params.append('direction', filters.direction)
      }
      if (filters.level) {
        params.append('level', filters.level)
      }
      if (filters.search) {
        params.append('search', filters.search)
      }

      const response = await fetch(`/api/courses?${params}`)
      const data: CoursesResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка загрузки курсов')
      }

      setCourses(data.courses)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки курсов')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [filters])

  const handleEnroll = async (courseId: string) => {
    try {
      setEnrollingCourseId(courseId)
      const response = await fetch(`/api/courses/${courseId}/enroll`, {
        method: 'POST'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка записи на курс')
      }

      // Обновляем список курсов
      await fetchCourses(pagination?.page || 1)
      
      // Показываем уведомление об успехе
      alert('Вы успешно записались на курс!')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка записи на курс')
    } finally {
      setEnrollingCourseId(null)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handlePageChange = (page: number) => {
    fetchCourses(page)
  }

  if (loading && courses.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-indigo-600 font-medium">Загрузка курсов...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Заголовок */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Курсы Neetrino Academy
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto font-medium">
            Изучайте веб-разработку, WordPress и Shopify с нашими профессиональными курсами
          </p>
        </div>

        {/* Фильтры */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8 border border-slate-200">
          <div className="flex flex-wrap gap-4">
            {/* Поиск */}
            <div className="flex-1 min-w-64">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Поиск по названию
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Введите название курса..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
              />
            </div>
            
            <div className="flex-1 min-w-48">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Направление
              </label>
              <select
                value={filters.direction}
                onChange={(e) => handleFilterChange('direction', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
              >
                <option value="">Все направления</option>
                <option value="WORDPRESS">WordPress</option>
                <option value="VIBE_CODING">Vibe Coding</option>
                <option value="SHOPIFY">Shopify</option>
              </select>
            </div>
            
            <div className="flex-1 min-w-48">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Уровень
              </label>
              <select
                value={filters.level}
                onChange={(e) => handleFilterChange('level', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
              >
                <option value="">Все уровни</option>
                <option value="BEGINNER">Начинающий</option>
                <option value="INTERMEDIATE">Средний</option>
                <option value="ADVANCED">Продвинутый</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ошибка */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-8">
            {error}
          </div>
        )}

        {/* Список курсов */}
        {courses.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onEnroll={handleEnroll}
                  isEnrolling={enrollingCourseId === course.id}
                />
              ))}
            </div>

            {/* Пагинация */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center">
                <nav className="flex space-x-2">
                  {pagination.hasPrev && (
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      className="px-4 py-2 border border-indigo-300 rounded-lg text-sm font-medium text-indigo-700 hover:bg-indigo-50 transition-all duration-200 hover:scale-105"
                    >
                      Назад
                    </button>
                  )}
                  
                  <span className="px-4 py-2 text-sm text-slate-700 font-semibold">
                    Страница {pagination.page} из {pagination.totalPages}
                  </span>
                  
                  {pagination.hasNext && (
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      className="px-4 py-2 border border-indigo-300 rounded-lg text-sm font-medium text-indigo-700 hover:bg-indigo-50 transition-all duration-200 hover:scale-105"
                    >
                      Вперед
                    </button>
                  )}
                </nav>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-indigo-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              Курсы не найдены
            </h3>
            <p className="text-slate-600 font-medium">
              Попробуйте изменить фильтры или загляните позже
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
