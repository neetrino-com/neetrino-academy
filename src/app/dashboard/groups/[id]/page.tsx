'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Group {
  id: string
  name: string
  description: string
  type: string
  maxStudents: number
  startDate: string
  endDate: string
  isActive: boolean
  students: Array<{
    id: string
    user: {
      id: string
      name: string
      email: string
      avatar: string
    }
    joinedAt: string
    status: string
  }>
  teachers: Array<{
    id: string
    user: {
      id: string
      name: string
      email: string
      avatar: string
    }
    role: string
    joinedAt: string
  }>
  courses: Array<{
    id: string
    course: {
      id: string
      title: string
      description: string
      direction: string
      level: string
      isActive: boolean
    }
    assignedAt: string
  }>
  assignments: Array<{
    id: string
    assignment: {
      id: string
      title: string
      description: string
      dueDate: string
      lessonId: string | null
      type: string
      status: string
      maxScore: number
      createdBy: string
      createdAt: string
      updatedAt: string
    }
    dueDate: string
    assignedAt: string
  }>
}

export default function StudentGroupDetail() {
  const params = useParams()
  const [group, setGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGroup = async () => {
    try {
      const response = await fetch(`/api/student/groups/${params.id}`)
      if (!response.ok) {
        throw new Error('Группа не найдена')
      }
      const data = await response.json()
      setGroup(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки группы')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (params.id) {
      fetchGroup()
    }
  }, [params.id])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка группы...</p>
        </div>
      </div>
    )
  }

  if (error || !group) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Группа не найдена</h1>
          <p className="text-gray-600 mb-6">{error || 'Группа не существует или у вас нет доступа к ней'}</p>
          <Link 
            href="/dashboard/groups"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Вернуться к группам
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Заголовок */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
              <p className="mt-2 text-gray-600">{group.description}</p>
            </div>
            <Link 
              href="/dashboard/groups"
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← Назад к группам
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Основная информация */}
          <div className="lg:col-span-2 space-y-6">
            {/* Курсы */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Курсы группы</h2>
              {group.courses.length > 0 ? (
                <div className="space-y-3">
                  {group.courses.map((courseGroup) => (
                    <div key={courseGroup.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <h3 className="font-medium text-gray-900">{courseGroup.course.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{courseGroup.course.description}</p>
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {courseGroup.course.direction}
                        </span>
                        <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded">
                          {courseGroup.course.level}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">К группе не привязаны курсы</p>
              )}
            </div>

            {/* Задания */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Задания группы</h2>
              {group.assignments.length > 0 ? (
                <div className="space-y-3">
                  {group.assignments.map((groupAssignment) => (
                    <div key={groupAssignment.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{groupAssignment.assignment.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{groupAssignment.assignment.description}</p>
                          <div className="flex items-center mt-2 text-xs text-gray-500">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {groupAssignment.assignment.type}
                            </span>
                            <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded">
                              {groupAssignment.assignment.status}
                            </span>
                            {groupAssignment.assignment.lessonId && (
                              <span className="ml-2 bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                Привязано к уроку
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {groupAssignment.assignment.maxScore} баллов
                          </p>
                          <p className="text-xs text-red-600">
                            Срок: {formatDate(groupAssignment.assignment.dueDate)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">В группе нет заданий</p>
              )}
            </div>
          </div>

          {/* Боковая панель */}
          <div className="space-y-6">
            {/* Информация о группе */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Информация о группе</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500">Тип:</span>
                  <p className="text-gray-900">{group.type}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Максимум студентов:</span>
                  <p className="text-gray-900">{group.maxStudents}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Дата начала:</span>
                  <p className="text-gray-900">{formatDate(group.startDate)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Дата окончания:</span>
                  <p className="text-gray-900">{formatDate(group.endDate)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Статус:</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    group.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {group.isActive ? 'Активна' : 'Неактивна'}
                  </span>
                </div>
              </div>
            </div>

            {/* Участники группы */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Участники</h2>
              
              {/* Преподаватели */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Преподаватели</h3>
                <div className="space-y-2">
                  {group.teachers.map((teacher) => (
                    <div key={teacher.id} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {teacher.user.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{teacher.user.name}</p>
                        <p className="text-xs text-gray-500">{teacher.user.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Студенты */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Студенты ({group.students.length})</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {group.students.map((student) => (
                    <div key={student.id} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-green-600">
                          {student.user.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{student.user.name}</p>
                        <p className="text-xs text-gray-500">{student.user.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
