'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { withStaffProtection, type WithRoleProtectionProps } from '@/components/auth/withRoleProtection'
import { 
  BookOpen, FileText, Video, ClipboardList, TestTube, 
  Rocket, ChevronRight, ChevronLeft, Save,
  Plus, Trash2, GripVertical, Upload, Link, Type,
  Image, File, Clock, Users, Settings, Check
} from 'lucide-react'
import LessonContentBuilder from '@/components/admin/LessonContentBuilder'
import ChecklistSelector from '@/components/admin/ChecklistSelector'
import LectureSelector from '@/components/admin/LectureSelector'

// Типы для курса
interface CourseData {
  title: string
  description: string
  direction: string
  level: string
  price: number
  paymentType: 'ONE_TIME' | 'MONTHLY'
  monthlyPrice: number
  totalPrice: number
  duration: number
  durationUnit: 'days' | 'weeks' | 'months'
  currency: 'RUB' | 'USD' | 'AMD'
  thumbnail?: string
  tags?: string[]
  prerequisites?: string[]
  learningOutcomes?: string[]
}

interface Module {
  id: string
  title: string
  description: string
  order: number
  lessons: Lesson[]
}

interface Lesson {
  id: string
  title: string
  description: string
  content: string
  videoUrl?: string
  duration?: number
  order: number
  files?: FileAttachment[]
  hasAssignment?: boolean
  hasQuiz?: boolean
  lectureId?: string
  checklistId?: string
}

interface FileAttachment {
  id: string
  name: string
  url: string
  type: string
  size: number
}

interface Assignment {
  id: string
  lessonId: string
  moduleId?: string
  title: string
  description: string
  dueDate?: string
  files?: FileAttachment[]
}

interface Quiz {
  id: string
  lessonId: string
  title: string
  description: string
  questions: QuizQuestion[]
  timeLimit?: number
  passingScore: number
}

interface QuizQuestion {
  id: string
  question: string
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE'
  points: number
  order: number
  options: QuizOption[]
}

interface QuizOption {
  id: string
  text: string
  isCorrect: boolean
  order: number
}

// Этапы создания курса
const STEPS = [
  { id: 'overview', title: 'Обзор', icon: BookOpen },
  { id: 'structure', title: 'Структура', icon: FileText },
  { id: 'lessons', title: 'Уроки', icon: Video },
  { id: 'assignments', title: 'Задания', icon: ClipboardList },
  { id: 'tests', title: 'Тесты', icon: TestTube },
  { id: 'publish', title: 'Публикация', icon: Rocket }
]

function CourseBuilderComponent({ userRole, isLoading }: WithRoleProtectionProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editCourseId = searchParams.get('edit')
  
  const [currentStep, setCurrentStep] = useState(0)
  const [courseData, setCourseData] = useState<CourseData>({
    title: '',
    description: '',
    direction: 'WORDPRESS',
    level: 'BEGINNER',
    price: 0,
    paymentType: 'ONE_TIME',
    monthlyPrice: 0,
    totalPrice: 0,
    duration: 4,
    durationUnit: 'weeks',
    currency: 'RUB',
    tags: [],
    prerequisites: [],
    learningOutcomes: []
  })

  // Автоматический расчет цен при изменении типа оплаты или длительности
  useEffect(() => {
    if (courseData.paymentType === 'MONTHLY') {
      // Для ежемесячной оплаты: общая цена = ежемесячная × длительность
      setCourseData(prev => ({
        ...prev,
        totalPrice: prev.monthlyPrice * prev.duration
      }))
    } else {
      // Для разовой оплаты: общая цена = цена курса
      setCourseData(prev => ({
        ...prev,
        totalPrice: prev.price
      }))
    }
  }, [courseData.paymentType, courseData.monthlyPrice, courseData.price, courseData.duration])

  const [modules, setModules] = useState<Module[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [selectedModule, setSelectedModule] = useState<string | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isEditing, setIsEditing] = useState(false)
  const [lectures, setLectures] = useState<Array<{id: string, title: string, description?: string}>>([])

  // Автоматически выбираем первый урок при переходе на этапы "Задания" и "Тесты"
  useEffect(() => {
    if ((currentStep === 3 || currentStep === 4) && modules.length > 0) { // 3 = Задания, 4 = Тесты
      const allLessons = modules.flatMap(m => m.lessons)
      if (allLessons.length > 0 && !selectedLesson) {
        setSelectedLesson(allLessons[0].id)
      }
    }
  }, [currentStep, modules, selectedLesson])

  // Загрузка существующего курса для редактирования
  useEffect(() => {
    if (editCourseId) {
      loadExistingCourse()
    }
  }, [editCourseId])

  // Загрузка лекций
  useEffect(() => {
    fetchLectures()
  }, [])

  const fetchLectures = async () => {
    try {
      const response = await fetch('/api/admin/lectures/list')
      if (response.ok) {
        const data = await response.json()
        setLectures(data)
      }
    } catch (error) {
      console.error('Error fetching lectures:', error)
    }
  }


  const loadExistingCourse = async () => {
    if (!editCourseId) return
    
    try {
      setLoading(true)
      setIsEditing(true)
      
      // Загружаем данные курса
      const courseResponse = await fetch(`/api/admin/courses/${editCourseId}`)
      if (!courseResponse.ok) throw new Error('Курс не найден')
      
      const course = await courseResponse.json()
      
      // Загружаем модули курса
      const modulesResponse = await fetch(`/api/admin/courses/${editCourseId}/modules`)
      const modulesData = modulesResponse.ok ? await modulesResponse.json() : []
      
      // Загружаем уроки для каждого модуля (модули уже содержат уроки с заданиями)
      const modulesWithLessons = await Promise.all(
        modulesData.map(async (module: {
          id: string;
          title: string;
          description?: string;
          order: number;
          lessons?: Array<{
            id: string;
            title: string;
            description?: string;
            checklistId?: string;
            assignments?: Array<{
              id: string;
              title: string;
              description?: string;
              dueDate?: string;
            }>;
          }>;
        }) => {
          // Используем уроки из модуля, если они есть, иначе загружаем отдельно
          let lessons = module.lessons || []
          if (lessons.length === 0) {
            const lessonsResponse = await fetch(`/api/admin/modules/${module.id}/lessons`)
            lessons = lessonsResponse.ok ? await lessonsResponse.json() : []
          }
          
          // Собираем все задания из всех уроков модуля
          const moduleAssignments = lessons.flatMap(lesson => lesson.assignments || [])
          
          // Тесты уже загружены вместе с уроками через основной API
          const lessonsWithQuizzes = lessons.map((lesson: {
            id: string;
            title: string;
            description?: string;
            videoUrl?: string;
            checklistId?: string;
            assignments?: Array<{
              id: string;
              title: string;
              description?: string;
              dueDate?: string;
            }>;
            quiz?: Quiz | null;
          }) => {
            // Тест уже пришел с уроком из API
            const quiz = lesson.quiz || null
            const hasQuiz = !!quiz
            const hasAssignment = (lesson.assignments && lesson.assignments.length > 0)
            
            if (hasQuiz) {
              console.log(`[DEBUG] Квиз уже загружен для урока ${lesson.id}`)
            }
            
            return {
              ...lesson,
              type: lesson.videoUrl ? 'video' : 'text',
              files: [],
              hasQuiz: hasQuiz,
              hasAssignment: hasAssignment,
              quiz: quiz
            }
          })
          
          return {
            ...module,
            lessons: lessonsWithQuizzes,
            assignments: moduleAssignments
          }
        })
      )
      
      // Обновляем состояние
      setCourseData({
        title: course.title || '',
        description: course.description || '',
        direction: course.direction || 'WORDPRESS',
        level: course.level || 'BEGINNER',
        price: course.price || 0,
        paymentType: course.paymentType || 'ONE_TIME',
        monthlyPrice: course.monthlyPrice || 0,
        totalPrice: course.totalPrice || 0,
        duration: course.duration || 4,
        durationUnit: course.durationUnit || 'weeks',
        currency: course.currency || 'RUB',
        tags: course.tags || [],
        prerequisites: course.prerequisites || [],
        learningOutcomes: course.learningOutcomes || []
      })
      
      setModules(modulesWithLessons)
      
      // Инициализируем тесты из загруженных данных (только существующие тесты)
      const allQuizzes = modulesWithLessons.flatMap(module => 
        module.lessons
          .filter((lesson: { quiz: unknown; hasQuiz: boolean }) => lesson.hasQuiz && lesson.quiz)
          .map((lesson: { quiz: unknown }) => lesson.quiz)
      )
      setQuizzes(allQuizzes)
      
      // Инициализируем задания из загруженных данных (задания привязаны к урокам)
      const allAssignments = modulesWithLessons.flatMap(module => 
        module.lessons.flatMap((lesson: Lesson & { assignments?: Array<{ id: string; title: string; description?: string; dueDate?: string }> }) => 
          lesson.assignments ? lesson.assignments.map((assignment: {
            id: string;
            title: string;
            description?: string;
            dueDate?: string;
          }) => ({
            id: assignment.id,
            lessonId: lesson.id,
            moduleId: module.id,
            title: assignment.title,
            description: assignment.description || '',
            dueDate: assignment.dueDate ? new Date(assignment.dueDate).toISOString().split('T')[0] : ''
          })) : []
        )
      )
      
      // Удаляем дубликаты заданий по ID
      const uniqueAssignments = allAssignments.filter((assignment, index, self) => 
        index === self.findIndex(a => a.id === assignment.id)
      )
      console.log('=== DEBUG: loadExistingCourse ===')
      console.log('Модули с уроками и заданиями:', modulesWithLessons.map(m => ({
        id: m.id,
        title: m.title,
        lessonsCount: m.lessons.length,
        lessons: m.lessons.map((l: Lesson & { assignments?: Array<{ id: string; title: string; description?: string; dueDate?: string }> }) => ({
          id: l.id,
          title: l.title,
          assignmentsCount: l.assignments?.length || 0
        }))
      })))
      console.log('Извлеченные задания для состояния:', uniqueAssignments)
      setAssignments(uniqueAssignments)
      
    } catch (error) {
      console.error('Ошибка загрузки курса:', error)
      alert('Ошибка загрузки курса для редактирования')
    } finally {
      setLoading(false)
    }
  }

  // Валидация текущего шага
  const validateStep = (showErrors = true) => {
    const newErrors: Record<string, string> = {}

    switch (currentStep) {
      case 0: // Обзор
        if (!courseData.title) newErrors.title = 'Название курса обязательно'
        if (!courseData.description) newErrors.description = 'Описание курса обязательно'
        break
      case 1: // Структура
        if (modules.length === 0) newErrors.modules = 'Добавьте хотя бы один модуль'
        modules.forEach(module => {
          if (module.lessons.length === 0) {
            newErrors[`module_${module.id}`] = `Модуль "${module.title}" должен содержать хотя бы один урок`
          }
        })
        break
      case 2: // Уроки
        // Проверка заполненности уроков
        break
    }

    if (showErrors) {
      setErrors(newErrors)
    }
    return Object.keys(newErrors).length === 0
  }

  // Переход между шагами
  const goToStep = (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step)
      setErrors({})
    } else if (validateStep(true)) {
      setCurrentStep(step)
      setErrors({})
      
      // Автоматически выбираем первый урок при переходе на этапы "Задания" и "Тесты"
      if (step === 3 || step === 4) { // 3 = Задания, 4 = Тесты
        const allLessons = modules.flatMap(m => m.lessons)
        if (allLessons.length > 0) {
          setSelectedLesson(allLessons[0].id)
        }
      }
    }
  }

  // Добавление модуля
  const addModule = () => {
    const newModule: Module = {
      id: `module_${Date.now()}`,
      title: `Модуль ${modules.length + 1}`,
      description: '',
      order: modules.length,
      lessons: []
    }
    setModules([...modules, newModule])
  }

  // Добавление урока
  const addLesson = (moduleId: string) => {
    const moduleIndex = modules.findIndex(m => m.id === moduleId)
    if (moduleIndex === -1) return

    const newLesson: Lesson = {
      id: `lesson_${Date.now()}`,
      title: `Урок ${modules[moduleIndex].lessons.length + 1}`,
      description: '',
      content: '',
      order: modules[moduleIndex].lessons.length,
      checklistId: undefined
    }

    const updatedModules = [...modules]
    updatedModules[moduleIndex].lessons.push(newLesson)
    setModules(updatedModules)
  }

  // Рендер шага "Обзор"
  const renderOverviewStep = () => (
    <div className="space-y-8">
      {/* Красивый заголовок */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
          <BookOpen className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Создайте свой курс</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">Заполните основную информацию о вашем курсе. Это поможет студентам понять, что их ждет</p>
      </div>

      {/* Основная форма */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Название курса */}
          <div className="lg:col-span-2">
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-800 mb-3">
                📚 Название курса *
              </label>
              <input
                type="text"
                value={courseData.title}
                onChange={(e) => setCourseData({...courseData, title: e.target.value})}
                className={`w-full px-6 py-4 text-lg border-2 rounded-xl transition-all duration-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 ${
                  errors.title ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                placeholder="Например: WordPress для начинающих"
              />
              {errors.title && (
                <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                  <span className="text-red-500">⚠️</span>
                  {errors.title}
                </p>
              )}
            </div>
          </div>

          {/* Направление */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-3">
              🎯 Направление
            </label>
            <select
              value={courseData.direction}
              onChange={(e) => setCourseData({...courseData, direction: e.target.value})}
              className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl transition-all duration-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-300 bg-white text-gray-900"
            >
              <option value="WORDPRESS">🌐 WordPress</option>
              <option value="VIBE_CODING">💻 Vibe Coding</option>
              <option value="SHOPIFY">🛍️ Shopify</option>
            </select>
          </div>

          {/* Уровень */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-3">
              📈 Уровень сложности
            </label>
            <select
              value={courseData.level}
              onChange={(e) => setCourseData({...courseData, level: e.target.value})}
              className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl transition-all duration-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-300 bg-white text-gray-900"
            >
              <option value="BEGINNER">🌱 Начальный</option>
              <option value="INTERMEDIATE">🔥 Средний</option>
              <option value="ADVANCED">⚡ Продвинутый</option>
            </select>
          </div>

          {/* Длительность */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-3">
              ⏱️ Длительность курса
            </label>
            <div className="flex gap-3">
              <input
                type="number"
                value={courseData.duration}
                onChange={(e) => setCourseData({...courseData, duration: parseInt(e.target.value) || 1})}
                className="flex-1 px-6 py-4 border-2 border-gray-200 rounded-xl transition-all duration-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-300"
                min="1"
                placeholder="4"
              />
              <select
                value={courseData.durationUnit}
                onChange={(e) => setCourseData({...courseData, durationUnit: e.target.value as 'days' | 'weeks' | 'months'})}
                className="px-4 py-4 border-2 border-gray-200 rounded-xl transition-all duration-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-300 bg-white text-gray-900 min-w-[120px]"
              >
                <option value="days">📅 дней</option>
                <option value="weeks">📆 недель</option>
                <option value="months">🗓️ месяцев</option>
              </select>
            </div>
          </div>

          {/* Цена и тип оплаты */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-3">
              💰 Стоимость курса
            </label>
            
            {/* Переключатель типов оплаты */}
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setCourseData({...courseData, paymentType: 'ONE_TIME'})}
                className={`flex-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  courseData.paymentType === 'ONE_TIME'
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                💎 Разовая
              </button>
              
              <button
                type="button"
                onClick={() => setCourseData({...courseData, paymentType: 'MONTHLY'})}
                className={`flex-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  courseData.paymentType === 'MONTHLY'
                    ? 'bg-purple-100 text-purple-700 border border-purple-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                📅 Месячная
              </button>
            </div>

            {/* Поле ввода цены */}
            <div className="flex gap-3">
              <input
                type="number"
                value={courseData.paymentType === 'ONE_TIME' ? (courseData.price || 0) : (courseData.monthlyPrice || 0)}
                onChange={(e) => {
                  if (courseData.paymentType === 'ONE_TIME') {
                    setCourseData({...courseData, price: parseInt(e.target.value) || 0})
                  } else {
                    setCourseData({...courseData, monthlyPrice: parseInt(e.target.value) || 0})
                  }
                }}
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-300"
                min="0"
                placeholder="0"
              />
              <select
                value={courseData.currency}
                onChange={(e) => setCourseData({...courseData, currency: e.target.value as 'RUB' | 'USD' | 'AMD'})}
                className="px-4 py-3 border-2 border-gray-200 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-300 bg-white text-gray-900 min-w-[100px]"
              >
                <option value="RUB">₽</option>
                <option value="USD">$</option>
                <option value="AMD">֏</option>
              </select>
            </div>

            {/* Информация о цене */}
            {courseData.paymentType === 'ONE_TIME' && courseData.price > 0 && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-xs text-blue-800">
                  💡 Разовая оплата: <strong>{courseData.price} {courseData.currency}</strong>
                </p>
              </div>
            )}
            
            {courseData.paymentType === 'MONTHLY' && courseData.monthlyPrice > 0 && (
              <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded-md">
                <p className="text-xs text-purple-800">
                  💡 <strong>{courseData.monthlyPrice} {courseData.currency}</strong> в месяц • Итого: <strong>{courseData.totalPrice} {courseData.currency}</strong>
                </p>
              </div>
            )}
          </div>

          {/* Описание */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-semibold text-gray-800 mb-3">
              📝 Описание курса *
            </label>
            <textarea
              value={courseData.description}
              onChange={(e) => setCourseData({...courseData, description: e.target.value})}
              className={`w-full px-6 py-4 border-2 rounded-xl transition-all duration-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 h-32 resize-none ${
                errors.description ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              placeholder="Расскажите подробно о курсе, что изучат студенты, какие навыки получат..."
            />
            {errors.description && (
              <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                <span className="text-red-500">⚠️</span>
                {errors.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Дополнительные поля */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Предварительные требования
          </label>
          <div className="space-y-2">
            {(courseData.prerequisites || []).map((prereq, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={prereq}
                  onChange={(e) => {
                    const newPrereqs = [...(courseData.prerequisites || [])]
                    newPrereqs[index] = e.target.value
                    setCourseData({...courseData, prerequisites: newPrereqs})
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Например: Базовые знания HTML"
                />
                <button
                  onClick={() => {
                    const newPrereqs = courseData.prerequisites?.filter((_, i) => i !== index)
                    setCourseData({...courseData, prerequisites: newPrereqs})
                  }}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() => setCourseData({
                ...courseData, 
                prerequisites: [...(courseData.prerequisites || []), '']
              })}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-4 h-4" />
              Добавить требование
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Чему научится студент
          </label>
          <div className="space-y-2">
            {(courseData.learningOutcomes || []).map((outcome, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={outcome}
                  onChange={(e) => {
                    const newOutcomes = [...(courseData.learningOutcomes || [])]
                    newOutcomes[index] = e.target.value
                    setCourseData({...courseData, learningOutcomes: newOutcomes})
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Например: Создавать сайты на WordPress"
                />
                <button
                  onClick={() => {
                    const newOutcomes = courseData.learningOutcomes?.filter((_, i) => i !== index)
                    setCourseData({...courseData, learningOutcomes: newOutcomes})
                  }}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() => setCourseData({
                ...courseData, 
                learningOutcomes: [...(courseData.learningOutcomes || []), '']
              })}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-4 h-4" />
              Добавить результат обучения
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  // Рендер шага "Структура"
  const renderStructureStep = () => (
    <div className="space-y-8">
      {/* Красивый заголовок */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-4">
          <FileText className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Структура курса</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">Разбейте ваш курс на модули и уроки. Логичная структура поможет студентам лучше усваивать материал</p>
      </div>

      {errors.modules && (
        <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-2xl flex items-center gap-3">
          <span className="text-red-500 text-xl">⚠️</span>
          <span className="font-medium">{errors.modules}</span>
        </div>
      )}

      <div className="space-y-6">
        {modules.map((module, moduleIndex) => (
          <div key={module.id} className="bg-white border-2 border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-200">
            <div className="flex items-start gap-6">
              {/* Номер модуля и перетаскивание */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                  {moduleIndex + 1}
                </div>
                <div className="cursor-move text-gray-400 hover:text-gray-600">
                  <GripVertical className="w-5 h-5" />
                </div>
              </div>
              
              <div className="flex-1 space-y-6">
                {/* Заголовок и описание модуля */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      📚 Название модуля
                    </label>
                    <input
                      type="text"
                      value={module.title}
                      onChange={(e) => {
                        const updatedModules = [...modules]
                        updatedModules[moduleIndex].title = e.target.value
                        setModules(updatedModules)
                      }}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 hover:border-gray-300 transition-all duration-200"
                      placeholder="Например: Основы WordPress"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      📝 Описание модуля
                    </label>
                    <input
                      type="text"
                      value={module.description}
                      onChange={(e) => {
                        const updatedModules = [...modules]
                        updatedModules[moduleIndex].description = e.target.value
                        setModules(updatedModules)
                      }}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 hover:border-gray-300 transition-all duration-200"
                      placeholder="Краткое описание содержания"
                    />
                  </div>
                </div>

                {errors[`module_${module.id}`] && (
                  <p className="text-sm text-red-500">{errors[`module_${module.id}`]}</p>
                )}

                {/* Уроки модуля */}
                <div className="ml-8 space-y-2">
                  {module.lessons.map((lesson, lessonIndex) => (
                    <div key={lesson.id} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                      <GripVertical className="w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={lesson.title}
                        onChange={(e) => {
                          const updatedModules = [...modules]
                          updatedModules[moduleIndex].lessons[lessonIndex].title = e.target.value
                          setModules(updatedModules)
                        }}
                        className="flex-1 px-3 py-1 border border-gray-200 rounded bg-white"
                        placeholder="Название урока"
                      />
                      <button
                        onClick={() => setSelectedLesson(lesson.id)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Редактировать урок"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          const updatedModules = [...modules]
                          updatedModules[moduleIndex].lessons = updatedModules[moduleIndex].lessons.filter(
                            l => l.id !== lesson.id
                          )
                          setModules(updatedModules)
                        }}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  
                  <button
                    onClick={() => addLesson(module.id)}
                    className="inline-flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg font-medium text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Добавить урок</span>
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  setModules(modules.filter(m => m.id !== module.id))
                }}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}

        {/* Кнопка добавления модуля под списком */}
        <div className="text-center pt-4">
          <button
            onClick={addModule}
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            <span className="font-semibold">Добавить модуль</span>
          </button>
        </div>
      </div>
    </div>
  )

  // Рендер шага "Уроки"
  const renderLessonsStep = () => {
    const allLessons = modules.flatMap(m => 
      m.lessons.map(l => ({...l, moduleTitle: m.title, moduleId: m.id}))
    )

    if (allLessons.length === 0) {
      return (
        <div className="text-center py-12">
          <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Нет уроков</h3>
          <p className="text-gray-500 mb-4">Сначала создайте структуру курса с модулями и уроками</p>
          <button
            onClick={() => setCurrentStep(1)}
            className="text-blue-600 hover:text-blue-700"
          >
            Перейти к структуре
          </button>
        </div>
      )
    }

    const currentLesson = selectedLesson 
      ? allLessons.find(l => l.id === selectedLesson)
      : allLessons[0]

    return (
      <div className="flex gap-8">
        {/* Список уроков */}
        <div className="w-96 bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Содержание курса</h3>
            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {modules.reduce((sum, m) => sum + m.lessons.length, 0)} уроков
            </div>
          </div>
          
          <div className="space-y-4 max-h-[700px] overflow-y-auto">
            {modules.map((module, moduleIndex) => (
              <div key={module.id} className="space-y-2">
                {/* Заголовок модуля */}
                <div className="sticky top-0 bg-white z-10 border-b border-gray-100 pb-2">
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">
                      {moduleIndex + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm">{module.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{module.lessons.length} урок{module.lessons.length === 1 ? '' : module.lessons.length < 5 ? 'а' : 'ов'}</p>
                    </div>
                    <div className="text-xs text-blue-600 font-medium">
                      Модуль {moduleIndex + 1}
                    </div>
                  </div>
                </div>
                
                {/* Уроки модуля */}
                <div className="ml-4 space-y-1">
                  {module.lessons.map((lesson, lessonIndex) => (
                    <button
                      key={lesson.id}
                      onClick={() => setSelectedLesson(lesson.id)}
                      className={`group w-full text-left p-3 rounded-lg transition-all duration-200 border ${
                        selectedLesson === lesson.id 
                          ? 'bg-blue-50 border-blue-200 text-blue-900 shadow-sm' 
                          : 'hover:bg-gray-50 border-transparent hover:border-gray-200 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                            selectedLesson === lesson.id 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-200 text-gray-600 group-hover:bg-gray-300'
                          }`}>
                            {lessonIndex + 1}
                          </div>
                          <div className="flex-1">
                            <h5 className={`text-sm font-medium leading-tight ${
                              selectedLesson === lesson.id ? 'text-blue-900' : 'text-gray-900'
                            }`}>
                              {lesson.title}
                            </h5>
                            {lesson.description && (
                              <p className={`text-xs mt-1 line-clamp-2 ${
                                selectedLesson === lesson.id ? 'text-blue-700' : 'text-gray-500'
                              }`}>
                                {lesson.description}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Иконки статуса */}
                        <div className="flex items-center gap-1 ml-2">
                          {lesson.lectureId && (
                            <div className="w-5 h-5 bg-cyan-100 rounded-full flex items-center justify-center" title="Прикреплена лекция">
                              <FileText className="w-3 h-3 text-cyan-600" />
                            </div>
                          )}
                          {lesson.checklistId && (
                            <div className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center" title="Прикреплен чеклист">
                              <ClipboardList className="w-3 h-3 text-amber-600" />
                            </div>
                          )}
                          {lesson.hasAssignment && (
                            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center" title="Есть задание">
                              <ClipboardList className="w-3 h-3 text-green-600" />
                            </div>
                          )}
                          {lesson.hasQuiz && (
                            <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center" title="Есть тест">
                              <TestTube className="w-3 h-3 text-purple-600" />
                            </div>
                          )}
                          {lesson.videoUrl && (
                            <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center" title="Содержит видео">
                              <Video className="w-3 h-3 text-red-600" />
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Редактор урока */}
        {currentLesson && (
          <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm p-8">
            <div className="border-b border-gray-100 pb-6 mb-8">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold">
                  {(() => {
                    const currentModule = modules.find(m => m.id === currentLesson.moduleId)
                    if (!currentModule) return '?'
                    const lessonIndex = currentModule.lessons.findIndex(l => l.id === currentLesson.id)
                    return lessonIndex >= 0 ? lessonIndex + 1 : '?'
                  })()}
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={currentLesson.title}
                    onChange={(e) => {
                      const updatedModules = [...modules]
                      const moduleIndex = updatedModules.findIndex(m => m.id === currentLesson.moduleId)
                      const lessonIndex = updatedModules[moduleIndex].lessons.findIndex(l => l.id === currentLesson.id)
                      updatedModules[moduleIndex].lessons[lessonIndex].title = e.target.value
                      setModules(updatedModules)
                    }}
                    className="text-2xl font-bold text-gray-900 leading-tight bg-transparent border-0 border-b-2 border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none w-full transition-colors duration-200"
                    placeholder="Введите название урока..."
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Модуль: {modules.find(m => m.id === currentLesson.moduleId)?.title || 'Неизвестный модуль'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">


              {/* Описание и настройки урока */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Описание */}
                <div className="lg:col-span-3">
                  <textarea
                    value={currentLesson.description}
                    onChange={(e) => {
                      const updatedModules = [...modules]
                      const moduleIndex = updatedModules.findIndex(m => m.id === currentLesson.moduleId)
                      const lessonIndex = updatedModules[moduleIndex].lessons.findIndex(l => l.id === currentLesson.id)
                      updatedModules[moduleIndex].lessons[lessonIndex].description = e.target.value
                      setModules(updatedModules)
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                    placeholder="Краткое описание урока..."
                  />
                </div>

                {/* Длительность */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ⏱️ Длительность (минуты)
                  </label>
                  <input
                    type="number"
                    value={currentLesson.duration || ''}
                    onChange={(e) => {
                      const updatedModules = [...modules]
                      const moduleIndex = updatedModules.findIndex(m => m.id === currentLesson.moduleId)
                      const lessonIndex = updatedModules[moduleIndex].lessons.findIndex(l => l.id === currentLesson.id)
                      updatedModules[moduleIndex].lessons[lessonIndex].duration = parseInt(e.target.value) || undefined
                      setModules(updatedModules)
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-center font-semibold"
                    placeholder="Авто"
                    min="1"
                  />
                </div>
              </div>

              {/* Выбор лекции */}
              <LectureSelector
                selectedLectureId={currentLesson.lectureId}
                onLectureSelect={(lectureId) => {
                  const updatedModules = [...modules]
                  const moduleIndex = updatedModules.findIndex(m => m.id === currentLesson.moduleId)
                  const lessonIndex = updatedModules[moduleIndex].lessons.findIndex(l => l.id === currentLesson.id)
                  updatedModules[moduleIndex].lessons[lessonIndex].lectureId = lectureId || undefined
                  setModules(updatedModules)
                }}
              />

              {/* Выбор чеклиста */}
              <ChecklistSelector
                selectedChecklistId={currentLesson.checklistId}
                onChecklistSelect={(checklistId) => {
                  const updatedModules = [...modules]
                  const moduleIndex = updatedModules.findIndex(m => m.id === currentLesson.moduleId)
                  const lessonIndex = updatedModules[moduleIndex].lessons.findIndex(l => l.id === currentLesson.id)
                  updatedModules[moduleIndex].lessons[lessonIndex].checklistId = checklistId || undefined
                  setModules(updatedModules)
                }}
                direction={courseData.direction as 'WORDPRESS' | 'VIBE_CODING' | 'SHOPIFY'}
              />

              {/* Контент урока */}
              <LessonContentBuilder
                content={currentLesson.content}
                onChange={(content) => {
                  const updatedModules = [...modules]
                  const moduleIndex = updatedModules.findIndex(m => m.id === currentLesson.moduleId)
                  const lessonIndex = updatedModules[moduleIndex].lessons.findIndex(l => l.id === currentLesson.id)
                  updatedModules[moduleIndex].lessons[lessonIndex].content = content
                  setModules(updatedModules)
                }}
              />


            </div>
          </div>
        )}
      </div>
    )
  }

  // Рендер шага "Задания"
  const renderAssignmentsStep = () => {
    const allLessons = modules.flatMap(m => 
      m.lessons.map(l => ({
        ...l, 
        moduleTitle: m.title, 
        moduleId: m.id
      }))
    )

    if (allLessons.length === 0) {
      return (
        <div className="text-center py-12">
          <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Нет уроков</h3>
          <p className="text-gray-500 mb-4">
            Сначала создайте структуру курса с модулями и уроками
          </p>
          <button
            onClick={() => setCurrentStep(1)}
            className="text-blue-600 hover:text-blue-700"
          >
            Перейти к структуре
          </button>
        </div>
      )
    }

    const currentLesson = selectedLesson 
      ? allLessons.find(l => l.id === selectedLesson)
      : allLessons[0]

    const currentAssignment = assignments.find(a => a.lessonId === selectedLesson)

    return (
      <div className="flex gap-6">
        {/* Список уроков */}
        <div className="w-96 bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Содержание курса</h3>
            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {allLessons.length} урок{allLessons.length === 1 ? '' : allLessons.length < 5 ? 'а' : 'ов'}
            </div>
          </div>
          
          <div className="space-y-4 max-h-[700px] overflow-y-auto">
            {modules.map((module, moduleIndex) => (
              <div key={module.id} className="space-y-2">
                {/* Заголовок модуля */}
                <div className="sticky top-0 bg-white z-10 border-b border-gray-100 pb-2">
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
                    <div className="w-8 h-8 bg-green-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">
                      {moduleIndex + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm">{module.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{module.lessons.length} урок{module.lessons.length === 1 ? '' : module.lessons.length < 5 ? 'а' : 'ов'}</p>
                    </div>
                    <div className="text-xs text-green-600 font-medium">
                      Модуль {moduleIndex + 1}
                    </div>
                  </div>
                </div>
                
                {/* Уроки модуля */}
                <div className="ml-4 space-y-1">
                  {module.lessons.map((lesson, lessonIndex) => {
                    const hasAssignment = assignments.some(a => a.lessonId === lesson.id)
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => setSelectedLesson(lesson.id)}
                        className={`group w-full text-left p-3 rounded-lg transition-all duration-200 border ${
                          selectedLesson === lesson.id 
                            ? 'bg-green-50 border-green-200 text-green-900 shadow-sm' 
                            : 'hover:bg-gray-50 border-transparent hover:border-gray-200 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                              selectedLesson === lesson.id 
                                ? 'bg-green-600 text-white' 
                                : 'bg-gray-200 text-gray-600 group-hover:bg-gray-300'
                            }`}>
                              {lessonIndex + 1}
                            </div>
                            <div className="flex-1">
                              <h5 className={`text-sm font-medium leading-tight ${
                                selectedLesson === lesson.id ? 'text-green-900' : 'text-gray-900'
                              }`}>
                                {lesson.title}
                              </h5>
                              {lesson.description && (
                                <p className={`text-xs mt-1 line-clamp-2 ${
                                  selectedLesson === lesson.id ? 'text-green-700' : 'text-gray-500'
                                }`}>
                                  {lesson.description}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {/* Статус задания */}
                          <div className="flex items-center gap-1 ml-2">
                            {hasAssignment && (
                              <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center" title="Есть задание">
                                <ClipboardList className="w-3 h-3 text-green-600" />
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Редактор задания */}
        {currentLesson && (
          <div className="flex-1 bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Задание для урока: {currentLesson.title}
              </h3>
              {currentAssignment && (
                <button
                  onClick={() => {
                    setAssignments(prev => prev.filter(a => a.lessonId !== selectedLesson))
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Удалить задание
                </button>
              )}
            </div>

            {!currentAssignment ? (
              <div className="text-center py-12">
                <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Задание не создано</h4>
                <p className="text-gray-500 mb-6">
                  Добавьте задание к этому уроку для проверки знаний студентов
                </p>
                <button
                  onClick={() => {
                    const currentLesson = allLessons.find(l => l.id === selectedLesson)
                    const newAssignment = {
                      id: `assignment_${Date.now()}`,
                      lessonId: selectedLesson!,
                      moduleId: currentLesson?.moduleId || '',
                      title: '',
                      description: ''
                    }
                    setAssignments(prev => [...prev, newAssignment])
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 mx-auto"
                >
                  <Plus className="w-5 h-5" />
                  Добавить задание
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Название задания *
                  </label>
                  <input
                    type="text"
                    value={currentAssignment.title}
                    onChange={(e) => {
                      const updated = { ...currentAssignment, title: e.target.value }
                      setAssignments(prev => {
                        const filtered = prev.filter(a => a.lessonId !== selectedLesson)
                        return [...filtered, updated]
                      })
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Например: Создать главную страницу сайта"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Описание задания *
                  </label>
                  <textarea
                    value={currentAssignment.description}
                    onChange={(e) => {
                      const updated = { ...currentAssignment, description: e.target.value }
                      setAssignments(prev => {
                        const filtered = prev.filter(a => a.lessonId !== selectedLesson)
                        return [...filtered, updated]
                      })
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-32"
                    placeholder="Подробное описание задания, требования, критерии оценки..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Срок сдачи (опционально)
                  </label>
                  <input
                    type="date"
                    value={currentAssignment.dueDate || ''}
                    onChange={(e) => {
                      const updated = { ...currentAssignment, dueDate: e.target.value }
                      setAssignments(prev => {
                        const filtered = prev.filter(a => a.lessonId !== selectedLesson)
                        return [...filtered, updated]
                      })
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Файлы и материалы
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      Загрузите файлы с примерами или шаблонами
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, DOC, ZIP до 10MB
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Рендер шага "Тесты"
  const renderTestsStep = () => {
    const allLessons = modules.flatMap(m => 
      m.lessons.map(l => ({
        ...l, 
        moduleTitle: m.title, 
        moduleId: m.id
      }))
    )

    if (allLessons.length === 0) {
      return (
        <div className="text-center py-12">
          <TestTube className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Нет уроков</h3>
          <p className="text-gray-500 mb-4">
            Сначала создайте структуру курса с модулями и уроками
          </p>
          <button
            onClick={() => setCurrentStep(1)}
            className="text-blue-600 hover:text-blue-700"
          >
            Перейти к структуре
          </button>
        </div>
      )
    }

    const currentLesson = selectedLesson 
      ? allLessons.find(l => l.id === selectedLesson)
      : allLessons[0]

    const currentQuiz = quizzes.find(q => q.lessonId === selectedLesson)

    return (
      <div className="flex gap-6">
        {/* Список уроков */}
        <div className="w-96 bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Содержание курса</h3>
            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {allLessons.length} урок{allLessons.length === 1 ? '' : allLessons.length < 5 ? 'а' : 'ов'}
            </div>
          </div>
          
          <div className="space-y-4 max-h-[700px] overflow-y-auto">
            {modules.map((module, moduleIndex) => (
              <div key={module.id} className="space-y-2">
                {/* Заголовок модуля */}
                <div className="sticky top-0 bg-white z-10 border-b border-gray-100 pb-2">
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-100">
                    <div className="w-8 h-8 bg-purple-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">
                      {moduleIndex + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm">{module.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{module.lessons.length} урок{module.lessons.length === 1 ? '' : module.lessons.length < 5 ? 'а' : 'ов'}</p>
                    </div>
                    <div className="text-xs text-purple-600 font-medium">
                      Модуль {moduleIndex + 1}
                    </div>
                  </div>
                </div>
                
                {/* Уроки модуля */}
                <div className="ml-4 space-y-1">
                  {module.lessons.map((lesson, lessonIndex) => {
                    const hasQuiz = quizzes.some(q => q.lessonId === lesson.id)
                    const existingQuiz = quizzes.find(q => q.lessonId === lesson.id)
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => setSelectedLesson(lesson.id)}
                        className={`group w-full text-left p-3 rounded-lg transition-all duration-200 border ${
                          selectedLesson === lesson.id 
                            ? 'bg-purple-50 border-purple-200 text-purple-900 shadow-sm' 
                            : 'hover:bg-gray-50 border-transparent hover:border-gray-200 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                              selectedLesson === lesson.id 
                                ? 'bg-purple-600 text-white' 
                                : 'bg-gray-200 text-gray-600 group-hover:bg-gray-300'
                            }`}>
                              {lessonIndex + 1}
                            </div>
                            <div className="flex-1">
                              <h5 className={`text-sm font-medium leading-tight ${
                                selectedLesson === lesson.id ? 'text-purple-900' : 'text-gray-900'
                              }`}>
                                {lesson.title}
                              </h5>
                              {lesson.description && (
                                <p className={`text-xs mt-1 line-clamp-2 ${
                                  selectedLesson === lesson.id ? 'text-purple-700' : 'text-gray-500'
                                }`}>
                                  {lesson.description}
                                </p>
                              )}

                            </div>
                          </div>
                          
                          {/* Статус теста */}
                          <div className="flex items-center gap-1 ml-2">
                            {hasQuiz && (
                              <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center" title="Есть тест">
                                <TestTube className="w-3 h-3 text-purple-600" />
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Редактор теста */}
        {currentLesson && (
          <div className="flex-1 bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Тест для урока: {currentLesson.title}
              </h3>
              {currentQuiz && (
                <button
                  onClick={() => {
                    setQuizzes(prev => prev.filter(q => q.lessonId !== selectedLesson))
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Удалить тест
                </button>
              )}
            </div>

            {!currentQuiz ? (
              <div className="text-center py-12">
                <TestTube className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Тест не создан</h4>
                <p className="text-gray-500 mb-6">
                  Добавьте тест к этому уроку для проверки знаний студентов
                </p>
                <button
                  onClick={() => {
                    const newQuiz = {
                      id: `quiz_${Date.now()}`,
                      lessonId: selectedLesson!,
                      title: '',
                      description: '',
                      questions: [],
                      timeLimit: 30,
                      passingScore: 70
                    }
                    setQuizzes(prev => [...prev, newQuiz])
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 mx-auto"
                >
                  <Plus className="w-5 h-5" />
                  Добавить тест
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Название теста
                    </label>
                    <input
                      type="text"
                      value={currentQuiz.title}
                      onChange={(e) => {
                        const updated = { ...currentQuiz, title: e.target.value }
                        setQuizzes(prev => {
                          const filtered = prev.filter(q => q.lessonId !== selectedLesson)
                          return [...filtered, updated]
                        })
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Например: Проверка знаний по уроку 1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Проходной балл (%)
                    </label>
                    <input
                      type="number"
                      value={currentQuiz.passingScore}
                      onChange={(e) => {
                        const updated = { ...currentQuiz, passingScore: parseInt(e.target.value) || 70 }
                        setQuizzes(prev => {
                          const filtered = prev.filter(q => q.lessonId !== selectedLesson)
                          return [...filtered, updated]
                        })
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Время на выполнение (минут)
                  </label>
                  <input
                    type="number"
                    value={currentQuiz.timeLimit || 0}
                    onChange={(e) => {
                      const updated = { ...currentQuiz, timeLimit: parseInt(e.target.value) || 0 }
                      setQuizzes(prev => {
                        const filtered = prev.filter(q => q.lessonId !== selectedLesson)
                        return [...filtered, updated]
                      })
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                    placeholder="0 - без ограничения времени"
                  />
                </div>

                {/* Вопросы теста */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-900">Вопросы теста</h4>
                    <button
                      onClick={() => {
                        const newQuestion: QuizQuestion = {
                          id: `question_${Date.now()}`,
                          question: '',
                          type: 'SINGLE_CHOICE',
                          points: 1,
                          order: (currentQuiz.questions || []).length + 1,
                          options: [
                            { id: `opt_${Date.now()}_1`, text: '', isCorrect: false, order: 1 },
                            { id: `opt_${Date.now()}_2`, text: '', isCorrect: false, order: 2 }
                          ]
                        }
                        const updated = { 
                          ...currentQuiz, 
                          questions: [...(currentQuiz.questions || []), newQuestion]
                        }
                        setQuizzes(prev => {
                          const filtered = prev.filter(q => q.lessonId !== selectedLesson)
                          return [...filtered, updated]
                        })
                      }}
                      className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Добавить вопрос
                    </button>
                  </div>

                  <div className="space-y-4">
                    {(currentQuiz.questions || []).map((question, qIndex) => (
                      <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start gap-4">
                          <div className="cursor-move text-gray-400 hover:text-gray-600 pt-1">
                            <GripVertical className="w-5 h-5" />
                          </div>
                          
                          <div className="flex-1 space-y-3">
                            <div className="grid grid-cols-3 gap-3">
                              <div className="col-span-2">
                                <input
                                  type="text"
                                  value={question.question}
                                  onChange={(e) => {
                                    const updatedQuestions = [...(currentQuiz.questions || [])]
                                    updatedQuestions[qIndex] = { ...question, question: e.target.value }
                                    const updated = { ...currentQuiz, questions: updatedQuestions }
                                    setQuizzes(prev => {
                                      const filtered = prev.filter(q => q.lessonId !== selectedLesson)
                                      return [...filtered, updated]
                                    })
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                  placeholder="Текст вопроса"
                                />
                              </div>
                              <select
                                value={question.type}
                                onChange={(e) => {
                                  const updatedQuestions = [...(currentQuiz.questions || [])]
                                  updatedQuestions[qIndex] = { 
                                    ...question, 
                                    type: e.target.value as 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE'
                                  }
                                  const updated = { ...currentQuiz, questions: updatedQuestions }
                                  setQuizzes(prev => {
                                    const filtered = prev.filter(q => q.lessonId !== selectedLesson)
                                    return [...filtered, updated]
                                  })
                                }}
                                className="px-3 py-2 border border-gray-300 rounded-lg"
                              >
                                <option value="SINGLE_CHOICE">Один ответ</option>
                                <option value="MULTIPLE_CHOICE">Несколько ответов</option>
                                <option value="TRUE_FALSE">Да/Нет</option>
                              </select>
                            </div>

                            {/* Варианты ответов */}
                            <div className="ml-4 space-y-2">
                              {question.options.map((option, oIndex) => (
                                <div key={option.id} className="flex items-center gap-2">
                                  <input
                                    type={question.type === 'SINGLE_CHOICE' ? 'radio' : 'checkbox'}
                                    checked={option.isCorrect}
                                    onChange={(e) => {
                                      const updatedQuestions = [...(currentQuiz.questions || [])]
                                      const updatedOptions = [...question.options]
                                      if (question.type === 'SINGLE_CHOICE') {
                                        // Для single choice сбрасываем все другие
                                        updatedOptions.forEach(opt => opt.isCorrect = false)
                                      }
                                      updatedOptions[oIndex].isCorrect = e.target.checked
                                      updatedQuestions[qIndex] = { ...question, options: updatedOptions }
                                      const updated = { ...currentQuiz, questions: updatedQuestions }
                                      setQuizzes(prev => {
                                        const filtered = prev.filter(q => q.lessonId !== selectedLesson)
                                        return [...filtered, updated]
                                      })
                                    }}
                                    className="w-4 h-4"
                                  />
                                  <input
                                    type="text"
                                    value={option.text}
                                    onChange={(e) => {
                                      const updatedQuestions = [...(currentQuiz.questions || [])]
                                      const updatedOptions = [...question.options]
                                      updatedOptions[oIndex].text = e.target.value
                                      updatedQuestions[qIndex] = { ...question, options: updatedOptions }
                                      const updated = { ...currentQuiz, questions: updatedQuestions }
                                      setQuizzes(prev => {
                                        const filtered = prev.filter(q => q.lessonId !== selectedLesson)
                                        return [...filtered, updated]
                                      })
                                    }}
                                    className="flex-1 px-3 py-1 border border-gray-200 rounded"
                                    placeholder={`Вариант ${oIndex + 1}`}
                                  />
                                  <button
                                    onClick={() => {
                                      const updatedQuestions = [...(currentQuiz.questions || [])]
                                      const updatedOptions = question.options
                                        .filter((_, i) => i !== oIndex)
                                        .map((opt, index) => ({ ...opt, order: index + 1 }))
                                      updatedQuestions[qIndex] = { ...question, options: updatedOptions }
                                      const updated = { ...currentQuiz, questions: updatedQuestions }
                                      setQuizzes(prev => {
                                        const filtered = prev.filter(q => q.lessonId !== selectedLesson)
                                        return [...filtered, updated]
                                      })
                                    }}
                                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={() => {
                                  const updatedQuestions = [...(currentQuiz.questions || [])]
                                  const newOption = { 
                                    id: `opt_${Date.now()}`, 
                                    text: '', 
                                    isCorrect: false,
                                    order: question.options.length + 1
                                  }
                                  updatedQuestions[qIndex] = { 
                                    ...question, 
                                    options: [...question.options, newOption]
                                  }
                                  const updated = { ...currentQuiz, questions: updatedQuestions }
                                  setQuizzes(prev => {
                                    const filtered = prev.filter(q => q.lessonId !== selectedLesson)
                                    return [...filtered, updated]
                                  })
                                }}
                                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                              >
                                <Plus className="w-3 h-3" />
                                Добавить вариант
                              </button>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              const updatedQuestions = (currentQuiz.questions || [])
                                .filter((_, i) => i !== qIndex)
                                .map((q, index) => ({ ...q, order: index + 1 }))
                              const updated = { ...currentQuiz, questions: updatedQuestions }
                              setQuizzes(prev => {
                                const filtered = prev.filter(q => q.lessonId !== selectedLesson)
                                return [...filtered, updated]
                              })
                            }}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Рендер шага "Публикация"
  const renderPublishStep = () => {
    const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0)
    const lessonsWithContent = modules.flatMap(m => m.lessons).filter(l => l.content || l.videoUrl)
    const assignmentsCount = assignments.filter(a => a.title && a.description).length
    const quizzesCount = quizzes.filter(q => q.questions && q.questions.length > 0).length

    return (
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Финальная проверка и публикация</h2>
        
        {/* Статистика курса */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Статистика курса</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{modules.length}</div>
              <div className="text-sm text-gray-600">Модулей</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{totalLessons}</div>
              <div className="text-sm text-gray-600">Уроков</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{assignmentsCount}</div>
              <div className="text-sm text-gray-600">Заданий</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{quizzesCount}</div>
              <div className="text-sm text-gray-600">Тестов</div>
            </div>
          </div>
        </div>

        {/* Чек-лист */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Проверка готовности</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {courseData.title && courseData.description ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <span className="w-5 h-5 text-red-600 flex items-center justify-center">✗</span>
              )}
              <span className={courseData.title && courseData.description ? 'text-gray-700' : 'text-red-600'}>
                Основная информация заполнена
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              {modules.length > 0 ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <span className="w-5 h-5 text-red-600 flex items-center justify-center">✗</span>
              )}
              <span className={modules.length > 0 ? 'text-gray-700' : 'text-red-600'}>
                Создана структура курса
              </span>
            </div>

            <div className="flex items-center gap-3">
              {lessonsWithContent.length === totalLessons ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <span className="w-5 h-5 text-yellow-600 flex items-center justify-center">⚠</span>
              )}
              <span className={lessonsWithContent.length === totalLessons ? 'text-gray-700' : 'text-yellow-600'}>
                Контент добавлен для всех уроков ({lessonsWithContent.length}/{totalLessons})
              </span>
            </div>

            <div className="flex items-center gap-3">
              {assignmentsCount > 0 || quizzesCount > 0 ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <span className="w-5 h-5 text-yellow-600 flex items-center justify-center">⚠</span>
              )}
              <span className="text-gray-700">
                Добавлены задания или тесты
              </span>
            </div>
          </div>
        </div>

        {/* Настройки публикации */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Настройки публикации</h3>
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 rounded"
                defaultChecked
              />
              <span className="text-gray-700">Опубликовать курс сразу после сохранения</span>
            </label>
            
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-gray-700">Отправить уведомление студентам о новом курсе</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-gray-700">Создать черновик для дальнейшего редактирования</span>
            </label>
          </div>
        </div>

      </div>
    )
  }

  // Функция сохранения курса
  const saveCourse = async (isDraft: boolean) => {
    setSaving(true)
    try {
      // Валидация обязательных полей
      if (!courseData.title || !courseData.description || !courseData.direction || !courseData.level) {
        throw new Error('Пожалуйста, заполните все обязательные поля курса')
      }

      // Валидация полей оплаты
      if (courseData.paymentType === 'ONE_TIME' && courseData.price <= 0) {
        throw new Error('Для разовой оплаты укажите стоимость курса больше 0')
      }
      
      if (courseData.paymentType === 'MONTHLY' && courseData.monthlyPrice <= 0) {
        throw new Error('Для ежемесячной оплаты укажите стоимость в месяц больше 0')
      }

      if (modules.length === 0) {
        throw new Error('Добавьте хотя бы один модуль к курсу')
      }

      for (const currentModuleData of modules) {
        if (!currentModuleData.title) {
          throw new Error(`Модуль ${currentModuleData.order + 1}: заполните название`)
        }
        if (currentModuleData.lessons.length === 0) {
          throw new Error(`Модуль "${currentModuleData.title}": добавьте хотя бы один урок`)
        }
        for (const lesson of currentModuleData.lessons) {
          if (!lesson.title) {
            throw new Error(`Урок в модуле "${currentModuleData.title}": заполните название`)
          }
        }
      }

      const url = isEditing 
        ? `/api/admin/courses/${editCourseId}` 
        : '/api/admin/builder'
      
      const method = isEditing ? 'PUT' : 'POST'
      
      // Подготавливаем данные для отправки
      const requestData = {
        courseData: {
          ...courseData,
          isDraft,
          isActive: !isDraft
        },
        modules: modules.map(module => ({
          ...module,
          lessons: module.lessons.map(lesson => ({
            ...lesson,
            assignments: assignments
              .filter(a => a.lessonId === lesson.id)
              .slice(0, 1) // Берем только первое задание
              .map(a => ({
                title: a.title,
                description: a.description,
                dueDate: a.dueDate,
                maxScore: 100 // Добавляем maxScore по умолчанию
              }))
          }))
        }))
      }

      // Логируем данные для отладки
      console.log('=== DEBUG: saveCourse ===')
      console.log('assignments state:', assignments)
      console.log('modules:', modules.map(m => ({ id: m.id, title: m.title, lessonsCount: m.lessons.length })))
      console.log('Отправляемые данные:', JSON.stringify(requestData, null, 2))
      
      // Проверим, есть ли задания в модулях
      requestData.modules.forEach((module, index) => {
        const totalAssignments = module.lessons.reduce((sum, lesson) => sum + (lesson.assignments?.length || 0), 0)
        console.log(`Модуль ${index + 1} (${module.title}): ${totalAssignments} заданий`)
        module.lessons.forEach(lesson => {
          lesson.assignments?.forEach(assignment => {
            console.log(`  - Задание: ${assignment.title}`)
          })
        })
        
        // Проверим чеклисты в уроках
        module.lessons.forEach((lesson, lessonIndex) => {
          if (lesson.checklistId) {
            console.log(`  Урок ${lessonIndex + 1} (${lesson.title}): чеклист ${lesson.checklistId}`)
          }
        })
      })
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })

      if (response.ok) {
        const result = await response.json()
        
        // Сохраняем тесты
        for (const quiz of quizzes) {
          if (quiz.questions && quiz.questions.length > 0) {
            try {
              console.log('=== DEBUG: Отправляем тест ===')
              console.log('Quiz data:', JSON.stringify(quiz, null, 2))
              
              // Если у теста есть ID, значит он уже существует - обновляем
              // Если нет ID - создаем новый
              const isUpdate = quiz.id && !quiz.id.startsWith('quiz_')
              const url = isUpdate ? `/api/admin/quizzes/${quiz.id}` : '/api/admin/quizzes'
              const method = isUpdate ? 'PUT' : 'POST'
              
              console.log(`Метод: ${method}, URL: ${url}`)
              
              const quizResponse = await fetch(url, {
                method,
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(quiz)
              })
              
              if (!quizResponse.ok) {
                const errorText = await quizResponse.text()
                console.error(`Ошибка ${isUpdate ? 'обновления' : 'создания'} теста:`, errorText)
                console.error('Status:', quizResponse.status)
                console.error('StatusText:', quizResponse.statusText)
              } else {
                console.log(`Тест успешно ${isUpdate ? 'обновлен' : 'создан'}!`)
              }
            } catch (error) {
              console.error('Ошибка при сохранении теста:', error)
            }
          }
        }

        alert(isDraft 
          ? (isEditing ? 'Курс обновлен как черновик!' : 'Черновик сохранен!')
          : (isEditing ? 'Курс обновлен и опубликован!' : 'Курс опубликован!')
        )
        router.push('/admin')
      } else {
        // Улучшенная обработка ошибок
        console.error('Ошибка HTTP:', response.status, response.statusText)
        
        let errorData: {
          error?: string;
          message?: string;
          [key: string]: unknown;
        } = {}
        let errorMessage = 'Ошибка сохранения курса'
        
        try {
          // Проверяем, есть ли content-type
          const contentType = response.headers.get('content-type')
          console.log('Content-Type ответа:', contentType)
          
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json()
            console.log('Данные ошибки:', errorData)
            errorMessage = errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`
          } else {
            // Если ответ не JSON, получаем текст
            const errorText = await response.text()
            console.log('Текст ошибки:', errorText)
            errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`
          }
        } catch (parseError) {
          console.error('Ошибка парсинга ответа сервера:', parseError)
          errorMessage = `Ошибка сервера (${response.status}): Не удалось обработать ответ`
        }
        
        console.error('Финальная ошибка для пользователя:', errorMessage)
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error('Ошибка сохранения:', error)
      alert(`Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
    } finally {
      setSaving(false)
    }
  }

  // Рендер текущего шага
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderOverviewStep()
      case 1:
        return renderStructureStep()
      case 2:
        return renderLessonsStep()
      case 3:
        return renderAssignmentsStep()
      case 4:
        return renderTestsStep()
      case 5:
        return renderPublishStep()
      default:
        return null
    }
  }

  // Показываем загрузку при редактировании
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка курса для редактирования...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Хедер с навигацией по шагам */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-none mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="py-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {isEditing ? 'Редактирование курса' : 'Конструктор курса'}
              </h1>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => saveCourse(true)}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Сохранение...' : 'Черновик'}
                </button>
                <button
                  onClick={() => saveCourse(false)}
                  disabled={saving || !courseData.title || !courseData.description || modules.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium"
                >
                  <Rocket className="w-4 h-4" />
                  {saving ? 'Публикация...' : 'Опубликовать курс'}
                </button>
              </div>
            </div>

            {/* Навигация по шагам */}
            <div className="flex items-center justify-between">
              {STEPS.map((step, index) => {
                const Icon = step.icon
                const isActive = index === currentStep
                const isCompleted = index < currentStep
                const isDisabled = index > currentStep && !validateStep(false)

                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <button
                      onClick={() => goToStep(index)}
                      disabled={isDisabled}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        isActive 
                          ? 'bg-blue-100 text-blue-700' 
                          : isCompleted
                          ? 'text-green-600 hover:bg-green-50'
                          : isDisabled
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                      <span className="font-medium">{step.title}</span>
                    </button>
                    {index < STEPS.length - 1 && (
                      <ChevronRight className="w-5 h-5 text-gray-400 mx-2" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Контент */}
      <div className="max-w-none mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8">
        {renderCurrentStep()}

        {/* Навигация внизу */}
        <div className="flex justify-between mt-8">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Назад
          </button>
          
          {currentStep < STEPS.length - 1 && (
            <button
              onClick={() => goToStep(currentStep + 1)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Далее
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Экспортируем защищенный компонент
export default withStaffProtection(CourseBuilderComponent, {
  fallback: null,
  showAccessDenied: true
})
