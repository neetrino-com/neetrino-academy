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
  const [checklist, setChecklist] = useState<{
    id: string;
    title: string;
    description?: string;
    direction?: string;
    thumbnail?: string;
    isActive?: boolean;
    items?: Array<{
      id: string;
      text: string;
      order: number;
    }>;
    groups?: Array<{
      id: string;
      title: string;
      description?: string;
      order: number;
      isCollapsed?: boolean;
      items: Array<{
        id: string;
        title: string;
        description?: string;
        order: number;
        isRequired?: boolean;
      }>;
    }>;
  } | null>(null);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Современный хедер */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href={`/admin/checklists/${params.id}`}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
                  Редактирование: {checklist.title}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Изменение структуры и содержимого чеклиста
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-500">
                📊 {checklist.groups?.reduce((sum: number, g: { items: Array<{ id: string }> }) => sum + g.items.length, 0) || 0} пунктов
              </div>
              <div className="text-sm text-gray-500">
                📂 {checklist.groups?.length || 0} групп
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <ChecklistForm 
          mode="edit" 
          checklistId={params.id as string}
          initialData={{
            title: checklist.title,
            description: checklist.description || '',
            direction: (checklist.direction as 'WORDPRESS' | 'VIBE_CODING' | 'SHOPIFY') || 'WORDPRESS',
            thumbnail: checklist.thumbnail || '',
            isActive: checklist.isActive ?? true,
            groups: (checklist.groups || []).map((group: {
              id: string;
              title: string;
              description?: string;
              order: number;
              isCollapsed?: boolean;
              items: Array<{
                id: string;
                title: string;
                description?: string;
                order: number;
                isRequired?: boolean;
              }>;
            }) => ({
              id: group.id,
              title: group.title,
              description: group.description || '',
              order: group.order,
              isCollapsed: group.isCollapsed ?? false,
              items: group.items.map((item) => ({
                id: item.id,
                title: item.title,
                description: item.description || '',
                order: item.order,
                isRequired: item.isRequired ?? false
              }))
            }))
          }}
        />
      </div>
    </div>
  );
}
