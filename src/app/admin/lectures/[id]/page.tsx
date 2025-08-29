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
            <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
              {block.content}
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="my-4">
            {block.metadata?.url && (
              <img
                src={block.metadata.url}
                alt={block.metadata.alt || 'Изображение'}
                className="max-w-full h-auto rounded-lg shadow-sm"
              />
            )}
            {block.metadata?.alt && (
              <p className="text-sm text-gray-500 mt-2 italic">
                {block.metadata.alt}
              </p>
            )}
          </div>
        );

      case 'file':
        return (
          <div className="my-4 p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center gap-3">
              <FileText className="text-blue-600" size={24} />
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">
                  {block.metadata?.filename || 'Файл'}
                </h4>
                {block.content && (
                  <p className="text-sm text-gray-600 mt-1">{block.content}</p>
                )}
              </div>
              {block.metadata?.url && (
                <a
                  href={block.metadata.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <iframe
                  src={block.metadata.url}
                  className="w-full h-full"
                  frameBorder="0"
                  allowFullScreen
                />
              </div>
            )}
            {block.content && (
              <p className="text-sm text-gray-600 mt-2">{block.content}</p>
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
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 underline"
              >
                <Link size={16} />
                {block.content || block.metadata.url}
              </a>
            )}
          </div>
        );

      case 'code':
        return (
          <div className="my-4">
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              <div className="text-sm font-mono">
                <div className="text-gray-400 mb-2">
                  {block.content || 'Код'}
                </div>
                <pre className="whitespace-pre-wrap">
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!lecture) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Лекция не найдена</h1>
          <p className="text-gray-600">Запрашиваемая лекция не существует или была удалена.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Заголовок */}
        <div className="flex justify-between items-start mb-8">
          <div className="flex-1">
            <button
              onClick={() => router.push('/admin/lectures')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft size={20} />
              Назад к лекциям
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{lecture.title}</h1>
            {lecture.description && (
              <p className="text-gray-600 text-lg">{lecture.description}</p>
            )}
          </div>
          <button
            onClick={() => router.push(`/admin/lectures/${lecture.id}/edit`)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit size={16} />
            Редактировать
          </button>
        </div>

        {/* Информация о лекции */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Автор</h3>
              <p className="text-gray-900">{lecture.creator.name}</p>
              <p className="text-sm text-gray-600">{lecture.creator.email}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Статус</h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                lecture.isActive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {lecture.isActive ? 'Активна' : 'Неактивна'}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Дата создания</h3>
              <p className="text-gray-900">{formatDate(lecture.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Использование в курсах */}
        {lecture.lessons.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Используется в курсах ({lecture._count.lessons})
            </h2>
            <div className="space-y-3">
              {lecture.lessons.map((lesson) => (
                <div key={lesson.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{lesson.title}</p>
                    <p className="text-sm text-gray-600">
                      {lesson.module.course.title} → {lesson.module.title}
                    </p>
                  </div>
                  <button
                    onClick={() => router.push(`/admin/courses/${lesson.module.course.id}`)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Перейти к курсу
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Контент лекции */}
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Содержание лекции</h2>
          
          {lecture.content.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Контент отсутствует</h3>
              <p className="mt-1 text-sm text-gray-500">
                В этой лекции пока нет контента
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {lecture.content.map((block) => (
                <div key={block.id}>
                  {renderBlock(block)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
