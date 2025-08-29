'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ChecklistForm from '@/components/admin/ChecklistForm';

export default function CreateChecklistPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!session?.user || !['ADMIN', 'TEACHER'].includes(session.user.role)) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Хедер с навигацией */}
      <div className="flex items-center gap-4 mb-8">
        <Link 
          href="/admin/checklists"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Назад к чеклистам</span>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
            Создание нового чеклиста
          </h1>
          <p className="text-gray-600 mt-2">
            Создайте структурированный чеклист с группами задач для студентов
          </p>
        </div>

        <ChecklistForm mode="create" />
      </div>
    </div>
  );
}
