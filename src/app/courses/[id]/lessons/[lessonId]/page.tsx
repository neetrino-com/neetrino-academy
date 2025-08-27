'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import VideoPlayer from '@/components/ui/VideoPlayer'

interface Lesson {
  id: string
  title: string
  content: string
  duration: number
  order: number
  videoUrl?: string
  module: {
    id: string
    title: string
    order: number
    course: {
      id: string
      title: string
    }
  }
}

interface LessonResponse {
  lesson: Lesson
  error?: string
}

export default function LessonStudyPage() {
  const params = useParams()
  const router = useRouter()
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCompleted, setIsCompleted] = useState(false)
  const [videoProgress, setVideoProgress] = useState(0)

  const courseId = params.id as string
  const lessonId = params.lessonId as string

  useEffect(() => {
    fetchLesson()
    checkCompletionStatus()
  }, [lessonId])

  const fetchLesson = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/lessons/${lessonId}`)
      const data: LessonResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка загрузки урока')
      }

      setLesson(data.lesson)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки урока')
    } finally {
      setLoading(false)
    }
  }

  const checkCompletionStatus = async () => {
    try {
      const response = await fetch(`/api/lessons/${lessonId}/status`)
      if (response.ok) {
        const data = await response.json()
        setIsCompleted(data.completed)
      }
    } catch (error) {
      console.error('Ошибка при проверке статуса урока:', error)
    }
  }

  const handleCompleteLesson = async () => {
    try {
      const response = await fetch(`/api/lessons/${lessonId}/complete`, {
        method: 'POST'
      })

      if (response.ok) {
        setIsCompleted(true)
        // Показываем уведомление об успешном завершении
        alert('Урок успешно завершен!')
      }
    } catch (error) {
      console.error('Ошибка при завершении урока:', error)
      alert('Ошибка при завершении урока')
    }
  }

  const handleVideoProgress = (progress: number) => {
    setVideoProgress(progress)
    
    // Автоматически завершаем урок, если видео просмотрено на 90% или больше
    if (progress >= 90 && !isCompleted) {
      handleCompleteLesson()
    }
  }

  const handleVideoEnded = () => {
    if (!isCompleted) {
      handleCompleteLesson()
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Загрузка урока...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !lesson) {
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
              Ошибка загрузки урока
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
                {lesson.module.course.title}
              </Link>
            </li>
            <li>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </li>
            <li>
              <Link href={`/courses/${courseId}/modules/${lesson.module.id}`} className="hover:text-gray-700">
                {lesson.module.title}
              </Link>
            </li>
            <li>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </li>
            <li className="text-gray-900">{lesson.title}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Основной контент */}
          <div className="lg:col-span-2">
            {/* Заголовок урока */}
            <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-4">
                    <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full mr-4">
                      Урок {lesson.order}
                    </span>
                    <h1 className="text-3xl font-bold text-gray-900">
                      {lesson.title}
                    </h1>
                  </div>

                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatDuration(lesson.duration)}
                    </span>
                    {lesson.videoUrl && (
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Видео включено
                      </span>
                    )}
                  </div>
                </div>

                <Link
                  href={`/courses/${courseId}/modules/${lesson.module.id}`}
                  className="ml-6 text-blue-600 hover:text-blue-700 font-medium"
                >
                  ← К модулю
                </Link>
              </div>
            </div>

            {/* Видеоплеер */}
            {lesson.videoUrl && (
              <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Видео урока
                </h2>
                <VideoPlayer
                  videoUrl={lesson.videoUrl}
                  title={lesson.title}
                  onProgress={handleVideoProgress}
                  onEnded={handleVideoEnded}
                  className="w-full"
                />
              </div>
            )}

            {/* Контент урока */}
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Содержание урока
              </h2>
              <div className="prose max-w-none">
                {lesson.content ? (
                  <div className="text-gray-700 leading-relaxed">
                    {lesson.content}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-4">
                      <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Контент пока не добавлен
                    </h3>
                    <p className="text-gray-600">
                      Содержание урока будет добавлено в ближайшее время
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Боковая панель */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Прогресс урока
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Статус:</span>
                  <span className={`text-sm font-medium ${isCompleted ? 'text-green-600' : 'text-yellow-600'}`}>
                    {isCompleted ? 'Завершен' : 'В процессе'}
                  </span>
                </div>

                {lesson.videoUrl && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Прогресс видео:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {Math.round(videoProgress)}%
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Длительность:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDuration(lesson.duration)}
                  </span>
                </div>

                <div className="pt-4">
                  {!isCompleted ? (
                    <button
                      onClick={handleCompleteLesson}
                      className="w-full bg-green-600 text-white px-4 py-3 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                      Завершить урок
                    </button>
                  ) : (
                    <div className="text-center">
                      <div className="text-green-600 mb-2">
                        <svg className="mx-auto h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-sm text-green-600 font-medium">
                        Урок завершен!
                      </p>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Навигация
                  </h4>
                  <div className="space-y-2">
                    <Link
                      href={`/courses/${courseId}/modules/${lesson.module.id}`}
                      className="block text-sm text-blue-600 hover:text-blue-700"
                    >
                      ← Вернуться к модулю
                    </Link>
                    <Link
                      href={`/courses/${courseId}`}
                      className="block text-sm text-blue-600 hover:text-blue-700"
                    >
                      ← К курсу
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
