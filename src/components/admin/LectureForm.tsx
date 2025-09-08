'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, X, Plus, Image, Link, FileText, Video, Code, Settings } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Красивый заголовок с градиентом */}
        <div className="relative mb-12">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-3xl opacity-10"></div>
          <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                      {mode === 'create' ? 'Создание лекции' : 'Редактирование лекции'}
                    </h1>
                    <p className="text-gray-600 text-lg mt-2">
                      {mode === 'create' ? 'Создайте новую лекцию с богатым контентом' : 'Отредактируйте существующую лекцию'}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => router.push('/admin/lectures')}
                className="group flex items-center gap-3 px-6 py-3 bg-white/80 hover:bg-white text-gray-700 hover:text-gray-900 rounded-2xl border border-gray-200 hover:border-gray-300 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                <span className="font-medium">Отмена</span>
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Основная информация */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20 hover:shadow-3xl transition-all duration-500">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Основная информация</h2>
                  <p className="text-gray-600">Заполните основную информацию о лекции</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-3">
                      📚 Название лекции *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Введите название лекции"
                      className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-2xl transition-all duration-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-300 bg-white/80 backdrop-blur-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-3">
                      📊 Статус лекции
                    </label>
                    <select
                      value={isActive ? 'true' : 'false'}
                      onChange={(e) => setIsActive(e.target.value === 'true')}
                      className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-2xl transition-all duration-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-300 bg-white/80 backdrop-blur-sm"
                    >
                      <option value="true">✅ Активна</option>
                      <option value="false">⏸️ Неактивна</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-3">
                      📝 Описание лекции
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Краткое описание лекции"
                      className="w-full h-32 px-6 py-4 text-lg border-2 border-gray-200 rounded-2xl transition-all duration-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-300 resize-none bg-white/80 backdrop-blur-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-3">
                      🖼️ Обложка (URL изображения)
                    </label>
                    <input
                      type="url"
                      value={thumbnail}
                      onChange={(e) => setThumbnail(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-2xl transition-all duration-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-300 bg-white/80 backdrop-blur-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Контент лекции */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20 hover:shadow-3xl transition-all duration-500">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Контент лекции</h2>
                  <p className="text-gray-600">Создайте интерактивную лекцию с разными типами контента</p>
                </div>
              </div>

              <LectureContentBuilder
                content={blocks}
                onChange={handleBlocksChange}
              />
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-500/10 to-slate-500/10 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-white/20 hover:shadow-3xl transition-all duration-500">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-slate-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Save className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Готово к сохранению?</h3>
                    <p className="text-sm text-gray-600">Проверьте данные и сохраните лекцию</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => router.push('/admin/lectures')}
                    className="group/btn flex items-center gap-3 px-8 py-4 bg-white/80 hover:bg-white text-gray-700 hover:text-gray-900 rounded-2xl border-2 border-gray-200 hover:border-gray-300 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold"
                  >
                    <X size={20} className="group-hover/btn:rotate-90 transition-transform duration-300" />
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="group/btn flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 disabled:hover:scale-100"
                  >
                    <Save size={20} className="group-hover/btn:rotate-12 transition-transform duration-300" />
                    {loading ? 'Сохранение...' : 'Сохранить лекцию'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
