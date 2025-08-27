'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Eye, Trash2, BookOpen, Users, Calendar } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  slug: string;
  direction: 'WORDPRESS' | 'VIBE_CODING' | 'SHOPIFY';
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  price: number;
  isActive: boolean;
  createdAt: string;
  modules: Array<{
    id: string;
    title: string;
    _count: {
      lessons: number;
      assignments: number;
    };
  }>;
  _count: {
    enrollments: number;
  };
}

export default function AdminCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/courses');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка загрузки курсов');
      }

      const data = await response.json();
      setCourses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  const getDirectionLabel = (direction: string) => {
    switch (direction) {
      case 'WORDPRESS': return 'WordPress';
      case 'VIBE_CODING': return 'Vibe Coding';
      case 'SHOPIFY': return 'Shopify';
      default: return direction;
    }
  };

  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'BEGINNER': return 'Начинающий';
      case 'INTERMEDIATE': return 'Средний';
      case 'ADVANCED': return 'Продвинутый';
      default: return level;
    }
  };

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case 'WORDPRESS': return 'bg-blue-100 text-blue-800';
      case 'VIBE_CODING': return 'bg-green-100 text-green-800';
      case 'SHOPIFY': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'BEGINNER': return 'bg-green-100 text-green-800';
      case 'INTERMEDIATE': return 'bg-yellow-100 text-yellow-800';
      case 'ADVANCED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка курсов...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchCourses}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Заголовок */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Управление курсами
                </h1>
                <p className="text-gray-600 mt-1">
                  Создавайте и управляйте курсами для студентов
                </p>
              </div>
              <button
                onClick={() => router.push('/admin/courses/create')}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-md text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Plus className="w-4 h-4" />
                Создать курс
              </button>
            </div>
          </div>

          {/* Статистика */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Всего курсов</p>
                  <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Активных курсов</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {courses.filter(c => c.isActive).length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Всего записей</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {courses.reduce((sum, course) => sum + course._count.enrollments, 0)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <BookOpen className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Всего модулей</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {courses.reduce((sum, course) => sum + course.modules.length, 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Список курсов */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Список курсов</h2>
            </div>
            
            {courses.length === 0 ? (
              <div className="p-8 text-center">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Курсы не найдены
                </h3>
                <p className="text-gray-600 mb-4">
                  Создайте первый курс для начала работы
                </p>
                <button
                  onClick={() => router.push('/admin/courses/create')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Создать курс
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Курс
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Направление
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Уровень
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Статистика
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Статус
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {courses.map((course) => (
                      <tr key={course.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {course.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {course.description.substring(0, 60)}...
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDirectionColor(course.direction)}`}>
                            {getDirectionLabel(course.direction)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLevelColor(course.level)}`}>
                            {getLevelLabel(course.level)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="space-y-1">
                            <div>Модулей: {course.modules.length}</div>
                            <div>Записей: {course._count.enrollments}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            course.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {course.isActive ? 'Активен' : 'Неактивен'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => router.push(`/courses/${course.slug}`)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Просмотр"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => router.push(`/admin/courses/${course.id}/edit`)}
                              className="text-green-600 hover:text-green-900"
                              title="Редактировать"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                                            <button
                  onClick={() => router.push(`/admin/courses/${course.id}/edit`)}
                  className="text-blue-600 hover:text-blue-900"
                  title="Редактировать курс"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => router.push(`/admin/courses/${course.id}/modules`)}
                  className="text-purple-600 hover:text-purple-900"
                  title="Управление модулями"
                >
                  <BookOpen className="w-4 h-4" />
                </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
