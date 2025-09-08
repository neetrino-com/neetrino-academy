'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { File, Image } from 'lucide-react'
import VideoPlayer from '@/components/ui/VideoPlayer'

interface Lecture {
  id: string
  title: string
  description?: string | null
  content: Array<{
    type: string;
    data: unknown;
  }>
  isActive: boolean
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
      const response = await fetch(`/api/admin/lectures/${lectureId}`)
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

  const parseLectureContent = (content: Array<{
    type: string;
    data: unknown;
  }> | string | null) => {
    try {
      if (!content) return [];
      return typeof content === 'string' ? JSON.parse(content) : content;
    } catch (error) {
      console.error('Error parsing lecture content:', error);
      return [];
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Ошибка загрузки лекции
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link
              href="/courses"
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
            >
              Вернуться к курсам
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const contentBlocks = parseLectureContent(lecture.content) as Array<{
    type: string;
    data: unknown;
  }>

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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

        {/* Заголовок лекции */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-center mb-6">
            <div className="bg-cyan-100 text-cyan-800 p-3 rounded-lg mr-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {lecture.title}
              </h1>
              {lecture.description && (
                <p className="text-gray-600 mt-2 text-lg">{lecture.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Контент лекции */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          {contentBlocks && contentBlocks.length > 0 ? (
            <div className="space-y-8">
              {contentBlocks.map((block: {
                id?: string;
                type: string;
                content?: string;
                metadata?: {
                  url?: string;
                  alt?: string;
                  filename?: string;
                  files?: Array<{
                    id: string;
                    url: string;
                    name: string;
                    size: number;
                    type: string;
                    publicId?: string;
                  }>;
                };
              }, index: number) => (
                <div key={block.id || index} className="border-l-4 border-cyan-200 pl-6">
                  {block.type === 'text' && (
                    <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-lg">
                      {block.content}
                    </div>
                  )}
                  {block.type === 'file' && block.metadata?.files && block.metadata.files.length > 0 && (
                    <div className="my-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                          <File className="w-5 h-5 text-blue-600" />
                          Файлы для скачивания ({block.metadata.files.length})
                        </h4>
                        <div className="grid gap-3">
                          {block.metadata.files.map((file) => (
                            <div key={file.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                {file.type.startsWith('image/') ? (
                                  <Image className="w-5 h-5 text-green-600" />
                                ) : (
                                  <File className="w-5 h-5 text-blue-600" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 truncate">{file.name}</div>
                                  <div className="text-sm text-gray-500">
                                    {Math.round(file.size / 1024)} KB
                                  </div>
                                </div>
                              </div>
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
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
                  {block.type === 'code' && block.metadata?.url && (
                    <div className="my-6">
                      <div className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto">
                        <div className="text-sm text-gray-400 mb-3 font-medium">
                          {block.content || 'Код'}
                        </div>
                        <pre className="text-sm leading-relaxed">
                          <code>{block.metadata.url}</code>
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
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
  )
}
