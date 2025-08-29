'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Plus, Search, Edit, Trash2, Eye, ClipboardCheck, Globe, Monitor, ShoppingBag, BarChart3, Bell } from 'lucide-react';

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
  groups: Array<{
    id: string;
    title: string;
    _count: {
      items: number;
    };
  }>;
  _count: {
    lessons: number;
    progress: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
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
  WORDPRESS: 'bg-blue-100 text-blue-800',
  VIBE_CODING: 'bg-purple-100 text-purple-800',
  SHOPIFY: 'bg-green-100 text-green-800'
};

export default function ChecklistsPage() {
  const { data: session, status } = useSession();
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [directionFilter, setDirectionFilter] = useState<string>('');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('true');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user || !['ADMIN', 'TEACHER'].includes(session.user.role)) {
      redirect('/login');
    }
    
    fetchChecklists();
  }, [session, status, search, directionFilter, isActiveFilter, currentPage]);

  const fetchChecklists = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(search && { search }),
        ...(directionFilter && { direction: directionFilter }),
        ...(isActiveFilter && { isActive: isActiveFilter }),
      });

      const response = await fetch(`/api/admin/checklists?${params}`);
      const data = await response.json();

      if (response.ok) {
        setChecklists(data.checklists);
        setPagination(data.pagination);
      } else {
        console.error('Error fetching checklists:', data.error);
      }
    } catch (error) {
      console.error('Error fetching checklists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот чеклист?')) return;

    try {
      const response = await fetch(`/api/admin/checklists/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchChecklists();
      } else {
        const data = await response.json();
        alert(data.error || 'Ошибка при удалении чеклиста');
      }
    } catch (error) {
      console.error('Error deleting checklist:', error);
      alert('Ошибка при удалении чеклиста');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTotalItems = (groups: Checklist['groups']) => {
    return groups.reduce((sum, group) => sum + group._count.items, 0);
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
            Управление чеклистами
          </h1>
          <p className="text-gray-600 mt-2">Создание и управление чеклистами для студентов</p>
        </div>
        <button
          onClick={() => window.location.href = '/admin/checklists/create'}
          className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all shadow-lg hover:shadow-xl"
        >
          <Plus size={20} />
          Создать чеклист
        </button>
      </div>

      {/* Фильтры */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Поиск по названию или описанию..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="">Все направления</option>
              <option value="WORDPRESS">WordPress</option>
              <option value="VIBE_CODING">Vibe Coding</option>
              <option value="SHOPIFY">Shopify</option>
            </select>
            <select
              value={isActiveFilter}
              onChange={(e) => setIsActiveFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="true">Активные</option>
              <option value="false">Неактивные</option>
              <option value="">Все</option>
            </select>
          </div>
        </div>
      </div>

      {/* Список чеклистов */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
          </div>
        ) : checklists.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardCheck className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Чеклисты не найдены</h3>
            <p className="mt-1 text-sm text-gray-500">
              {search || directionFilter || isActiveFilter !== 'true' 
                ? 'Попробуйте изменить фильтры поиска'
                : 'Создайте первый чеклист для начала работы'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Чеклист
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Направление
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Автор
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Структура
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Использований
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дата создания
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {checklists.map((checklist) => {
                  const DirectionIcon = directionIcons[checklist.direction];
                  return (
                    <tr key={checklist.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {checklist.thumbnail && (
                            <img
                              src={checklist.thumbnail}
                              alt={checklist.title}
                              className="h-10 w-10 rounded-lg object-cover mr-3"
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {checklist.title}
                            </div>
                            {checklist.description && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {checklist.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${directionColors[checklist.direction]}`}>
                          <DirectionIcon size={12} className="mr-1" />
                          {directionLabels[checklist.direction]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{checklist.creator.name}</div>
                        <div className="text-sm text-gray-500">{checklist.creator.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {checklist.groups.length} групп
                        </div>
                        <div className="text-sm text-gray-500">
                          {getTotalItems(checklist.groups)} пунктов
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {checklist._count.lessons} уроков
                        </div>
                        <div className="text-sm text-gray-500">
                          {checklist._count.progress} студентов
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          checklist.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {checklist.isActive ? 'Активен' : 'Неактивен'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(checklist.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => window.location.href = `/admin/checklists/${checklist.id}`}
                            className="text-amber-600 hover:text-amber-900 p-1"
                            title="Просмотр"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => window.location.href = `/admin/checklists/${checklist.id}/analytics`}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Аналитика"
                          >
                            <BarChart3 size={16} />
                          </button>
                          <button
                            onClick={() => window.location.href = `/admin/checklists/${checklist.id}/notifications`}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="Уведомления"
                          >
                            <Bell size={16} />
                          </button>
                          <button
                            onClick={() => window.location.href = `/admin/checklists/${checklist.id}/edit`}
                            className="text-indigo-600 hover:text-indigo-900 p-1"
                            title="Редактировать"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(checklist.id)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Удалить"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Пагинация */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-700">
            Показано {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} из {pagination.total} чеклистов
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Назад
            </button>
            <span className="px-3 py-2 text-sm text-gray-700">
              Страница {currentPage} из {pagination.pages}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === pagination.pages}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Вперед
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
