'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Filter, Search } from 'lucide-react';
import AssignmentCard from '@/components/assignments/AssignmentCard';

interface Assignment {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  createdAt: string;
  module: {
    id: string;
    title: string;
    course: {
      id: string;
      title: string;
      slug: string;
    };
  };
  creator: {
    name: string;
    email: string;
  };
  _count: {
    submissions: number;
  };
  submissions?: Array<{
    id: string;
    submittedAt: string;
    score?: number;
  }>;
}

interface Module {
  id: string;
  title: string;
  course: {
    id: string;
    title: string;
  };
}

export default function AssignmentsPage() {
  const { data: session } = useSession();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [userRole, setUserRole] = useState<'STUDENT' | 'TEACHER' | 'ADMIN'>('STUDENT');

  // Загрузка заданий
  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedModule) params.append('moduleId', selectedModule);
      
      const response = await fetch(`/api/assignments?${params}`);
      if (!response.ok) throw new Error('Ошибка загрузки заданий');
      
      const data = await response.json();
      setAssignments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  // Загрузка модулей
  const fetchModules = async () => {
    try {
      const response = await fetch('/api/modules');
      if (!response.ok) throw new Error('Ошибка загрузки модулей');
      
      const data = await response.json();
      setModules(data);
    } catch (err) {
      console.error('Ошибка загрузки модулей:', err);
    }
  };

  // Получение роли пользователя
  const fetchUserRole = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const user = await response.json();
        setUserRole(user.role);
      }
    } catch (err) {
      console.error('Ошибка получения роли пользователя:', err);
    }
  };

  useEffect(() => {
    fetchAssignments();
    fetchModules();
    fetchUserRole();
  }, [selectedModule]);

  // Фильтрация заданий
  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.module.course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.module.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Задания</h1>
          <p className="text-gray-600 mt-2">
            Все доступные задания по курсам
          </p>
        </div>

        {/* Фильтры и поиск */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Поиск */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Поиск по названию, описанию или курсу..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Фильтр по модулю */}
            <div className="sm:w-64">
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Все модули</option>
                {modules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.course.title} - {module.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Ошибка */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Список заданий */}
        {filteredAssignments.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Filter className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Задания не найдены
            </h3>
            <p className="text-gray-600">
              {searchTerm || selectedModule 
                ? 'Попробуйте изменить параметры поиска'
                : 'Пока нет доступных заданий'
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAssignments.map((assignment) => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                userRole={userRole}
                userSubmission={assignment.submissions?.[0]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
