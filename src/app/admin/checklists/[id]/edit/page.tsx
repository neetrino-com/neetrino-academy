'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ChecklistForm from '@/components/admin/ChecklistForm';

export default function EditChecklistPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const [checklist, setChecklist] = useState<any>(null);
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Хедер с навигацией */}
      <div className="flex items-center gap-4 mb-8">
        <Link 
          href={`/admin/checklists/${params.id}`}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Назад к чеклисту</span>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
            Редактирование чеклиста
          </h1>
          <p className="text-gray-600 mt-2">
            Изменение структуры и содержимого чеклиста
          </p>
        </div>

        <ChecklistForm 
          mode="edit" 
          checklistId={params.id as string}
          initialData={{
            title: checklist.title,
            description: checklist.description || '',
            direction: checklist.direction,
            thumbnail: checklist.thumbnail || '',
            isActive: checklist.isActive,
            groups: checklist.groups.map((group: any) => ({
              id: group.id,
              title: group.title,
              description: group.description || '',
              order: group.order,
              isCollapsed: group.isCollapsed,
              items: group.items.map((item: any) => ({
                id: item.id,
                title: item.title,
                description: item.description || '',
                order: item.order,
                isRequired: item.isRequired
              }))
            }))
          }}
        />
      </div>
    </div>
  );
}
