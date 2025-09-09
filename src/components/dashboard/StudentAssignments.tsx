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
  ArrowRight,
  TrendingUp,
  Calendar,
  Award
} from 'lucide-react'

interface Assignment {
  id: string
  title: string
  description: string | null
  dueDate: string | null
  type: string
  status: string
  maxScore: number | null
  source: 'course' | 'group'
  course: {
    id: string
    title: string
    direction: string
  }
  lesson: {
    id: string
    title: string
    module: {
      title: string
    }
  }
  creator: {
    id: string
    name: string
    email: string
  }
  group: {
    id: string
    name: string
  } | null
  submission: {
    id: string;
    submittedAt: string;
    gradedAt?: string;
    score?: number;
  } | null
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
        const stats = data.reduce((acc: {
          total: number;
          pending: number;
          submitted: number;
          graded: number;
          overdue: number;
          due_soon: number;
          [key: string]: number;
        }, assignment: Assignment) => {
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

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-blue-50 border-blue-200'
      case 'due_soon': return 'bg-yellow-50 border-yellow-200'
      case 'overdue': return 'bg-red-50 border-red-200'
      case 'submitted': return 'bg-purple-50 border-purple-200'
      case 'graded': return 'bg-green-50 border-green-200'
      default: return 'bg-gray-50 border-gray-200'
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
      <div className="bg-white rounded-2xl shadow-lg border p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
      {/* Заголовок */}
      <div className="p-8 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Мои задания</h2>
              <p className="text-gray-600">Задания из ваших групп</p>
            </div>
          </div>
          <Link
            href="/dashboard/assignments"
            className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-800 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center gap-2"
          >
            Все задания
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Статистика */}
      <div className="p-8 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-gray-50">
        <div className="grid grid-cols-5 gap-6">
          <div className="text-center group">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-slate-500 to-gray-600 rounded-2xl mx-auto mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <Target className="w-7 h-7 text-white" />
            </div>
            <p className="text-sm text-gray-600 font-medium">Всего</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          
          <div className="text-center group">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl mx-auto mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <Clock className="w-7 h-7 text-white" />
            </div>
            <p className="text-sm text-gray-600 font-medium">К выполнению</p>
            <p className="text-2xl font-bold text-blue-600">{stats.pending}</p>
          </div>

          <div className="text-center group">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl mx-auto mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <Upload className="w-7 h-7 text-white" />
            </div>
            <p className="text-sm text-gray-600 font-medium">Сдано</p>
            <p className="text-2xl font-bold text-purple-600">{stats.submitted}</p>
          </div>

          <div className="text-center group">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl mx-auto mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <CheckCircle className="w-7 h-7 text-white" />
            </div>
            <p className="text-sm text-gray-600 font-medium">Проверено</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.graded}</p>
          </div>

          <div className="text-center group">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl mx-auto mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <AlertCircle className="w-7 h-7 text-white" />
            </div>
            <p className="text-sm text-gray-600 font-medium">Просрочено</p>
            <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
          </div>
        </div>
      </div>

      {/* Список заданий */}
      <div className="p-8">
        {assignments.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
              <Target className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Заданий нет</h3>
            <p className="text-gray-600 mb-6">У вас пока нет заданий в группах</p>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Проверьте расписание</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>Следите за обновлениями</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div key={assignment.id} className={`flex items-center justify-between p-6 rounded-2xl border transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 ${getStatusBgColor(assignment.status)}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${getStatusBgColor(assignment.status)}`}>
                      <div className={`flex items-center gap-2 ${getStatusColor(assignment.status)}`}>
                        {getStatusIcon(assignment.status)}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg mb-1">{assignment.title}</h4>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          {assignment.course?.title || 'Без курса'}
                        </span>
                        <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          {assignment.group?.name || 'Из курса'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-gray-600 font-medium mb-1">Дедлайн</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <p className="text-sm font-semibold text-gray-900">{assignment.dueDate ? formatDate(assignment.dueDate) : 'Без дедлайна'}</p>
                    </div>
                  </div>
                  
                  <Link
                    href={`/assignments/${assignment.id}`}
                    className="p-3 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-all duration-300 hover:scale-110"
                  >
                    <Eye className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            ))}

            {assignments.length >= 5 && (
              <div className="text-center pt-6">
                <Link
                  href="/dashboard/assignments"
                  className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold text-lg hover:scale-105 transition-all duration-300"
                >
                  Показать все задания
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
