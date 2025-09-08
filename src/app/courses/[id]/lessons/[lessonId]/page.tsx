'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { File, Image } from 'lucide-react'
import VideoPlayer from '@/components/ui/VideoPlayer'
import Quiz from '@/components/ui/Quiz'
import ChecklistLesson from '@/components/lessons/ChecklistLesson'
import { AccessControl } from '@/components/courses/AccessControl'

interface UploadedFile {
  id: string;
  url: string;
  name: string;
  size: number;
  type: string;
  publicId?: string;
}

interface ContentBlock {
  id?: string;
  type: 'text' | 'video' | 'code' | 'link' | 'file' | 'gallery' | 'checklist';
  content?: string;
  metadata?: {
    url?: string;
    alt?: string;
    filename?: string;
    language?: string;
    description?: string;
    fileSize?: number;
    files?: UploadedFile[];
  };
}

interface Assignment {
  id: string
  title: string
  description: string
  dueDate: string
}

interface Lesson {
  id: string
  title: string
  content: string
  duration: number
  order: number
  type?: 'LECTURE' | 'CHECKLIST' | 'ASSIGNMENT' | 'TEST'
  videoUrl?: string
  lectureId?: string | null
  checklistId?: string | null
  lecture?: {
    id: string
    title: string
    description?: string | null
    content: Array<{
      type: string;
      data: unknown;
    }>
  } | null
  checklist?: {
    id: string
    title: string
    description?: string | null
    direction: string
  } | null
  module: {
    id: string
    title: string
    order: number
    course: {
      id: string
      title: string
    }
  }
  assignments: Assignment[]
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
  const [quiz, setQuiz] = useState<{
    id: string;
    title: string;
    description?: string;
    questions: Array<{
      id: string;
      text: string;
      options: Array<{
        id: string;
        text: string;
      }>;
    }>;
  } | null>(null)
  const [userAttempt, setUserAttempt] = useState<{
    id: string;
    score: number;
    passed: boolean;
    completedAt: string;
  } | null>(null)
  const [showQuiz, setShowQuiz] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string[]>>({})


  const courseId = params.id as string
  const lessonId = params.lessonId as string

  // Функция для парсинга JSON контента уроков
  const parseLessonContent = (content: string | null): ContentBlock[] => {
    try {
      if (!content) return [];
      
      // Проверяем, является ли контент JSON
      if (content.trim().startsWith('[') || content.trim().startsWith('{')) {
        const parsed = JSON.parse(content);
        // Убеждаемся, что это массив блоков
        return Array.isArray(parsed) ? parsed : [parsed];
      }
      
      // Если это не JSON, возвращаем как текстовый блок
      return [{
        id: 'text-1',
        type: 'text' as const,
        content: content
      }];
    } catch (error) {
      console.error('Error parsing lesson content:', error);
      // Если JSON невалидный, возвращаем как текстовый блок
      return [{
        id: 'text-1',
        type: 'text' as const,
        content: content || ''
      }];
    }
  }

  // Функция для рендеринга блоков контента
  const renderContentBlocks = (content: string | null) => {
    const blocks = parseLessonContent(content);
    
    if (blocks.length === 0) {
      return (
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
      );
    }

    return (
      <div className="space-y-6">
        {blocks.map((block: ContentBlock, index: number) => (
          <div key={block.id || index} className="border-l-4 border-cyan-200 pl-6">
            {block.type === 'text' && (
              <div 
                className="text-gray-700 leading-relaxed text-lg prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-code:text-gray-800 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded"
                dangerouslySetInnerHTML={{ __html: block.content }}
              />
            )}
            {block.type === 'gallery' && block.metadata?.files && block.metadata.files.length > 0 && (
              <div className="my-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Image className="w-5 h-5 text-green-600" />
                    Галерея изображений ({block.metadata.files.length})
                  </h4>
                  
                  <div className="space-y-2">
                    {block.metadata.files.map((file) => (
                      <div
                        key={file.id}
                        className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex gap-3"
                      >
                        <div className="flex-shrink-0">
                          <img
                            src={file.url.startsWith('http') ? file.url : `${process.env.NEXTAUTH_URL || 'http://localhost:3005'}${file.url}`}
                            alt={file.name}
                            className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                            onError={(e) => {
                              console.error('Ошибка загрузки изображения:', file.url, e);
                              e.currentTarget.style.display = 'none';
                            }}
                            onLoad={() => {
                              console.log('Изображение загружено:', file.url);
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Image className="w-4 h-4 text-green-600" />
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {file.name}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 mb-2">
                            {Math.round(file.size / 1024)} KB
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={file.url.startsWith('http') ? file.url : `${process.env.NEXTAUTH_URL || 'http://localhost:3005'}${file.url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:text-blue-700 text-xs flex items-center gap-1"
                              title="Открыть изображение"
                            >
                              <File className="w-3 h-3" />
                              Открыть
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {block.content && (
                    <p className="text-gray-600 mt-3 text-sm">{block.content}</p>
                  )}
                </div>
              </div>
            )}

            {block.type === 'file' && block.metadata?.files && block.metadata.files.length > 0 && (
              <div className="my-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <File className="w-5 h-5 text-indigo-600" />
                    Файлы для скачивания ({block.metadata.files.length})
                  </h4>
                  
                  <div className="space-y-2">
                    {block.metadata.files.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <File className="w-5 h-5 text-indigo-600" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">{file.name}</div>
                            <div className="text-sm text-gray-500">
                              {Math.round(file.size / 1024)} KB
                            </div>
                          </div>
                        </div>
                        <a
                          href={file.url.startsWith('http') ? file.url : `${process.env.NEXTAUTH_URL || 'http://localhost:3005'}${file.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                        >
                          Скачать
                        </a>
                      </div>
                    ))}
                  </div>
                  
                  {block.content && (
                    <p className="text-gray-600 mt-3 text-sm">{block.content}</p>
                  )}
                </div>
              </div>
            )}
            {block.type === 'video' && block.metadata?.url && (
              <div className="my-6">
                <VideoPlayer
                  videoUrl={block.metadata.url}
                  title={block.content || 'Видео'}
                  className="w-full"
                />
                {block.content && (
                  <p className="text-gray-600 mt-3 text-center">{block.content}</p>
                )}
              </div>
            )}
            {block.type === 'code' && (
              <div className="my-6">
                <div className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto">
                  <div className="text-sm text-gray-400 mb-3 font-medium">
                    {block.metadata?.language || 'Код'}
                  </div>
                  <pre className="text-sm leading-relaxed">
                    <code>{block.content || block.metadata?.url || ''}</code>
                  </pre>
                </div>
              </div>
            )}
            {block.type === 'link' && block.metadata?.url && (
              <div className="my-6">
                <a 
                  href={block.metadata.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-lg font-medium"
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  {block.content || 'Открыть ссылку'}
                </a>
              </div>
            )}
            {block.type === 'file' && block.metadata?.url && (
              <div className="my-6 p-6 bg-gray-50 rounded-lg border">
                <div className="flex items-center">
                  <svg className="w-10 h-10 text-gray-400 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <div className="flex-1">
                    <a 
                      href={block.metadata.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 font-medium text-lg"
                    >
                      {block.metadata.filename || 'Скачать файл'}
                    </a>
                    {block.content && (
                      <p className="text-gray-600 mt-2">{block.content}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            {block.type === 'checklist' && (
              <div className="my-6 p-6 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-3">Чек-лист:</h4>
                <div className="text-blue-800 whitespace-pre-wrap">
                  {block.content}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  useEffect(() => {
    fetchLesson()
    checkCompletionStatus()
    fetchQuiz()
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

  const fetchQuiz = async () => {
    try {
      const response = await fetch(`/api/lessons/${lessonId}/quiz`)
      if (response.ok) {
        const data = await response.json()
        setQuiz(data.quiz)
        setUserAttempt(data.userAttempt)
      }
    } catch (error) {
      console.error('Ошибка при получении теста:', error)
    }
  }



  const handleQuizComplete = async (score: number, maxScore: number, passed: boolean) => {
    const percentage = (score / maxScore) * 100
    
    try {
      // Отправляем результаты на сервер
      const response = await fetch(`/api/lessons/${lessonId}/quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers: Object.entries(answers).map(([questionId, selectedOptions]) => ({
            questionId,
            selectedOptions
          }))
        })
      });

      if (response.ok) {
        const result = await response.json();
        setUserAttempt(result.attempt);
        
        if (passed) {
          alert(`Поздравляем! Вы прошли тест с результатом ${percentage.toFixed(1)}%`)
        } else {
          alert(`Тест не пройден. Ваш результат: ${percentage.toFixed(1)}%. Необходимо набрать минимум 70%`)
        }
      } else {
        const error = await response.json();
        if (error.error === 'Вы уже проходили этот тест') {
          alert('Вы уже проходили этот тест ранее!')
        } else {
          alert('Ошибка при сохранении результатов теста')
        }
      }
    } catch (error) {
      console.error('Ошибка при отправке результатов теста:', error);
      alert('Ошибка при сохранении результатов теста')
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
      <div className="max-w-none mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Основной контент */}
          <div className="lg:col-span-3">
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

            {/* Лекция */}
            {lesson.lecture && (
              <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="bg-cyan-100 text-cyan-800 p-3 rounded-lg mr-4">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {lesson.lecture.title}
                      </h2>
                      {lesson.lecture.description && (
                        <p className="text-gray-600 mt-1">{lesson.lecture.description}</p>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/lectures/${lesson.lecture.id}`}
                    className="inline-flex items-center px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-medium"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Открыть лекцию
                  </Link>
                </div>
                
                <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-cyan-800">
                        Лекция доступна для изучения
                      </h3>
                      <div className="mt-2 text-sm text-cyan-700">
                        <p>
                          К этому уроку прикреплена лекция с дополнительными материалами. 
                          Нажмите "Открыть лекцию" для полного изучения контента.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Чеклист */}
            {lesson.checklist && (
              <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="bg-amber-100 text-amber-800 p-3 rounded-lg mr-4">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {lesson.checklist.title}
                      </h2>
                      {lesson.checklist.description && (
                        <p className="text-gray-600 mt-1">{lesson.checklist.description}</p>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/checklist/${lesson.checklist.id}`}
                    className="inline-flex items-center px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Открыть чеклист
                  </Link>
                </div>
                
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-amber-800">
                        Чеклист доступен для выполнения
                      </h3>
                      <div className="text-sm text-amber-700">
                        <p>
                          К этому уроку прикреплен чеклист с практическими заданиями. 
                          Выполните все пункты для закрепления материала.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Встроенный чеклист */}
                <div className="mt-6">
                  <ChecklistLesson 
                    checklistId={lesson.checklist.id} 
                    lessonId={lesson.id} 
                  />
                </div>
              </div>
            )}

            {/* Контент урока */}
            <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Содержание урока
              </h2>
              <div className="prose max-w-none">
                {renderContentBlocks(lesson.content)}
              </div>
            </div>

            {/* Задания к уроку */}
            {lesson.assignments && lesson.assignments.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="bg-orange-100 text-orange-800 p-3 rounded-lg mr-4">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        Задания к уроку
                      </h2>
                      <p className="text-gray-600 mt-1">
                        Практические задания для закрепления материала
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {lesson.assignments.map((assignment) => (
                    <div key={assignment.id} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {assignment.title}
                          </h3>
                          {assignment.description && (
                            <p className="text-gray-600 mb-3">
                              {assignment.description}
                            </p>
                          )}
                          {assignment.dueDate && (
                            <div className="flex items-center text-sm text-orange-600">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Срок выполнения: {new Date(assignment.dueDate).toLocaleDateString('ru-RU')}
                            </div>
                          )}
                        </div>
                        <Link
                          href={`/assignments/${assignment.id}`}
                          className="ml-4 inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors text-sm font-medium"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          Выполнить
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Тест к уроку */}
            {quiz && (
              <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="bg-purple-100 text-purple-800 p-3 rounded-lg mr-4">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        Тест по уроку
                      </h2>
                      <p className="text-gray-600 mt-1">
                        Проверьте свои знания по пройденному материалу
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="text-sm font-medium text-purple-800 mb-2">
                        {quiz.title}
                      </h3>
                      <div className="text-sm text-purple-700 mb-4">
                        <p>
                          Пройдите тест, чтобы проверить понимание материала урока. 
                          Тест содержит {quiz.questions?.length || 0} вопросов.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowQuiz(true)}
                        className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm font-medium"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        Начать тест
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}



            {/* Модальное окно с тестом */}
            {showQuiz && quiz && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {quiz.title}
                      </h2>
                      <button
                        onClick={() => setShowQuiz(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    <Quiz
                      quiz={quiz}
                      onComplete={handleQuizComplete}
                      onAnswersChange={setAnswers}
                      onClose={() => setShowQuiz(false)}
                    />
                  </div>
                </div>
              </div>
            )}
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

                {lesson.checklist && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Тип урока:</span>
                    <span className="text-sm font-medium text-amber-600">
                      Чеклист
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
