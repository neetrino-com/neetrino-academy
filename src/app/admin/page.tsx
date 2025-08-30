'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { withStaffProtection, type WithRoleProtectionProps } from '@/components/auth/withRoleProtection'
import { 
  Users, 
  BookOpen,
  FileText,
  BarChart3,
  Loader2,
  ClipboardList,
  UserCheck,
  GraduationCap,
  TrendingUp,
  Calendar,
  Award,
  Settings,
  ChevronRight,
  Activity,
  Target
} from 'lucide-react'
import SecurityStatus from '@/components/admin/SecurityStatus'

interface DashboardStats {
  totalCourses: number
  totalStudents: number
  totalTests: number
  totalGroups: number
  totalLectures: number
  totalChecklists: number
  activeCourses: number
  draftCourses: number
  completedTests: number
  recentActivity: number
  totalPayments: number
  pendingPayments: number
  totalRevenue: number
}

function AdminDashboardComponent({ userRole, isLoading }: WithRoleProtectionProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    totalStudents: 0,
    totalTests: 0,
    totalGroups: 0,
    totalLectures: 0,
    totalChecklists: 0,
    activeCourses: 0,
    draftCourses: 0,
    completedTests: 0,
    recentActivity: 0,
    totalPayments: 0,
    pendingPayments: 0,
    totalRevenue: 0
  })

  useEffect(() => {
    if (isLoading) return
    
    if (!userRole) {
      return
    }

    fetchDashboardData()
  }, [userRole, isLoading])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Загружаем статистику параллельно
      const [coursesRes, testsRes, groupsRes, lecturesRes, checklistsRes, paymentsRes] = await Promise.all([
        fetch('/api/admin/courses'),
        fetch('/api/admin/quizzes'),
        fetch('/api/admin/groups'),
        fetch('/api/admin/lectures'),
        fetch('/api/admin/checklists?limit=1000'), // Получаем все чеклисты для подсчета
        fetch('/api/admin/payments') // Получаем данные о платежах
      ])
      
      const coursesResponse = coursesRes.ok ? await coursesRes.json() : { courses: [] }
      const coursesData = coursesResponse.courses || coursesResponse // Поддержка старого и нового формата
      const testsData = testsRes.ok ? await testsRes.json() : []
      const groupsData = groupsRes.ok ? await groupsRes.json() : []
      const lecturesData = lecturesRes.ok ? await lecturesRes.json() : { lectures: [] }
      const checklistsData = checklistsRes.ok ? await checklistsRes.json() : { checklists: [] }
      const paymentsData = paymentsRes.ok ? await paymentsRes.json() : { payments: [], stats: {} }
      
      setStats({
        totalCourses: coursesData.length,
        totalStudents: coursesData.reduce((acc: number, c: { _count?: { enrollments?: number } }) => acc + (c._count?.enrollments || 0), 0),
        totalTests: testsData.length,
        totalGroups: groupsData.length,
        totalLectures: lecturesData.lectures?.length || 0,
        totalChecklists: checklistsData.checklists?.length || 0,
        activeCourses: coursesData.filter((c: { isActive?: boolean; isDraft?: boolean }) => c.isActive && !c.isDraft).length,
        draftCourses: coursesData.filter((c: { isDraft?: boolean }) => c.isDraft).length,
        completedTests: testsData.filter((t: { attempts?: Array<unknown> }) => t.attempts?.length > 0).length,
        recentActivity: Math.floor(Math.random() * 50) + 10, // Заглушка для активности
        totalPayments: paymentsData.payments?.length || 0,
        pendingPayments: paymentsData.stats?.PENDING || 0,
        totalRevenue: 0 // Будет рассчитано ниже
      })
    } catch (error) {
      console.error('Ошибка загрузки дашборда:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Загрузка панели администратора...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Современный хедер */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Панель администратора
              </h1>
              <p className="text-slate-600 mt-1 font-medium">
                Управляйте образовательной платформой
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg px-3 py-2">
                <p className="text-sm text-emerald-700 font-semibold">
                  Добро пожаловать, {userRole === 'ADMIN' ? 'Администратор' : 'Преподаватель'}!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Блок "Контроль обучения" */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-6 mb-6 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  Контроль обучения
                </h2>
                <p className="text-white/80 font-medium">
                  Инструменты для мониторинга и оценки образовательного процесса
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            {/* Аналитика чеклистов */}
            <div 
              onClick={() => router.push('/admin/checklists/analytics')}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-emerald-200/80 hover:shadow-2xl transition-all duration-300 cursor-pointer group hover:bg-gradient-to-br hover:from-emerald-50 hover:to-teal-50 hover:border-emerald-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl p-4 group-hover:scale-110 transition-transform duration-300">
                    <BarChart3 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent leading-none">
                      📊
                    </p>
                    <p className="text-xs text-emerald-600 font-medium mt-1">отчеты</p>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-emerald-600 transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Аналитика чеклистов</h3>
              <p className="text-slate-600 leading-relaxed">
                Статистика выполнения и анализ прогресса студентов
              </p>
            </div>

            {/* Задания */}
            <div 
              onClick={() => router.push('/admin/submissions')}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-blue-200/80 hover:shadow-2xl transition-all duration-300 cursor-pointer group hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl p-4 group-hover:scale-110 transition-transform duration-300">
                    <FileText className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent leading-none">
                      23
                    </p>
                    <p className="text-xs text-blue-600 font-medium mt-1">новых</p>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-blue-600 transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Задания</h3>
              <p className="text-slate-600 leading-relaxed">
                Просмотр и управление студенческими работами
              </p>
            </div>

            {/* Проверка и оценивание работ */}
            <div 
              onClick={() => router.push('/admin/grading')}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-orange-200/80 hover:shadow-2xl transition-all duration-300 cursor-pointer group hover:bg-gradient-to-br hover:from-orange-50 hover:to-amber-50 hover:border-orange-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl p-4 group-hover:scale-110 transition-transform duration-300">
                    <Award className="w-8 h-8 text-orange-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent leading-none">
                      ⭐
                    </p>
                    <p className="text-xs text-orange-600 font-medium mt-1">оценка</p>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-orange-600 transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Проверка и оценивание</h3>
              <p className="text-slate-600 leading-relaxed">
                Система оценивания и обратной связи
              </p>
            </div>

            {/* Студенты */}
            <div 
              onClick={() => router.push('/admin/students')}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-violet-200/80 hover:shadow-2xl transition-all duration-300 cursor-pointer group hover:bg-gradient-to-br hover:from-violet-50 hover:to-purple-50 hover:border-violet-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-violet-100 to-purple-100 rounded-2xl p-4 group-hover:scale-110 transition-transform duration-300">
                    <Users className="w-8 h-8 text-violet-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent leading-none">
                      👥
                    </p>
                    <p className="text-xs text-violet-600 font-medium mt-1">управление</p>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-violet-600 transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Студенты</h3>
              <p className="text-slate-600 leading-relaxed">
                Управление студентами, курсами и платежами
              </p>
            </div>
          </div>

          {/* Второй ряд блока "Контроль обучения" */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {/* Аналитика тестов */}
            <div 
              onClick={() => router.push('/admin/tests/analytics')}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-rose-200/80 hover:shadow-2xl transition-all duration-300 cursor-pointer group hover:bg-gradient-to-br hover:from-rose-50 hover:to-pink-50 hover:border-rose-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-rose-100 to-pink-100 rounded-2xl p-4 group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="w-8 h-8 text-rose-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent leading-none">
                      {stats.totalTests}
                    </p>
                    <p className="text-xs text-rose-600 font-medium mt-1">тестов</p>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-rose-600 transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Аналитика тестов</h3>
              <p className="text-slate-600 leading-relaxed">
                Статистика прохождения и результаты тестирования
              </p>
            </div>

            {/* Платежи и финансы */}
            <div 
              onClick={() => router.push('/admin/payments')}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-green-200/80 hover:shadow-2xl transition-all duration-300 cursor-pointer group hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 hover:border-green-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl p-4 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent leading-none">
                      {stats.totalPayments}
                    </p>
                    <p className="text-xs text-green-600 font-medium mt-1">платежей</p>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-green-600 transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Платежи и финансы</h3>
              <p className="text-slate-600 leading-relaxed">
                Управление платежами и финансовая отчетность
              </p>
              {stats.pendingPayments > 0 && (
                <div className="mt-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  {stats.pendingPayments} ожидают оплаты
                </div>
              )}
            </div>

            {/* Уведомления системы */}
            <div 
              onClick={() => router.push('/admin/notifications')}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-indigo-200/80 hover:shadow-2xl transition-all duration-300 cursor-pointer group hover:bg-gradient-to-br hover:from-indigo-50 hover:to-blue-50 hover:border-indigo-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-indigo-100 to-blue-100 rounded-2xl p-4 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 3h6l5 5v12a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2zm0 4v2h6V7H9z" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent leading-none">
                      🔔
                    </p>
                    <p className="text-xs text-indigo-600 font-medium mt-1">система</p>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Уведомления</h3>
              <p className="text-slate-600 leading-relaxed">
                Настройка и управление системными уведомлениями
              </p>
            </div>

            {/* Резерв для будущих функций */}
            <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-6 border-2 border-gray-200/60 opacity-60">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="bg-gray-100 rounded-2xl p-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-400 leading-none">
                      ⚡
                    </p>
                    <p className="text-xs text-gray-400 font-medium mt-1">скоро</p>
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-600 mb-3">Новая функция</h3>
              <p className="text-gray-500 leading-relaxed">
                Планируется добавление новых инструментов
              </p>
            </div>
          </div>
        </div>

        {/* Основные блоки управления */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl p-6 mb-6 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  Управление системой
                </h2>
                <p className="text-white/80 font-medium">
                  Основные инструменты администрирования платформы
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          
          {/* Управление группами */}
          <div 
            onClick={() => router.push('/admin/groups')}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-emerald-200/80 hover:shadow-2xl transition-all duration-300 cursor-pointer group hover:bg-gradient-to-br hover:from-emerald-50 hover:to-teal-50 hover:border-emerald-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl p-4 group-hover:scale-110 transition-transform duration-300">
                  <UserCheck className="w-8 h-8 text-emerald-600" />
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent leading-none">
                    {stats.totalGroups}
                  </p>
                  <p className="text-xs text-emerald-600 font-medium mt-1">активных</p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-emerald-600 transition-colors duration-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">Группы</h3>
            <p className="text-slate-600 leading-relaxed">
              Управление учебными группами
            </p>
          </div>

          {/* Управление тестами */}
          <div 
            onClick={() => router.push('/admin/tests')}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-purple-200/80 hover:shadow-2xl transition-all duration-300 cursor-pointer group hover:bg-gradient-to-br hover:from-purple-50 hover:to-violet-50 hover:border-purple-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-purple-100 to-violet-100 rounded-2xl p-4 group-hover:scale-110 transition-transform duration-300">
                  <ClipboardList className="w-8 h-8 text-purple-600" />
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent leading-none">
                    {stats.totalTests}
                  </p>
                  <p className="text-xs text-purple-600 font-medium mt-1">всего</p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-purple-600 transition-colors duration-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">Тесты</h3>
            <p className="text-slate-600 leading-relaxed">
              Создание и анализ тестов
            </p>
          </div>

          {/* Управление курсами */}
          <div 
            onClick={() => router.push('/admin/courses')}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-indigo-200/80 hover:shadow-2xl transition-all duration-300 cursor-pointer group hover:bg-gradient-to-br hover:from-indigo-50 hover:to-blue-50 hover:border-indigo-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-indigo-100 to-blue-100 rounded-2xl p-4 group-hover:scale-110 transition-transform duration-300">
                  <BookOpen className="w-8 h-8 text-indigo-600" />
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent leading-none">
                    {stats.totalCourses}
                  </p>
                  <p className="text-xs text-indigo-600 font-medium mt-1">всего</p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 transition-colors duration-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">Курсы</h3>
            <p className="text-slate-600 leading-relaxed">
              Управление образовательным контентом
            </p>
          </div>

          {/* Управление лекциями */}
          <div 
            onClick={() => router.push('/admin/lectures')}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-cyan-200/80 hover:shadow-2xl transition-all duration-300 cursor-pointer group hover:bg-gradient-to-br hover:from-cyan-50 hover:to-blue-50 hover:border-cyan-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-cyan-100 to-blue-100 rounded-2xl p-4 group-hover:scale-110 transition-transform duration-300">
                  <FileText className="w-8 h-8 text-cyan-600" />
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent leading-none">
                    {stats.totalLectures}
                  </p>
                  <p className="text-xs text-cyan-600 font-medium mt-1">всего</p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-cyan-600 transition-colors duration-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">Лекции</h3>
            <p className="text-slate-600 leading-relaxed">
              Создание и управление учебными материалами
            </p>
          </div>

          {/* Управление чеклистами */}
          <div 
            onClick={() => router.push('/admin/checklists')}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-amber-200/80 hover:shadow-2xl transition-all duration-300 cursor-pointer group hover:bg-gradient-to-br hover:from-amber-50 hover:to-yellow-50 hover:border-amber-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-amber-100 to-yellow-100 rounded-2xl p-4 group-hover:scale-110 transition-transform duration-300">
                  <ClipboardList className="w-8 h-8 text-amber-600" />
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent leading-none">
                    {stats.totalChecklists || 0}
                  </p>
                  <p className="text-xs text-amber-600 font-medium mt-1">всего</p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-amber-600 transition-colors duration-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">Чеклисты</h3>
            <p className="text-slate-600 leading-relaxed">
              Создание и управление чеклистами для студентов
            </p>
          </div>



          {/* Управление пользователями */}
          <div 
            onClick={() => router.push('/admin/users')}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-red-200/80 hover:shadow-2xl transition-all duration-300 cursor-pointer group hover:bg-gradient-to-br hover:from-red-50 hover:to-pink-50 hover:border-red-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-red-100 to-pink-100 rounded-2xl p-4 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-8 h-8 text-red-600" />
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent leading-none">
                    {stats.totalStudents}
                  </p>
                  <p className="text-xs text-red-600 font-medium mt-1">студентов</p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-red-600 transition-colors duration-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">Пользователи</h3>
            <p className="text-slate-600 leading-relaxed">
              Управление ролями и правами
            </p>
          </div>



          {/* Аналитика и отчеты */}
          <div 
            onClick={() => router.push('/admin/analytics')}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-green-200/80 hover:shadow-2xl transition-all duration-300 cursor-pointer group hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 hover:border-green-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl p-4 group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="w-8 h-8 text-green-600" />
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent leading-none">
                    100%
                  </p>
                  <p className="text-xs text-green-600 font-medium mt-1">покрытие</p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-green-600 transition-colors duration-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">Аналитика</h3>
            <p className="text-slate-600 leading-relaxed">
              Статистика и отчеты
            </p>
          </div>

          {/* Безопасность системы */}
          <div 
            onClick={() => router.push('/admin/security')}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-red-200/80 hover:shadow-2xl transition-all duration-300 cursor-pointer group hover:bg-gradient-to-br hover:from-red-50 hover:to-pink-50 hover:border-red-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-red-100 to-pink-100 rounded-2xl p-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent leading-none">
                    🛡️
                  </p>
                  <p className="text-xs text-red-600 font-medium mt-1">активна</p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-red-600 transition-colors duration-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">Безопасность</h3>
            <p className="text-slate-600 leading-relaxed">
              Мониторинг и управление безопасностью системы
            </p>
          </div>
        </div>

        {/* Блок безопасности */}
        <div className="mb-8">
          <SecurityStatus userRole={userRole} />
        </div>


      </div>
    </div>
  )
}

// Экспортируем защищенный компонент
export default withStaffProtection(AdminDashboardComponent, {
  fallback: null,
  showAccessDenied: true
})