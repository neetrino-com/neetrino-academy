'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  ArrowLeft,
  Users, 
  FileText, 
  Target, 
  Star,
  TrendingUp,
  Clock,
  Award,
  BarChart3,
  Activity,
  Calendar,
  RefreshCw,
  Download,
  User,
  BookOpen,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import StatCard from '@/components/analytics/StatCard'
import SimpleChart from '@/components/analytics/SimpleChart'

interface GroupAnalytics {
  group: {
    id: string
    name: string
    description: string | null
  }
  overview: {
    totalStudents: number
    totalAssignments: number
    totalSubmissions: number
    gradedSubmissions: number
    averageGroupScore: number
    completionRate: number
  }
  studentStats: Array<{
    student: {
      id: string
      name: string
      email: string
    }
    totalAssignments: number
    submittedAssignments: number
    gradedAssignments: number
    averageScore: number
    completionRate: number
  }>
  assignmentStats: Array<{
    assignment: {
      id: string
      title: string
      dueDate: string
    }
    totalStudents: number
    submittedCount: number
    gradedCount: number
    averageScore: number
    submissionRate: number
  }>
  weeklyProgress: Array<{
    week: string
    submissions: number
  }>
}

export default function GroupAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { data: session, status } = useSession()
  const [analytics, setAnalytics] = useState<GroupAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
      return
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'TEACHER') {
      router.push('/dashboard')
      return
    }

    fetchAnalytics()
  }, [session, status, router, resolvedParams.id])

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true)
      const response = await fetch(`/api/analytics/groups/${resolvedParams.id}`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      } else {
        console.error('Failed to fetch analytics')
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const exportData = () => {
    if (!analytics) return

    const csvData = [
      ['Группа', analytics.group.name],
      [''],
      ['Общая статистика'],
      ['Студентов', analytics.overview.totalStudents],
      ['Заданий', analytics.overview.totalAssignments],
      ['Сдач', analytics.overview.totalSubmissions],
      ['Проверено', analytics.overview.gradedSubmissions],
      ['Средний балл', analytics.overview.averageGroupScore],
      ['Процент выполнения', analytics.overview.completionRate + '%'],
      [''],
      ['Статистика студентов'],
      ['Имя', 'Email', 'Средний балл', 'Выполнено заданий', 'Процент выполнения'],
      ...analytics.studentStats.map(s => [
        s.student.name,
        s.student.email,
        s.averageScore,
        s.submittedAssignments + '/' + s.totalAssignments,
        s.completionRate + '%'
      ])
    ]

    const csvContent = csvData.map(row => Array.isArray(row) ? row.join(',') : row).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `group_${analytics.group.name}_analytics_${new Date().toISOString().split('T')[0]}.csv`)
    link.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка аналитики группы...</p>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Группа не найдена</h3>
          <p className="text-gray-600 mb-4">Не удалось загрузить аналитику группы</p>
          <button
            onClick={() => router.push('/admin/groups')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Вернуться к группам
          </button>
        </div>
      </div>
    )
  }

  const chartData = analytics.weeklyProgress.map(item => ({
    label: item.week.split(' - ')[0],
    value: item.submissions
  }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Заголовок */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/admin/groups/${resolvedParams.id}`)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Аналитика группы
                </h1>
                <p className="text-gray-600">{analytics.group.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchAnalytics}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Обновить
              </button>
              <button
                onClick={exportData}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Экспорт
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Основные метрики */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <StatCard
            title="Студентов"
            value={analytics.overview.totalStudents}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Заданий"
            value={analytics.overview.totalAssignments}
            icon={Target}
            color="purple"
          />
          <StatCard
            title="Сдач"
            value={analytics.overview.totalSubmissions}
            icon={FileText}
            color="indigo"
          />
          <StatCard
            title="Проверено"
            value={analytics.overview.gradedSubmissions}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            title="Средний балл"
            value={analytics.overview.averageGroupScore}
            icon={Star}
            color="yellow"
          />
          <StatCard
            title="Выполнение"
            value={`${analytics.overview.completionRate}%`}
            icon={TrendingUp}
            color="green"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          {/* График прогресса */}
          <div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                Прогресс по неделям
              </h3>
              <SimpleChart
                data={chartData}
                type="bar"
                height={300}
                color="#4F46E5"
                showValues={true}
              />
            </div>
          </div>

          {/* Статистика заданий */}
          <div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                Статистика заданий
              </h3>
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {analytics.assignmentStats.map((assignment) => (
                  <div key={assignment.assignment.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 truncate">
                        {assignment.assignment.title}
                      </h4>
                      <span className="text-sm text-gray-600">
                        {assignment.submissionRate}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Сдано: {assignment.submittedCount}/{assignment.totalStudents}</span>
                      <span>Ср. балл: {assignment.averageScore}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${assignment.submissionRate}%` }}
                      />
                    </div>
                  </div>
                ))}
                {analytics.assignmentStats.length === 0 && (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">Нет заданий в группе</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Рейтинг студентов */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-600" />
            Рейтинг студентов
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Место</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Студент</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Средний балл</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Выполнено</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Процент</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Статус</th>
                </tr>
              </thead>
              <tbody>
                {analytics.studentStats.map((student, index) => (
                  <tr key={student.student.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-amber-100 text-amber-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {index + 1}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">{student.student.name}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-gray-600">{student.student.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900">{student.averageScore}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-900">
                        {student.submittedAssignments}/{student.totalAssignments}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900">{student.completionRate}%</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        student.completionRate >= 80 
                          ? 'bg-green-100 text-green-800' 
                          : student.completionRate >= 50
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {student.completionRate >= 80 ? 'Отлично' :
                         student.completionRate >= 50 ? 'Хорошо' : 'Требует внимания'}
                      </span>
                    </td>
                  </tr>
                ))}
                {analytics.studentStats.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center">
                      <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-gray-500">Нет студентов в группе</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
