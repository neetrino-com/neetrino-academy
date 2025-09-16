'use client'

import { useState, useEffect } from 'react'
import { 
  X, 
  Search, 
  FileText, 
  Copy, 
  Loader2,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface AssignmentTemplate {
  id: string
  title: string
  description: string | null
  type: string
  maxScore: number | null
  createdAt: string
  creator: {
    id: string
    name: string
    email: string
  }
  _count: {
    submissions: number
    groupAssignments: number
  }
}

interface TemplateSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onTemplateSelected: (template: AssignmentTemplate) => void
}

const assignmentTypes = [
  { value: 'ALL', label: 'Все типы' },
  { value: 'HOMEWORK', label: 'Домашнее задание' },
  { value: 'PROJECT', label: 'Проект' },
  { value: 'EXAM', label: 'Экзамен' },
  { value: 'QUIZ', label: 'Тест' },
  { value: 'PRACTICAL', label: 'Практическая работа' },
  { value: 'ESSAY', label: 'Эссе' },
  { value: 'OTHER', label: 'Другое' }
]

const ITEMS_PER_PAGE = 10

export default function TemplateSelectionModal({
  isOpen,
  onClose,
  onTemplateSelected
}: TemplateSelectionModalProps) {
  const [templates, setTemplates] = useState<AssignmentTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(selectedType !== 'ALL' && { type: selectedType })
      })
      
      const response = await fetch(`/api/assignments/templates?${params}`)
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
        setTotalPages(Math.ceil((data.total || 0) / ITEMS_PER_PAGE))
      }
    } catch (error) {
      console.error('Ошибка загрузки шаблонов:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchTemplates()
    }
  }, [isOpen, searchTerm, selectedType, currentPage])

  const handleTemplateSelect = (template: AssignmentTemplate) => {
    onTemplateSelected(template)
    onClose()
  }

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'HOMEWORK': 'Домашнее задание',
      'PROJECT': 'Проект',
      'EXAM': 'Экзамен',
      'QUIZ': 'Тест',
      'PRACTICAL': 'Практическая работа',
      'ESSAY': 'Эссе',
      'OTHER': 'Другое'
    }
    return types[type] || type
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'HOMEWORK': 'bg-blue-100 text-blue-800',
      'PROJECT': 'bg-purple-100 text-purple-800',
      'EXAM': 'bg-red-100 text-red-800',
      'QUIZ': 'bg-green-100 text-green-800',
      'PRACTICAL': 'bg-yellow-100 text-yellow-800',
      'ESSAY': 'bg-indigo-100 text-indigo-800',
      'OTHER': 'bg-gray-100 text-gray-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[60] p-2">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl h-[96vh] overflow-hidden flex flex-col">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <FileText className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Выбор шаблона задания</h2>
              <p className="text-sm text-gray-600">Выберите шаблон для создания задания</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-100 rounded-lg transition-colors border border-gray-300 hover:border-red-300"
          >
            <X className="w-5 h-5 text-gray-600 hover:text-red-600" />
          </button>
        </div>

        {/* Поиск и фильтры */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Поиск */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Поиск по названию или ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Фильтр по типу */}
            <div className="lg:w-64">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none"
                >
                  {assignmentTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Список шаблонов */}
        <div className="p-6 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-600" />
                <p className="text-gray-600">Загрузка шаблонов...</p>
              </div>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">Шаблоны не найдены</h3>
              <p className="text-gray-500">Попробуйте изменить поисковый запрос или фильтры</p>
            </div>
          ) : (
            <div className="space-y-4">
              {templates.map((template) => (
                <div key={template.id} className="border border-gray-200 rounded-xl p-4 hover:border-orange-300 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {template.title}
                        </h3>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${getTypeColor(template.type)}`}>
                          {getTypeLabel(template.type)}
                        </span>
                      </div>
                      
                      {template.description && (
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {template.description}
                        </p>
                      )}

                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                            ID: {template.id}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>Автор: {template.creator.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>Создан: {new Date(template.createdAt).toLocaleDateString('ru-RU')}</span>
                        </div>
                        {template.maxScore && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{template.maxScore} баллов</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleTemplateSelect(template)}
                      className="ml-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Выбрать
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Пагинация */}
        {totalPages > 1 && (
          <div className="p-6 border-t border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Страница {currentPage} из {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 text-sm rounded-lg ${
                      page === currentPage
                        ? 'bg-orange-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
