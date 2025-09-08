'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Edit, ArrowLeft, FileText, Image, Link, Video, Code, Download } from 'lucide-react';

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

interface Lecture {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  content: LectureBlock[];
  isActive: boolean;
  createdAt: string;
  creator: {
    id: string;
    name: string;
    email: string;
  };
  lessons: Array<{
    id: string;
    title: string;
    module: {
      id: string;
      title: string;
      course: {
        id: string;
        title: string;
      };
    };
  }>;
  _count: {
    lessons: number;
  };
}

export default function LectureViewPage() {
  const params = useParams();
  const router = useRouter();
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLecture = async () => {
      try {
        const response = await fetch(`/api/admin/lectures/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setLecture(data);
        } else {
          console.error('Error fetching lecture');
        }
      } catch (error) {
        console.error('Error fetching lecture:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchLecture();
    }
  }, [params.id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderBlock = (block: LectureBlock) => {
    switch (block.type) {
      case 'text':
        return (
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-gray-800 leading-relaxed text-lg">
              {block.content}
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="my-4">
            {block.metadata?.url && (
              <div className="relative group">
                <img
                  src={block.metadata.url}
                  alt={block.metadata.alt || 'Изображение'}
                  className="max-w-full h-auto rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-2xl transition-all duration-300"></div>
              </div>
            )}
            {block.metadata?.alt && (
              <p className="text-sm text-gray-500 mt-3 italic text-center">
                {block.metadata.alt}
              </p>
            )}
          </div>
        );

      case 'file':
        return (
          <div className="my-4 p-6 bg-white rounded-2xl border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="text-blue-600" size={24} />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 text-lg">
                  {block.metadata?.filename || 'Файл'}
                </h4>
                {block.content && (
                  <p className="text-gray-600 mt-1">{block.content}</p>
                )}
                {block.metadata?.size && (
                  <p className="text-sm text-gray-500 mt-1">
                    {(block.metadata.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                )}
              </div>
              {block.metadata?.url && (
                <a
                  href={block.metadata.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 transform hover:scale-105"
                >
                  <Download size={16} />
                  Скачать
                </a>
              )}
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="my-4">
            {block.metadata?.url && (
              <div className="relative group">
                <div className="aspect-video bg-gray-100 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
                  <iframe
                    src={block.metadata.url}
                    className="w-full h-full"
                    frameBorder="0"
                    allowFullScreen
                  />
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-5 rounded-2xl transition-all duration-300"></div>
              </div>
            )}
            {block.content && (
              <p className="text-gray-600 mt-3 text-center italic">{block.content}</p>
            )}
          </div>
        );

      case 'link':
        return (
          <div className="my-4">
            {block.metadata?.url && (
              <a
                href={block.metadata.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group/link inline-flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 rounded-2xl border border-blue-200 hover:border-blue-300 transition-all duration-200"
              >
                <Link size={20} className="group-hover/link:rotate-12 transition-transform duration-200" />
                <span className="font-medium">{block.content || block.metadata.url}</span>
                <div className="ml-auto">
                  <ArrowLeft size={16} className="group-hover/link:translate-x-1 transition-transform duration-200" />
                </div>
              </a>
            )}
          </div>
        );

      case 'code':
        return (
          <div className="my-4">
            <div className="bg-gray-900 text-gray-100 p-6 rounded-2xl overflow-x-auto shadow-lg">
              <div className="text-sm font-mono">
                {block.content && (
                  <div className="text-gray-400 mb-3 text-xs uppercase tracking-wide">
                    {block.content}
                  </div>
                )}
                <pre className="whitespace-pre-wrap text-gray-100">
                  {block.metadata?.url || ''}
                </pre>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <FileText className="w-12 h-12 text-white animate-pulse" />
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Загрузка лекции...</h2>
          <p className="text-gray-600">Пожалуйста, подождите</p>
        </div>
      </div>
    );
  }

  if (!lecture) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Лекция не найдена</h1>
          <p className="text-gray-600 mb-8 text-lg">
            Запрашиваемая лекция не существует или была удалена.
          </p>
          <button
            onClick={() => router.push('/admin/lectures')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft size={16} />
            Вернуться к лекциям
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Красивый заголовок */}
        <div className="relative mb-12">
          <div className="relative bg-white rounded-3xl p-8 shadow-lg border border-gray-200">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <button
                  onClick={() => router.push('/admin/lectures')}
                  className="group flex items-center gap-3 px-4 py-2 text-gray-600 hover:text-gray-900 mb-6 transition-all duration-200 hover:bg-gray-100 rounded-xl"
                >
                  <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform duration-200" />
                  <span className="font-medium">Назад к лекциям</span>
                </button>
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-3">
                      {lecture.title}
                    </h1>
                    {lecture.description && (
                      <p className="text-gray-600 text-xl leading-relaxed">{lecture.description}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => router.push(`/admin/lectures/${lecture.id}/edit`)}
                className="group flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Edit size={20} className="group-hover:rotate-12 transition-transform duration-300" />
                <span className="font-medium">Редактировать</span>
              </button>
            </div>
          </div>
        </div>

        {/* Информация о лекции */}
        <div className="relative group mb-8">
          <div className="relative bg-white rounded-3xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Информация о лекции</h2>
                <p className="text-gray-600">Основные данные и статистика</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="group/item">
                <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">Автор</h3>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-lg font-semibold text-gray-900 mb-1">{lecture.creator.name}</p>
                  <p className="text-sm text-gray-600">{lecture.creator.email}</p>
                </div>
              </div>
              
              <div className="group/item">
                <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">Статус</h3>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                    lecture.isActive
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'bg-red-100 text-red-800 border border-red-200'
                  }`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      lecture.isActive ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    {lecture.isActive ? 'Активна' : 'Неактивна'}
                  </span>
                </div>
              </div>
              
              <div className="group/item">
                <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">Дата создания</h3>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-lg font-semibold text-gray-900">{formatDate(lecture.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Использование в курсах */}
        {lecture.lessons.length > 0 && (
          <div className="relative group mb-8">
            <div className="relative bg-white rounded-3xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Используется в курсах ({lecture._count.lessons})
                  </h2>
                  <p className="text-gray-600">Связанные уроки и модули</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {lecture.lessons.map((lesson) => (
                  <div key={lesson.id} className="group/card p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2 group-hover/card:text-blue-600 transition-colors">
                          {lesson.title}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
                            {lesson.module.course.title}
                          </span>
                          <span className="text-gray-400">→</span>
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium">
                            {lesson.module.title}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => router.push(`/admin/courses/${lesson.module.course.id}`)}
                        className="group/btn flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 transform hover:scale-105"
                      >
                        <span className="text-sm font-medium">Перейти</span>
                        <ArrowLeft size={14} className="group-hover/btn:rotate-180 transition-transform duration-200" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Контент лекции */}
        <div className="relative group">
          <div className="relative bg-white rounded-3xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Содержание лекции</h2>
                <p className="text-gray-600">Основной контент и материалы</p>
              </div>
            </div>
            
            {lecture.content.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Контент отсутствует</h3>
                <p className="text-gray-500 mb-6">
                  В этой лекции пока нет контента
                </p>
                <button
                  onClick={() => router.push(`/admin/lectures/${lecture.id}/edit`)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <Edit size={16} />
                  Добавить контент
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {lecture.content.map((block, index) => (
                  <div key={block.id} className="group/block">
                    <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-semibold">
                          {index + 1}
                        </div>
                        <div className="flex items-center gap-2">
                          {block.type === 'text' && <FileText size={16} className="text-gray-500" />}
                          {block.type === 'image' && <Image size={16} className="text-gray-500" />}
                          {block.type === 'video' && <Video size={16} className="text-gray-500" />}
                          {block.type === 'file' && <Download size={16} className="text-gray-500" />}
                          {block.type === 'link' && <Link size={16} className="text-gray-500" />}
                          {block.type === 'code' && <Code size={16} className="text-gray-500" />}
                          <span className="text-sm font-medium text-gray-600 capitalize">
                            {block.type === 'text' ? 'Текст' : 
                             block.type === 'image' ? 'Изображение' :
                             block.type === 'video' ? 'Видео' :
                             block.type === 'file' ? 'Файл' :
                             block.type === 'link' ? 'Ссылка' :
                             block.type === 'code' ? 'Код' : block.type}
                          </span>
                        </div>
                      </div>
                      <div className="ml-11">
                        {renderBlock(block)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
