'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import CalendarComponent from '@/components/calendar/Calendar'
import EventModal from '@/components/calendar/EventModal'

export default function CalendarPage() {
  const { data: session, status } = useSession()
  const [showEventModal, setShowEventModal] = useState(false)
  const [editingEventId, setEditingEventId] = useState<string | undefined>()

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Доступ запрещен</h1>
          <p className="text-gray-600">Необходимо войти в систему</p>
        </div>
      </div>
    )
  }

  // Студенты могут видеть календарь, но не могут создавать события
  // Админы и учителя используют календарь через админ-панель
  if (session.user.role === 'ADMIN' || session.user.role === 'TEACHER') {
    window.location.href = '/'
    return null
  }

  const canCreateEvents = false // Студенты не могут создавать события

  const handleEventCreate = () => {
    setEditingEventId(undefined)
    setShowEventModal(true)
  }

  const handleEventEdit = (eventId: string) => {
    setEditingEventId(eventId)
    setShowEventModal(true)
  }

  const handleEventSubmit = async (eventData: {
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    groupId?: string;
  }) => {
    try {
      const url = editingEventId 
        ? `/api/events/${editingEventId}` 
        : '/api/events'
      
      const method = editingEventId ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      })

      if (response.ok) {
        setShowEventModal(false)
        setEditingEventId(undefined)
        // Календарь автоматически обновится через useEffect
      } else {
        const error = await response.json()
        alert(`Ошибка: ${error.error}`)
      }
    } catch (error) {
      console.error('Error saving event:', error)
      alert('Ошибка сохранения события')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Заголовок страницы */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Календарь событий
            </h1>
            <p className="mt-2 text-gray-600">
              Управление расписанием занятий, событий и дедлайнов
            </p>
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-xl">
          <CalendarComponent
            canCreateEvents={canCreateEvents}
            onEventCreate={handleEventCreate}
            onEventEdit={handleEventEdit}
          />
        </div>
      </div>

      {/* Модальное окно создания/редактирования события */}
      <EventModal
        isOpen={showEventModal}
        onClose={() => {
          setShowEventModal(false)
          setEditingEventId(undefined)
        }}
        onSubmit={handleEventSubmit}
        eventId={editingEventId}
      />
    </div>
  )
}
