'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { CourseForm } from '@/components/admin/CourseForm'
import { 
  ArrowLeft, 
  Plus, 
  BookOpen, 
  FileText, 
  Settings, 
  Play,
  Save,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface Module {
  id: string
  title: string
  description: string
  order: number
  lessons: Lesson[]
  assignments: Assignment[]
}

interface Lesson {
  id: string
  title: string
  content: string
  videoUrl: string
  duration: number
  order: number
}

interface Assignment {
  id: string
  title: string
  description: string
  dueDate: string
}

interface Test {
  id: string
  title: string
  description: string
  questions: Question[]
}

interface Question {
  id: string
  text: string
  type: 'SINGLE' | 'MULTIPLE' | 'BOOLEAN'
  options: string[]
  correctAnswer: string | string[]
}

export default function CreateCoursePage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [step, setStep] = useState<'course' | 'modules' | 'content' | 'preview'>('course')
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    direction: 'WORDPRESS',
    level: 'BEGINNER',
    price: 0,
    isActive: true
  })
  const [modules, setModules] = useState<Partial<Module>[]>([])
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Проверка доступа
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  if (session.user.role !== 'ADMIN' && session.user.role !== 'TEACHER') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Доступ запрещен</h2>
          <p className="text-gray-600">У вас нет прав для создания курсов. Ваша роль: {session.user.role}</p>
        </div>
      </div>
    )
  }

  const handleCourseSubmit = (data: any) => {
    setCourseData(data)
    setStep('modules')
  }

  const addModule = () => {
    const newModule: Partial<Module> = {
      title: '',
      description: '',
      order: modules.length + 1,
      lessons: [],
      assignments: []
    }
    setModules([...modules, newModule])
  }

  const updateModule = (index: number, data: Partial<Module>) => {
    const updatedModules = [...modules]
    updatedModules[index] = { ...updatedModules[index], ...data }
    setModules(updatedModules)
  }

  const removeModule = (index: number) => {
    setModules(modules.filter((_, i) => i !== index))
  }

  const addLesson = (moduleIndex: number) => {
    const newLesson: Partial<Lesson> = {
      title: '',
      content: '',
      videoUrl: '',
      duration: 0,
      order: modules[moduleIndex]?.lessons?.length || 0
    }
    const updatedModules = [...modules]
    if (!updatedModules[moduleIndex].lessons) {
      updatedModules[moduleIndex].lessons = []
    }
    updatedModules[moduleIndex].lessons!.push(newLesson as Lesson)
    setModules(updatedModules)
  }

  const addAssignment = (moduleIndex: number) => {
    const newAssignment: Partial<Assignment> = {
      title: '',
      description: '',
      dueDate: ''
    }
    const updatedModules = [...modules]
    if (!updatedModules[moduleIndex].assignments) {
      updatedModules[moduleIndex].assignments = []
    }
    updatedModules[moduleIndex].assignments!.push(newAssignment as Assignment)
    setModules(updatedModules)
  }

  const handleFinalSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      // Создаем курс
      const courseResponse = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseData)
      })

      if (!courseResponse.ok) {
        const errorData = await courseResponse.json()
        if (errorData.error) {
          throw new Error(errorData.error)
        } else {
          throw new Error(`Ошибка создания курса (${courseResponse.status})`)
        }
      }

      const course = await courseResponse.json()

      // Создаем модули, уроки, задания и тесты
      for (const moduleData of modules) {
        if (!moduleData.title) continue

        // Создаем модуль
        const moduleResponse = await fetch(`/api/admin/courses/${course.id}/modules`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: moduleData.title,
            description: moduleData.description,
            order: moduleData.order
          })
        })

        if (!moduleResponse.ok) continue

        const module = await moduleResponse.json()

        // Создаем уроки
        if (moduleData.lessons) {
          for (const lessonData of moduleData.lessons) {
            if (!lessonData.title) continue

            await fetch(`/api/admin/modules/${module.id}/lessons`, {
        method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: lessonData.title,
                content: lessonData.content,
                videoUrl: lessonData.videoUrl,
                duration: lessonData.duration,
                order: lessonData.order
              })
            })
          }
        }

        // Создаем задания
        if (moduleData.assignments) {
          for (const assignmentData of moduleData.assignments) {
            if (!assignmentData.title) continue

            await fetch('/api/assignments', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: assignmentData.title,
                description: assignmentData.description,
                dueDate: assignmentData.dueDate,
                moduleId: module.id
              })
            })
          }
        }
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/admin')
      }, 2000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка')
    } finally {
      setLoading(false)
    }
    }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        {/* Заголовок и навигация */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <button
              onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
              <ArrowLeft className="w-5 h-5" />
              Назад
              </button>
            </div>
            
          <div className="flex items-center justify-between">
              <div>
              <h1 className="text-3xl font-bold text-gray-900">
                  Создание нового курса
                </h1>
              <p className="mt-2 text-gray-600">
                Создайте полноценный курс с модулями, уроками, заданиями и тестами
                </p>
              </div>
            
            {/* Прогресс */}
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${step === 'course' ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              <div className={`w-3 h-3 rounded-full ${step === 'modules' ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              <div className={`w-3 h-3 rounded-full ${step === 'content' ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              <div className={`w-3 h-3 rounded-full ${step === 'preview' ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              </div>
            </div>
          </div>

        {/* Ошибка */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Успех */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <p className="text-green-700">Курс успешно создан! Перенаправление...</p>
            </div>
          </div>
        )}

        {/* Шаг 1: Основная информация о курсе */}
        {step === 'course' && (
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Шаг 1: Основная информация о курсе
              </h2>
              <p className="text-gray-600 mt-1">
                Заполните основную информацию о курсе
              </p>
            </div>
            
            <div className="p-6">
              <CourseForm
                mode="create" 
                onCourseSubmit={handleCourseSubmit}
              />
            </div>
          </div>
        )}

        {/* Шаг 2: Модули */}
        {step === 'modules' && (
          <div className="space-y-6">
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Шаг 2: Модули курса
                </h2>
                <p className="text-gray-600 mt-1">
                  Создайте модули для структурирования курса
                </p>
              </div>
              
              <div className="p-6">
                {modules.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Модули не созданы
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Добавьте модули для структурирования курса
                    </p>
                    <button
                      onClick={addModule}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Добавить первый модуль
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {modules.map((module, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium text-gray-900">
                            Модуль {index + 1}
                          </h3>
                          <button
                            onClick={() => removeModule(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Название модуля *
                            </label>
                            <input
                              type="text"
                              value={module.title || ''}
                              onChange={(e) => updateModule(index, { title: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-600"
                              placeholder="Введите название модуля"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Описание
                            </label>
                            <textarea
                              value={module.description || ''}
                              onChange={(e) => updateModule(index, { description: e.target.value })}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-600"
                              placeholder="Опишите содержание модуля"
              />
            </div>
                        </div>
                      </div>
                    ))}
                    
                    <button
                      onClick={addModule}
                      className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors"
                    >
                      <Plus className="w-5 h-5 mx-auto mb-2" />
                      Добавить модуль
                    </button>
                  </div>
                )}
                
                <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setStep('course')}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Назад
                  </button>
                  
                  <button
                    onClick={() => setStep('content')}
                    disabled={modules.length === 0}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    Продолжить
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Шаг 3: Контент */}
        {step === 'content' && (
          <div className="space-y-6">
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Шаг 3: Контент модулей
                </h2>
                <p className="text-gray-600 mt-1">
                  Добавьте уроки, задания и тесты в каждый модуль
                </p>
          </div>

              <div className="p-6">
                {modules.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600">Сначала создайте модули</p>
                    <button
                      onClick={() => setStep('modules')}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
                    >
                      Вернуться к модулям
                    </button>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {modules.map((module, moduleIndex) => (
                      <div key={moduleIndex} className="border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                          {module.title || `Модуль ${moduleIndex + 1}`}
            </h3>
                        
                        {/* Уроки */}
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-md font-medium text-gray-700 flex items-center gap-2">
                              <Play className="w-4 h-4" />
                              Уроки ({module.lessons?.length || 0})
                            </h4>
                            <button
                              onClick={() => addLesson(moduleIndex)}
                              className="px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          
                          {module.lessons?.map((lesson, lessonIndex) => (
                            <div key={lessonIndex} className="border border-gray-200 rounded-md p-4 mb-3">
                              <input
                                type="text"
                                value={lesson.title || ''}
                                onChange={(e) => {
                                  const updatedModules = [...modules]
                                  updatedModules[moduleIndex].lessons![lessonIndex].title = e.target.value
                                  setModules(updatedModules)
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-600 mb-2"
                                placeholder="Название урока"
                              />
                              <textarea
                                value={lesson.content || ''}
                                onChange={(e) => {
                                  const updatedModules = [...modules]
                                  updatedModules[moduleIndex].lessons![lessonIndex].content = e.target.value
                                  setModules(updatedModules)
                                }}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-600"
                                placeholder="Описание урока"
                              />
                            </div>
                          ))}
                        </div>
                        
                        {/* Задания */}
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-md font-medium text-gray-700 flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              Задания ({module.assignments?.length || 0})
                            </h4>
                            <button
                              onClick={() => addAssignment(moduleIndex)}
                              className="px-3 py-1 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          
                          {module.assignments?.map((assignment, assignmentIndex) => (
                            <div key={assignmentIndex} className="border border-gray-200 rounded-md p-4 mb-3">
                              <input
                                type="text"
                                value={assignment.title || ''}
                                onChange={(e) => {
                                  const updatedModules = [...modules]
                                  updatedModules[moduleIndex].assignments![assignmentIndex].title = e.target.value
                                  setModules(updatedModules)
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-600 mb-2"
                                placeholder="Название задания"
                              />
                              <textarea
                                value={assignment.description || ''}
                                onChange={(e) => {
                                  const updatedModules = [...modules]
                                  updatedModules[moduleIndex].assignments![assignmentIndex].description = e.target.value
                                  setModules(updatedModules)
                                }}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-600"
                                placeholder="Описание задания"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setStep('modules')}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Назад
                  </button>
                  
                  <button
                    onClick={() => setStep('preview')}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Предварительный просмотр
                  </button>
          </div>
        </div>
      </div>
    </div>
        )}

        {/* Шаг 4: Предварительный просмотр */}
        {step === 'preview' && (
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Шаг 4: Предварительный просмотр
              </h2>
              <p className="text-gray-600 mt-1">
                Проверьте всю информацию перед созданием курса
              </p>
            </div>
            
            <div className="p-6">
              {/* Информация о курсе */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Информация о курсе</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-lg font-medium">{courseData.title}</p>
                  <p className="text-gray-600 mt-1">{courseData.description}</p>
                  <div className="flex gap-4 mt-2 text-sm text-gray-500">
                    <span>Направление: {courseData.direction}</span>
                    <span>Уровень: {courseData.level}</span>
                    <span>Цена: {courseData.price} ₽</span>
                  </div>
                </div>
              </div>
              
              {/* Модули */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Модули ({modules.length})
                </h3>
                <div className="space-y-4">
                  {modules.map((module, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">
                        {module.title || `Модуль ${index + 1}`}
                      </h4>
                      <p className="text-gray-600 text-sm mb-3">{module.description}</p>
                      
                      <div className="flex gap-4 text-sm text-gray-500">
                        <span>Уроков: {module.lessons?.length || 0}</span>
                        <span>Заданий: {module.assignments?.length || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-between pt-6 border-t border-gray-200">
                <button
                  onClick={() => setStep('content')}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Назад
                </button>
                
                <button
                  onClick={handleFinalSubmit}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-md disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Создание...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Создать курс
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
