'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { File, Image, Link as LinkIcon, Video, Code, Download, ArrowLeft, Calendar, User, BookOpen, Clock } from 'lucide-react'
import VideoPlayer from '@/components/ui/VideoPlayer'

interface LectureBlock {
  id: string;
  type: 'text' | 'video' | 'code' | 'link' | 'file' | 'gallery';
  content?: string;
  metadata?: {
    url?: string;
    alt?: string;
    filename?: string;
    language?: string;
    description?: string;
    fileSize?: number;
    files?: Array<{
      id: string;
      url: string;
      name: string;
      size: number;
      type: string;
      publicId?: string;
    }>;
  };
}

interface Lecture {
  id: string
  title: string
  description?: string | null
  thumbnail?: string | null
  content: LectureBlock[]
  isActive: boolean
  createdAt: string
  creator: {
    id: string
    name: string
    email: string
  }
  lessons: Array<{
    id: string
    title: string
    module: {
      id: string
      title: string
      course: {
        id: string
        title: string
      }
    }
  }>
  _count: {
    lessons: number
  }
}

interface LectureResponse {
  lecture: Lecture
  error?: string
}

export default function LecturePage() {
  const params = useParams()
  const router = useRouter()
  const [lecture, setLecture] = useState<Lecture | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const lectureId = params.id as string

  useEffect(() => {
    fetchLecture()
  }, [lectureId])

  const fetchLecture = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/lectures/${lectureId}`)
      const data: LectureResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка загрузки лекции')
      }

      setLecture(data.lecture)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки лекции')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const renderBlock = (block: LectureBlock, index: number) => {
    switch (block.type) {
      case 'text':
        return (
          <div className="prose max-w-none">
            <div 
              className="whitespace-pre-wrap text-gray-800 leading-relaxed text-xl"
              dangerouslySetInnerHTML={{ __html: block.content || '' }}
            />
          </div>
        );

      case 'gallery':
        return (
          <div className="my-6">
            <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Image className="w-5 h-5 text-green-600" />
                Галерея изображений ({block.metadata?.files?.length || 0})
              </h4>
              
              <div className={`grid gap-4 ${
                (block.metadata?.files?.length || 0) === 1 
                  ? 'grid-cols-1' 
                  : 'grid-cols-2'
              }`}>
                {block.metadata?.files?.map((file) => (
                  <div key={file.id} className="group relative">
                    <a
                      href={file.url.startsWith('http') ? file.url : `${process.env.NEXTAUTH_URL || 'http://localhost:3007'}${file.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <div className={`w-full rounded-lg border border-gray-200 hover:border-green-300 transition-all duration-200 group-hover:shadow-lg bg-gray-100 flex items-center justify-center ${
                        (block.metadata?.files?.length || 0) === 1 
                          ? 'h-64' 
                          : 'h-48'
                      }`}>
                        <img
                          src={file.url.startsWith('http') ? file.url : `${process.env.NEXTAUTH_URL || 'http://localhost:3007'}${file.url}`}
                          alt={file.name}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            console.error('Ошибка загрузки изображения:', file.url, e);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    </a>
                  </div>
                ))}
              </div>
              
              {block.content && (
                <p className="text-gray-600 mt-3 text-sm">{block.content}</p>
              )}
            </div>
          </div>
        );

      case 'file':
        return (
          <div className="my-6">
            <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <File className="w-4 h-4 text-indigo-600" />
                Файлы для скачивания ({block.metadata?.files?.length || 0})
              </h4>
              
              <div className="space-y-2">
                {block.metadata?.files?.map((file) => (
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
                      href={file.url.startsWith('http') ? file.url : `${process.env.NEXTAUTH_URL || 'http://localhost:3007'}${file.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-base font-medium"
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
        );

      case 'video':
        return (
          <div className="my-6">
            <VideoPlayer
              videoUrl={block.metadata?.url || ''}
              title={block.content || 'Видео'}
              className="w-full"
            />
            {block.content && (
              <p className="text-gray-600 mt-3 text-center">{block.content}</p>
            )}
          </div>
        );

      case 'code':
        return (
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
        );

      case 'link':
        return (
          <div className="my-6">
              <a 
                href={block.metadata?.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center px-8 py-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-xl font-medium"
              >
                <LinkIcon className="w-5 h-5 mr-2" />
                {block.content || 'Открыть ссылку'}
              </a>
          </div>
        );

      default:
        return (
          <div className="my-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">Неизвестный тип блока: {block.type}</p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Загрузка лекции...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !lecture) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {error === 'Access denied' ? 'Доступ запрещен' : 'Ошибка загрузки лекции'}
            </h3>
            <p className="text-gray-600 mb-4">
              {error === 'Access denied' 
                ? 'У вас нет доступа к этой лекции. Убедитесь, что вы записаны на соответствующий курс.'
                : error
              }
            </p>
            <Link
              href="/courses"
              className="bg-blue-600 text-white px-8 py-4 rounded-md hover:bg-blue-700 transition-colors text-lg"
            >
              Вернуться к курсам
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16 xl:px-20">
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
            <li className="text-gray-900">Лекция</li>
          </ol>
        </nav>

        <div className="max-w-7xl mx-auto">
          {/* Основной контент */}
          <div>
            {/* Заголовок лекции */}
            <div className="bg-white rounded-2xl shadow-sm p-12 mb-8 border border-gray-200">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center">
                  <div className="bg-gradient-to-br from-cyan-400 to-blue-500 p-4 rounded-2xl mr-6 shadow-lg">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                      {lecture.title}
                    </h1>
                    {lecture.description && (
                      <p className="text-gray-600 text-xl leading-relaxed">{lecture.description}</p>
                    )}
                  </div>
                </div>
                <Link
                  href="/courses"
                  className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Назад
                </Link>
              </div>

              {/* Информация о лекции */}
              <div className="flex flex-wrap gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>Автор: {lecture.creator.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Создано: {formatDate(lecture.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>{lecture._count.lessons} уроков</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${lecture.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>{lecture.isActive ? 'Активна' : 'Неактивна'}</span>
                </div>
              </div>
            </div>

            {/* Контент лекции */}
            <div className="bg-white rounded-2xl shadow-sm p-12 border border-gray-200">
              {lecture.content && lecture.content.length > 0 ? (
                <div className="space-y-8">
                  {lecture.content.map((block, index) => (
                    <div key={block.id || index} className="group/block">
                      <div className="p-8 bg-gray-50 rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-base font-semibold">
                            {index + 1}
                          </div>
                          <div className="flex items-center gap-2">
                            {block.type === 'text' && <File className="w-5 h-5 text-gray-500" />}
                            {block.type === 'gallery' && <Image className="w-5 h-5 text-gray-500" />}
                            {block.type === 'video' && <Video className="w-5 h-5 text-gray-500" />}
                            {block.type === 'file' && <Download className="w-5 h-5 text-gray-500" />}
                            {block.type === 'link' && <LinkIcon className="w-5 h-5 text-gray-500" />}
                            {block.type === 'code' && <Code className="w-5 h-5 text-gray-500" />}
                            <span className="text-base font-medium text-gray-600 capitalize">
                              {block.type === 'text' ? 'Текст' : 
                               block.type === 'gallery' ? 'Галерея' :
                               block.type === 'video' ? 'Видео' :
                               block.type === 'file' ? 'Файл' :
                               block.type === 'link' ? 'Ссылка' :
                               block.type === 'code' ? 'Код' : block.type}
                            </span>
                          </div>
                        </div>
                        <div className="ml-14">
                          {renderBlock(block, index)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <BookOpen className="mx-auto h-16 w-16" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    Контент лекции пока не добавлен
                  </h3>
                  <p className="text-gray-600">
                    Содержание лекции будет добавлено в ближайшее время
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}