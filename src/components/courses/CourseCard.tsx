'use client'

import Link from 'next/link'
import { useState } from 'react'

interface CourseCardProps {
  course: {
    id: string
    title: string
    description?: string | null
    direction: string
    level: string
    price?: number | null
    _count: {
      modules: number
      enrollments: number
    }
  }
  showEnrollButton?: boolean
  onEnroll?: (courseId: string) => void
  isEnrolling?: boolean
}

export function CourseCard({ 
  course, 
  showEnrollButton = true, 
  onEnroll,
  isEnrolling = false 
}: CourseCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case 'WORDPRESS':
        return 'bg-blue-100 text-blue-800'
      case 'VIBE_CODING':
        return 'bg-purple-100 text-purple-800'
      case 'SHOPIFY':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'BEGINNER':
        return 'bg-green-100 text-green-800'
      case 'INTERMEDIATE':
        return 'bg-yellow-100 text-yellow-800'
      case 'ADVANCED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getDirectionLabel = (direction: string) => {
    switch (direction) {
      case 'WORDPRESS':
        return 'WordPress'
      case 'VIBE_CODING':
        return 'Vibe Coding'
      case 'SHOPIFY':
        return 'Shopify'
      default:
        return direction
    }
  }

  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'BEGINNER':
        return 'Начинающий'
      case 'INTERMEDIATE':
        return 'Средний'
      case 'ADVANCED':
        return 'Продвинутый'
      default:
        return level
    }
  }

  const handleEnroll = () => {
    if (onEnroll) {
      onEnroll(course.id)
    }
  }

  return (
    <div 
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
              {course.title}
            </h3>
            {course.description && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {course.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDirectionColor(course.direction)}`}>
            {getDirectionLabel(course.direction)}
          </span>
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLevelColor(course.level)}`}>
            {getLevelLabel(course.level)}
          </span>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              {course._count.modules} модулей
            </span>
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              {course._count.enrollments} студентов
            </span>
          </div>
          {course.price && (
            <div className="text-lg font-semibold text-blue-600">
              {course.price === 0 ? 'Бесплатно' : `${course.price} ₽`}
            </div>
          )}
        </div>

        <div className="flex space-x-3">
          <Link
            href={`/courses/${course.id}`}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors text-center"
          >
            Подробнее
          </Link>
          
          {showEnrollButton && onEnroll && (
            <button
              onClick={handleEnroll}
              disabled={isEnrolling}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEnrolling ? 'Запись...' : 'Записаться'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
