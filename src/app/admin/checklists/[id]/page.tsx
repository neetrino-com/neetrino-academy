'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { ArrowLeft, Edit, Globe, Monitor, ShoppingBag, Users, BookOpen, ClipboardCheck, CheckCircle, Circle, XCircle, HelpCircle } from 'lucide-react';
import Link from 'next/link';

interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  order: number;
  isRequired: boolean;
  _count: {
    progress: number;
  };
}

interface ChecklistGroup {
  id: string;
  title: string;
  description?: string;
  order: number;
  isCollapsed: boolean;
  items: ChecklistItem[];
}

interface Checklist {
  id: string;
  title: string;
  description?: string;
  direction: 'WORDPRESS' | 'VIBE_CODING' | 'SHOPIFY';
  thumbnail?: string;
  isActive: boolean;
  createdAt: string;
  creator: {
    id: string;
    name: string;
    email: string;
  };
  groups: ChecklistGroup[];
  _count: {
    lessons: number;
    progress: number;
  };
}

const directionIcons = {
  WORDPRESS: Globe,
  VIBE_CODING: Monitor,
  SHOPIFY: ShoppingBag
};

const directionLabels = {
  WORDPRESS: 'WordPress',
  VIBE_CODING: 'Vibe Coding',
  SHOPIFY: 'Shopify'
};

const directionColors = {
  WORDPRESS: 'bg-blue-100 text-blue-800 border-blue-200',
  VIBE_CODING: 'bg-purple-100 text-purple-800 border-purple-200',
  SHOPIFY: 'bg-green-100 text-green-800 border-green-200'
};

export default function ChecklistViewPage() {
  const params = useParams();
  const { data: session, status } = useSession();
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user || !['ADMIN', 'TEACHER'].includes(session.user.role)) {
      redirect('/login');
    }

    fetchChecklist();
  }, [session, status, params.id]);

  const fetchChecklist = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/checklists/${params.id}`);
      const data = await response.json();

      if (response.ok) {
        setChecklist(data);
      } else {
        setError(data.error || 'Ошибка загрузки чеклиста');
      }
    } catch (error) {
      console.error('Error fetching checklist:', error);
      setError('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalItems = (groups: ChecklistGroup[]) => {
    return groups.reduce((sum, group) => sum + group.items.length, 0);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Ошибка</h3>
          <p className="text-red-700">{error}</p>
          <Link 
            href="/admin/checklists"
            className="inline-flex items-center gap-2 mt-4 text-red-600 hover:text-red-800"
          >
            <ArrowLeft size={16} />
            Вернуться к списку чеклистов
          </Link>
        </div>
      </div>
    );
  }

  if (!checklist) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Чеклист не найден</h3>
          <Link 
            href="/admin/checklists"
            className="inline-flex items-center gap-2 mt-4 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft size={16} />
            Вернуться к списку чеклистов
          </Link>
        </div>
      </div>
    );
  }

  const DirectionIcon = directionIcons[checklist.direction];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Навигация */}
      <div className="flex items-center justify-between mb-8">
        <Link 
          href="/admin/checklists"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Назад к чеклистам</span>
        </Link>
        
        <Link
          href={`/admin/checklists/${checklist.id}/edit`}
          className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
        >
          <Edit size={16} />
          Редактировать
        </Link>
      </div>

      {/* Информация о чеклисте */}
      <div className="bg-white rounded-lg shadow-sm border p-8 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              {checklist.thumbnail && (
                <img
                  src={checklist.thumbnail}
                  alt={checklist.title}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {checklist.title}
                </h1>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${directionColors[checklist.direction]}`}>
                  <DirectionIcon size={14} className="mr-1" />
                  {directionLabels[checklist.direction]}
                </div>
              </div>
            </div>
            
            {checklist.description && (
              <p className="text-gray-600 text-lg mb-4">{checklist.description}</p>
            )}
          </div>

          <div className="text-right">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              checklist.isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {checklist.isActive ? 'Активен' : 'Неактивен'}
            </span>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-amber-50 rounded-lg p-4 text-center">
            <ClipboardCheck className="w-8 h-8 text-amber-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-amber-700">{checklist.groups.length}</div>
            <div className="text-sm text-amber-600">Групп</div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <CheckCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-700">{getTotalItems(checklist.groups)}</div>
            <div className="text-sm text-blue-600">Пунктов</div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <BookOpen className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-700">{checklist._count.lessons}</div>
            <div className="text-sm text-green-600">Уроков</div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-700">{checklist._count.progress}</div>
            <div className="text-sm text-purple-600">Студентов</div>
          </div>
        </div>

        {/* Метаинформация */}
        <div className="border-t pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Автор:</span> {checklist.creator.name} ({checklist.creator.email})
            </div>
            <div>
              <span className="font-medium">Дата создания:</span> {formatDate(checklist.createdAt)}
            </div>
          </div>
        </div>
      </div>

      {/* Структура чеклиста */}
      <div className="bg-white rounded-lg shadow-sm border p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Структура чеклиста</h2>
        
        {checklist.groups.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardCheck className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Группы отсутствуют</h3>
            <p className="mt-1 text-sm text-gray-500">
              В этом чеклисте пока нет групп и пунктов
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {checklist.groups.map((group) => (
              <div key={group.id} className="border border-gray-200 rounded-lg">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {group.title}
                      </h3>
                      {group.description && (
                        <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {group.items.length} пунктов
                    </div>
                  </div>
                </div>
                
                {group.items.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {group.items.map((item) => (
                      <div key={item.id} className="px-6 py-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Circle className="w-4 h-4 text-gray-400" />
                              <span className="font-medium text-gray-900">
                                {item.title}
                              </span>
                              {!item.isRequired && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                  необязательно
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-sm text-gray-600 mt-1 ml-6">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item._count.progress} выполнений
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-6 py-8 text-center text-gray-500">
                    В этой группе пока нет пунктов
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
