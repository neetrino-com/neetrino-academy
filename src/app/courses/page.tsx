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
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pagination, setPagination] = useState<any>(null)
  const [filters, setFilters] = useState({
    direction: '',
    level: ''
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
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Загрузка курсов...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Заголовок */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Курсы Neetrino Academy
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Изучайте веб-разработку, WordPress и Shopify с нашими профессиональными курсами
          </p>
        </div>

        {/* Фильтры */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Направление
              </label>
              <select
                value={filters.direction}
                onChange={(e) => handleFilterChange('direction', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Все направления</option>
                <option value="WORDPRESS">WordPress</option>
                <option value="VIBE_CODING">Vibe Coding</option>
                <option value="SHOPIFY">Shopify</option>
              </select>
            </div>
            
            <div className="flex-1 min-w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Уровень
              </label>
              <select
                value={filters.level}
                onChange={(e) => handleFilterChange('level', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-8">
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
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Назад
                    </button>
                  )}
                  
                  <span className="px-3 py-2 text-sm text-gray-700">
                    Страница {pagination.page} из {pagination.totalPages}
                  </span>
                  
                  {pagination.hasNext && (
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
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
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Курсы не найдены
            </h3>
            <p className="text-gray-600">
              Попробуйте изменить фильтры или загляните позже
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
