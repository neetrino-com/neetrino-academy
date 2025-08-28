'use client'

import { useState, useEffect } from 'react'
import { 
  X,
  Search,
  BookOpen,
  Check,
  Loader2,
  AlertCircle,
  Filter,
  Target,
  Users,
  Clock
} from 'lucide-react'

interface Course {
  id: string
  title: string
  description: string
  direction: string
  level: string
  isActive: boolean
  isDraft: boolean
  _count: {
    enrollments: number
    modules: number
  }
}

interface CourseAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  groupId: string
  groupName: string
  assignedCourseIds: string[]
  onAssignSuccess: () => void
}

export default function CourseAssignmentModal({
  isOpen,
  onClose,
  groupId,
  groupName,
  assignedCourseIds,
  onAssignSuccess
}: CourseAssignmentModalProps) {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all') // all, active, available
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchCourses()
      setSelectedCourses([])
      setSearchTerm('')
      setFilter('all')
      setError('')
    }
  }, [isOpen])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/courses')
      
      if (response.ok) {
        const data = await response.json()
        setCourses(data)
      } else {
        setError('Ошибка загрузки курсов')
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
      setError('Ошибка загрузки курсов')
    } finally {
      setLoading(false)
    }
  }

  const handleAssignCourses = async () => {
    if (selectedCourses.length === 0) {
      setError('Выберите хотя бы один курс для назначения')
      return
    }

    try {
      setAssigning(true)
      const response = await fetch(`/api/admin/groups/${groupId}/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          courseIds: selectedCourses
        })
      })

      if (response.ok) {
        onAssignSuccess()
        onClose()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Ошибка назначения курсов')
      }
    } catch (error) {
      console.error('Error assigning courses:', error)
      setError('Ошибка назначения курсов')
    } finally {
      setAssigning(false)
    }
  }

  const toggleCourseSelection = (courseId: string) => {
    setSelectedCourses(prev => 
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    )
  }

  // Фильтрация курсов
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.direction?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const isAssigned = assignedCourseIds.includes(course.id)
    
    const matchesFilter = filter === 'all' || 
                         (filter === 'active' && course.isActive && !course.isDraft) ||
                         (filter === 'available' && !isAssigned)
    
    return matchesSearch && matchesFilter
  })

  const availableCourses = filteredCourses.filter(course => !assignedCourseIds.includes(course.id))

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'начинающий': return 'bg-green-100 text-green-800'
      case 'средний': return 'bg-blue-100 text-blue-800'
      case 'продвинутый': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Хедер */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Назначить курсы группе</h2>
            <p className="text-sm text-gray-600 mt-1">
              Группа: <span className="font-semibold">{groupName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Фильтры и поиск */}
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Поиск курсов по названию, описанию или направлению..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">Все курсы</option>
              <option value="active">Только активные</option>
              <option value="available">Не назначенные</option>
            </select>
          </div>

          {/* Статистика */}
          <div className="mt-4 flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-gray-700 font-medium">Всего курсов: <strong className="text-gray-900">{filteredCourses.length}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-700 font-medium">Доступно для назначения: <strong className="text-gray-900">{availableCourses.length}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-700 font-medium">Выбрано: <strong className="text-blue-600">{selectedCourses.length}</strong></span>
            </div>
          </div>
        </div>

        {/* Список курсов */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              <span className="ml-3 text-gray-600">Загрузка курсов...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12 text-red-600">
              <AlertCircle className="w-8 h-8 mr-3" />
              <span>{error}</span>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <BookOpen className="w-12 h-12 mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">Курсы не найдены</p>
              <p className="text-sm">Попробуйте изменить критерии поиска или фильтрации</p>
            </div>
          ) : (
            <div className="p-6 space-y-3">
              {filteredCourses.map(course => {
                const isAssigned = assignedCourseIds.includes(course.id)
                const isSelected = selectedCourses.includes(course.id)
                
                return (
                  <div
                    key={course.id}
                    className={`p-4 border rounded-lg transition-all duration-200 ${
                      isAssigned 
                        ? 'border-gray-200 bg-gray-50 opacity-60' 
                        : isSelected
                          ? 'border-purple-300 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-200 hover:bg-purple-25'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{course.title}</h3>
                          
                          {isAssigned && (
                            <span className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded-full font-medium">
                              Уже назначен
                            </span>
                          )}
                          
                          {course.isDraft && (
                            <span className="px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded-full font-medium">
                              Черновик
                            </span>
                          )}
                          
                          {!course.isActive && !course.isDraft && (
                            <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full font-medium">
                              Неактивен
                            </span>
                          )}
                        </div>
                        
                        {course.description && (
                          <p className="text-gray-600 text-sm mb-3">{course.description}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Target className="w-4 h-4" />
                            <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs font-medium">
                              {course.direction}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(course.level)}`}>
                              {course.level}
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
                        </div>
                      </div>

                      {/* Чекбокс */}
                      <div className="ml-4">
                        {isAssigned ? (
                          <div className="w-6 h-6 bg-gray-200 rounded border flex items-center justify-center">
                            <Check className="w-4 h-4 text-gray-500" />
                          </div>
                        ) : (
                          <button
                            onClick={() => toggleCourseSelection(course.id)}
                            className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                              isSelected
                                ? 'bg-purple-600 border-purple-600 text-white'
                                : 'border-gray-300 hover:border-purple-400'
                            }`}
                          >
                            {isSelected && <Check className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Футер с кнопками */}
        <div className="sticky bottom-0 p-6 border-t border-gray-200 bg-white shadow-lg">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="text-sm">
              {selectedCourses.length > 0 && (
                <span className="text-gray-700 font-medium">Выбрано курсов: <strong className="text-blue-600">{selectedCourses.length}</strong></span>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium"
                disabled={assigning}
              >
                Отмена
              </button>
              <button
                onClick={handleAssignCourses}
                disabled={selectedCourses.length === 0 || assigning}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg"
              >
                {assigning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Назначение...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Назначить курсы ({selectedCourses.length})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
