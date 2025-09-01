'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react'

type ScheduleItem = {
  id?: string
  dayOfWeek: number
  startTime: string
  endTime: string
  isActive?: boolean
}

interface GroupScheduleManagerProps {
  groupId: string
  onClose: () => void
}

const DAY_LABELS: Record<number, string> = {
  0: 'Воскресенье',
  1: 'Понедельник',
  2: 'Вторник',
  3: 'Среда',
  4: 'Четверг',
  5: 'Пятница',
  6: 'Суббота'
}

export default function GroupScheduleManager({ groupId, onClose }: GroupScheduleManagerProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])
  const [genStartDate, setGenStartDate] = useState<string>('')
  const [genEndDate, setGenEndDate] = useState<string>('')
  const [genTitle, setGenTitle] = useState<string>('Занятие группы')
  const [genLocation, setGenLocation] = useState<string>('')
  const [genAttendanceRequired, setGenAttendanceRequired] = useState<boolean>(true)

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true)
        console.log('[Schedule][Fetch] Fetching schedule for group', groupId)
        const res = await fetch(`/api/admin/groups/${groupId}/schedule`)
        if (!res.ok) {
          console.error('[Schedule][Fetch] Failed with status', res.status)
          return
        }
        const data = await res.json()
        setGroupName(data.group?.name || '')
        setSchedule(
          (data.schedule || []).map((s: any) => ({
            id: s.id,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            isActive: s.isActive !== false
          }))
        )
      } catch (e) {
        console.error('[Schedule][Fetch] Error', e)
      } finally {
        setLoading(false)
      }
    }
    fetchSchedule()
  }, [groupId])

  const groupedByDay = useMemo(() => {
    const map: Record<number, ScheduleItem[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }
    schedule.forEach(item => {
      map[item.dayOfWeek] = [...(map[item.dayOfWeek] || []), item]
    })
    Object.keys(map).forEach(k => {
      map[Number(k)].sort((a, b) => a.startTime.localeCompare(b.startTime))
    })
    return map
  }, [schedule])

  const addItem = (dayOfWeek: number) => {
    setSchedule(prev => ([...prev, { dayOfWeek, startTime: '10:00', endTime: '11:30', isActive: true }]))
  }

  const updateItem = (index: number, patch: Partial<ScheduleItem>) => {
    setSchedule(prev => prev.map((it, i) => i === index ? { ...it, ...patch } : it))
  }

  const removeItem = (index: number) => {
    setSchedule(prev => prev.filter((_, i) => i !== index))
  }

  const saveSchedule = async () => {
    try {
      setSaving(true)
      console.log('[Schedule][Save] Saving schedule for group', groupId, schedule)
      const res = await fetch(`/api/admin/groups/${groupId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule })
      })
      if (!res.ok) {
        alert('Ошибка сохранения расписания')
        return
      }
    } catch (e) {
      console.error('[Schedule][Save] Error', e)
      alert('Ошибка сохранения расписания')
    } finally {
      setSaving(false)
    }
  }

  const generateEvents = async () => {
    if (!genStartDate || !genEndDate) {
      alert('Укажите период генерации (начало и конец)')
      return
    }
    try {
      setGenerating(true)
      console.log('[Schedule][Generate] Generating events', { genStartDate, genEndDate, genAttendanceRequired })
      const res = await fetch(`/api/admin/groups/${groupId}/schedule/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: genStartDate,
          endDate: genEndDate,
          title: genTitle,
          location: genLocation || null,
          isAttendanceRequired: genAttendanceRequired
        })
      })
      if (!res.ok) {
        const t = await res.text()
        console.error('[Schedule][Generate] Failed', t)
        alert('Ошибка генерации событий')
        return
      }
      const data = await res.json()
      alert(`Сгенерировано событий: ${data.created}`)
    } catch (e) {
      console.error('[Schedule][Generate] Error', e)
      alert('Ошибка генерации событий')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Загрузка расписания...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Calendar className="w-6 h-6" /> Менеджер расписания
              </h2>
              <p className="text-blue-100 mt-1">Группа: {groupName}</p>
            </div>
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
            >
              Закрыть
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x">
          {/* Schedule editor */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Редактор расписания</h3>
              <button
                onClick={saveSchedule}
                disabled={saving}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Save className={`w-4 h-4 ${saving ? 'animate-pulse' : ''}`} /> Сохранить
              </button>
            </div>

            <div className="space-y-6">
              {Object.keys(DAY_LABELS).map(k => {
                const day = Number(k)
                const items = groupedByDay[day] || []
                return (
                  <div key={day} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-medium text-gray-900">{DAY_LABELS[day]}</div>
                      <button
                        onClick={() => addItem(day)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" /> Добавить
                      </button>
                    </div>
                    {items.length === 0 ? (
                      <p className="text-sm text-gray-500">Нет слотов</p>
                    ) : (
                      <div className="space-y-3">
                        {items.map((it, idxInDay) => {
                          // Глобальный индекс элемента в общем массиве schedule
                          const globalIndex = schedule.findIndex(
                            s => s === it
                          )
                          return (
                            <div key={`${day}-${idxInDay}`} className="flex items-center gap-3">
                              <div className="flex items-center gap-2 text-gray-700">
                                <Clock className="w-4 h-4" />
                                <input
                                  type="time"
                                  value={it.startTime}
                                  onChange={e => updateItem(globalIndex, { startTime: e.target.value })}
                                  className="border rounded-lg px-2 py-1"
                                />
                                <span className="text-sm">—</span>
                                <input
                                  type="time"
                                  value={it.endTime}
                                  onChange={e => updateItem(globalIndex, { endTime: e.target.value })}
                                  className="border rounded-lg px-2 py-1"
                                />
                              </div>
                              <button
                                onClick={() => removeItem(globalIndex)}
                                className="ml-auto px-3 py-1 text-sm text-red-700 bg-red-100 hover:bg-red-200 rounded-lg flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" /> Удалить
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Generation panel */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Генерация событий по расписанию</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Период начала</label>
                <input
                  type="date"
                  value={genStartDate}
                  onChange={e => setGenStartDate(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Период окончания</label>
                <input
                  type="date"
                  value={genEndDate}
                  onChange={e => setGenEndDate(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Заголовок событий</label>
                  <input
                    type="text"
                    value={genTitle}
                    onChange={e => setGenTitle(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Занятие группы"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Локация (необязательно)</label>
                  <input
                    type="text"
                    value={genLocation}
                    onChange={e => setGenLocation(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Каб. 101 или Zoom"
                  />
                </div>
              </div>

              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={genAttendanceRequired}
                  onChange={e => setGenAttendanceRequired(e.target.checked)}
                />
                <span className="text-sm text-gray-700">Отмечать посещаемость обязательно</span>
              </label>

              <div className="flex items-center gap-3">
                <button
                  onClick={generateEvents}
                  disabled={generating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} /> Сгенерировать события
                </button>
                <div className="text-xs text-gray-500">
                  События будут созданы в календаре и видны студентам
                </div>
              </div>

              <div className="mt-4 text-xs text-gray-500 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Следите, чтобы временные слоты не пересекались.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


