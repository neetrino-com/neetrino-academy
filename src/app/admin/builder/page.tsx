'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Plus, 
  GripVertical, 
  Trash2, 
  Edit2,
  Save,
  Eye,
  Copy,
  FileText,
  Video,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Loader2,
  Move,
  BookOpen,
  X
} from 'lucide-react'
import CourseTemplateSelector from '@/components/admin/CourseTemplateSelector'

// Типы для конструктора
interface BuilderModule {
  id: string
  title: string
  description?: string
  order: number
  lessons: BuilderLesson[]
  assignments: BuilderAssignment[]
  isExpanded: boolean
}

interface BuilderLesson {
  id: string
  title: string
  type: 'video' | 'text' | 'mixed'
  content?: string
  videoUrl?: string
  duration?: number
  order: number
  hasQuiz: boolean
}

interface BuilderAssignment {
  id: string
  title: string
  description?: string
  dueDate?: string
}

interface CourseData {
  title: string
  description: string
  direction: 'WORDPRESS' | 'VIBE_CODING' | 'SHOPIFY'
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  duration: number
  price: number
}

export default function CourseBuilder() {
  const router = useRouter()
  const [courseData, setCourseData] = useState<CourseData>({
    title: '',
    description: '',
    direction: 'WORDPRESS',
    level: 'BEGINNER',
    duration: 4,
    price: 0
  })
  
  const [modules, setModules] = useState<BuilderModule[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'structure' | 'content' | 'settings'>('overview')
  const [saving, setSaving] = useState(false)
  const [draggedItem, setDraggedItem] = useState<{type: 'module' | 'lesson' | 'assignment', moduleId?: string, item: any} | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [showFileModal, setShowFileModal] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Добавить новый модуль
  const addModule = () => {
    const newModule: BuilderModule = {
      id: `module-${Date.now()}`,
      title: `Модуль ${modules.length + 1}`,
      description: '',
      order: modules.length,
      lessons: [],
      assignments: [],
      isExpanded: true
    }
    setModules([...modules, newModule])
  }

  // Добавить урок в модуль
  const addLesson = (moduleId: string) => {
    setModules(modules.map(module => {
      if (module.id === moduleId) {
        const newLesson: BuilderLesson = {
          id: `lesson-${Date.now()}`,
          title: `Урок ${module.lessons.length + 1}`,
          type: 'video',
          order: module.lessons.length,
          hasQuiz: false
        }
        return {
          ...module,
          lessons: [...module.lessons, newLesson]
        }
      }
      return module
    }))
  }

  // Добавить задание в модуль
  const addAssignment = (moduleId: string) => {
    setModules(modules.map(module => {
      if (module.id === moduleId) {
        const newAssignment: BuilderAssignment = {
          id: `assignment-${Date.now()}`,
          title: `Задание ${module.assignments.length + 1}`,
          description: ''
        }
        return {
          ...module,
          assignments: [...module.assignments, newAssignment]
        }
      }
      return module
    }))
  }

  // Удалить модуль
  const deleteModule = (moduleId: string) => {
    setModules(modules.filter(m => m.id !== moduleId))
  }

  // Удалить урок
  const deleteLesson = (moduleId: string, lessonId: string) => {
    setModules(modules.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          lessons: m.lessons.filter(l => l.id !== lessonId)
        }
      }
      return m
    }))
  }

  // Удалить задание
  const deleteAssignment = (moduleId: string, assignmentId: string) => {
    setModules(modules.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          assignments: m.assignments.filter(a => a.id !== assignmentId)
        }
      }
      return m
    }))
  }

  // Переключить развернутость модуля
  const toggleModule = (moduleId: string) => {
    setModules(modules.map(m => 
      m.id === moduleId ? {...m, isExpanded: !m.isExpanded} : m
    ))
  }

  // Улучшенные Drag & Drop функции
  const handleDragStart = (e: React.DragEvent, type: 'module' | 'lesson' | 'assignment', item: any, moduleId?: string) => {
    setDraggedItem({ type, item, moduleId })
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', JSON.stringify({ type, item, moduleId }))
  }

  const handleDragOver = (e: React.DragEvent, index?: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (index !== undefined) {
      setDragOverIndex(index)
    }
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, targetIndex?: number, targetModuleId?: string, targetType?: 'lesson' | 'assignment') => {
    e.preventDefault()
    setDragOverIndex(null)
    
    if (!draggedItem) return

    if (draggedItem.type === 'module') {
      // Перемещение модулей
      const newModules = [...modules]
      const draggedIndex = modules.findIndex(m => m.id === draggedItem.item.id)
      const targetIdx = targetIndex ?? modules.length
      
      if (draggedIndex !== -1 && draggedIndex !== targetIdx) {
        const [draggedModule] = newModules.splice(draggedIndex, 1)
        newModules.splice(targetIdx, 0, draggedModule)
        
        // Обновляем порядок
        setModules(newModules.map((m, i) => ({...m, order: i})))
      }
    } else if (draggedItem.type === 'lesson' && targetModuleId) {
      // Перемещение уроков внутри модуля
      setModules(modules.map(module => {
        if (module.id === targetModuleId) {
          const newLessons = [...module.lessons]
          const draggedIndex = newLessons.findIndex(l => l.id === draggedItem.item.id)
          const targetIdx = targetIndex ?? newLessons.length
          
          if (draggedIndex !== -1 && draggedIndex !== targetIdx) {
            const [draggedLesson] = newLessons.splice(draggedIndex, 1)
            newLessons.splice(targetIdx, 0, draggedLesson)
            
            // Обновляем порядок
            return {
              ...module,
              lessons: newLessons.map((l, i) => ({...l, order: i}))
            }
          }
        }
        return module
      }))
    } else if (draggedItem.type === 'assignment' && targetModuleId) {
      // Перемещение заданий внутри модуля
      setModules(modules.map(module => {
        if (module.id === targetModuleId) {
          const newAssignments = [...module.assignments]
          const draggedIndex = newAssignments.findIndex(a => a.id === draggedItem.item.id)
          const targetIdx = targetIndex ?? newAssignments.length
          
          if (draggedIndex !== -1 && draggedIndex !== targetIdx) {
            const [draggedAssignment] = newAssignments.splice(draggedIndex, 1)
            newAssignments.splice(targetIdx, 0, draggedAssignment)
            
            return {
              ...module,
              assignments: newAssignments
            }
          }
        }
        return module
      }))
    }
    
    setDraggedItem(null)
  }

  // Применить шаблон
  const applyTemplate = (template: any) => {
    setCourseData({
      ...courseData,
      title: template.name,
      description: template.description,
      direction: template.category as any
    })
    
    const newModules = template.structure.modules.map((module: any, index: number) => ({
      id: `module-${Date.now()}-${index}`,
      title: module.title,
      description: '',
      order: index,
      lessons: module.lessons.map((lesson: any, lessonIndex: number) => ({
        id: `lesson-${Date.now()}-${index}-${lessonIndex}`,
        title: lesson.title,
        type: lesson.type,
        order: lessonIndex,
        hasQuiz: false
      })),
      assignments: module.assignments.map((assignment: any, assignmentIndex: number) => ({
        id: `assignment-${Date.now()}-${index}-${assignmentIndex}`,
        title: assignment.title,
        description: ''
      })),
      isExpanded: true
    }))
    
    setModules(newModules)
    setShowTemplates(false)
  }

  // Сохранить курс
  const saveCourse = async () => {
    if (!courseData.title.trim()) {
      alert('Введите название курса')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/admin/builder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseData,
          modules: modules.map((m, i) => ({...m, order: i}))
        })
      })

      if (response.ok) {
        const result = await response.json()
        router.push('/admin')
      } else {
        throw new Error('Ошибка сохранения')
      }
    } catch (error) {
      console.error('Ошибка сохранения:', error)
      alert('Ошибка при сохранении курса')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Хедер */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
                         <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Конструктор курса</h1>
            <div className="flex gap-3">
                                                           <button 
                  onClick={() => setShowPreview(true)}
                  className="px-4 py-2 border border-indigo-300 rounded-lg hover:bg-indigo-50 text-indigo-600 font-medium transition-all duration-200 hover:scale-105"
                >
                  <Eye className="w-4 h-4 inline mr-2" />
                  Просмотр
                </button>
                             <button 
                 onClick={saveCourse}
                 disabled={saving}
                 className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 font-medium transition-all duration-200 hover:scale-105 shadow-lg"
               >
                {saving ? (
                  <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 inline mr-2" />
                )}
                Сохранить
              </button>
            </div>
          </div>

          {/* Табы */}
          <div className="flex gap-6 mt-4">
            {(['overview', 'structure', 'content', 'settings'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                                 className={`pb-2 px-1 border-b-2 transition-all duration-200 ${
                   activeTab === tab 
                     ? 'border-indigo-600 text-indigo-600 font-semibold' 
                     : 'border-transparent text-slate-600 hover:text-indigo-600 hover:border-indigo-300'
                 }`}
              >
                {tab === 'overview' && 'Обзор'}
                {tab === 'structure' && 'Структура'}
                {tab === 'content' && 'Контент'}
                {tab === 'settings' && 'Настройки'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Контент */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Таб: Обзор */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6">
                             <h2 className="text-xl font-bold mb-4 text-slate-800">Основная информация</h2>
              <div className="space-y-4">
                <div>
                                     <label className="block text-sm font-semibold mb-1 text-slate-700">Название курса</label>
                                     <input
                     type="text"
                     value={courseData.title}
                     onChange={(e) => setCourseData({...courseData, title: e.target.value})}
                     className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                     placeholder="WordPress для начинающих"
                   />
                </div>
                <div>
                                     <label className="block text-sm font-semibold mb-1 text-slate-700">Описание</label>
                  <textarea
                    value={courseData.description}
                    onChange={(e) => setCourseData({...courseData, description: e.target.value})}
                                         className="w-full px-3 py-2 border border-slate-300 rounded-lg h-24 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    placeholder="Краткое описание курса..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                                         <label className="block text-sm font-semibold mb-1 text-slate-700">Направление</label>
                                          <select 
                        value={courseData.direction}
                        onChange={(e) => setCourseData({...courseData, direction: e.target.value as any})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                      >
                      <option value="WORDPRESS">WordPress</option>
                      <option value="VIBE_CODING">Программирование</option>
                      <option value="SHOPIFY">Shopify</option>
                    </select>
                  </div>
                  <div>
                                         <label className="block text-sm font-semibold mb-1 text-slate-700">Уровень</label>
                                           <select
                         value={courseData.level}
                         onChange={(e) => setCourseData({...courseData, level: e.target.value as any})}
                         className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                       >
                      <option value="BEGINNER">Начальный</option>
                      <option value="INTERMEDIATE">Средний</option>
                      <option value="ADVANCED">Продвинутый</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                                         <label className="block text-sm font-semibold mb-1 text-slate-700">Длительность (недель)</label>
                                           <input
                         type="number"
                         value={courseData.duration}
                         onChange={(e) => setCourseData({...courseData, duration: parseInt(e.target.value) || 4})}
                         className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                         min="1"
                         max="52"
                       />
                  </div>
                  <div>
                                         <label className="block text-sm font-semibold mb-1 text-slate-700">Цена</label>
                                           <input
                         type="number"
                         value={courseData.price}
                         onChange={(e) => setCourseData({...courseData, price: parseInt(e.target.value) || 0})}
                         className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                         min="0"
                       />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6">
                             <h2 className="text-xl font-bold mb-4 text-slate-800">Статистика</h2>
              <div className="space-y-3">
                                 <div className="flex justify-between">
                   <span className="text-indigo-600 font-semibold">Модулей:</span>
                   <span className="font-medium">{modules.length}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-emerald-600 font-semibold">Уроков:</span>
                   <span className="font-medium">
                     {modules.reduce((acc, m) => acc + m.lessons.length, 0)}
                   </span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-violet-600 font-semibold">Заданий:</span>
                   <span className="font-medium">
                     {modules.reduce((acc, m) => acc + m.assignments.length, 0)}
                   </span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-amber-600 font-semibold">Длительность:</span>
                   <span className="font-medium">{courseData.duration} недель</span>
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* Таб: Структура */}
        {activeTab === 'structure' && (
          <div className="bg-white rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
                             <h2 className="text-xl font-bold text-slate-800">Структура курса</h2>
              <div className="flex gap-2">
                                                  <button
                   onClick={() => setShowTemplates(true)}
                   className="px-4 py-2 border border-violet-300 rounded-lg hover:bg-violet-50 text-violet-600 font-medium flex items-center gap-2 transition-all duration-200 hover:scale-105"
                 >
                   <BookOpen className="w-4 h-4" />
                   Шаблоны
                 </button>
                                 <button
                   onClick={addModule}
                   className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 flex items-center gap-2 font-medium transition-all duration-200 hover:scale-105 shadow-lg"
                 >
                   <Plus className="w-4 h-4" />
                   Добавить модуль
                 </button>
              </div>
            </div>

            <div className="space-y-2">
              {modules.map((module, moduleIndex) => (
                <div key={module.id}>
                  {/* Drop zone перед модулем */}
                  {dragOverIndex === moduleIndex && (
                    <div className="h-2 bg-indigo-200 rounded my-2 border-2 border-dashed border-indigo-400" />
                  )}
                  
                  <div
                    className={`border rounded-lg transition-all ${
                      draggedItem?.item?.id === module.id ? 'opacity-50' : ''
                    }`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'module', module)}
                    onDragOver={(e) => handleDragOver(e, moduleIndex)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, moduleIndex)}
                  >
                                         <div className="p-4 bg-indigo-50 flex items-center gap-3">
                       <GripVertical className="w-5 h-5 text-indigo-400 cursor-move" />
                       <button
                         onClick={() => toggleModule(module.id)}
                         className="text-indigo-600 hover:text-indigo-900"
                       >
                        {module.isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                      </button>
                      <input
                        type="text"
                        value={module.title}
                        onChange={(e) => setModules(modules.map(m => 
                          m.id === module.id ? {...m, title: e.target.value} : m
                        ))}
                        className="flex-1 px-2 py-1 bg-transparent font-medium"
                        placeholder="Название модуля"
                      />
                                             <span className="text-sm text-indigo-600 font-medium">
                         {module.lessons.length} уроков, {module.assignments.length} заданий
                       </span>
                      <button
                        onClick={() => deleteModule(module.id)}
                        className="text-red-600 hover:text-red-700 p-1"
                        title="Удалить модуль"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {module.isExpanded && (
                      <div className="p-4 space-y-3">
                        {/* Уроки */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-slate-700 mb-2">Уроки:</h4>
                          {module.lessons.map((lesson, lessonIndex) => (
                            <div key={lesson.id}>
                              {/* Drop zone перед уроком */}
                              {dragOverIndex === lessonIndex && draggedItem?.type === 'lesson' && draggedItem?.moduleId === module.id && (
                                <div className="h-1 bg-emerald-200 rounded my-1 border border-dashed border-emerald-400" />
                              )}
                              
                              <div 
                                className={`flex items-center gap-3 p-2 bg-indigo-50 rounded transition-all ${
                                  draggedItem?.item?.id === lesson.id ? 'opacity-50' : ''
                                }`}
                                draggable
                                onDragStart={(e) => handleDragStart(e, 'lesson', lesson, module.id)}
                                onDragOver={(e) => handleDragOver(e, lessonIndex)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, lessonIndex, module.id, 'lesson')}
                              >
                                <GripVertical className="w-4 h-4 text-indigo-400 cursor-move" />
                                {lesson.type === 'video' && <Video className="w-4 h-4 text-indigo-600" />}
                                {lesson.type === 'text' && <FileText className="w-4 h-4 text-emerald-600" />}
                                <input
                                  type="text"
                                  value={lesson.title}
                                  onChange={(e) => setModules(modules.map(m => {
                                    if (m.id === module.id) {
                                      return {
                                        ...m,
                                        lessons: m.lessons.map(l => 
                                          l.id === lesson.id ? {...l, title: e.target.value} : l
                                        )
                                      }
                                    }
                                    return m
                                  }))}
                                  className="flex-1 px-2 py-1 bg-white border rounded"
                                  placeholder="Название урока"
                                />
                                {lesson.hasQuiz && <CheckSquare className="w-4 h-4 text-purple-600" />}
                                                                 <button
                                   onClick={() => deleteLesson(module.id, lesson.id)}
                                   className="text-red-600 hover:text-red-700 p-1"
                                   title="Удалить урок"
                                 >
                                   <Trash2 className="w-3 h-3" />
                                 </button>
                              </div>
                            </div>
                          ))}
                          
                          {/* Drop zone в конце уроков */}
                          {dragOverIndex === module.lessons.length && draggedItem?.type === 'lesson' && draggedItem?.moduleId === module.id && (
                            <div className="h-1 bg-emerald-200 rounded my-1 border border-dashed border-emerald-400" />
                          )}
                        </div>

                        {/* Задания */}
                        {module.assignments.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-slate-700 mb-2">Задания:</h4>
                            {module.assignments.map((assignment, assignmentIndex) => (
                              <div key={assignment.id}>
                                {/* Drop zone перед заданием */}
                                {dragOverIndex === assignmentIndex && draggedItem?.type === 'assignment' && draggedItem?.moduleId === module.id && (
                                  <div className="h-1 bg-violet-200 rounded my-1 border border-dashed border-violet-400" />
                                )}
                                
                                <div 
                                  className={`flex items-center gap-3 p-2 bg-emerald-50 rounded transition-all ${
                                    draggedItem?.item?.id === assignment.id ? 'opacity-50' : ''
                                  }`}
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, 'assignment', assignment, module.id)}
                                  onDragOver={(e) => handleDragOver(e, assignmentIndex)}
                                  onDragLeave={handleDragLeave}
                                  onDrop={(e) => handleDrop(e, assignmentIndex, module.id, 'assignment')}
                                >
                                  <GripVertical className="w-4 h-4 text-emerald-400 cursor-move" />
                                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                                  <input
                                    type="text"
                                    value={assignment.title}
                                    onChange={(e) => setModules(modules.map(m => {
                                      if (m.id === module.id) {
                                        return {
                                          ...m,
                                          assignments: m.assignments.map(a => 
                                            a.id === assignment.id ? {...a, title: e.target.value} : a
                                          )
                                        }
                                      }
                                      return m
                                    }))}
                                    className="flex-1 px-2 py-1 bg-white border rounded"
                                    placeholder="Название задания"
                                  />
                                  <button
                                    onClick={() => deleteAssignment(module.id, assignment.id)}
                                    className="text-red-600 hover:text-red-700 p-1"
                                    title="Удалить задание"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                            
                            {/* Drop zone в конце заданий */}
                            {dragOverIndex === module.assignments.length && draggedItem?.type === 'assignment' && draggedItem?.moduleId === module.id && (
                              <div className="h-1 bg-violet-200 rounded my-1 border border-dashed border-violet-400" />
                            )}
                          </div>
                        )}

                        {/* Кнопки добавления */}
                        <div className="flex gap-2 pt-2 border-t border-slate-200">
                          <button
                            onClick={() => addLesson(module.id)}
                            className="px-3 py-1.5 text-sm border border-indigo-300 rounded hover:bg-indigo-50 text-indigo-600 flex items-center gap-1 transition-all duration-200 hover:scale-105"
                          >
                            <Plus className="w-3 h-3" />
                            Урок
                          </button>
                          <button
                            onClick={() => addAssignment(module.id)}
                            className="px-3 py-1.5 text-sm border border-emerald-300 rounded hover:bg-emerald-50 text-emerald-600 flex items-center gap-1 transition-all duration-200 hover:scale-105"
                          >
                            <Plus className="w-3 h-3" />
                            Задание
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Drop zone в конце */}
              {dragOverIndex === modules.length && (
                <div className="h-2 bg-indigo-200 rounded my-2 border-2 border-dashed border-indigo-400" />
              )}

                             {modules.length === 0 && (
                 <div className="text-center py-12 text-indigo-500">
                   <p className="mb-4 font-medium">Пока нет модулей</p>
                   <button
                     onClick={addModule}
                     className="px-4 py-2 border-2 border-dashed border-indigo-300 rounded-lg hover:border-indigo-400 text-indigo-600 transition-all duration-200 hover:scale-105"
                   >
                    <Plus className="w-4 h-4 inline mr-2" />
                    Создать первый модуль
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

                 {/* Таб: Контент */}
         {activeTab === 'content' && (
           <div className="bg-white rounded-lg p-6">
             <div className="flex justify-between items-center mb-6">
               <h2 className="text-xl font-bold text-slate-800">Редактирование контента</h2>
               <div className="flex gap-2">
                 <button 
                   onClick={() => setShowVideoModal(true)}
                   className="px-4 py-2 border border-indigo-300 rounded-lg hover:bg-indigo-50 text-indigo-600 font-medium transition-all duration-200"
                 >
                   <Plus className="w-4 h-4 inline mr-2" />
                   Добавить видео
                 </button>
                 <button 
                   onClick={() => setShowFileModal(true)}
                   className="px-4 py-2 border border-emerald-300 rounded-lg hover:bg-emerald-50 text-emerald-600 font-medium transition-all duration-200"
                 >
                   <Plus className="w-4 h-4 inline mr-2" />
                   Добавить файл
                 </button>
               </div>
             </div>

             {modules.length === 0 ? (
               <div className="text-center py-12 text-indigo-500">
                 <p className="mb-4 font-medium">Сначала создайте модули и уроки в разделе "Структура"</p>
                 <button
                   onClick={() => setActiveTab('structure')}
                   className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200"
                 >
                   Перейти к структуре
                 </button>
               </div>
             ) : (
               <div className="space-y-6">
                 {modules.map((module) => (
                   <div key={module.id} className="border border-slate-200 rounded-lg p-4">
                     <h3 className="text-lg font-semibold text-slate-800 mb-4">{module.title}</h3>
                     
                     {module.lessons.length === 0 ? (
                       <p className="text-slate-500 text-center py-4">В этом модуле пока нет уроков</p>
                     ) : (
                       <div className="space-y-4">
                         {module.lessons.map((lesson) => (
                           <div key={lesson.id} className="border border-slate-200 rounded-lg p-4">
                             <div className="flex items-center justify-between mb-3">
                               <h4 className="font-medium text-slate-800">{lesson.title}</h4>
                               <div className="flex gap-2">
                                 <span className={`px-2 py-1 rounded text-xs font-medium ${
                                   lesson.type === 'video' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                                 }`}>
                                   {lesson.type === 'video' ? 'Видео' : 'Текст'}
                                 </span>
                                 {lesson.hasQuiz && (
                                   <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700">
                                     Тест
                                   </span>
                                 )}
                               </div>
                             </div>
                             
                             <div className="space-y-3">
                               {/* Тип контента */}
                               <div>
                                 <label className="block text-sm font-medium text-slate-700 mb-1">Тип контента</label>
                                 <select
                                   value={lesson.type}
                                   onChange={(e) => setModules(modules.map(m => {
                                     if (m.id === module.id) {
                                       return {
                                         ...m,
                                         lessons: m.lessons.map(l => 
                                           l.id === lesson.id ? {...l, type: e.target.value as any} : l
                                         )
                                       }
                                     }
                                     return m
                                   }))}
                                   className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                 >
                                   <option value="video">Видео</option>
                                   <option value="text">Текст</option>
                                   <option value="mixed">Смешанный</option>
                                 </select>
                               </div>

                               {/* URL видео */}
                               {lesson.type === 'video' && (
                                 <div>
                                   <label className="block text-sm font-medium text-slate-700 mb-1">URL видео</label>
                                   <input
                                     type="url"
                                     value={lesson.videoUrl || ''}
                                     onChange={(e) => setModules(modules.map(m => {
                                       if (m.id === module.id) {
                                         return {
                                           ...m,
                                           lessons: m.lessons.map(l => 
                                             l.id === lesson.id ? {...l, videoUrl: e.target.value} : l
                                           )
                                         }
                                       }
                                       return m
                                     }))}
                                     placeholder="https://www.youtube.com/watch?v=..."
                                     className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                   />
                                 </div>
                               )}

                               {/* Длительность */}
                               <div>
                                 <label className="block text-sm font-medium text-slate-700 mb-1">Длительность (минуты)</label>
                                 <input
                                   type="number"
                                   value={lesson.duration || ''}
                                   onChange={(e) => setModules(modules.map(m => {
                                     if (m.id === module.id) {
                                       return {
                                         ...m,
                                         lessons: m.lessons.map(l => 
                                           l.id === lesson.id ? {...l, duration: parseInt(e.target.value) || 0} : l
                                         )
                                       }
                                     }
                                     return m
                                   }))}
                                   placeholder="15"
                                   className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                 />
                               </div>

                               {/* Текстовый контент */}
                               <div>
                                 <label className="block text-sm font-medium text-slate-700 mb-1">Описание урока</label>
                                 <textarea
                                   value={lesson.content || ''}
                                   onChange={(e) => setModules(modules.map(m => {
                                     if (m.id === module.id) {
                                       return {
                                         ...m,
                                         lessons: m.lessons.map(l => 
                                           l.id === lesson.id ? {...l, content: e.target.value} : l
                                         )
                                       }
                                     }
                                     return m
                                   }))}
                                   placeholder="Описание урока, основные моменты, что студент узнает..."
                                   rows={4}
                                   className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                 />
                               </div>

                               {/* Тест */}
                               <div className="flex items-center gap-2">
                                 <input
                                   type="checkbox"
                                   id={`quiz-${lesson.id}`}
                                   checked={lesson.hasQuiz}
                                   onChange={(e) => setModules(modules.map(m => {
                                     if (m.id === module.id) {
                                       return {
                                         ...m,
                                         lessons: m.lessons.map(l => 
                                           l.id === lesson.id ? {...l, hasQuiz: e.target.checked} : l
                                         )
                                       }
                                     }
                                     return m
                                   }))}
                                   className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                                 />
                                 <label htmlFor={`quiz-${lesson.id}`} className="text-sm font-medium text-slate-700">
                                   Добавить тест к уроку
                                 </label>
                               </div>
                             </div>
                           </div>
                         ))}
                       </div>
                     )}
                   </div>
                 ))}
               </div>
             )}
           </div>
         )}

         {/* Таб: Настройки */}
         {activeTab === 'settings' && (
           <div className="bg-white rounded-lg p-6">
             <h2 className="text-xl font-bold text-slate-800 mb-6">Настройки курса</h2>
             
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               {/* Основные настройки */}
               <div className="space-y-6">
                 <div className="border border-slate-200 rounded-lg p-4">
                   <h3 className="text-lg font-semibold text-slate-800 mb-4">Основные настройки</h3>
                   
                   <div className="space-y-4">
                     {/* Статус курса */}
                     <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Статус курса</label>
                       <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                         <option value="draft">Черновик</option>
                         <option value="published">Опубликован</option>
                         <option value="archived">Архив</option>
                       </select>
                     </div>

                     {/* Видимость */}
                     <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Видимость</label>
                       <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                         <option value="public">Публичный</option>
                         <option value="private">Приватный</option>
                         <option value="unlisted">Не в списке</option>
                       </select>
                     </div>

                     {/* Язык */}
                     <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Язык курса</label>
                       <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                         <option value="ru">Русский</option>
                         <option value="en">English</option>
                         <option value="kz">Қазақша</option>
                       </select>
                     </div>

                     {/* Сертификат */}
                     <div className="flex items-center gap-2">
                       <input
                         type="checkbox"
                         id="certificate"
                         className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                       />
                       <label htmlFor="certificate" className="text-sm font-medium text-slate-700">
                         Выдавать сертификат по завершении
                       </label>
                     </div>
                   </div>
                 </div>

                 {/* Настройки обучения */}
                 <div className="border border-slate-200 rounded-lg p-4">
                   <h3 className="text-lg font-semibold text-slate-800 mb-4">Настройки обучения</h3>
                   
                   <div className="space-y-4">
                     {/* Прогресс */}
                     <div className="flex items-center gap-2">
                       <input
                         type="checkbox"
                         id="progress"
                         className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                       />
                       <label htmlFor="progress" className="text-sm font-medium text-slate-700">
                         Отслеживать прогресс студентов
                       </label>
                     </div>

                     {/* Повторное прохождение */}
                     <div className="flex items-center gap-2">
                       <input
                         type="checkbox"
                         id="retake"
                         className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                       />
                       <label htmlFor="retake" className="text-sm font-medium text-slate-700">
                         Разрешить повторное прохождение
                       </label>
                     </div>

                     {/* Обсуждения */}
                     <div className="flex items-center gap-2">
                       <input
                         type="checkbox"
                         id="discussions"
                         className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                       />
                       <label htmlFor="discussions" className="text-sm font-medium text-slate-700">
                         Включить обсуждения
                       </label>
                     </div>
                   </div>
                 </div>
               </div>

               {/* Дополнительные настройки */}
               <div className="space-y-6">
                 {/* SEO настройки */}
                 <div className="border border-slate-200 rounded-lg p-4">
                   <h3 className="text-lg font-semibold text-slate-800 mb-4">SEO настройки</h3>
                   
                   <div className="space-y-4">
                     <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Meta Title</label>
                       <input
                         type="text"
                         placeholder="Название для поисковых систем"
                         className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                       />
                     </div>

                     <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Meta Description</label>
                       <textarea
                         placeholder="Краткое описание для поисковых систем"
                         rows={3}
                         className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                       />
                     </div>

                     <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Ключевые слова</label>
                       <input
                         type="text"
                         placeholder="wordpress, обучение, сайты"
                         className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                       />
                     </div>
                   </div>
                 </div>

                 {/* Уведомления */}
                 <div className="border border-slate-200 rounded-lg p-4">
                   <h3 className="text-lg font-semibold text-slate-800 mb-4">Уведомления</h3>
                   
                   <div className="space-y-4">
                     <div className="flex items-center gap-2">
                       <input
                         type="checkbox"
                         id="email-notifications"
                         className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                       />
                       <label htmlFor="email-notifications" className="text-sm font-medium text-slate-700">
                         Email уведомления о новых студентах
                       </label>
                     </div>

                     <div className="flex items-center gap-2">
                       <input
                         type="checkbox"
                         id="completion-notifications"
                         className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                       />
                       <label htmlFor="completion-notifications" className="text-sm font-medium text-slate-700">
                         Уведомления о завершении курса
                       </label>
                     </div>
                   </div>
                 </div>

                 {/* Опасная зона */}
                 <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                   <h3 className="text-lg font-semibold text-red-800 mb-4">Опасная зона</h3>
                   
                   <div className="space-y-4">
                     <button className="w-full px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-100 transition-all duration-200">
                       Дублировать курс
                     </button>
                     <button className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200">
                       Удалить курс
                     </button>
                   </div>
                 </div>
               </div>
             </div>
           </div>
         )}

        {/* Модальное окно шаблонов */}
        {showTemplates && (
          <CourseTemplateSelector
            onSelectTemplate={applyTemplate}
            onClose={() => setShowTemplates(false)}
          />
        )}

        {/* Модальное окно добавления видео */}
        {showVideoModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Добавить видео</h3>
                <button
                  onClick={() => setShowVideoModal(false)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">URL видео</label>
                  <input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Название</label>
                  <input
                    type="text"
                    placeholder="Название видео"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Описание</label>
                  <textarea
                    placeholder="Краткое описание видео"
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowVideoModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Отмена
                </button>
                <button className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  Добавить
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Модальное окно добавления файла */}
        {showFileModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Добавить файл</h3>
                <button
                  onClick={() => setShowFileModal(false)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Выберите файл</label>
                  <input
                    type="file"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Название</label>
                  <input
                    type="text"
                    placeholder="Название файла"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Описание</label>
                  <textarea
                    placeholder="Описание файла"
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowFileModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Отмена
                </button>
                <button className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                  Загрузить
                </button>
              </div>
            </div>
                     </div>
         )}

        {/* Модальное окно предварительного просмотра */}
        {showPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-slate-800">Предварительный просмотр курса</h3>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                {/* Заголовок курса */}
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-slate-800 mb-2">{courseData.title || 'Название курса'}</h1>
                  <p className="text-slate-600 mb-4">{courseData.description || 'Описание курса'}</p>
                  <div className="flex gap-4 text-sm text-slate-500">
                    <span>Направление: {courseData.direction}</span>
                    <span>Уровень: {courseData.level}</span>
                    <span>Длительность: {courseData.duration} недель</span>
                    <span>Цена: {courseData.price} ₸</span>
                  </div>
                </div>

                {/* Структура курса */}
                <div className="space-y-6">
                  {modules.map((module, moduleIndex) => (
                    <div key={module.id} className="border border-slate-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-slate-800 mb-3">
                        Модуль {moduleIndex + 1}: {module.title}
                      </h3>
                      
                      {module.description && (
                        <p className="text-slate-600 mb-4">{module.description}</p>
                      )}

                      {/* Уроки */}
                      {module.lessons.length > 0 && (
                        <div className="space-y-2 mb-4">
                          <h4 className="font-medium text-slate-700">Уроки:</h4>
                          {module.lessons.map((lesson, lessonIndex) => (
                            <div key={lesson.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded">
                              <span className="text-sm text-slate-500">Урок {lessonIndex + 1}</span>
                              <span className="font-medium">{lesson.title}</span>
                              <span className={`px-2 py-1 rounded text-xs ${
                                lesson.type === 'video' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                              }`}>
                                {lesson.type === 'video' ? 'Видео' : 'Текст'}
                              </span>
                              {lesson.duration && (
                                <span className="text-xs text-slate-500">{lesson.duration} мин</span>
                              )}
                              {lesson.hasQuiz && (
                                <span className="px-2 py-1 rounded text-xs bg-purple-100 text-purple-700">Тест</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Задания */}
                      {module.assignments.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-slate-700">Задания:</h4>
                          {module.assignments.map((assignment, assignmentIndex) => (
                            <div key={assignment.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded">
                              <span className="text-sm text-slate-500">Задание {assignmentIndex + 1}</span>
                              <span className="font-medium">{assignment.title}</span>
                              {assignment.dueDate && (
                                <span className="text-xs text-slate-500">Срок: {assignment.dueDate}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {modules.length === 0 && (
                  <div className="text-center py-12 text-slate-500">
                    <p>Курс пока не содержит модулей</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
       </div>
     </div>
   )
 }
