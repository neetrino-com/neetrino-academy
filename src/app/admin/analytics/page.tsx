'use client'

import { useState, useEffect } from 'react'
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
  Filter
} from 'lucide-react'
import StatCard from '@/components/analytics/StatCard'
import SimpleChart from '@/components/analytics/SimpleChart'

interface AnalyticsData {
  overview: {
    totalGroups: number
    totalStudents: number
    totalAssignments: number
    totalSubmissions: number
    ungraded: number
    averageScore: number
  }
  recentSubmissions: Array<{
    id: string
    studentName: string
    assignmentTitle: string
    courseTitle: string
    submittedAt: string
    score: number | null
    isGraded: boolean
  }>
  topStudents: Array<{
    name: string
    email: string
    averageScore: number
    submissionsCount: number
  }>
  dailySubmissions: Array<{
    date: string
    submissions: number
  }>
  assignmentStats: number
}

export default function AnalyticsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
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
  }, [session, status, router])

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true)
      const response = await fetch('/api/analytics/overview')
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
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

  const exportData = () => {
    if (!analytics) return

    const csvData = [
      ['Метрика', 'Значение'],
      ['Всего групп', analytics.overview.totalGroups],
      ['Всего студентов', analytics.overview.totalStudents],
      ['Всего заданий', analytics.overview.totalAssignments],
      ['Всего сдач', analytics.overview.totalSubmissions],
      ['На проверке', analytics.overview.ungraded],
      ['Средний балл', analytics.overview.averageScore]
    ]

    const csvContent = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `analytics_${new Date().toISOString().split('T')[0]}.csv`)
    link.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка аналитики...</p>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Ошибка загрузки</h3>
          <p className="text-gray-600 mb-4">Не удалось загрузить данные аналитики</p>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Попробовать еще раз
          </button>
        </div>
      </div>
    )
  }

  const chartData = analytics.dailySubmissions.map(item => ({
    label: new Date(item.date).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' }),
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
                onClick={() => router.push('/admin')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Аналитика и отчеты
                </h1>
                <p className="text-gray-600">Детальная статистика и метрики системы</p>
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
            title="Всего групп"
            value={analytics.overview.totalGroups}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Студентов"
            value={analytics.overview.totalStudents}
            icon={Users}
            color="green"
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
            title="На проверке"
            value={analytics.overview.ungraded}
            icon={Clock}
            color="yellow"
          />
          <StatCard
            title="Средний балл"
            value={analytics.overview.averageScore}
            icon={Star}
            color="yellow"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
          {/* График активности */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-600" />
                  Активность (последние 7 дней)
                </h3>
              </div>
              <SimpleChart
                data={chartData}
                type="line"
                height={300}
                color="#4F46E5"
                showValues={true}
              />
            </div>
          </div>

          {/* Топ студенты */}
          <div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-600" />
                Топ студенты
              </h3>
              <div className="space-y-4">
                {analytics.topStudents.slice(0, 5).map((student, index) => (
                  <div key={student.email} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      index === 2 ? 'bg-amber-100 text-amber-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {student.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {student.submissionsCount} сдач
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">
                        {student.averageScore}
                      </p>
                      <p className="text-xs text-gray-500">балл</p>
                    </div>
                  </div>
                ))}
                {analytics.topStudents.length === 0 && (
                  <div className="text-center py-8">
                    <Award className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">Нет данных о студентах</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Последние сдачи */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-600" />
            Последние сдачи
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Студент</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Задание</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Курс</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Сдано</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Статус</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Оценка</th>
                </tr>
              </thead>
              <tbody>
                {analytics.recentSubmissions.map((submission) => (
                  <tr key={submission.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">{submission.studentName}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-gray-900">{submission.assignmentTitle}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-gray-600">{submission.courseTitle}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-gray-600">{formatDate(submission.submittedAt)}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        submission.isGraded 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {submission.isGraded ? 'Проверено' : 'На проверке'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {submission.score !== null ? (
                        <span className="font-medium text-gray-900">{submission.score}/5</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {analytics.recentSubmissions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center">
                      <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-gray-500">Нет последних сдач</p>
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
