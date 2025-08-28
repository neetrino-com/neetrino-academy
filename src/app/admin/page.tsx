'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import QuizBuilder from '@/components/admin/QuizBuilder'
import GroupManager from '@/components/admin/GroupManager'
import { 
  Plus, 
  Edit, 
  Eye, 
  Users, 
  BookOpen,
  FileText,
  BarChart3,
  Settings,
  Loader2,
  ClipboardList,
  UserCheck
} from 'lucide-react'

interface Course {
  id: string
  title: string
  description: string
  direction: string
  level: string
  isActive: boolean
  _count: {
    enrollments: number
  }
}

export default function AdminDashboard() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showQuizBuilder, setShowQuizBuilder] = useState(false)
  const [showGroupManager, setShowGroupManager] = useState(false)
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    activeCourses: 0,
    draftCourses: 0
  })

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
      return
    }

    fetchData()
  }, [session, status, router])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/courses')
      if (response.ok) {
        const data = await response.json()
        setCourses(data)
        
        // Подсчёт статистики
        setStats({
          totalCourses: data.length,
          totalStudents: data.reduce((acc: number, c: Course) => acc + c._count.enrollments, 0),
          activeCourses: data.filter((c: Course) => c.isActive).length,
          draftCourses: 0
        })
      }
    } catch (error) {
      console.error('Ошибка загрузки:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Хедер */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Панель администратора</h1>
            <div className="flex gap-3">
              <button
                onClick={() => setShowGroupManager(true)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
              >
                <UserCheck className="w-4 h-4" />
                Управление группами
              </button>
              <button
                onClick={() => setShowQuizBuilder(true)}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 flex items-center gap-2"
              >
                <ClipboardList className="w-4 h-4" />
                Создать тест
              </button>
              <button
                onClick={() => router.push('/admin/builder/v2')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Конструктор v2
              </button>
              <button
                onClick={() => router.push('/admin/builder')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Создать курс
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Статистика */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-indigo-600 font-semibold">Всего курсов</p>
                <p className="text-2xl font-bold mt-1">{stats.totalCourses}</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600 font-semibold">Студентов</p>
                <p className="text-2xl font-bold mt-1">{stats.totalStudents}</p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-violet-600 font-semibold">Активных</p>
                <p className="text-2xl font-bold mt-1">{stats.activeCourses}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 font-semibold">Черновиков</p>
                <p className="text-2xl font-bold mt-1">{stats.draftCourses}</p>
              </div>
              <FileText className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Список курсов */}
        <div className="bg-white rounded-lg">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-slate-800 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Управление курсами</h2>
          </div>

          <div className="divide-y">
            {courses.map(course => (
              <div key={course.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                                      <div className="flex items-center gap-3">
                    <h3 className="font-bold text-slate-800 text-lg">{course.title}</h3>
                    {course.isActive && (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                        Активен
                      </span>
                    )}
                  </div>
                    <p className="text-sm text-slate-600 mt-1">{course.description}</p>
                    <div className="flex gap-4 mt-2 text-sm text-slate-500 font-medium">
                      <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs">{course.direction}</span>
                      <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs">{course.level}</span>
                      <span className="bg-violet-100 text-violet-700 px-2 py-1 rounded-full text-xs">{course._count.enrollments} студентов</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                                       <button
                     onClick={() => router.push(`/admin/builder?id=${course.id}`)}
                     className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-all duration-200 hover:scale-110"
                   >
                     <Edit className="w-4 h-4" />
                   </button>
                   <button
                     onClick={() => router.push(`/courses/${course.id}`)}
                     className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-all duration-200 hover:scale-110"
                   >
                     <Eye className="w-4 h-4" />
                   </button>
                  </div>
                </div>
              </div>
            ))}

            {courses.length === 0 && (
                             <div className="p-12 text-center text-blue-500">
                 <BookOpen className="w-12 h-12 mx-auto mb-4 text-blue-300" />
                 <p className="mb-4 font-medium">Пока нет курсов</p>
                 <button
                   onClick={() => router.push('/admin/builder')}
                   className="px-4 py-2 border-2 border-dashed rounded-lg hover:border-blue-400"
                >
                  Создать первый курс
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Модальные окна */}
      {showQuizBuilder && (
        <QuizBuilder
          lessonId=""
          onSave={(quiz) => {
            console.log('Тест сохранен:', quiz)
            setShowQuizBuilder(false)
          }}
          onCancel={() => setShowQuizBuilder(false)}
        />
      )}

      {showGroupManager && (
        <GroupManager onClose={() => setShowGroupManager(false)} />
      )}
    </div>
  )
}