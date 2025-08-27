'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Eye, 
  Trash2, 
  Users, 
  Calendar,
  FileText,
  Settings,
  BarChart3
} from 'lucide-react'

interface Course {
  id: string
  title: string
  description: string
  slug: string
  direction: 'WORDPRESS' | 'VIBE_CODING' | 'SHOPIFY'
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  price: number
  isActive: boolean
  createdAt: string
  modules: Array<{
    id: string
    title: string
    _count: {
      lessons: number
      assignments: number
    }
  }>
  _count: {
    enrollments: number
  }
}

interface Assignment {
  id: string
  title: string
  description: string
  dueDate: string
  moduleId: string
  createdAt: string
  _count: {
    submissions: number
  }
  module: {
    title: string
    course: {
      title: string
    }
  }
  createdBy: {
    name: string
  }
}

interface Module {
  id: string
  title: string
  course: {
    id: string
    title: string
  }
}

type TabType = 'courses' | 'assignments' | 'tests' | 'analytics'

export default function AdminDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('courses')
  const [courses, setCourses] = useState<Course[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  


  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Загружаем курсы
      const coursesResponse = await fetch('/api/admin/courses')
      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json()
        setCourses(coursesData)
      }

      // Загружаем задания
      const assignmentsResponse = await fetch('/api/assignments')
      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json()
        setAssignments(assignmentsData)
      }


    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка')
    } finally {
      setLoading(false)
    }
  }



  const getDirectionLabel = (direction: string) => {
    switch (direction) {
      case 'WORDPRESS': return 'WordPress'
      case 'VIBE_CODING': return 'Vibe Coding'
      case 'SHOPIFY': return 'Shopify'
      default: return direction
    }
  }

  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'BEGINNER': return 'Начинающий'
      case 'INTERMEDIATE': return 'Средний'
      case 'ADVANCED': return 'Продвинутый'
      default: return level
    }
  }

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case 'WORDPRESS': return 'bg-blue-100 text-blue-800'
      case 'VIBE_CODING': return 'bg-green-100 text-green-800'
      case 'SHOPIFY': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'BEGINNER': return 'bg-green-100 text-green-800'
      case 'INTERMEDIATE': return 'bg-yellow-100 text-yellow-800'
      case 'ADVANCED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка данных...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Заголовок */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Админ-панель
                </h1>
                <p className="mt-2 text-gray-600">
                  Управление курсами, модулями и заданиями
                </p>
              </div>
            </div>
          </div>

          {/* Вкладки */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('courses')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'courses'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Курсы ({courses.length})
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('assignments')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'assignments'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Задания ({assignments.length})
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('tests')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'tests'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Тесты
                </div>
              </button>
              
                             <button
                 onClick={() => setActiveTab('analytics')}
                 className={`py-2 px-1 border-b-2 font-medium text-sm ${
                   activeTab === 'analytics'
                     ? 'border-blue-500 text-blue-600'
                     : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                 }`}
               >
                 <div className="flex items-center gap-2">
                   <BarChart3 className="w-4 h-4" />
                   Аналитика
                 </div>
               </button>
               
               <button
                 onClick={() => router.push('/admin/test-course')}
                 className="py-2 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
               >
                 <div className="flex items-center gap-2">
                   <Settings className="w-4 h-4" />
                   Тест курса
                 </div>
               </button>
            </nav>
          </div>

          {/* Контент вкладок */}
          {activeTab === 'courses' && (
            <div>
              {/* Статистика курсов */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BookOpen className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Всего курсов</p>
                      <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Активных курсов</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {courses.filter(c => c.isActive).length}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Calendar className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Всего записей</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {courses.reduce((sum, course) => sum + course._count.enrollments, 0)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <BookOpen className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Всего модулей</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {courses.reduce((sum, course) => sum + course.modules.length, 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Список курсов */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900">Список курсов</h2>
                  <button
                    onClick={() => router.push('/admin/courses/create')}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-md text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Plus className="w-4 h-4" />
                    Создать курс
                  </button>
                </div>
                
                {courses.length === 0 ? (
                  <div className="p-8 text-center">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Курсы не найдены
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Создайте первый курс для начала работы
                    </p>
                    <button
                      onClick={() => router.push('/admin/courses/create')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Создать курс
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Курс
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Направление
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Уровень
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Статистика
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Статус
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Действия
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {courses.map((course) => (
                          <tr key={course.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {course.title}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {course.description.substring(0, 60)}...
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDirectionColor(course.direction)}`}>
                                {getDirectionLabel(course.direction)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLevelColor(course.level)}`}>
                                {getLevelLabel(course.level)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="space-y-1">
                                <div>Модулей: {course.modules.length}</div>
                                <div>Записей: {course._count.enrollments}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                course.isActive 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {course.isActive ? 'Активен' : 'Неактивен'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => router.push(`/courses/${course.slug}`)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Просмотр"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => router.push(`/admin/courses/${course.id}/edit`)}
                                  className="text-green-600 hover:text-green-900"
                                  title="Редактировать"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => router.push(`/admin/courses/${course.id}/modules`)}
                                  className="text-purple-600 hover:text-purple-900"
                                  title="Управление модулями"
                                >
                                  <BookOpen className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'assignments' && (
            <div>
              {/* Статистика заданий */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <FileText className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Всего заданий</p>
                      <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Всего решений</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {assignments.reduce((sum, assignment) => sum + assignment._count.submissions, 0)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Создано сегодня</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {assignments.filter(a => {
                          const today = new Date().toDateString()
                          const createdDate = new Date(a.createdAt).toDateString()
                          return today === createdDate
                        }).length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Список заданий */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900">Список заданий</h2>
                  <button
                    onClick={() => router.push('/admin/assignments/create')}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-md text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Plus className="w-4 h-4" />
                    Создать задание
                  </button>
                </div>
                
                {assignments.length === 0 ? (
                  <div className="p-8 text-center">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Задания не найдены
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Создайте первое задание для студентов
                    </p>
                    <button
                      onClick={() => router.push('/admin/assignments/create')}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                    >
                      Создать задание
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Задание
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Курс
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Модуль
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Создатель
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Решения
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Действия
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {assignments.map((assignment) => (
                          <tr key={assignment.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {assignment.title}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {assignment.description.substring(0, 60)}...
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {assignment.module.course.title}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {assignment.module.title}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {assignment.createdBy.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {assignment._count.submissions} решений
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => router.push(`/assignments/${assignment.id}`)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Просмотр"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => router.push(`/assignments/${assignment.id}`)}
                                  className="text-green-600 hover:text-green-900"
                                  title="Редактировать"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'tests' && (
            <div>
              {/* Заголовок и кнопка создания */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Управление тестами</h2>
                  <p className="text-gray-600 mt-1">
                    Создавайте и управляйте тестами для уроков
                  </p>
                </div>
                
                <button
                  onClick={() => router.push('/admin/tests/create')}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-md text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-4 h-4" />
                  Создать тест
                </button>
              </div>
              
              <div className="bg-white shadow rounded-lg p-6">
                <div className="text-center py-12">
                  <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Система управления тестами
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Здесь вы сможете создавать тесты для уроков, добавлять вопросы и управлять результатами
                  </p>
                  <button
                    onClick={() => router.push('/admin/tests/create')}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Создать первый тест
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Аналитика</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-800">Общая статистика</h3>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-blue-600">Курсов: {courses.length}</p>
                    <p className="text-sm text-blue-600">Заданий: {assignments.length}</p>
                    <p className="text-sm text-blue-600">Модулей: {courses.reduce((sum, course) => sum + course.modules.length, 0)}</p>
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-green-800">Активность</h3>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-green-600">Активных курсов: {courses.filter(c => c.isActive).length}</p>
                    <p className="text-sm text-green-600">Всего записей: {courses.reduce((sum, course) => sum + course._count.enrollments, 0)}</p>
                  </div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-purple-800">Задания</h3>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-purple-600">Всего решений: {assignments.reduce((sum, assignment) => sum + assignment._count.submissions, 0)}</p>
                    <p className="text-sm text-purple-600">Создано сегодня: {assignments.filter(a => {
                      const today = new Date().toDateString()
                      const createdDate = new Date(a.createdAt).toDateString()
                      return today === createdDate
                    }).length}</p>
                  </div>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-yellow-800">Направления</h3>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-yellow-600">WordPress: {courses.filter(c => c.direction === 'WORDPRESS').length}</p>
                    <p className="text-sm text-yellow-600">Vibe Coding: {courses.filter(c => c.direction === 'VIBE_CODING').length}</p>
                    <p className="text-sm text-yellow-600">Shopify: {courses.filter(c => c.direction === 'SHOPIFY').length}</p>
                  </div>
                </div>
              </div>
            </div>
          )}


        </div>
      </div>
    </div>
  )
}
