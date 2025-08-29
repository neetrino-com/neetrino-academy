'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  ArrowLeft,
  Plus, 
  Edit, 
  Eye, 
  Trash2,
  BookOpen, 
  Calendar,
  Users,
  Settings,
  Loader2,
  Search,
  Filter,
  GraduationCap,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  BarChart3
} from 'lucide-react'

interface Course {
  id: string
  title: string
  description: string
  direction: string
  level: string
  isActive: boolean
  isDraft: boolean
  createdAt: string
  updatedAt: string
  _count: {
    enrollments: number
    modules: number
  }
}

interface CourseStats {
  total: number
  active: number
  draft: number
  inactive: number
  totalStudents: number
}

export default function CoursesManagement() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all') // all, active, draft, inactive
  const [stats, setStats] = useState<CourseStats>({
    total: 0,
    active: 0,
    draft: 0,
    inactive: 0,
    totalStudents: 0
  })

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
      return
    }

    fetchCourses()
  }, [session, status, router])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/courses')
      if (response.ok) {
        const data = await response.json()
        const coursesData = data.courses || data // Поддержка старого и нового формата
        setCourses(coursesData)
        
        // Подсчёт статистики
        setStats({
          total: coursesData.length,
          active: coursesData.filter((c: Course) => c.isActive && !c.isDraft).length,
          draft: coursesData.filter((c: Course) => c.isDraft).length,
          inactive: coursesData.filter((c: Course) => !c.isActive && !c.isDraft).length,
          totalStudents: coursesData.reduce((acc: number, c: Course) => acc + (c._count?.enrollments || 0), 0)
        })
      }
    } catch (error) {
      console.error('Ошибка загрузки курсов:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteCourse = async (courseId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот курс? Это действие нельзя отменить.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await fetchCourses()
      } else {
        alert('Ошибка при удалении курса')
      }
    } catch (error) {
      console.error('Ошибка удаления курса:', error)
      alert('Ошибка при удалении курса')
    }
  }

  const toggleCourseStatus = async (courseId: string, field: 'isActive' | 'isDraft', currentValue: boolean) => {
    try {
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          [field]: !currentValue
        })
      })
      
      if (response.ok) {
        await fetchCourses()
      } else {
        alert('Ошибка при изменении статуса курса')
      }
    } catch (error) {
      console.error('Ошибка изменения статуса курса:', error)
      alert('Ошибка при изменении статуса курса')
    }
  }

  // Фильтрация курсов
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.direction?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filter === 'all' || 
                         (filter === 'active' && course.isActive && !course.isDraft) ||
                         (filter === 'draft' && course.isDraft) ||
                         (filter === 'inactive' && !course.isActive && !course.isDraft)
    
    return matchesSearch && matchesFilter
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusInfo = (course: Course) => {
    if (course.isDraft) {
      return { label: 'Черновик', color: 'bg-amber-100 text-amber-800' }
    } else if (course.isActive) {
      return { label: 'Активен', color: 'bg-emerald-100 text-emerald-800' }
    } else {
      return { label: 'Неактивен', color: 'bg-red-100 text-red-800' }
    }
  }

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'начинающий': return 'bg-green-100 text-green-800'
      case 'средний': return 'bg-blue-100 text-blue-800'
      case 'продвинутый': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Загрузка курсов...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Хедер */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                  Управление курсами
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Создавайте и управляйте образовательными курсами
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push('/admin/builder')}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700 flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-4 h-4" />
              Создать курс
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Статистика */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-indigo-600 font-semibold">Всего курсов</p>
                <p className="text-3xl font-bold mt-1 text-gray-900">{stats.total}</p>
              </div>
              <BookOpen className="w-8 h-8 text-indigo-600" />
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600 font-semibold">Активных</p>
                <p className="text-3xl font-bold mt-1 text-gray-900">{stats.active}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 font-semibold">Черновиков</p>
                <p className="text-3xl font-bold mt-1 text-gray-900">{stats.draft}</p>
              </div>
              <FileText className="w-8 h-8 text-amber-600" />
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-semibold">Неактивных</p>
                <p className="text-3xl font-bold mt-1 text-gray-900">{stats.inactive}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-semibold">Студентов</p>
                <p className="text-3xl font-bold mt-1 text-gray-900">{stats.totalStudents}</p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Поиск и фильтры */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Поиск курсов по названию, описанию или направлению..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">Все курсы</option>
              <option value="active">Активные</option>
              <option value="draft">Черновики</option>
              <option value="inactive">Неактивные</option>
            </select>
          </div>
        </div>

        {/* Список курсов */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">
              Курсы ({filteredCourses.length})
            </h2>
          </div>

          <div className="divide-y divide-gray-100">
            {filteredCourses.map(course => {
              const status = getStatusInfo(course)
              return (
                <div key={course.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-gray-900 text-lg">{course.title}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${status.color}`}>
                          {status.label}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${getLevelColor(course.level)}`}>
                          {course.level}
                        </span>
                      </div>
                      
                      {course.description && (
                        <p className="text-gray-600 mb-3">{course.description}</p>
                      )}
                      
                      {/* Характеристики курса */}
                      <div className="flex gap-6 text-sm text-gray-500 mb-3">
                        <div className="flex items-center gap-1">
                          <Target className="w-4 h-4" />
                          <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs font-medium">
                            {course.direction}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{course._count?.enrollments || 0} студентов</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          <span>{course._count?.modules || 0} модулей</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Создан: {formatDate(course.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Действия */}
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => router.push(`/admin/builder?edit=${course.id}`)}
                        className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-all duration-200 hover:scale-110"
                        title="Редактировать"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => router.push(`/courses/${course.id}`)}
                        className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-all duration-200 hover:scale-110"
                        title="Просмотр курса"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {!course.isDraft && (
                        <button
                          onClick={() => toggleCourseStatus(course.id, 'isActive', course.isActive)}
                          className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
                            course.isActive 
                              ? 'text-amber-600 hover:bg-amber-100' 
                              : 'text-emerald-600 hover:bg-emerald-100'
                          }`}
                          title={course.isActive ? 'Деактивировать' : 'Активировать'}
                        >
                          {course.isActive ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                      )}

                      {course.isDraft && (
                        <button
                          onClick={() => toggleCourseStatus(course.id, 'isDraft', course.isDraft)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-200 hover:scale-110"
                          title="Опубликовать"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => deleteCourse(course.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all duration-200 hover:scale-110"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}

            {filteredCourses.length === 0 && (
              <div className="p-12 text-center">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || filter !== 'all' ? 'Курсы не найдены' : 'Пока нет курсов'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || filter !== 'all' 
                    ? 'Попробуйте изменить критерии поиска или фильтрации'
                    : 'Создайте свой первый курс для начала работы'
                  }
                </p>
                {!searchTerm && filter === 'all' && (
                  <button
                    onClick={() => router.push('/admin/builder')}
                    className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
                  >
                    Создать первый курс
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
