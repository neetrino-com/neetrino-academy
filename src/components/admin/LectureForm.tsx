'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, X, Plus, Image, Link, FileText, Video, Code } from 'lucide-react';

interface LectureBlock {
  id: string;
  type: 'text' | 'image' | 'file' | 'video' | 'link' | 'code';
  content: string;
  metadata?: {
    url?: string;
    alt?: string;
    filename?: string;
    size?: number;
  };
}

interface LectureFormProps {
  lecture?: {
    id: string;
    title: string;
    description?: string;
    thumbnail?: string;
    content: LectureBlock[];
    isActive: boolean;
  };
  mode: 'create' | 'edit';
}

export default function LectureForm({ lecture, mode }: LectureFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(lecture?.title || '');
  const [description, setDescription] = useState(lecture?.description || '');
  const [thumbnail, setThumbnail] = useState(lecture?.thumbnail || '');
  const [isActive, setIsActive] = useState(lecture?.isActive ?? true);
  const [blocks, setBlocks] = useState<LectureBlock[]>(lecture?.content || []);
  const [showBlockSelector, setShowBlockSelector] = useState(false);

  const addBlock = (type: LectureBlock['type']) => {
    const newBlock: LectureBlock = {
      id: Date.now().toString(),
      type,
      content: '',
    };
    setBlocks([...blocks, newBlock]);
    setShowBlockSelector(false);
  };

  const showBlockTypeSelector = () => {
    setShowBlockSelector(true);
  };

  const updateBlock = (id: string, updates: Partial<LectureBlock>) => {
    setBlocks(blocks.map(block => 
      block.id === id ? { ...block, ...updates } : block
    ));
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter(block => block.id !== id));
  };

  const moveBlock = (id: string, direction: 'up' | 'down') => {
    const index = blocks.findIndex(block => block.id === id);
    if (index === -1) return;

    const newBlocks = [...blocks];
    if (direction === 'up' && index > 0) {
      [newBlocks[index], newBlocks[index - 1]] = [newBlocks[index - 1], newBlocks[index]];
    } else if (direction === 'down' && index < blocks.length - 1) {
      [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
    }
    setBlocks(newBlocks);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert('Введите название лекции');
      return;
    }

    if (blocks.length === 0) {
      alert('Добавьте хотя бы один блок контента');
      return;
    }

    setLoading(true);

    try {
      const url = mode === 'create' ? '/api/admin/lectures' : `/api/admin/lectures/${lecture?.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          thumbnail: thumbnail.trim() || null,
          content: blocks,
          isActive,
        }),
      });

      if (response.ok) {
        router.push('/admin/lectures');
      } else {
        const data = await response.json();
        alert(data.error || 'Ошибка при сохранении лекции');
      }
    } catch (error) {
      console.error('Error saving lecture:', error);
      alert('Ошибка при сохранении лекции');
    } finally {
      setLoading(false);
    }
  };

  const renderBlock = (block: LectureBlock) => {
    switch (block.type) {
      case 'text':
        return (
          <textarea
            value={block.content}
            onChange={(e) => updateBlock(block.id, { content: e.target.value })}
            placeholder="Введите текст лекции..."
            className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        );

      case 'image':
        return (
          <div className="space-y-2">
            <input
              type="url"
              value={block.metadata?.url || ''}
              onChange={(e) => updateBlock(block.id, { 
                metadata: { ...block.metadata, url: e.target.value }
              })}
              placeholder="URL изображения"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              value={block.metadata?.alt || ''}
              onChange={(e) => updateBlock(block.id, { 
                metadata: { ...block.metadata, alt: e.target.value }
              })}
              placeholder="Альтернативный текст"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {block.metadata?.url && (
              <img
                src={block.metadata.url}
                alt={block.metadata.alt || 'Изображение'}
                className="max-w-full h-auto rounded-lg border"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
          </div>
        );

      case 'file':
        return (
          <div className="space-y-2">
            <input
              type="url"
              value={block.metadata?.url || ''}
              onChange={(e) => updateBlock(block.id, { 
                metadata: { ...block.metadata, url: e.target.value }
              })}
              placeholder="URL файла"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              value={block.metadata?.filename || ''}
              onChange={(e) => updateBlock(block.id, { 
                metadata: { ...block.metadata, filename: e.target.value }
              })}
              placeholder="Название файла"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              placeholder="Описание файла"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        );

      case 'video':
        return (
          <div className="space-y-2">
            <input
              type="url"
              value={block.metadata?.url || ''}
              onChange={(e) => updateBlock(block.id, { 
                metadata: { ...block.metadata, url: e.target.value }
              })}
              placeholder="URL видео (YouTube, Vimeo и т.д.)"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              placeholder="Описание видео"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        );

      case 'link':
        return (
          <div className="space-y-2">
            <input
              type="url"
              value={block.metadata?.url || ''}
              onChange={(e) => updateBlock(block.id, { 
                metadata: { ...block.metadata, url: e.target.value }
              })}
              placeholder="URL ссылки"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              placeholder="Текст ссылки"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        );

      case 'code':
        return (
          <div className="space-y-2">
            <input
              type="text"
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              placeholder="Язык программирования (например: javascript, python, html)"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <textarea
              value={block.metadata?.url || ''}
              onChange={(e) => updateBlock(block.id, { 
                metadata: { ...block.metadata, url: e.target.value }
              })}
              placeholder="Код..."
              className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
            />
          </div>
        );

      default:
        return null;
    }
  };

  const getBlockIcon = (type: LectureBlock['type']) => {
    switch (type) {
      case 'text': return <FileText size={16} />;
      case 'image': return <Image size={16} />;
      case 'file': return <FileText size={16} />;
      case 'video': return <Video size={16} />;
      case 'link': return <Link size={16} />;
      case 'code': return <Code size={16} />;
      default: return <FileText size={16} />;
    }
  };

  const getBlockTitle = (type: LectureBlock['type']) => {
    switch (type) {
      case 'text': return 'Текст';
      case 'image': return 'Изображение';
      case 'file': return 'Файл';
      case 'video': return 'Видео';
      case 'link': return 'Ссылка';
      case 'code': return 'Код';
      default: return 'Блок';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {mode === 'create' ? 'Создание лекции' : 'Редактирование лекции'}
            </h1>
            <p className="text-gray-600 mt-2">
              {mode === 'create' ? 'Создайте новую лекцию с богатым контентом' : 'Отредактируйте существующую лекцию'}
            </p>
          </div>
          <button
            onClick={() => router.push('/admin/lectures')}
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <X size={20} />
            Отмена
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Основная информация */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Основная информация</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название лекции *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Введите название лекции"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Статус
                </label>
                <select
                  value={isActive ? 'true' : 'false'}
                  onChange={(e) => setIsActive(e.target.value === 'true')}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="true">Активна</option>
                  <option value="false">Неактивна</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Описание
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Краткое описание лекции"
                className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Обложка (URL изображения)
              </label>
              <input
                type="url"
                value={thumbnail}
                onChange={(e) => setThumbnail(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Контент лекции */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Контент лекции</h2>
            </div>

            {blocks.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Нет блоков контента</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Добавьте блоки для создания контента лекции
                </p>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {(['text', 'image', 'file', 'video', 'link', 'code'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => addBlock(type)}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      {getBlockIcon(type)}
                      {getBlockTitle(type)}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {blocks.map((block, index) => (
                  <div key={block.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getBlockIcon(block.type)}
                        <span className="font-medium text-gray-900">
                          {getBlockTitle(block.type)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => moveBlock(block.id, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveBlock(block.id, 'down')}
                          disabled={index === blocks.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => removeBlock(block.id)}
                          className="p-1 text-red-400 hover:text-red-600"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                    {renderBlock(block)}
                  </div>
                ))}

                {/* Кнопка добавления блока в конце списка */}
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={showBlockTypeSelector}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
                  >
                    <Plus size={20} />
                    Добавить блок
                  </button>
                </div>

                {/* Селектор типа блока */}
                {showBlockSelector && (
                  <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-900">Выберите тип блока:</h3>
                      <button
                        type="button"
                        onClick={() => setShowBlockSelector(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(['text', 'image', 'file', 'video', 'link', 'code'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => addBlock(type)}
                          className="flex items-center gap-2 px-3 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                        >
                          {getBlockIcon(type)}
                          {getBlockTitle(type)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Кнопки действий */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.push('/admin/lectures')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Save size={16} />
              {loading ? 'Сохранение...' : 'Сохранить лекцию'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
