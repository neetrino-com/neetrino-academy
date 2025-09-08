'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Trash2, 
  Save, 
  X,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  BarChart3,
  GripVertical,
  FileText,
  Video,
  Link,
  Code,
  CheckSquare,
  Copy,
  Play,
  Clock,
  BookOpen,
  Lightbulb,
  File,
  Image
} from 'lucide-react';
import MultiFileUpload from '@/components/ui/MultiFileUpload';

interface UploadedFile {
  id: string;
  url: string;
  name: string;
  size: number;
  type: string;
  publicId?: string;
}

interface LessonBlock {
  id: string;
  type: 'text' | 'video' | 'link' | 'code' | 'checklist' | 'file';
  content: string;
  metadata?: {
    url?: string;
    alt?: string;
    filename?: string;
    language?: string;
    description?: string;
    files?: UploadedFile[];
  };
}

interface LessonFormData {
  title: string;
  description: string;
  thumbnail: string;
  duration: number;
  isActive: boolean;
  blocks: LessonBlock[];
}

interface LessonBuilderFormProps {
  mode: 'create' | 'edit';
  moduleId: string;
  initialData?: LessonFormData;
  lessonId?: string;
  onSuccess?: () => void;
}

export default function LessonBuilderForm({ 
  mode, 
  moduleId, 
  initialData, 
  lessonId, 
  onSuccess 
}: LessonBuilderFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showBlockSelector, setShowBlockSelector] = useState(false);

  const [formData, setFormData] = useState<LessonFormData>({
    title: '',
    description: '',
    thumbnail: '',
    duration: 0,
    isActive: true,
    blocks: []
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const blockTypes = [
    { 
      type: 'text', 
      icon: FileText, 
      title: 'Текст', 
      description: 'Добавить текстовый блок с форматированием',
      color: 'text-blue-600 bg-blue-50 border-blue-200'
    },
    { 
      type: 'file', 
      icon: File, 
      title: 'Файлы', 
      description: 'Загрузить файлы и изображения',
      color: 'text-green-600 bg-green-50 border-green-200'
    },
    { 
      type: 'video', 
      icon: Video, 
      title: 'Видео', 
      description: 'Встроить видео из YouTube, Vimeo и др.',
      color: 'text-red-600 bg-red-50 border-red-200'
    },
    { 
      type: 'code', 
      icon: Code, 
      title: 'Код', 
      description: 'Блок кода с подсветкой синтаксиса',
      color: 'text-purple-600 bg-purple-50 border-purple-200'
    },
    { 
      type: 'link', 
      icon: Link, 
      title: 'Ссылка', 
      description: 'Добавить внешнюю ссылку или ресурс',
      color: 'text-yellow-600 bg-yellow-50 border-yellow-200'
    },
    { 
      type: 'checklist', 
      icon: CheckSquare, 
      title: 'Чеклист', 
      description: 'Создать список задач для студентов',
      color: 'text-amber-600 bg-amber-50 border-amber-200'
    }
  ] as const;

  const addBlock = (type: LessonBlock['type']) => {
    const newBlock: LessonBlock = {
      id: `block-${Date.now()}`,
      type,
      content: '',
      metadata: {}
    };
    setFormData(prev => ({
      ...prev,
      blocks: [...prev.blocks, newBlock]
    }));
    setShowBlockSelector(false);
  };

  const duplicateBlock = (blockId: string) => {
    const block = formData.blocks.find(b => b.id === blockId);
    if (!block) return;

    const newBlock: LessonBlock = {
      ...block,
      id: `block-${Date.now()}`,
      content: block.content
    };
    
    const blockIndex = formData.blocks.findIndex(b => b.id === blockId);
    const newBlocks = [...formData.blocks];
    newBlocks.splice(blockIndex + 1, 0, newBlock);
    
    setFormData(prev => ({ ...prev, blocks: newBlocks }));
  };

  const removeBlock = (blockId: string) => {
    setFormData(prev => ({
      ...prev,
      blocks: prev.blocks.filter(b => b.id !== blockId)
    }));
  };

  const updateBlock = (blockId: string, updates: Partial<LessonBlock>) => {
    setFormData(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => 
        b.id === blockId ? { ...b, ...updates } : b
      )
    }));
  };

  const moveBlock = (blockId: string, direction: 'up' | 'down') => {
    setFormData(prev => {
      const blocks = [...prev.blocks];
      const index = blocks.findIndex(b => b.id === blockId);
      
      if (direction === 'up' && index > 0) {
        [blocks[index], blocks[index - 1]] = [blocks[index - 1], blocks[index]];
      } else if (direction === 'down' && index < blocks.length - 1) {
        [blocks[index], blocks[index + 1]] = [blocks[index + 1], blocks[index]];
      }
      
      return { ...prev, blocks };
    });
  };

  const getBlockTypeInfo = (type: LessonBlock['type']) => {
    return blockTypes.find(bt => bt.type === type);
  };

  const renderBlockEditor = (block: LessonBlock) => {
    switch (block.type) {
      case 'text':
        return (
          <textarea
            value={block.content}
            onChange={(e) => updateBlock(block.id, { content: e.target.value })}
            placeholder="Введите текст урока. Поддерживается HTML-разметка..."
            className="w-full h-32 p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        );

      case 'file':
        return (
          <div className="space-y-3">
            <MultiFileUpload
              onFilesUpload={(files) => updateBlock(block.id, { 
                metadata: { ...block.metadata, files: files }
              })}
              onError={(error) => console.error('Ошибка загрузки файлов:', error)}
              acceptedTypes=".pdf,.doc,.docx,.zip,.rar,.jpg,.jpeg,.png,.gif,.webp,.mp4,.mov,.avi"
              maxSize={10}
              maxFiles={20}
              initialFiles={block.metadata?.files || []}
            />
            <textarea
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              placeholder="Описание файлов (необязательно)"
              className="w-full h-20 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            />
          </div>
        );

      case 'video':
        return (
          <div className="space-y-3">
            <input
              type="url"
              value={block.metadata?.url || ''}
              onChange={(e) => updateBlock(block.id, { 
                metadata: { ...block.metadata, url: e.target.value }
              })}
              placeholder="URL видео (YouTube, Vimeo, и др.)"
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <textarea
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              placeholder="Описание видео"
              className="w-full h-20 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />
          </div>
        );

      case 'code':
        return (
          <div className="space-y-3">
            <input
              type="text"
              value={block.metadata?.language || ''}
              onChange={(e) => updateBlock(block.id, { 
                metadata: { ...block.metadata, language: e.target.value }
              })}
              placeholder="Язык программирования (javascript, python, html...)"
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <textarea
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              placeholder="Код..."
              className="w-full h-40 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-mono text-sm"
            />
          </div>
        );

      case 'link':
        return (
          <div className="space-y-3">
            <input
              type="url"
              value={block.metadata?.url || ''}
              onChange={(e) => updateBlock(block.id, { 
                metadata: { ...block.metadata, url: e.target.value }
              })}
              placeholder="URL ссылки"
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
            <input
              type="text"
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              placeholder="Текст ссылки"
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
            <textarea
              value={block.metadata?.description || ''}
              onChange={(e) => updateBlock(block.id, { 
                metadata: { ...block.metadata, description: e.target.value }
              })}
              placeholder="Описание ссылки"
              className="w-full h-20 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
            />
          </div>
        );

      case 'checklist':
        return (
          <div className="space-y-3">
            <input
              type="text"
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              placeholder="Название чеклиста"
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent font-semibold"
            />
            <textarea
              value={block.metadata?.description || ''}
              onChange={(e) => updateBlock(block.id, { 
                metadata: { ...block.metadata, description: e.target.value }
              })}
              placeholder="Список задач (каждая с новой строки)"
              className="w-full h-32 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
            />
          </div>
        );

      default:
        return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Введите название урока');
      return;
    }

    if (formData.blocks.length === 0) {
      alert('Добавьте хотя бы один блок контента');
      return;
    }

    setLoading(true);

    try {
      const url = mode === 'create' 
        ? `/api/admin/modules/${moduleId}/lessons`
        : `/api/admin/lessons/${lessonId}`;
      
      const method = mode === 'create' ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          content: JSON.stringify(formData.blocks),
          thumbnail: formData.thumbnail.trim() || null,
          duration: formData.duration || null,
          isActive: formData.isActive
        })
      });

      if (response.ok) {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push(`/admin/modules/${moduleId}`);
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Произошла ошибка при сохранении');
      }
    } catch (error) {
      console.error('Error saving lesson:', error);
      alert('Ошибка при сохранении урока');
    } finally {
      setLoading(false);
    }
  };

  const getTotalEstimatedTime = () => {
    return formData.blocks.reduce((total, block) => {
      switch (block.type) {
        case 'text': return total + Math.ceil(block.content.length / 200); // ~200 символов в минуту
        case 'video': return total + 5; // Примерно 5 минут на видео
        case 'code': return total + 3; // 3 минуты на изучение кода
        case 'checklist': return total + 2; // 2 минуты на чеклист
        default: return total + 1; // 1 минута на остальные блоки
      }
    }, 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Современный хедер */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.back()}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {mode === 'create' ? 'Создание урока' : 'Редактирование урока'}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Создайте интерактивный урок с различными типами контента
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Совет: Смешивайте разные типы блоков для лучшего обучения
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Левая панель - Статистика и настройки */}
          <div className="xl:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Статистика */}
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Статистика урока
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Всего блоков:</span>
                    <span className="font-semibold text-blue-600">{formData.blocks.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Время изучения:</span>
                    <span className="font-semibold text-blue-600 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      ~{getTotalEstimatedTime()} мин
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Статус:</span>
                    <span className={`font-semibold ${formData.isActive ? 'text-green-600' : 'text-gray-600'}`}>
                      {formData.isActive ? 'Активен' : 'Неактивен'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Основные настройки */}
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  Настройки
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Длительность (мин)
                    </label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        duration: parseInt(e.target.value) || 0 
                      }))}
                      className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Авто"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Обложка (URL)
                    </label>
                    <input
                      type="url"
                      value={formData.thumbnail}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        thumbnail: e.target.value 
                      }))}
                      className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://..."
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">Активность</h4>
                      <p className="text-xs text-gray-600">
                        {formData.isActive ? 'Урок доступен студентам' : 'Урок скрыт'}
                      </p>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ 
                        ...prev, 
                        isActive: !prev.isActive 
                      }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        formData.isActive ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.isActive ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Кнопка сохранения */}
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 p-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <Save size={20} />
                  )}
                  {mode === 'create' ? 'Создать урок' : 'Сохранить изменения'}
                </button>
              </div>
            </div>
          </div>

          {/* Правая панель - Контент урока */}
          <div className="xl:col-span-3">
            {/* Основная информация урока */}
            <div className="space-y-6 mb-6">
              <div className="border-2 border-dashed border-blue-300 rounded-2xl p-6 hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-300">
                <div className="space-y-4">
                  <div>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        title: e.target.value 
                      }))}
                      className="w-full px-4 py-3 text-2xl font-bold border-0 border-b-2 border-blue-300 focus:border-blue-500 focus:outline-none bg-transparent placeholder-blue-400/70"
                      placeholder="Название урока"
                      required
                    />
                  </div>
                  
                  <div>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        description: e.target.value 
                      }))}
                      rows={2}
                      className="w-full px-4 py-2 text-gray-600 border-0 focus:outline-none bg-transparent placeholder-blue-300/60 resize-none"
                      placeholder="Краткое описание урока"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Панель инструментов */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {showPreview ? 'Скрыть превью' : 'Превью'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowBlockSelector(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-4 h-4" />
                  Добавить блок
                </button>
              </div>
            </div>

            {/* Селектор типа блока */}
            {showBlockSelector && (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Выберите тип блока:</h3>
                  <button
                    type="button"
                    onClick={() => setShowBlockSelector(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {blockTypes.map((blockType) => {
                    const IconComponent = blockType.icon;
                    return (
                      <button
                        key={blockType.type}
                        type="button"
                        onClick={() => addBlock(blockType.type)}
                        className={`p-4 border-2 rounded-xl transition-all duration-200 hover:shadow-lg ${blockType.color} hover:scale-105`}
                      >
                        <div className="flex flex-col items-center text-center space-y-2">
                          <IconComponent size={24} />
                          <h4 className="font-semibold">{blockType.title}</h4>
                          <p className="text-xs opacity-80">{blockType.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Блоки контента */}
            {formData.blocks.length === 0 ? (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  Начните создавать урок
                </h3>
                <p className="text-gray-500 mb-6">
                  Добавьте блоки контента для создания интерактивного урока
                </p>
                <button
                  type="button"
                  onClick={() => setShowBlockSelector(true)}
                  className="px-6 py-3 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <Plus className="w-5 h-5 inline mr-2" />
                  Добавить первый блок
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {formData.blocks.map((block, index) => {
                  const blockInfo = getBlockTypeInfo(block.type);
                  if (!blockInfo) return null;

                  const IconComponent = blockInfo.icon;

                  return (
                    <div 
                      key={block.id} 
                      className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 transition-all duration-200 hover:shadow-lg"
                    >
                      {/* Заголовок блока */}
                      <div className="p-4 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <GripVertical className="text-gray-400 cursor-move" size={20} />
                            <div className={`p-2 rounded-lg ${blockInfo.color}`}>
                              <IconComponent size={16} />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{blockInfo.title}</h4>
                              <p className="text-sm text-gray-600">Блок #{index + 1}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => duplicateBlock(block.id)}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Дублировать блок"
                            >
                              <Copy size={16} />
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => moveBlock(block.id, 'up')}
                              disabled={index === 0}
                              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Переместить вверх"
                            >
                              <ArrowUp size={16} />
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => moveBlock(block.id, 'down')}
                              disabled={index === formData.blocks.length - 1}
                              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Переместить вниз"
                            >
                              <ArrowDown size={16} />
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => removeBlock(block.id)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                              title="Удалить блок"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Содержимое блока */}
                      <div className="p-4">
                        {renderBlockEditor(block)}
                      </div>
                    </div>
                  );
                })}

                {/* Кнопка добавления блока в конце */}
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => setShowBlockSelector(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-blue-300 rounded-2xl text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    <Plus size={24} />
                    <span className="text-lg font-medium">Добавить новый блок</span>
                  </button>
                </div>
              </div>
            )}

            {/* Превью урока */}
            {showPreview && formData.blocks.length > 0 && (
              <div className="mt-6 bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Play className="w-5 h-5 text-blue-600" />
                  Превью урока
                </h3>
                
                <div className="bg-white rounded-lg border p-6">
                  <div className="mb-6">
                    <h4 className="text-2xl font-bold text-gray-900 mb-2">
                      {formData.title || 'Название урока'}
                    </h4>
                    {formData.description && (
                      <p className="text-gray-600 mb-4">{formData.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        ~{getTotalEstimatedTime()} мин
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        {formData.blocks.length} блоков
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    {formData.blocks.map((block, index) => {
                      const blockInfo = getBlockTypeInfo(block.type);
                      if (!blockInfo) return null;

                      return (
                        <div key={block.id} className="border-l-4 border-blue-500 pl-4">
                          <div className="flex items-center gap-2 mb-2">
                            <blockInfo.icon size={16} className="text-blue-600" />
                            <span className="text-sm font-medium text-gray-700">
                              {blockInfo.title} #{index + 1}
                            </span>
                          </div>
                          
                          {block.content && (
                            <div className="text-gray-900">
                              {block.type === 'code' ? (
                                <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                                  <code>{block.content}</code>
                                </pre>
                              ) : (
                                <p>{block.content}</p>
                              )}
                            </div>
                          )}
                          
                          {block.type === 'file' && block.metadata?.files && block.metadata.files.length > 0 && (
                            <div className="mt-2">
                              <div className="text-sm font-medium text-gray-700 mb-2">
                                Файлы ({block.metadata.files.length}):
                              </div>
                              <div className="space-y-2">
                                {block.metadata.files.map((file) => (
                                  <div key={file.id} className={`p-2 bg-gray-50 rounded border ${
                                    file.type.startsWith('image/') ? 'flex gap-3' : 'flex items-center gap-2'
                                  }`}>
                                    {file.type.startsWith('image/') ? (
                                      // Превью для изображений
                                      <>
                                        <div className="flex-shrink-0">
                                          <img
                                            src={file.url}
                                            alt={file.name}
                                            className="w-12 h-12 object-cover rounded border border-gray-200"
                                            onError={(e) => {
                                              e.currentTarget.style.display = 'none';
                                            }}
                                          />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-1">
                                            <Image size={14} className="text-green-600" />
                                            <a 
                                              href={file.url} 
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              className="text-blue-600 hover:underline text-sm font-medium truncate"
                                            >
                                              {file.name}
                                            </a>
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            {Math.round(file.size / 1024)} KB
                                          </div>
                                        </div>
                                      </>
                                    ) : (
                                      // Обычное отображение для файлов
                                      <>
                                        <File size={14} className="text-gray-500" />
                                        <a 
                                          href={file.url} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:underline text-sm flex-1"
                                        >
                                          {file.name}
                                        </a>
                                        <span className="text-xs text-gray-500">
                                          {Math.round(file.size / 1024)} KB
                                        </span>
                                      </>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {block.type !== 'file' && block.metadata?.url && (
                            <div className="mt-2">
                              <a 
                                href={block.metadata.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm"
                              >
                                {block.metadata.url}
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
