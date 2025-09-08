'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface ContentBlock {
  id?: string;
  type: string;
  content?: string;
  metadata?: {
    url?: string;
    alt?: string;
    filename?: string;
  };
}

interface Lesson {
  id: string
  title: string
  content: string
  duration: number
  order: number
  videoUrl?: string
}

interface Module {
  id: string
  title: string
  description?: string | null
  order: number
  lessons: Lesson[]
  course: {
    id: string
    title: string
  }
}

interface ModuleResponse {
  module: Module
  error?: string
}

export default function ModuleStudyPage() {
  const params = useParams()
  const router = useRouter()
  const [module, setModule] = useState<Module | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0)

  const courseId = params.id as string
  const moduleId = params.moduleId as string

  useEffect(() => {
    fetchModule()
  }, [moduleId])

  // Функция для парсинга JSON контента уроков
  const parseLessonContent = (content: string | null): ContentBlock[] => {
    try {
      if (!content) return [];
      
      // Проверяем, является ли контент JSON
      if (content.trim().startsWith('[') || content.trim().startsWith('{')) {
        return JSON.parse(content);
      }
      
      // Если это не JSON, возвращаем как текстовый блок
      return [{
        id: 'text-1',
        type: 'text',
        content: content
      }];
    } catch (error) {
      console.error('Error parsing lesson content:', error);
      // Если JSON невалидный, возвращаем как текстовый блок
      return [{
        id: 'text-1',
        type: 'text',
        content: content || ''
      }];
    }
  }

  // Функция для извлечения текстового контента из блоков
  const getTextContent = (content: string | null): string => {
    if (!content) return '';
    
    const blocks = parseLessonContent(content);
    if (blocks.length === 0) return '';
    
    const textBlocks = blocks.filter(block => block.type === 'text' && block.content);
    if (textBlocks.length === 0) return '';
    
    return textBlocks.map(block => block.content || '').join(' ').trim();
  }

  const fetchModule = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/modules/${moduleId}/lessons`)
      const data: ModuleResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка загрузки модуля')
      }

      setModule(data.module)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки модуля')
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    
    if (hours > 0) {
      return `${hours}ч ${mins}м`
    }
    return `${mins}м`
  }

  const handleLessonClick = (lessonId: string) => {
    router.push(`/courses/${courseId}/lessons/${lessonId}`)
  }

  const handleCompleteLesson = async (lessonId: string) => {
    try {
      const response = await fetch(`/api/lessons/${lessonId}/complete`, {
        method: 'POST'
      })

      if (response.ok) {
        // Обновляем состояние или показываем уведомление
        console.log('Урок отмечен как завершенный')
      }
    } catch (error) {
      console.error('Ошибка при завершении урока:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Загрузка модуля...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !module) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Ошибка загрузки модуля
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link
              href={`/courses/${courseId}`}
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
            >
              Вернуться к курсу
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Хлебные крошки */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li>
              <Link href="/courses" className="hover:text-gray-700">
                Курсы
              </Link>
            </li>
            <li>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </li>
            <li>
              <Link href={`/courses/${courseId}`} className="hover:text-gray-700">
                {module.course.title}
              </Link>
            </li>
            <li>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </li>
            <li className="text-gray-900">{module.title}</li>
          </ol>
        </nav>

        {/* Заголовок модуля */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-4">
                <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full mr-4">
                  Модуль {module.order}
                </span>
                <h1 className="text-3xl font-bold text-gray-900">
                  {module.title}
                </h1>
              </div>
              
              {module.description && (
                <p className="text-lg text-gray-600 mb-6">
                  {module.description}
                </p>
              )}

              <div className="flex items-center space-x-6 text-sm text-gray-500">
                                 <span className="flex items-center">
                   <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                   </svg>
                   {module.lessons?.length || 0} уроков
                 </span>
                                 <span className="flex items-center">
                   <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                   {module.lessons?.reduce((total, lesson) => total + lesson.duration, 0) || 0} мин
                 </span>
              </div>
            </div>

            <Link
              href={`/courses/${courseId}`}
              className="ml-6 text-blue-600 hover:text-blue-700 font-medium"
            >
              ← К курсу
            </Link>
          </div>
        </div>

        {/* Список уроков */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Уроки модуля
          </h2>

                     {module.lessons && module.lessons.length > 0 ? (
            <div className="space-y-4">
              {module.lessons.map((lesson, index) => (
                <div 
                  key={lesson.id} 
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleLessonClick(lesson.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">
                            {lesson.order}
                          </span>
                        </div>
                      </div>
                      
                      <div className="ml-4 flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {lesson.title}
                        </h3>
                        {lesson.content && (
                          <p className="text-gray-600 mt-1 line-clamp-2">
                            {getTextContent(lesson.content)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-500">
                        {formatDuration(lesson.duration)}
                      </span>
                      
                      {lesson.videoUrl && (
                        <span className="flex items-center text-sm text-gray-500">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Видео
                        </span>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCompleteLesson(lesson.id)
                        }}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        Завершить
                      </button>

                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Уроки пока не добавлены
              </h3>
              <p className="text-gray-600">
                Содержание модуля будет добавлено в ближайшее время
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
