'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
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

interface DashboardStats {
  totalCourses: number
  totalStudents: number
  totalTests: number
  totalGroups: number
  activeCourses: number
  draftCourses: number
  completedTests: number
  recentActivity: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    totalStudents: 0,
    totalTests: 0,
    totalGroups: 0,
    activeCourses: 0,
    draftCourses: 0,
    completedTests: 0,
    recentActivity: 0
  })

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
      return
    }

    fetchDashboardData()
  }, [session, status, router])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Загружаем статистику параллельно
      const [coursesRes, testsRes, groupsRes] = await Promise.all([
        fetch('/api/admin/courses'),
        fetch('/api/admin/quizzes'),
        fetch('/api/admin/groups')
      ])
      
      const coursesData = coursesRes.ok ? await coursesRes.json() : []
      const testsData = testsRes.ok ? await testsRes.json() : []
      const groupsData = groupsRes.ok ? await groupsRes.json() : []
      
      setStats({
        totalCourses: coursesData.length,
        totalStudents: coursesData.reduce((acc: number, c: any) => acc + (c._count?.enrollments || 0), 0),
        totalTests: testsData.length,
        totalGroups: groupsData.length,
        activeCourses: coursesData.filter((c: any) => c.isActive && !c.isDraft).length,
        draftCourses: coursesData.filter((c: any) => c.isDraft).length,
        completedTests: testsData.filter((t: any) => t.attempts?.length > 0).length,
        recentActivity: Math.floor(Math.random() * 50) + 10 // Заглушка для активности
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
                  Добро пожаловать, {session?.user?.name || 'Администратор'}!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Улучшенная статистика */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-indigo-600 font-semibold uppercase tracking-wide">Всего курсов</p>
                <p className="text-3xl font-bold mt-2 bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                  {stats.totalCourses}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {stats.activeCourses} активных • {stats.draftCourses} черновиков
                </p>
              </div>
              <div className="bg-gradient-to-br from-indigo-100 to-blue-100 rounded-2xl p-4">
                <BookOpen className="w-8 h-8 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600 font-semibold uppercase tracking-wide">Студентов</p>
                <p className="text-3xl font-bold mt-2 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  {stats.totalStudents}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  +{stats.recentActivity} за неделю
                </p>
              </div>
              <div className="bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl p-4">
                <Users className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-semibold uppercase tracking-wide">Тестов</p>
                <p className="text-3xl font-bold mt-2 bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                  {stats.totalTests}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {stats.completedTests} завершено
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-100 to-violet-100 rounded-2xl p-4">
                <ClipboardList className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 font-semibold uppercase tracking-wide">Групп</p>
                <p className="text-3xl font-bold mt-2 bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  {stats.totalGroups}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Активные группы
                </p>
              </div>
              <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl p-4">
                <UserCheck className="w-8 h-8 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Основные разделы управления */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-8 mb-8">
          
          {/* Управление группами */}
          <div 
            onClick={() => router.push('/admin/groups')}
            className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/60 hover:shadow-xl transition-all duration-300 cursor-pointer group hover:bg-gradient-to-br hover:from-emerald-50 hover:to-teal-50"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl p-4 group-hover:scale-110 transition-transform duration-300">
                <UserCheck className="w-10 h-10 text-emerald-600" />
              </div>
              <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-emerald-600 transition-colors duration-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">Управление группами</h3>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Создавайте и управляйте учебными группами, назначайте курсы и контролируйте прогресс студентов
            </p>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span>Групповое обучение</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                <span>Назначение заданий</span>
              </div>
            </div>
          </div>

          {/* Управление тестами */}
          <div 
            onClick={() => router.push('/admin/tests')}
            className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/60 hover:shadow-xl transition-all duration-300 cursor-pointer group hover:bg-gradient-to-br hover:from-purple-50 hover:to-violet-50"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="bg-gradient-to-br from-purple-100 to-violet-100 rounded-2xl p-4 group-hover:scale-110 transition-transform duration-300">
                <ClipboardList className="w-10 h-10 text-purple-600" />
              </div>
              <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-purple-600 transition-colors duration-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">Управление тестами</h3>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Создавайте, редактируйте тесты и анализируйте результаты студентов с детальной статистикой
            </p>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Создание тестов</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-violet-500 rounded-full"></div>
                <span>Аналитика результатов</span>
              </div>
            </div>
          </div>

          {/* Управление курсами */}
          <div 
            onClick={() => router.push('/admin/courses')}
            className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/60 hover:shadow-xl transition-all duration-300 cursor-pointer group hover:bg-gradient-to-br hover:from-indigo-50 hover:to-blue-50"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="bg-gradient-to-br from-indigo-100 to-blue-100 rounded-2xl p-4 group-hover:scale-110 transition-transform duration-300">
                <GraduationCap className="w-10 h-10 text-indigo-600" />
              </div>
              <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 transition-colors duration-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">Управление курсами</h3>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Создавайте, редактируйте курсы и управляйте образовательным контентом с удобным интерфейсом
            </p>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                <span>Создание курсов</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Управление контентом</span>
              </div>
            </div>
          </div>

          {/* Проверка заданий */}
          <div 
            onClick={() => router.push('/admin/submissions')}
            className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/60 hover:shadow-xl transition-all duration-300 cursor-pointer group hover:bg-gradient-to-br hover:from-orange-50 hover:to-amber-50"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl p-4 group-hover:scale-110 transition-transform duration-300">
                <Target className="w-10 h-10 text-orange-600" />
              </div>
              <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-orange-600 transition-colors duration-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">Проверка заданий</h3>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Проверяйте сдачи заданий студентов, выставляйте оценки и оставляйте обратную связь
            </p>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Оценивание работ</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                <span>Обратная связь</span>
              </div>
            </div>
          </div>
        </div>

        {/* Быстрые действия */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/60">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
            <Activity className="w-7 h-7 text-indigo-600" />
            Быстрые действия
          </h2>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => router.push('/admin/builder')}
              className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200/50 hover:shadow-lg transition-all duration-300 group text-left"
            >
              <div className="bg-green-100 rounded-lg p-3 w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-green-800 mb-2">Создать курс</h3>
              <p className="text-sm text-green-600">Новый обучающий курс</p>
            </button>

            <button
              onClick={() => router.push('/admin/tests')}
              className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50 hover:shadow-lg transition-all duration-300 group text-left"
            >
              <div className="bg-blue-100 rounded-lg p-3 w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                <ClipboardList className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-blue-800 mb-2">Создать тест</h3>
              <p className="text-sm text-blue-600">Новый тест или викторина</p>
            </button>

            <button
              onClick={() => router.push('/admin/groups')}
              className="p-6 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-200/50 hover:shadow-lg transition-all duration-300 group text-left"
            >
              <div className="bg-purple-100 rounded-lg p-3 w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-purple-800 mb-2">Управление группами</h3>
              <p className="text-sm text-purple-600">Просмотр всех групп</p>
            </button>

            <button
              onClick={() => router.push('/admin/courses')}
              className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200/50 hover:shadow-lg transition-all duration-300 group text-left"
            >
              <div className="bg-amber-100 rounded-lg p-3 w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="font-semibold text-amber-800 mb-2">Управление курсами</h3>
              <p className="text-sm text-amber-600">Просмотр всех курсов</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}