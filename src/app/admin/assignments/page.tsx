'use client'

import { useState, useEffect } from 'react'
import { withStaffProtection, type WithRoleProtectionProps } from '@/components/auth/withRoleProtection'
import AssignmentTemplateModal from '@/components/admin/AssignmentTemplateModal'
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Copy, 
  Edit, 
  Trash2,
  Calendar,
  User,
  BookOpen,
  Loader2
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

// Убираем FilterType - всегда показываем только шаблоны

function AssignmentsPageComponent({ userRole, isLoading }: WithRoleProtectionProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  // Убираем все фильтры - всегда показываем только шаблоны
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null)

  const fetchAssignments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        ...(searchTerm && { search: searchTerm })
      })
      
      const response = await fetch(`/api/assignments/templates?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAssignments(data.templates || [])
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

  const handleCopyTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/assignments/templates/${templateId}/copy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })
      
      if (response.ok) {
        alert('Задание успешно создано из шаблона!')
        fetchAssignments()
      } else {
        const error = await response.json()
        alert(error.error || 'Ошибка копирования шаблона')
      }
    } catch (error) {
      console.error('Ошибка копирования шаблона:', error)
      alert('Ошибка копирования шаблона')
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-50">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-slate-600" />
            <p className="text-slate-600">Загрузка заданий...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Шаблоны заданий</h1>
          <p className="text-slate-600">Создание и управление шаблонами для быстрого создания заданий</p>
        </div>

        {/* Фильтры и поиск */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-slate-200">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Поиск */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Поиск по названию..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Только шаблоны - убираем все фильтры */}
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setShowTemplateModal(true)}
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl font-medium hover:from-orange-600 hover:to-orange-700 transition-all duration-200 flex items-center gap-2 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Создать шаблон
          </button>
        </div>

        {/* Список шаблонов */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {assignments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">Шаблоны не найдены</h3>
              <p className="text-slate-500">Создайте первый шаблон задания</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-800">
                          {assignment.title}
                        </h3>
                        <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
                          Шаблон
                        </span>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${getTypeColor(assignment.type)}`}>
                          {getTypeLabel(assignment.type)}
                        </span>
                      </div>
                      
                      {assignment.description && (
                        <p className="text-slate-600 mb-3 line-clamp-2">
                          {assignment.description}
                        </p>
                      )}

                      <div className="flex items-center gap-6 text-sm text-slate-500">
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                            ID: {assignment.id}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {assignment.creator.name}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(assignment.createdAt).toLocaleDateString('ru-RU')}
                        </div>
                        {assignment.lesson && (
                          <div className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4" />
                            {assignment.lesson.module.course.title} → {assignment.lesson.title}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {assignment._count.submissions} сдач
                        </div>
                        {assignment.maxScore && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{assignment.maxScore} баллов</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleCopyTemplate(assignment.id)}
                        className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
                        title="Скопировать шаблон"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => setEditingAssignment(assignment)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Редактировать шаблон"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDelete(assignment.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Удалить шаблон"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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