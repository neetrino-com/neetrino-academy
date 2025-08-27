'use client'

import { useState } from 'react'
import { 
  BookOpen, 
  Code, 
  ShoppingCart, 
  Plus,
  Check,
  Eye,
  X
} from 'lucide-react'

interface Template {
  id: string
  name: string
  description: string
  category: string
  structure: {
    modules: Array<{
      title: string
      lessons: Array<{
        title: string
        type: 'video' | 'text'
      }>
      assignments: Array<{
        title: string
      }>
    }>
  }
}

interface CourseTemplateSelectorProps {
  onSelectTemplate: (template: Template) => void
  onClose: () => void
}

const defaultTemplates: Template[] = [
  {
    id: 'wordpress-basic',
    name: 'WordPress для начинающих',
    description: 'Базовый курс по WordPress с нуля до создания первого сайта',
    category: 'WORDPRESS',
    structure: {
      modules: [
        {
          title: 'Введение в WordPress',
          lessons: [
            { title: 'Что такое WordPress', type: 'video' },
            { title: 'Установка WordPress', type: 'video' },
            { title: 'Первые настройки', type: 'text' }
          ],
          assignments: [
            { title: 'Установить WordPress локально' }
          ]
        },
        {
          title: 'Работа с контентом',
          lessons: [
            { title: 'Создание страниц', type: 'video' },
            { title: 'Создание записей', type: 'video' },
            { title: 'Медиафайлы', type: 'text' }
          ],
          assignments: [
            { title: 'Создать блог с 5 записями' }
          ]
        },
        {
          title: 'Дизайн и темы',
          lessons: [
            { title: 'Выбор и установка тем', type: 'video' },
            { title: 'Настройка темы', type: 'video' },
            { title: 'Кастомизация', type: 'text' }
          ],
          assignments: [
            { title: 'Настроить уникальный дизайн' }
          ]
        }
      ]
    }
  },
  {
    id: 'programming-basics',
    name: 'Основы программирования',
    description: 'Введение в программирование для полных новичков',
    category: 'VIBE_CODING',
    structure: {
      modules: [
        {
          title: 'Основы программирования',
          lessons: [
            { title: 'Что такое программирование', type: 'video' },
            { title: 'Переменные и типы данных', type: 'video' },
            { title: 'Условия и циклы', type: 'text' }
          ],
          assignments: [
            { title: 'Написать первую программу' }
          ]
        },
        {
          title: 'Функции и объекты',
          lessons: [
            { title: 'Создание функций', type: 'video' },
            { title: 'Работа с объектами', type: 'video' },
            { title: 'Массивы и методы', type: 'text' }
          ],
          assignments: [
            { title: 'Создать калькулятор' }
          ]
        }
      ]
    }
  },
  {
    id: 'shopify-store',
    name: 'Создание интернет-магазина',
    description: 'Полный курс по созданию магазина на Shopify',
    category: 'SHOPIFY',
    structure: {
      modules: [
        {
          title: 'Настройка магазина',
          lessons: [
            { title: 'Регистрация в Shopify', type: 'video' },
            { title: 'Базовые настройки', type: 'video' },
            { title: 'Настройка платежей', type: 'text' }
          ],
          assignments: [
            { title: 'Создать аккаунт и настроить магазин' }
          ]
        },
        {
          title: 'Товары и каталог',
          lessons: [
            { title: 'Добавление товаров', type: 'video' },
            { title: 'Категории и коллекции', type: 'video' },
            { title: 'Варианты товаров', type: 'text' }
          ],
          assignments: [
            { title: 'Добавить 10 товаров в каталог' }
          ]
        }
      ]
    }
  }
]

export default function CourseTemplateSelector({ onSelectTemplate, onClose }: CourseTemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'WORDPRESS':
        return <BookOpen className="w-5 h-5" />
      case 'VIBE_CODING':
        return <Code className="w-5 h-5" />
      case 'SHOPIFY':
        return <ShoppingCart className="w-5 h-5" />
      default:
        return <BookOpen className="w-5 h-5" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'WORDPRESS':
        return 'bg-indigo-100 text-indigo-700'
      case 'VIBE_CODING':
        return 'bg-violet-100 text-violet-700'
      case 'SHOPIFY':
        return 'bg-emerald-100 text-emerald-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const handleUseTemplate = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Хедер */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Выберите шаблон курса
            </h2>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Список шаблонов */}
          <div className="w-1/2 p-6 border-r border-slate-200 overflow-y-auto">
            <div className="space-y-4">
              {defaultTemplates.map((template) => (
                <div
                  key={template.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedTemplate?.id === template.id
                      ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                      : 'border-slate-200 hover:border-indigo-300'
                  }`}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${getCategoryColor(template.category)}`}>
                      {getCategoryIcon(template.category)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-800">{template.name}</h3>
                      <p className="text-sm text-slate-600 mt-1">{template.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs">
                        <span className="text-indigo-600 font-medium">{template.structure.modules.length} модулей</span>
                        <span className="text-emerald-600 font-medium">
                          {template.structure.modules.reduce((acc, m) => acc + m.lessons.length, 0)} уроков
                        </span>
                        <span className="text-violet-600 font-medium">
                          {template.structure.modules.reduce((acc, m) => acc + m.assignments.length, 0)} заданий
                        </span>
                      </div>
                    </div>
                    {selectedTemplate?.id === template.id && (
                      <Check className="w-5 h-5 text-indigo-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Предпросмотр */}
          <div className="w-1/2 p-6 overflow-y-auto">
            {selectedTemplate ? (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${getCategoryColor(selectedTemplate.category)}`}>
                    {getCategoryIcon(selectedTemplate.category)}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">{selectedTemplate.name}</h3>
                    <p className="text-slate-600">{selectedTemplate.description}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {selectedTemplate.structure.modules.map((module, moduleIndex) => (
                    <div key={moduleIndex} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-all duration-200">
                      <h4 className="font-semibold mb-3 text-slate-800">
                        Модуль {moduleIndex + 1}: {module.title}
                      </h4>
                      
                      {/* Уроки */}
                      <div className="space-y-2 mb-3">
                        <h5 className="text-sm font-semibold text-slate-700">Уроки:</h5>
                        {module.lessons.map((lesson, lessonIndex) => (
                          <div key={lessonIndex} className="flex items-center gap-2 text-sm">
                            <span className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-xs text-indigo-700 font-medium">
                              {lessonIndex + 1}
                            </span>
                            <span className="text-slate-700">{lesson.title}</span>
                            <span className="text-xs text-amber-600 font-medium">
                              {lesson.type === 'video' ? '📹' : '📝'}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Задания */}
                      {module.assignments.length > 0 && (
                        <div className="space-y-2">
                          <h5 className="text-sm font-semibold text-slate-700">Задания:</h5>
                          {module.assignments.map((assignment, assignmentIndex) => (
                            <div key={assignmentIndex} className="flex items-center gap-2 text-sm">
                              <span className="w-4 h-4 bg-emerald-100 rounded-full flex items-center justify-center text-xs text-emerald-700 font-bold">
                                ✓
                              </span>
                              <span className="text-slate-700">{assignment.title}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200">
                  <button
                    onClick={handleUseTemplate}
                    className="w-full px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 flex items-center justify-center gap-2 font-medium transition-all duration-200 hover:scale-105 shadow-lg"
                  >
                    <Plus className="w-4 h-4" />
                    Использовать этот шаблон
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-500 py-12">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-600 font-medium">Выберите шаблон для предпросмотра</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
