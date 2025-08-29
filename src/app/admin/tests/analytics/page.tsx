'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  ArrowLeft,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Award,
  Calendar,
  Filter,
  Search,
  Download,
  Eye,
  BarChart3,
  PieChart,
  Target,
  Loader2,
  BookOpen,
  Star
} from 'lucide-react'

interface TestResult {
  id: string
  studentName: string
  studentEmail: string
  testTitle: string
  courseName: string
  score: number
  maxScore: number
  percentage: number
  timeSpent: number // в минутах
  completedAt: string
  attempts: number
  status: 'completed' | 'in_progress' | 'not_started'
}

interface TestAnalytics {
  testId: string
  testTitle: string
  courseName: string
  totalAttempts: number
  completedAttempts: number
  averageScore: number
  maxScore: number
  averageTime: number
  passRate: number // процент прошедших
  difficulty: 'easy' | 'medium' | 'hard'
}

export default function TestAnalyticsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [testAnalytics, setTestAnalytics] = useState<TestAnalytics[]>([])
  const [filteredResults, setFilteredResults] = useState<TestResult[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTest, setFilterTest] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedView, setSelectedView] = useState<'results' | 'analytics'>('results')

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
      return
    }

    fetchTestData()
  }, [session, status, router])

  useEffect(() => {
    filterResults()
  }, [testResults, searchTerm, filterTest, filterStatus])

  const fetchTestData = async () => {
    try {
      setLoading(true)
      
      // Имитация данных - в реальном приложении здесь будет API вызов
      const mockResults: TestResult[] = [
        {
          id: '1',
          studentName: 'Иван Петров',
          studentEmail: 'ivan.petrov@example.com',
          testTitle: 'Основы WordPress',
          courseName: 'WordPress Разработка',
          score: 85,
          maxScore: 100,
          percentage: 85,
          timeSpent: 45,
          completedAt: '2024-01-15T14:30:00Z',
          attempts: 2,
          status: 'completed'
        },
        {
          id: '2',
          studentName: 'Мария Сидорова',
          studentEmail: 'maria.sidorova@example.com',
          testTitle: 'React Hooks',
          courseName: 'React Основы',
          score: 92,
          maxScore: 100,
          percentage: 92,
          timeSpent: 32,
          completedAt: '2024-01-14T16:45:00Z',
          attempts: 1,
          status: 'completed'
        },
        {
          id: '3',
          studentName: 'Алексей Козлов',
          studentEmail: 'alexey.kozlov@example.com',
          testTitle: 'Shopify API',
          courseName: 'Shopify Development',
          score: 78,
          maxScore: 100,
          percentage: 78,
          timeSpent: 52,
          completedAt: '2024-01-13T11:20:00Z',
          attempts: 3,
          status: 'completed'
        },
        {
          id: '4',
          studentName: 'Елена Васильева',
          studentEmail: 'elena.vasilieva@example.com',
          testTitle: 'JavaScript ES6',
          courseName: 'JavaScript Продвинутый',
          score: 0,
          maxScore: 100,
          percentage: 0,
          timeSpent: 15,
          completedAt: '',
          attempts: 1,
          status: 'in_progress'
        }
      ]

      const mockAnalytics: TestAnalytics[] = [
        {
          testId: 'test-1',
          testTitle: 'Основы WordPress',
          courseName: 'WordPress Разработка',
          totalAttempts: 25,
          completedAttempts: 23,
          averageScore: 82.4,
          maxScore: 100,
          averageTime: 38.5,
          passRate: 87.5,
          difficulty: 'medium'
        },
        {
          testId: 'test-2',
          testTitle: 'React Hooks',
          courseName: 'React Основы',
          totalAttempts: 18,
          completedAttempts: 16,
          averageScore: 89.2,
          maxScore: 100,
          averageTime: 28.3,
          passRate: 93.8,
          difficulty: 'easy'
        },
        {
          testId: 'test-3',
          testTitle: 'Shopify API',
          courseName: 'Shopify Development',
          totalAttempts: 15,
          completedAttempts: 12,
          averageScore: 74.6,
          maxScore: 100,
          averageTime: 45.7,
          passRate: 75.0,
          difficulty: 'hard'
        }
      ]
      
      setTestResults(mockResults)
      setTestAnalytics(mockAnalytics)
    } catch (error) {
      console.error('Ошибка загрузки аналитики тестов:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterResults = () => {
    let filtered = testResults

    if (searchTerm) {
      filtered = filtered.filter(result =>
        result.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.testTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.courseName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterTest !== 'all') {
      filtered = filtered.filter(result => result.testTitle === filterTest)
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(result => result.status === filterStatus)
    }

    setFilteredResults(filtered)
  }

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-full">
            <CheckCircle className="w-4 h-4" />
            Завершен
          </span>
        )
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 text-sm font-medium rounded-full">
            <Clock className="w-4 h-4" />
            В процессе
          </span>
        )
      case 'not_started':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-700 text-sm font-medium rounded-full">
            <XCircle className="w-4 h-4" />
            Не начат
          </span>
        )
    }
  }

  const getDifficultyBadge = (difficulty: TestAnalytics['difficulty']) => {
    switch (difficulty) {
      case 'easy':
        return (
          <span className="inline-flex items-center px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
            Легкий
          </span>
        )
      case 'medium':
        return (
          <span className="inline-flex items-center px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
            Средний
          </span>
        )
      case 'hard':
        return (
          <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
            Сложный
          </span>
        )
    }
  }

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-emerald-600'
    if (percentage >= 60) return 'text-amber-600'
    return 'text-red-600'
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}ч ${mins}м`
    }
    return `${mins}м`
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Не завершен'
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const calculateStats = () => {
    const completed = testResults.filter(r => r.status === 'completed')
    const totalScore = completed.reduce((sum, r) => sum + r.score, 0)
    const totalTime = completed.reduce((sum, r) => sum + r.timeSpent, 0)
    
    return {
      totalTests: testResults.length,
      completedTests: completed.length,
      averageScore: completed.length > 0 ? (totalScore / completed.length).toFixed(1) : '0',
      averageTime: completed.length > 0 ? Math.round(totalTime / completed.length) : 0,
      passRate: testResults.length > 0 ? ((completed.length / testResults.length) * 100).toFixed(1) : '0'
    }
  }

  const stats = calculateStats()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-violet-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Загрузка аналитики тестов...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Хедер */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin')}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
                Назад
              </button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Аналитика тестов
                </h1>
                <p className="text-slate-600 mt-1 font-medium">
                  Подробная статистика прохождения тестов и результаты студентов
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => setSelectedView('results')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    selectedView === 'results' 
                      ? 'bg-white text-violet-600 shadow-sm' 
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <Eye className="w-4 h-4 inline mr-2" />
                  Результаты
                </button>
                <button
                  onClick={() => setSelectedView('analytics')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    selectedView === 'analytics' 
                      ? 'bg-white text-violet-600 shadow-sm' 
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 inline mr-2" />
                  Аналитика
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Общая статистика */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60">
            <div className="flex items-center gap-4">
              <div className="bg-violet-100 rounded-xl p-3">
                <BookOpen className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-violet-600">{stats.totalTests}</p>
                <p className="text-slate-600 text-sm">Всего тестов</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-emerald-200/60">
            <div className="flex items-center gap-4">
              <div className="bg-emerald-100 rounded-xl p-3">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{stats.completedTests}</p>
                <p className="text-slate-600 text-sm">Завершено</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-amber-200/60">
            <div className="flex items-center gap-4">
              <div className="bg-amber-100 rounded-xl p-3">
                <Star className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{stats.averageScore}</p>
                <p className="text-slate-600 text-sm">Средний балл</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-200/60">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 rounded-xl p-3">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{formatTime(stats.averageTime)}</p>
                <p className="text-slate-600 text-sm">Среднее время</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-200/60">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 rounded-xl p-3">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.passRate}%</p>
                <p className="text-slate-600 text-sm">Успешность</p>
              </div>
            </div>
          </div>
        </div>

        {selectedView === 'results' && (
          <>
            {/* Фильтры для результатов */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-slate-200/60">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Поиск по студенту или тесту..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors duration-200"
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <select
                    value={filterTest}
                    onChange={(e) => setFilterTest(e.target.value)}
                    className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors duration-200"
                  >
                    <option value="all">Все тесты</option>
                    {Array.from(new Set(testResults.map(r => r.testTitle))).map(test => (
                      <option key={test} value={test}>{test}</option>
                    ))}
                  </select>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors duration-200"
                  >
                    <option value="all">Все статусы</option>
                    <option value="completed">Завершен</option>
                    <option value="in_progress">В процессе</option>
                    <option value="not_started">Не начат</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Результаты тестов */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200/60">
                <h2 className="text-xl font-bold text-slate-800">Результаты прохождения тестов</h2>
              </div>
              
              <div className="divide-y divide-slate-200/60">
                {filteredResults.map((result) => (
                  <div key={result.id} className="p-6 hover:bg-slate-50/50 transition-colors duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="text-lg font-semibold text-slate-800">
                            {result.studentName}
                          </h3>
                          {getStatusBadge(result.status)}
                          {result.status === 'completed' && (
                            <span className={`text-lg font-bold ${getScoreColor(result.percentage)}`}>
                              {result.score}/{result.maxScore} ({result.percentage}%)
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-600">
                          <div>
                            <span className="font-medium">Тест:</span>
                            <p className="text-slate-800">{result.testTitle}</p>
                          </div>
                          <div>
                            <span className="font-medium">Курс:</span>
                            <p className="text-slate-800">{result.courseName}</p>
                          </div>
                          <div>
                            <span className="font-medium">Время:</span>
                            <p className="text-slate-800">{formatTime(result.timeSpent)}</p>
                          </div>
                          <div>
                            <span className="font-medium">Попытки:</span>
                            <p className="text-slate-800">{result.attempts}</p>
                          </div>
                        </div>
                        
                        <div className="text-sm text-slate-500 mt-2">
                          <span className="font-medium">Завершен:</span> {formatDate(result.completedAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredResults.length === 0 && (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-600 mb-2">Результаты не найдены</h3>
                  <p className="text-slate-500">Попробуйте изменить фильтры или поисковый запрос</p>
                </div>
              )}
            </div>
          </>
        )}

        {selectedView === 'analytics' && (
          <>
            {/* Аналитика по тестам */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200/60">
                <h2 className="text-xl font-bold text-slate-800">Аналитика по тестам</h2>
              </div>
              
              <div className="divide-y divide-slate-200/60">
                {testAnalytics.map((analytics) => (
                  <div key={analytics.testId} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-1">
                          {analytics.testTitle}
                        </h3>
                        <p className="text-slate-600">{analytics.courseName}</p>
                      </div>
                      {getDifficultyBadge(analytics.difficulty)}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{analytics.totalAttempts}</p>
                        <p className="text-sm text-slate-600">Всего попыток</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-emerald-600">{analytics.completedAttempts}</p>
                        <p className="text-sm text-slate-600">Завершено</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-violet-600">{analytics.averageScore.toFixed(1)}</p>
                        <p className="text-sm text-slate-600">Средний балл</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-amber-600">{formatTime(analytics.averageTime)}</p>
                        <p className="text-sm text-slate-600">Среднее время</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{analytics.passRate.toFixed(1)}%</p>
                        <p className="text-sm text-slate-600">Успешность</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
