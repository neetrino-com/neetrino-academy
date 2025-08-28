'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Target, 
  Clock, 
  AlertCircle,
  CheckCircle,
  Upload,
  Eye,
  ArrowRight
} from 'lucide-react'

interface Assignment {
  id: string
  assignmentId: string
  dueDate: string
  assignment: {
    id: string
    title: string
    module: {
      title: string
      course: {
        title: string
      }
    }
  }
  group: {
    name: string
  }
  submission: any
  status: 'pending' | 'due_soon' | 'overdue' | 'submitted' | 'graded'
}

interface AssignmentStats {
  total: number
  pending: number
  submitted: number
  graded: number
  overdue: number
}

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<AssignmentStats>({
    total: 0,
    pending: 0,
    submitted: 0,
    graded: 0,
    overdue: 0
  })

  useEffect(() => {
    fetchAssignments()
  }, [])

  const fetchAssignments = async () => {
    try {
      const response = await fetch('/api/student/assignments')
      if (response.ok) {
        const data = await response.json()
        setAssignments(data.slice(0, 5)) // Показываем только 5 последних
        
        // Подсчет статистики
        const stats = data.reduce((acc: any, assignment: Assignment) => {
          acc.total++
          acc[assignment.status]++
          return acc
        }, { total: 0, pending: 0, submitted: 0, graded: 0, overdue: 0, due_soon: 0 })
        
        setStats({
          total: stats.total,
          pending: stats.pending + stats.due_soon,
          submitted: stats.submitted,
          graded: stats.graded,
          overdue: stats.overdue
        })
      }
    } catch (error) {
      console.error('Ошибка загрузки заданий:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-blue-600'
      case 'due_soon': return 'text-yellow-600'
      case 'overdue': return 'text-red-600'
      case 'submitted': return 'text-purple-600'
      case 'graded': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'due_soon': return <AlertCircle className="w-4 h-4" />
      case 'overdue': return <AlertCircle className="w-4 h-4" />
      case 'submitted': return <Upload className="w-4 h-4" />
      case 'graded': return <CheckCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border">
      {/* Заголовок */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Мои задания</h2>
            <p className="text-gray-600">Задания из ваших групп</p>
          </div>
          <Link
            href="/assignments"
            className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
          >
            Все задания
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Статистика */}
      <div className="p-6 border-b border-gray-200">
        <div className="grid grid-cols-5 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-slate-100 rounded-lg mx-auto mb-2">
              <Target className="w-4 h-4 text-slate-600" />
            </div>
            <p className="text-sm text-gray-600">Всего</p>
            <p className="text-lg font-semibold text-gray-900">{stats.total}</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg mx-auto mb-2">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600">К выполнению</p>
            <p className="text-lg font-semibold text-blue-600">{stats.pending}</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg mx-auto mb-2">
              <Upload className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-sm text-gray-600">Сдано</p>
            <p className="text-lg font-semibold text-purple-600">{stats.submitted}</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg mx-auto mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-sm text-gray-600">Проверено</p>
            <p className="text-lg font-semibold text-green-600">{stats.graded}</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-lg mx-auto mb-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
            </div>
            <p className="text-sm text-gray-600">Просрочено</p>
            <p className="text-lg font-semibold text-red-600">{stats.overdue}</p>
          </div>
        </div>
      </div>

      {/* Список заданий */}
      <div className="p-6">
        {assignments.length === 0 ? (
          <div className="text-center py-8">
            <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Заданий нет</h3>
            <p className="text-gray-600">У вас пока нет заданий в группах</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-1 ${getStatusColor(assignment.status)}`}>
                      {getStatusIcon(assignment.status)}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{assignment.assignment.title}</h4>
                      <p className="text-sm text-gray-600">
                        {assignment.assignment.module.course.title} • {assignment.group.name}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Дедлайн</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(assignment.dueDate)}</p>
                  </div>
                  
                  <Link
                    href={`/assignments/${assignment.assignment.id}`}
                    className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}

            {assignments.length >= 5 && (
              <div className="text-center pt-4">
                <Link
                  href="/assignments"
                  className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center justify-center gap-1"
                >
                  Показать все задания
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
