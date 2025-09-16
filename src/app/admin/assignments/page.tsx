'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { withStaffProtection, type WithRoleProtectionProps } from '@/components/auth/withRoleProtection'
import AssignmentTemplateModal from '@/components/admin/AssignmentTemplateModal'
import { 
  ArrowLeft,
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Edit, 
  Trash2,
  Calendar,
  User,
  BookOpen,
  Loader2,
  Eye,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  GraduationCap
} from 'lucide-react'

interface Assignment {
  id: string
  title: string
  description: string | null
  type: string
  maxScore: number | null
  isTemplate: boolean
  templateId: string | null
  createdAt: string
  creator: {
    id: string
    name: string
    email: string
  }
  lesson: {
    id: string
    title: string
    module: {
      id: string
      title: string
      course: {
        id: string
        title: string
      }
    }
  } | null
  _count: {
    submissions: number
    groupAssignments: number
  }
}

interface AssignmentStats {
  total: number
  templates: number
  active: number
  totalSubmissions: number
  totalGroups: number
}

function AssignmentsPageComponent({ userRole, isLoading }: WithRoleProtectionProps) {
  const router = useRouter()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all') // all, templates, active
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null)
  const [stats, setStats] = useState<AssignmentStats>({
    total: 0,
    templates: 0,
    active: 0,
    totalSubmissions: 0,
    totalGroups: 0
  })

  const fetchAssignments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        ...(searchTerm && { search: searchTerm })
      })
      
      const response = await fetch(`/api/assignments/templates?${params}`)
      if (response.ok) {
        const data = await response.json()
        const assignmentsData = data.templates || []
        setAssignments(assignmentsData)
        
        // Подсчёт статистики
        setStats({
          total: assignmentsData.length,
          templates: assignmentsData.filter((a: Assignment) => a.isTemplate).length,
          active: assignmentsData.filter((a: Assignment) => !a.isTemplate).length,
          totalSubmissions: assignmentsData.reduce((acc: number, a: Assignment) => acc + (a._count?.submissions || 0), 0),
          totalGroups: assignmentsData.reduce((acc: number, a: Assignment) => acc + (a._count?.groupAssignments || 0), 0)
        })
      }
    } catch (error) {
      console.error('Ошибка загрузки шаблонов:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isLoading) return
    fetchAssignments()
  }, [isLoading, searchTerm])

  // Фильтрация заданий
  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.type.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filter === 'all' || 
                         (filter === 'templates' && assignment.isTemplate) ||
                         (filter === 'active' && !assignment.isTemplate)
    
    return matchesSearch && matchesFilter
  })

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот шаблон?')) return
    
    try {
      const response = await fetch(`/api/assignments/templates/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setAssignments(prev => prev.filter(a => a.id !== id))
      } else {
        const error = await response.json()
        alert(error.error || 'Ошибка удаления')
      }
    } catch (error) {
      console.error('Ошибка удаления:', error)
      alert('Ошибка удаления')
    }
  }


  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'HOMEWORK': 'Домашнее задание',
      'PROJECT': 'Проект',
      'EXAM': 'Экзамен',
      'QUIZ': 'Тест',
      'PRACTICAL': 'Практическая работа',
      'ESSAY': 'Эссе',
      'OTHER': 'Другое'
    }
    return types[type] || type
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'HOMEWORK': 'bg-blue-100 text-blue-800',
      'PROJECT': 'bg-purple-100 text-purple-800',
      'EXAM': 'bg-red-100 text-red-800',
      'QUIZ': 'bg-green-100 text-green-800',
      'PRACTICAL': 'bg-yellow-100 text-yellow-800',
      'ESSAY': 'bg-indigo-100 text-indigo-800',
      'OTHER': 'bg-gray-100 text-gray-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Загрузка заданий...</p>
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
                <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  Управление заданиями
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Создавайте и управляйте шаблонами заданий
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowTemplateModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-4 h-4" />
              Создать шаблон
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
                <p className="text-sm text-amber-600 font-semibold">Всего заданий</p>
                <p className="text-3xl font-bold mt-1 text-gray-900">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-amber-600" />
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600 font-semibold">Шаблонов</p>
                <p className="text-3xl font-bold mt-1 text-gray-900">{stats.templates}</p>
              </div>
              <Target className="w-8 h-8 text-emerald-600" />
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-semibold">Активных</p>
                <p className="text-3xl font-bold mt-1 text-gray-900">{stats.active}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-semibold">Сдач</p>
                <p className="text-3xl font-bold mt-1 text-gray-900">{stats.totalSubmissions}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-semibold">Групп</p>
                <p className="text-3xl font-bold mt-1 text-gray-900">{stats.totalGroups}</p>
              </div>
              <GraduationCap className="w-8 h-8 text-orange-600" />
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
                placeholder="Поиск заданий по названию, описанию или типу..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="all">Все задания</option>
              <option value="templates">Шаблоны</option>
              <option value="active">Активные</option>
            </select>
          </div>
        </div>

        {/* Список заданий */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">
              Задания ({filteredAssignments.length})
            </h2>
          </div>

          <div className="divide-y divide-gray-100">
            {filteredAssignments.map(assignment => (
              <div key={assignment.id} className="group bg-white/60 hover:bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 hover:border-amber-200 relative overflow-hidden">
                {/* Декоративный элемент */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-lg group-hover:text-amber-700 transition-colors">{assignment.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {assignment.isTemplate && (
                            <span className="px-3 py-1 text-xs rounded-full font-medium shadow-sm bg-orange-100 text-orange-800">
                              Шаблон
                            </span>
                          )}
                          <span className={`px-3 py-1 text-xs rounded-full font-medium shadow-sm ${getTypeColor(assignment.type)}`}>
                            {getTypeLabel(assignment.type)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {assignment.description && (
                      <p className="text-gray-600 mb-4 group-hover:text-gray-700 transition-colors leading-relaxed">{assignment.description}</p>
                    )}
                    
                    {/* Характеристики задания */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-blue-50 px-3 py-2 rounded-lg group-hover:from-indigo-100 group-hover:to-blue-100 transition-colors">
                        <User className="w-4 h-4 text-indigo-500" />
                        <span className="font-medium">{assignment.creator.name}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 px-3 py-2 rounded-lg group-hover:from-green-100 group-hover:to-emerald-100 transition-colors">
                        <BarChart3 className="w-4 h-4 text-green-500" />
                        <span className="font-medium">{assignment._count?.submissions || 0} сдач</span>
                      </div>
                      <div className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-pink-50 px-3 py-2 rounded-lg group-hover:from-purple-100 group-hover:to-pink-100 transition-colors">
                        <GraduationCap className="w-4 h-4 text-purple-500" />
                        <span className="font-medium">{assignment._count?.groupAssignments || 0} групп</span>
                      </div>
                      <div className="flex items-center gap-2 bg-gradient-to-r from-orange-50 to-yellow-50 px-3 py-2 rounded-lg group-hover:from-orange-100 group-hover:to-yellow-100 transition-colors">
                        <Calendar className="w-4 h-4 text-orange-500" />
                        <span className="font-medium">Создан: {formatDate(assignment.createdAt)}</span>
                      </div>
                      {assignment.maxScore && (
                        <div className="flex items-center gap-2 bg-gradient-to-r from-red-50 to-pink-50 px-3 py-2 rounded-lg group-hover:from-red-100 group-hover:to-pink-100 transition-colors">
                          <Target className="w-4 h-4 text-red-500" />
                          <span className="font-medium">{assignment.maxScore} баллов</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Действия */}
                  <div className="flex gap-3 ml-6 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => router.push(`/admin/assignments/${assignment.id}`)}
                      className="w-12 h-12 flex items-center justify-center text-amber-600 hover:text-white hover:bg-amber-600 rounded-xl transition-all duration-200 hover:scale-110 shadow-md hover:shadow-lg border-2 border-amber-200 hover:border-amber-600 backdrop-blur-sm"
                      title="Просмотреть"
                    >
                      <Eye className="w-5 h-5" />
                    </button>

                    <button
                      onClick={() => setEditingAssignment(assignment)}
                      className="w-12 h-12 flex items-center justify-center text-amber-600 hover:text-white hover:bg-amber-600 rounded-xl transition-all duration-200 hover:scale-110 shadow-md hover:shadow-lg border-2 border-amber-200 hover:border-amber-600 backdrop-blur-sm"
                      title="Редактировать"
                    >
                      <Edit className="w-5 h-5" />
                    </button>

                    <button
                      onClick={() => handleDelete(assignment.id)}
                      className="w-12 h-12 flex items-center justify-center text-red-600 hover:text-white hover:bg-red-600 rounded-xl transition-all duration-200 hover:scale-110 shadow-md hover:shadow-lg border-2 border-red-200 hover:border-red-600 backdrop-blur-sm"
                      title="Удалить"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredAssignments.length === 0 && (
              <div className="p-12 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || filter !== 'all' ? 'Задания не найдены' : 'Пока нет заданий'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || filter !== 'all' 
                    ? 'Попробуйте изменить критерии поиска или фильтрации'
                    : 'Создайте свой первый шаблон задания для начала работы'
                  }
                </p>
                {!searchTerm && filter === 'all' && (
                  <button
                    onClick={() => setShowTemplateModal(true)}
                    className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
                  >
                    Создать первый шаблон
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Модальные окна */}
      <AssignmentTemplateModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        onSuccess={() => {
          fetchAssignments()
          setShowTemplateModal(false)
        }}
      />

      <AssignmentTemplateModal
        isOpen={editingAssignment !== null}
        onClose={() => setEditingAssignment(null)}
        onSuccess={() => {
          fetchAssignments()
          setEditingAssignment(null)
        }}
        editingTemplate={editingAssignment}
      />
    </div>
  )
}

export default withStaffProtection(AssignmentsPageComponent)