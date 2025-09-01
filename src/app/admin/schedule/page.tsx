'use client'

import { useState, useEffect } from 'react'
import { 
  Calendar, 
  Users, 
  Clock, 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  CalendarDays,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Settings,
  BarChart3,
  Grid3X3,
  List,
  Download,
  Upload,
  RefreshCw,
  Eye,
  EyeOff,
  User,
  Building,
  CalendarRange,
  Clock4,
  Zap,
  Target,
  TrendingUp,
  AlertCircle,
  Info,
  MoreHorizontal,
  Copy,
  RotateCcw,
  Play,
  Pause,
  Stop
} from 'lucide-react'

interface Group {
  id: string
  name: string
  description?: string
  type: string
  teacher?: {
    id: string
    name: string
    email: string
  }
  students: {
    id: string
    user: {
      name: string
      email: string
    }
  }[]
}

interface Teacher {
  id: string
  name: string
  email: string
  groups: Group[]
}

interface ScheduleEntry {
  id: string
  groupId: string
  groupName: string
  teacherId: string
  teacherName: string
  dayOfWeek: number
  startTime: string
  endTime: string
  location?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface ScheduleConflict {
  type: 'teacher' | 'location' | 'time_overlap'
  message: string
  severity: 'warning' | 'error'
  entries: ScheduleEntry[]
}

export default function ScheduleDashboard() {
  const [groups, setGroups] = useState<Group[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all')
  const [selectedGroup, setSelectedGroup] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'grid'>('calendar')
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('week')
  const [showConflicts, setShowConflicts] = useState(true)
  const [showInactive, setShowInactive] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([])
  const [bulkMode, setBulkMode] = useState(false)
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchScheduleData()
  }, [])

  useEffect(() => {
    detectConflicts()
  }, [scheduleEntries])

  const fetchScheduleData = async () => {
    try {
      setLoading(true)
      
      // Получаем группы
      const groupsResponse = await fetch('/api/admin/groups')
      let groupsData = []
      if (groupsResponse.ok) {
        const groupsDataResponse = await groupsResponse.json()
        groupsData = Array.isArray(groupsDataResponse) ? groupsDataResponse : []
        setGroups(groupsData)
      } else {
        console.error('Ошибка загрузки групп:', groupsResponse.status)
        setGroups([])
      }

      // Получаем учителей
      const teachersResponse = await fetch('/api/admin/teachers')
      if (teachersResponse.ok) {
        const teachersData = await teachersResponse.json()
        setTeachers(Array.isArray(teachersData) ? teachersData : [])
      } else {
        console.error('Ошибка загрузки учителей:', teachersResponse.status)
        // Если нет учителей, создаем пустой массив
        setTeachers([])
      }

      // Получаем расписание всех групп
      if (groupsData.length > 0) {
        try {
          const schedulePromises = groupsData.map((group: Group) =>
            fetch(`/api/admin/groups/${group.id}/schedule`)
              .then(res => res.ok ? res.json() : null)
              .catch((error) => {
                console.error(`Ошибка загрузки расписания группы ${group.name}:`, error)
                return null
              })
          )
          
          const schedulesData = await Promise.all(schedulePromises)
          const allEntries: ScheduleEntry[] = []
          
          schedulesData.forEach((schedule, index) => {
            if (schedule && schedule.entries) {
              schedule.entries.forEach((entry: any) => {
                allEntries.push({
                  ...entry,
                  groupId: groupsData[index].id,
                  groupName: groupsData[index].name,
                  teacherId: groupsData[index].teacher?.id || '',
                  teacherName: groupsData[index].teacher?.name || 'Не назначен'
                })
              })
            }
          })
          
          setScheduleEntries(allEntries)
        } catch (error) {
          console.error('Ошибка загрузки расписания групп:', error)
          setScheduleEntries([])
        }
      } else {
        setScheduleEntries([])
      }
    } catch (error) {
      console.error('Ошибка загрузки данных расписания:', error)
    } finally {
      setLoading(false)
    }
  }

  const detectConflicts = () => {
    const newConflicts: ScheduleConflict[] = []
    
    // Проверяем конфликты учителей
    if (!Array.isArray(teachers)) return
    
    teachers.forEach(teacher => {
      const teacherEntries = scheduleEntries.filter(entry => 
        entry.teacherId === teacher.id && entry.isActive
      )
      
      // Проверяем пересечения времени для одного учителя
      for (let i = 0; i < teacherEntries.length; i++) {
        for (let j = i + 1; j < teacherEntries.length; j++) {
          const entry1 = teacherEntries[i]
          const entry2 = teacherEntries[j]
          
          if (entry1.dayOfWeek === entry2.dayOfWeek) {
            const start1 = new Date(`2000-01-01T${entry1.startTime}`)
            const end1 = new Date(`2000-01-01T${entry1.endTime}`)
            const start2 = new Date(`2000-01-01T${entry2.startTime}`)
            const end2 = new Date(`2000-01-01T${entry2.endTime}`)
            
            if (start1 < end2 && start2 < end1) {
              newConflicts.push({
                type: 'teacher',
                message: `Конфликт времени у учителя ${teacher.name}: ${entry1.groupName} и ${entry2.groupName}`,
                severity: 'error',
                entries: [entry1, entry2]
              })
            }
          }
        }
      }
    })
    
    // Проверяем конфликты локаций
    const locationEntries = scheduleEntries.filter(entry => entry.location && entry.isActive)
    for (let i = 0; i < locationEntries.length; i++) {
      for (let j = i + 1; j < locationEntries.length; j++) {
        const entry1 = locationEntries[i]
        const entry2 = locationEntries[j]
        
        if (entry1.location === entry2.location && entry1.dayOfWeek === entry2.dayOfWeek) {
          const start1 = new Date(`2000-01-01T${entry1.startTime}`)
          const end1 = new Date(`2000-01-01T${entry1.endTime}`)
          const start2 = new Date(`2000-01-01T${entry2.startTime}`)
          const end2 = new Date(`2000-01-01T${entry2.endTime}`)
          
          if (start1 < end2 && start2 < end1) {
            newConflicts.push({
              type: 'location',
              message: `Конфликт аудитории ${entry1.location}: ${entry1.groupName} и ${entry2.groupName}`,
              severity: 'error',
              entries: [entry1, entry2]
            })
          }
        }
      }
    }
    
    setConflicts(newConflicts)
  }

  const getDayName = (dayOfWeek: number) => {
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']
    return days[dayOfWeek]
  }

  const getShortDayName = (dayOfWeek: number) => {
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
    return days[dayOfWeek]
  }

  const formatTime = (time: string) => {
    return time.substring(0, 5)
  }

  const getTeacherWorkload = (teacherId: string) => {
    const teacherEntries = scheduleEntries.filter(entry => 
      entry.teacherId === teacherId && entry.isActive
    )
    
    const workloadByDay: { [key: number]: number } = {}
    teacherEntries.forEach(entry => {
      workloadByDay[entry.dayOfWeek] = (workloadByDay[entry.dayOfWeek] || 0) + 1
    })
    
    return {
      totalGroups: teacherEntries.length,
      workloadByDay,
      maxGroupsPerDay: Math.max(...Object.values(workloadByDay), 0)
    }
  }

  const filteredEntries = scheduleEntries.filter(entry => {
    const matchesTeacher = selectedTeacher === 'all' || entry.teacherId === selectedTeacher
    const matchesGroup = selectedGroup === 'all' || entry.groupId === selectedGroup
    const matchesSearch = entry.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (entry.location && entry.location.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesActive = showInactive || entry.isActive
    
    return matchesTeacher && matchesGroup && matchesSearch && matchesActive
  })

  const generateScheduleForPeriod = async (months: number) => {
    try {
      const response = await fetch('/api/admin/schedule/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          months,
          groups: groups.map(g => g.id)
        })
      })
      
      if (response.ok) {
        await fetchScheduleData()
        alert(`Расписание сгенерировано на ${months} месяцев вперед!`)
      }
    } catch (error) {
      console.error('Ошибка генерации расписания:', error)
      alert('Ошибка при генерации расписания')
    }
  }

  const bulkUpdateSchedule = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedEntries.size === 0) return
    
    try {
      const response = await fetch('/api/admin/schedule/bulk-update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          entryIds: Array.from(selectedEntries)
        })
      })
      
      if (response.ok) {
        await fetchScheduleData()
        setSelectedEntries(new Set())
        setBulkMode(false)
      }
    } catch (error) {
      console.error('Ошибка массового обновления:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка расписания...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white min-h-[calc(100vh-100px)]">
      {/* Хедер */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Calendar className="w-8 h-8" />
              Расписание групп
            </h2>
                         <p className="text-blue-100 mt-1 flex items-center gap-2">
               <span>{Array.isArray(groups) ? groups.length : 0} групп</span>
               <span className="text-blue-200">•</span>
               <span>{Array.isArray(teachers) ? teachers.length : 0} учителей</span>
               <span className="text-blue-200">•</span>
               <span>{scheduleEntries.filter(e => e.isActive).length} активных занятий</span>
             </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => generateScheduleForPeriod(3)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg flex items-center gap-2 transition-colors"
            >
              <CalendarRange className="w-4 h-4" />
              Генерировать на 3 месяца
            </button>
            <button
              onClick={() => generateScheduleForPeriod(4)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Target className="w-4 h-4" />
              Генерировать на 4 месяца
            </button>
          </div>
        </div>
      </div>

      {/* Статистика */}
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Всего групп</p>
                                 <p className="text-2xl font-bold text-gray-900 mt-1">{Array.isArray(groups) ? groups.length : 0}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Учителей</p>
                                 <p className="text-2xl font-bold text-gray-900 mt-1">{Array.isArray(teachers) ? teachers.length : 0}</p>
              </div>
              <User className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Активных занятий</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {scheduleEntries.filter(e => e.isActive).length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Конфликтов</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{conflicts.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Фильтры и управление */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Поиск по группе, учителю, аудитории..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
                         <select
               value={selectedTeacher}
               onChange={(e) => setSelectedTeacher(e.target.value)}
               className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
             >
               <option value="all">Все учителя</option>
               {Array.isArray(teachers) && teachers.map(teacher => (
                 <option key={teacher.id} value={teacher.id}>
                   {teacher.name} ({getTeacherWorkload(teacher.id).totalGroups} групп)
                 </option>
               ))}
             </select>

                         <select
               value={selectedGroup}
               onChange={(e) => setSelectedGroup(e.target.value)}
               className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
             >
               <option value="all">Все группы</option>
               {Array.isArray(groups) && groups.map(group => (
                 <option key={group.id} value={group.id}>{group.name}</option>
               ))}
             </select>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  viewMode === 'calendar' 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                <Calendar className="w-4 h-4" />
                Календарь
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
                Сетка
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                <List className="w-4 h-4" />
                Список
              </button>
            </div>

            <button
              onClick={fetchScheduleData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Обновить
            </button>
          </div>

          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showConflicts}
                onChange={(e) => setShowConflicts(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-600">Показывать конфликты</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-600">Показывать неактивные</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={bulkMode}
                onChange={(e) => setBulkMode(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-600">Режим массового редактирования</span>
            </label>
          </div>
        </div>
      </div>

      {/* Конфликты */}
      {showConflicts && conflicts.length > 0 && (
        <div className="bg-red-50 border-b border-red-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-red-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Обнаружены конфликты ({conflicts.length})
            </h3>
            <button
              onClick={() => setShowConflicts(false)}
              className="text-red-600 hover:text-red-800"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-2">
            {conflicts.map((conflict, index) => (
              <div key={index} className="bg-white rounded-lg p-3 border border-red-200">
                <p className="text-red-800 font-medium">{conflict.message}</p>
                <div className="flex gap-2 mt-2">
                  {conflict.entries.map(entry => (
                    <span key={entry.id} className="px-2 py-1 bg-red-100 text-red-700 text-sm rounded">
                      {entry.groupName} ({getShortDayName(entry.dayOfWeek)} {formatTime(entry.startTime)})
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Массовые действия */}
      {bulkMode && (
        <div className="bg-blue-50 border-b border-blue-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-blue-700">
                Выбрано: {selectedEntries.size} занятий
              </span>
              <button
                onClick={() => setSelectedEntries(new Set(filteredEntries.map(e => e.id)))}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Выбрать все
              </button>
              <button
                onClick={() => setSelectedEntries(new Set())}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Снять выбор
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => bulkUpdateSchedule('activate')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Активировать
              </button>
              <button
                onClick={() => bulkUpdateSchedule('deactivate')}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center gap-2"
              >
                <Pause className="w-4 h-4" />
                Деактивировать
              </button>
              <button
                onClick={() => bulkUpdateSchedule('delete')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Содержимое */}
      <div className="p-6">
        {viewMode === 'calendar' && (
          <div className="space-y-6">
            {[0, 1, 2, 3, 4, 5, 6].map(dayOfWeek => {
              const dayEntries = filteredEntries.filter(entry => entry.dayOfWeek === dayOfWeek)
              if (dayEntries.length === 0) return null
              
              return (
                <div key={dayOfWeek} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <CalendarDays className="w-5 h-5 text-blue-600" />
                      {getDayName(dayOfWeek)}
                      <span className="text-sm text-gray-500">({dayEntries.length} занятий)</span>
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {dayEntries.map(entry => {
                        const isSelected = selectedEntries.has(entry.id)
                        const hasConflict = conflicts.some(c => 
                          c.entries.some(e => e.id === entry.id)
                        )
                        
                        return (
                          <div 
                            key={entry.id} 
                            className={`border rounded-lg p-4 transition-all ${
                              isSelected 
                                ? 'border-blue-500 bg-blue-50' 
                                : hasConflict
                                ? 'border-red-300 bg-red-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {bulkMode && (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  const newSelected = new Set(selectedEntries)
                                  if (e.target.checked) {
                                    newSelected.add(entry.id)
                                  } else {
                                    newSelected.delete(entry.id)
                                  }
                                  setSelectedEntries(newSelected)
                                }}
                                className="float-right rounded border-gray-300"
                              />
                            )}
                            
                            <div className="space-y-3">
                              <div>
                                <h4 className="font-semibold text-gray-900">{entry.groupName}</h4>
                                <p className="text-sm text-gray-600">{entry.teacherName}</p>
                              </div>
                              
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Clock className="w-4 h-4" />
                                {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                              </div>
                              
                              {entry.location && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <MapPin className="w-4 h-4" />
                                  {entry.location}
                                </div>
                              )}
                              
                              <div className="flex items-center gap-2">
                                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  entry.isActive 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {entry.isActive ? 'Активно' : 'Неактивно'}
                                </div>
                                {hasConflict && (
                                  <div className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                                    Конфликт
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex gap-2">
                                <button className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center gap-1">
                                  <Edit className="w-3 h-3" />
                                  Изменить
                                </button>
                                <button className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center gap-1">
                                  <Trash2 className="w-3 h-3" />
                                  Удалить
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {viewMode === 'grid' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Сетка расписания</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-8 gap-4">
                {/* Заголовки */}
                <div className="font-semibold text-gray-700">Время</div>
                {[1, 2, 3, 4, 5, 6, 7].map(day => (
                  <div key={day} className="font-semibold text-gray-700 text-center">
                    {getShortDayName(day)}
                  </div>
                ))}
                
                {/* Временные слоты */}
                {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'].map(time => (
                  <>
                    <div key={`time-${time}`} className="text-sm text-gray-600 py-2">
                      {time}
                    </div>
                    {[1, 2, 3, 4, 5, 6, 7].map(day => {
                      const entries = filteredEntries.filter(entry => 
                        entry.dayOfWeek === day && 
                        entry.startTime <= time && 
                        entry.endTime > time
                      )
                      
                      return (
                        <div key={`${day}-${time}`} className="border border-gray-200 p-2 min-h-[60px]">
                          {entries.map(entry => (
                            <div 
                              key={entry.id} 
                              className="text-xs p-1 bg-blue-100 text-blue-800 rounded mb-1 cursor-pointer hover:bg-blue-200"
                            >
                              {entry.groupName}
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </>
                ))}
              </div>
            </div>
          </div>
        )}

        {viewMode === 'list' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Список всех занятий</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {bulkMode && (
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        <input
                          type="checkbox"
                          checked={selectedEntries.size === filteredEntries.length && filteredEntries.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEntries(new Set(filteredEntries.map(e => e.id)))
                            } else {
                              setSelectedEntries(new Set())
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                      </th>
                    )}
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Группа</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Учитель</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">День</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Время</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Аудитория</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Статус</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map(entry => {
                    const isSelected = selectedEntries.has(entry.id)
                    const hasConflict = conflicts.some(c => 
                      c.entries.some(e => e.id === entry.id)
                    )
                    
                    return (
                      <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                        {bulkMode && (
                          <td className="py-3 px-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const newSelected = new Set(selectedEntries)
                                if (e.target.checked) {
                                  newSelected.add(entry.id)
                                } else {
                                  newSelected.delete(entry.id)
                                }
                                setSelectedEntries(newSelected)
                              }}
                              className="rounded border-gray-300"
                            />
                          </td>
                        )}
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{entry.groupName}</p>
                            <p className="text-sm text-gray-500">{entry.groupId}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-gray-900">{entry.teacherName}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-gray-900">{getDayName(entry.dayOfWeek)}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-gray-900">{formatTime(entry.startTime)} - {formatTime(entry.endTime)}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-gray-900">{entry.location || '-'}</p>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                              entry.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {entry.isActive ? 'Активно' : 'Неактивно'}
                            </div>
                            {hasConflict && (
                              <div className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                                Конфликт
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center gap-1">
                              <Edit className="w-3 h-3" />
                              Изменить
                            </button>
                            <button className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center gap-1">
                              <Trash2 className="w-3 h-3" />
                              Удалить
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
