'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, X, Plus, Image, Link, FileText, Video, Code } from 'lucide-react';
import LectureContentBuilder from './LectureContentBuilder';

interface LectureBlock {
  id: string;
  type: 'text' | 'video' | 'link' | 'code' | 'checklist' | 'file' | 'gallery';
  content: string;
  collapsed?: boolean;
  metadata?: {
    url?: string;
    alt?: string;
    language?: string;
    description?: string;
    filename?: string;
    fileSize?: number;
    files?: Array<{
      id: string;
      url: string;
      name: string;
      size: number;
      type: string;
      publicId?: string;
    }>;
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

  const handleBlocksChange = (newBlocks: LectureBlock[]) => {
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
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Контент лекции</h2>
              <p className="text-sm text-gray-600 mt-1">
                Создайте интерактивную лекцию с разными типами контента
              </p>
            </div>

            <LectureContentBuilder
              content={blocks}
              onChange={handleBlocksChange}
            />
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
