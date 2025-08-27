'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import SimpleSubmissionForm from '@/components/assignments/SimpleSubmissionForm'

interface Assignment {
  id: string
  title: string
  description?: string | null
  dueDate?: string | null
  module: {
    id: string
    title: string
    course: {
      id: string
      title: string
    }
  }
  creator: {
    id: string
    name: string
    email: string
  }
  submissions: Array<{
    id: string
    content?: string | null
    fileUrl?: string | null
    score?: number | null
    feedback?: string | null
    submittedAt: string
    user: {
      id: string
      name: string
      email: string
    }
  }>
  _count: {
    submissions: number
  }
}

export default function AssignmentPage() {
  const params = useParams()
  const router = useRouter()
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userRole, setUserRole] = useState<string>('')

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/assignments/${params.id}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Ошибка загрузки задания')
        }

        setAssignment(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки задания')
      } finally {
        setLoading(false)
      }
    }

    const fetchUserInfo = async () => {
      try {
        const response = await fetch('/api/auth/me')
        const data = await response.json()
        if (response.ok && data.role) {
          setUserRole(data.role)
        }
      } catch (err) {
        console.error('Ошибка получения информации о пользователе:', err)
      }
    }

    if (params.id) {
      fetchAssignment()
      fetchUserInfo()
    }
  }, [params.id])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Загрузка задания...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        </div>
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Задание не найдено</h2>
            <button
              onClick={() => router.push('/assignments')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Вернуться к списку заданий
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Заголовок */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/assignments')}
            className="text-blue-600 hover:text-blue-700 mb-4 flex items-center"
          >
            ← Вернуться к списку заданий
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {assignment.title}
          </h1>
          
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <span>Курс: {assignment.module.course.title}</span>
            <span>Модуль: {assignment.module.title}</span>
            <span>Автор: {assignment.creator.name}</span>
            {assignment.dueDate && (
              <span className={`${isOverdue(assignment.dueDate) ? 'text-red-600' : ''}`}>
                Дедлайн: {formatDate(assignment.dueDate)}
                {isOverdue(assignment.dueDate) && ' (просрочено)'}
              </span>
            )}
          </div>
        </div>

        {/* Описание задания */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Описание задания</h2>
          <div className="prose max-w-none">
            {assignment.description ? (
              <div className="whitespace-pre-wrap text-gray-700">
                {assignment.description}
              </div>
            ) : (
              <p className="text-gray-500">Описание не предоставлено</p>
            )}
          </div>
        </div>



        {/* Форма отправки решения (только для студентов) */}
        {userRole === 'STUDENT' && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Отправить решение</h2>
            <SimpleSubmissionForm 
              assignmentId={assignment.id} 
              onSuccess={() => {
                // Обновляем страницу после успешной отправки
                window.location.reload();
              }}
            />
          </div>
        )}

        {/* Если пользователь не студент, показываем сообщение */}
        {userRole && userRole !== 'STUDENT' && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-8">
            <p className="text-sm text-blue-800">
              Форма отправки решения доступна только для студентов. Ваша роль: {userRole}
            </p>
          </div>
        )}

        {/* Список сданных работ (только для преподавателей) */}
        {userRole === 'TEACHER' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Сданные работы ({assignment._count.submissions})
            </h2>
            
            {assignment.submissions.length > 0 ? (
              <div className="space-y-4">
                {assignment.submissions.map((submission) => (
                  <div key={submission.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {submission.user.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {submission.user.email}
                        </p>
                        <p className="text-sm text-gray-500">
                          Сдано: {formatDate(submission.submittedAt)}
                        </p>
                      </div>
                      {submission.score !== null && (
                        <div className="text-right">
                          <span className="text-lg font-semibold text-blue-600">
                            {submission.score}%
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {submission.content && (
                      <div className="mb-3">
                        <h4 className="font-medium text-gray-900 mb-2">Решение:</h4>
                        <div className="bg-gray-50 p-3 rounded-md">
                          <div className="whitespace-pre-wrap text-gray-700">
                            {submission.content}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {submission.fileUrl && (
                      <div className="mb-3">
                        <h4 className="font-medium text-gray-900 mb-2">Прикрепленный файл:</h4>
                        <a
                          href={submission.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 underline"
                        >
                          Скачать файл
                        </a>
                      </div>
                    )}
                    
                    {submission.feedback && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Комментарий преподавателя:</h4>
                        <div className="bg-blue-50 p-3 rounded-md">
                          <div className="whitespace-pre-wrap text-gray-700">
                            {submission.feedback}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Пока нет сданных работ</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
