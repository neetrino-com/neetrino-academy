'use client';

import { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  ArrowUp,
  ArrowDown,
  GripVertical,
  FileText,
  Image,
  Video,
  Link,
  Code,
  CheckSquare,
  Copy,
  X,
  File
} from 'lucide-react';

interface LessonBlock {
  id: string;
  type: 'text' | 'image' | 'video' | 'link' | 'code' | 'checklist' | 'file';
  content: string;
  metadata?: {
    url?: string;
    alt?: string;
    language?: string;
    description?: string;
    filename?: string;
    fileSize?: number;
  };
}

interface LessonContentBuilderProps {
  content: string; // JSON строка с блоками
  onChange: (content: string) => void;
}

export default function LessonContentBuilder({ content, onChange }: LessonContentBuilderProps) {
  const [blocks, setBlocks] = useState<LessonBlock[]>(() => {
    try {
      return content ? JSON.parse(content) : [];
    } catch {
      return [];
    }
  });


  const blockTypes = [
    { 
      type: 'text', 
      icon: FileText, 
      title: 'Текст', 
      description: 'Добавить текстовый блок',
      color: 'text-blue-600 bg-blue-50 border-blue-200'
    },
    { 
      type: 'image', 
      icon: Image, 
      title: 'Изображение', 
      description: 'Вставить изображение',
      color: 'text-green-600 bg-green-50 border-green-200'
    },
    { 
      type: 'video', 
      icon: Video, 
      title: 'Видео', 
      description: 'Встроить видео',
      color: 'text-red-600 bg-red-50 border-red-200'
    },
    { 
      type: 'code', 
      icon: Code, 
      title: 'Код', 
      description: 'Блок кода с подсветкой',
      color: 'text-purple-600 bg-purple-50 border-purple-200'
    },
    { 
      type: 'link', 
      icon: Link, 
      title: 'Ссылка', 
      description: 'Добавить ссылку',
      color: 'text-yellow-600 bg-yellow-50 border-yellow-200'
    },
    { 
      type: 'file', 
      icon: File, 
      title: 'Файл', 
      description: 'Прикрепить файл',
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200'
    },
    { 
      type: 'checklist', 
      icon: CheckSquare, 
      title: 'Чеклист', 
      description: 'Список задач',
      color: 'text-amber-600 bg-amber-50 border-amber-200'
    }
  ] as const;

  const updateBlocks = (newBlocks: LessonBlock[]) => {
    setBlocks(newBlocks);
    onChange(JSON.stringify(newBlocks));
  };

  const addBlock = (type: LessonBlock['type']) => {
    const newBlock: LessonBlock = {
      id: `block-${Date.now()}`,
      type,
      content: '',
      metadata: {}
    };
    updateBlocks([...blocks, newBlock]);
  };

  const duplicateBlock = (blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    const newBlock: LessonBlock = {
      ...block,
      id: `block-${Date.now()}`,
    };
    
    const blockIndex = blocks.findIndex(b => b.id === blockId);
    const newBlocks = [...blocks];
    newBlocks.splice(blockIndex + 1, 0, newBlock);
    
    updateBlocks(newBlocks);
  };

  const removeBlock = (blockId: string) => {
    updateBlocks(blocks.filter(b => b.id !== blockId));
  };

  const updateBlock = (blockId: string, updates: Partial<LessonBlock>) => {
    updateBlocks(blocks.map(b => 
      b.id === blockId ? { ...b, ...updates } : b
    ));
  };

  const moveBlock = (blockId: string, direction: 'up' | 'down') => {
    const newBlocks = [...blocks];
    const index = newBlocks.findIndex(b => b.id === blockId);
    
    if (direction === 'up' && index > 0) {
      [newBlocks[index], newBlocks[index - 1]] = [newBlocks[index - 1], newBlocks[index]];
    } else if (direction === 'down' && index < newBlocks.length - 1) {
      [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
    }
    
    updateBlocks(newBlocks);
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
            placeholder="Введите текст урока..."
            className="w-full h-24 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        );

      case 'image':
        return (
          <div className="space-y-3">
            <input
              type="url"
              value={block.metadata?.url || ''}
              onChange={(e) => updateBlock(block.id, { 
                metadata: { ...block.metadata, url: e.target.value }
              })}
              placeholder="URL изображения"
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <input
              type="text"
              value={block.metadata?.alt || ''}
              onChange={(e) => updateBlock(block.id, { 
                metadata: { ...block.metadata, alt: e.target.value }
              })}
              placeholder="Описание изображения"
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <textarea
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              placeholder="Подпись к изображению"
              className="w-full h-16 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
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
              className="w-full h-16 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
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
              className="w-full h-32 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-mono text-sm"
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
              className="w-full h-16 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
            />
          </div>
        );

      case 'file':
        return (
          <div className="space-y-3">
            <input
              type="url"
              value={block.metadata?.url || ''}
              onChange={(e) => updateBlock(block.id, { 
                metadata: { ...block.metadata, url: e.target.value }
              })}
              placeholder="URL файла"
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <input
              type="text"
              value={block.metadata?.filename || ''}
              onChange={(e) => updateBlock(block.id, { 
                metadata: { ...block.metadata, filename: e.target.value }
              })}
              placeholder="Название файла"
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <textarea
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              placeholder="Описание файла"
              className="w-full h-20 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
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
              className="w-full h-24 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Блоки контента */}
      {blocks.length === 0 ? (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Добавьте блоки контента
            </h3>
            <p className="text-gray-500 mb-6">
              Создайте интерактивный урок с разными типами контента
            </p>
          </div>
          
          {/* Варианты блоков сразу видны */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {blockTypes.map((blockType) => {
              const IconComponent = blockType.icon;
              return (
                <button
                  key={blockType.type}
                  type="button"
                  onClick={() => addBlock(blockType.type)}
                  className={`p-4 border-2 rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-105 ${blockType.color}`}
                >
                  <div className="flex flex-col items-center text-center space-y-2">
                    <IconComponent size={24} />
                    <div>
                      <h4 className="font-semibold text-sm">{blockType.title}</h4>
                      <p className="text-xs opacity-80">{blockType.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {blocks.map((block, index) => {
            const blockInfo = getBlockTypeInfo(block.type);
            if (!blockInfo) return null;

            const IconComponent = blockInfo.icon;

            return (
              <div 
                key={block.id} 
                className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-sm transition-shadow"
              >
                {/* Заголовок блока */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <GripVertical className="text-gray-400 cursor-move" size={16} />
                    <div className={`p-2 rounded-lg ${blockInfo.color}`}>
                      <IconComponent size={14} />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">{blockInfo.title}</h4>
                      <p className="text-xs text-gray-600">Блок #{index + 1}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => duplicateBlock(block.id)}
                      className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                      title="Дублировать блок"
                    >
                      <Copy size={14} />
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => moveBlock(block.id, 'up')}
                      disabled={index === 0}
                      className="p-1 text-gray-500 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Переместить вверх"
                    >
                      <ArrowUp size={14} />
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => moveBlock(block.id, 'down')}
                      disabled={index === blocks.length - 1}
                      className="p-1 text-gray-500 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Переместить вниз"
                    >
                      <ArrowDown size={14} />
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => removeBlock(block.id)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                      title="Удалить блок"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Содержимое блока */}
                {renderBlockEditor(block)}
              </div>
            );
          })}

          {/* Варианты блоков для добавления */}
          <div className="pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Добавить новый блок:</h4>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
              {blockTypes.map((blockType) => {
                const IconComponent = blockType.icon;
                return (
                  <button
                    key={blockType.type}
                    type="button"
                    onClick={() => addBlock(blockType.type)}
                    className={`p-3 border-2 rounded-lg transition-all duration-200 hover:shadow-md hover:scale-105 ${blockType.color}`}
                    title={blockType.description}
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <IconComponent size={16} />
                      <span className="text-xs font-medium">{blockType.title}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
