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
        {/* Объединенные блоки управления с статистикой */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          
          {/* Управление группами */}
          <div 
            onClick={() => router.push('/admin/groups')}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-emerald-200/80 hover:shadow-2xl transition-all duration-300 cursor-pointer group hover:bg-gradient-to-br hover:from-emerald-50 hover:to-teal-50 hover:border-emerald-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl p-4 group-hover:scale-110 transition-transform duration-300">
                <UserCheck className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="text-center flex-1">
                <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent leading-none">
                  {stats.totalGroups}
                </p>
                <p className="text-xs text-emerald-600 font-medium mt-1">активных</p>
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
              <div className="bg-gradient-to-br from-purple-100 to-violet-100 rounded-2xl p-4 group-hover:scale-110 transition-transform duration-300">
                <ClipboardList className="w-8 h-8 text-purple-600" />
              </div>
              <div className="text-center flex-1">
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent leading-none">
                  {stats.totalTests}
                </p>
                <p className="text-xs text-purple-600 font-medium mt-1">всего</p>
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
              <div className="bg-gradient-to-br from-indigo-100 to-blue-100 rounded-2xl p-4 group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="w-8 h-8 text-indigo-600" />
              </div>
              <div className="text-center flex-1">
                <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent leading-none">
                  {stats.totalCourses}
                </p>
                <p className="text-xs text-indigo-600 font-medium mt-1">всего</p>
              </div>
              <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 transition-colors duration-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">Курсы</h3>
            <p className="text-slate-600 leading-relaxed">
              Управление образовательным контентом
            </p>
          </div>

          {/* Управление пользователями */}
          <div 
            onClick={() => router.push('/admin/users')}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-red-200/80 hover:shadow-2xl transition-all duration-300 cursor-pointer group hover:bg-gradient-to-br hover:from-red-50 hover:to-pink-50 hover:border-red-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-br from-red-100 to-pink-100 rounded-2xl p-4 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-8 h-8 text-red-600" />
              </div>
              <div className="text-center flex-1">
                <p className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent leading-none">
                  {stats.totalStudents}
                </p>
                <p className="text-xs text-red-600 font-medium mt-1">студентов</p>
              </div>
              <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-red-600 transition-colors duration-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">Пользователи</h3>
            <p className="text-slate-600 leading-relaxed">
              Управление ролями и правами
            </p>
          </div>

          {/* Проверка заданий */}
          <div 
            onClick={() => router.push('/admin/submissions')}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-orange-200/80 hover:shadow-2xl transition-all duration-300 cursor-pointer group hover:bg-gradient-to-br hover:from-orange-50 hover:to-amber-50 hover:border-orange-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl p-4 group-hover:scale-110 transition-transform duration-300">
                <Target className="w-8 h-8 text-orange-600" />
              </div>
              <div className="text-center flex-1">
                <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent leading-none">
                  23
                </p>
                <p className="text-xs text-orange-600 font-medium mt-1">новых</p>
              </div>
              <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-orange-600 transition-colors duration-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">Задания</h3>
            <p className="text-slate-600 leading-relaxed">
              Проверка и оценивание работ
            </p>
          </div>

          {/* Аналитика и отчеты */}
          <div 
            onClick={() => router.push('/admin/analytics')}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-green-200/80 hover:shadow-2xl transition-all duration-300 cursor-pointer group hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 hover:border-green-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl p-4 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-center flex-1">
                <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent leading-none">
                  100%
                </p>
                <p className="text-xs text-green-600 font-medium mt-1">покрытие</p>
              </div>
              <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-green-600 transition-colors duration-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">Аналитика</h3>
            <p className="text-slate-600 leading-relaxed">
              Статистика и отчеты
            </p>
          </div>
        </div>


      </div>
    </div>
  )
}