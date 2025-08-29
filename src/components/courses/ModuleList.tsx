'use client'

import Link from 'next/link'

interface Lesson {
  id: string
  title: string
  duration: number
  order: number
  lectureId?: string | null
  lecture?: {
    id: string
    title: string
    description?: string | null
  } | null
}

interface Module {
  id: string
  title: string
  description?: string | null
  order: number
  lessons: Lesson[]
  _count: {
    lessons: number
    assignments: number
  }
}

interface ModuleListProps {
  modules: Module[]
  courseId: string
  isEnrolled: boolean
}

export function ModuleList({ modules, courseId, isEnrolled }: ModuleListProps) {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    
    if (hours > 0) {
      return `${hours}ч ${mins}м`
    }
    return `${mins}м`
  }

  return (
    <div className="space-y-6">
      {modules.map((module, index) => (
        <div key={module.id} className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-2 py-1 rounded-full mr-3">
                  Модуль {index + 1}
                </span>
                <h3 className="text-lg font-semibold text-gray-900">
                  {module.title}
                </h3>
              </div>
              
              {module.description && (
                <p className="text-gray-600 mb-4">
                  {module.description}
                </p>
              )}

              {/* Список уроков */}
              {module.lessons && module.lessons.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Уроки в модуле:
                  </h4>
                  <div className="space-y-2">
                    {module.lessons.map((lesson) => (
                      <div key={lesson.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-500 mr-3">
                            {lesson.order}.
                          </span>
                          <span className="text-sm text-gray-900">
                            {lesson.title}
                          </span>
                          {lesson.lecture && (
                            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800" title={`Лекция: ${lesson.lecture.title}`}>
                              📄 Лекция
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-xs text-gray-500">
                            {formatDuration(lesson.duration)}
                          </span>
                          {isEnrolled && (
                            <Link
                              href={`/courses/${courseId}/lessons/${lesson.id}`}
                              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                            >
                              Изучить
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-4 text-sm text-gray-500 mt-4">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  {module._count.lessons} уроков
                </span>
                {module._count.assignments > 0 && (
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {module._count.assignments} заданий
                  </span>
                )}
              </div>
            </div>

            {isEnrolled && (
              <Link
                href={`/courses/${courseId}/modules/${module.id}`}
                className="ml-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Изучить →
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
