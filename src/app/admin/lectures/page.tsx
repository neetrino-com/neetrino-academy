'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Plus, Search, Edit, Trash2, Eye, FileText } from 'lucide-react';

interface Lecture {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  isActive: boolean;
  createdAt: string;
  creator: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    lessons: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function LecturesPage() {
  const { data: session, status } = useSession();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('true');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user || !['ADMIN', 'TEACHER'].includes(session.user.role)) {
      redirect('/login');
    }
    
    fetchLectures();
  }, [session, status, search, isActiveFilter, currentPage]);

  const fetchLectures = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(search && { search }),
        ...(isActiveFilter && { isActive: isActiveFilter }),
      });

      const response = await fetch(`/api/admin/lectures?${params}`);
      const data = await response.json();

      if (response.ok) {
        setLectures(data.lectures);
        setPagination(data.pagination);
      } else {
        console.error('Error fetching lectures:', data.error);
      }
    } catch (error) {
      console.error('Error fetching lectures:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту лекцию?')) return;

    try {
      const response = await fetch(`/api/admin/lectures/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchLectures();
      } else {
        const data = await response.json();
        alert(data.error || 'Ошибка при удалении лекции');
      }
    } catch (error) {
      console.error('Error deleting lecture:', error);
      alert('Ошибка при удалении лекции');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Хедер */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.location.href = '/admin'}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                  Лекции
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Управление учебными материалами
                </p>
              </div>
            </div>
            <button
              onClick={() => window.location.href = '/admin/lectures/create'}
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-700 hover:to-blue-700 flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-4 h-4" />
              Создать лекцию
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Статистика */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-cyan-600 font-semibold">Всего лекций</p>
                <p className="text-3xl font-bold mt-1 text-gray-900">{pagination?.total || 0}</p>
              </div>
              <FileText className="w-8 h-8 text-cyan-600" />
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600 font-semibold">Активных</p>
                <p className="text-3xl font-bold mt-1 text-gray-900">{lectures.filter(l => l.isActive).length}</p>
              </div>
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-semibold">Уроков</p>
                <p className="text-3xl font-bold mt-1 text-gray-900">{lectures.reduce((sum, l) => sum + l._count.lessons, 0)}</p>
              </div>
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-semibold">Неактивных</p>
                <p className="text-3xl font-bold mt-1 text-gray-900">{lectures.filter(l => !l.isActive).length}</p>
              </div>
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
          </div>
        </div>

        {/* Поиск и фильтры */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Поиск лекций по названию или описанию..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={isActiveFilter}
              onChange={(e) => setIsActiveFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              <option value="true">Активные</option>
              <option value="false">Неактивные</option>
              <option value="">Все</option>
            </select>
          </div>
        </div>
      </div>

        {/* Список лекций */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">
              Лекции ({lectures.length})
            </h2>
          </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : lectures.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {search || isActiveFilter !== 'true' ? 'Лекции не найдены' : 'Пока нет лекций'}
            </h3>
            <p className="text-gray-500 mb-4">
              {search || isActiveFilter !== 'true' 
                ? 'Попробуйте изменить критерии поиска или фильтрации'
                : 'Создайте свою первую лекцию для начала работы'
              }
            </p>
            {!search && isActiveFilter === 'true' && (
              <button
                onClick={() => window.location.href = '/admin/lectures/create'}
                className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-cyan-400 hover:bg-cyan-50 transition-colors"
              >
                Создать первую лекцию
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {lectures.map((lecture) => {
              const statusInfo = lecture.isActive 
                ? { label: 'Активна', color: 'bg-emerald-100 text-emerald-800' }
                : { label: 'Неактивна', color: 'bg-red-100 text-red-800' };
              
              return (
                <div key={lecture.id} className="group bg-white/60 hover:bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 hover:border-cyan-200 relative overflow-hidden">
                  {/* Декоративный элемент */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                  
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-lg group-hover:text-cyan-700 transition-colors">{lecture.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-3 py-1 text-xs rounded-full font-medium shadow-sm ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                            <span className="px-3 py-1 text-xs rounded-full font-medium bg-cyan-100 text-cyan-800 shadow-sm">
                              {lecture._count.lessons} уроков
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {lecture.description && (
                        <p className="text-gray-600 mb-4 group-hover:text-gray-700 transition-colors leading-relaxed">{lecture.description}</p>
                      )}
                      
                      {/* Характеристики лекции */}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-pink-50 px-3 py-2 rounded-lg group-hover:from-purple-100 group-hover:to-pink-100 transition-colors">
                          <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="font-medium">{lecture.creator.name}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-cyan-50 px-3 py-2 rounded-lg group-hover:from-blue-100 group-hover:to-cyan-100 transition-colors">
                          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          <span className="font-medium">{lecture._count.lessons} использований</span>
                        </div>
                        <div className="flex items-center gap-2 bg-gradient-to-r from-orange-50 to-yellow-50 px-3 py-2 rounded-lg group-hover:from-orange-100 group-hover:to-yellow-100 transition-colors">
                          <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="font-medium">Создана: {formatDate(lecture.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Действия */}
                    <div className="flex gap-3 ml-6 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => window.location.href = `/admin/lectures/${lecture.id}`}
                        className="w-12 h-12 flex items-center justify-center text-cyan-600 hover:text-white hover:bg-cyan-600 rounded-xl transition-all duration-200 hover:scale-110 shadow-md hover:shadow-lg border-2 border-cyan-200 hover:border-cyan-600 backdrop-blur-sm"
                        title="Просмотр"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      
                      <button
                        onClick={() => window.location.href = `/admin/lectures/${lecture.id}/edit`}
                        className="w-12 h-12 flex items-center justify-center text-indigo-600 hover:text-white hover:bg-indigo-600 rounded-xl transition-all duration-200 hover:scale-110 shadow-md hover:shadow-lg border-2 border-indigo-200 hover:border-indigo-600 backdrop-blur-sm"
                        title="Редактировать"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      
                      <button
                        onClick={() => handleDelete(lecture.id)}
                        className="w-12 h-12 flex items-center justify-center text-red-600 hover:text-white hover:bg-red-600 rounded-xl transition-all duration-200 hover:scale-110 shadow-md hover:shadow-lg border-2 border-red-200 hover:border-red-600 backdrop-blur-sm"
                        title="Удалить"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

        {/* Пагинация */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700">
              Показано {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} из {pagination.total} лекций
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-200"
              >
                Назад
              </button>
              <span className="px-3 py-2 text-sm text-gray-700">
                Страница {currentPage} из {pagination.pages}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === pagination.pages}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-200"
              >
                Вперед
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
