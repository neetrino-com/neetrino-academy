'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useState, useEffect } from 'react';
import LessonBuilderForm from '@/components/admin/LessonBuilderForm';

interface PageProps {
  params: Promise<{ id: string }>
}

interface LessonData {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  thumbnail: string | null;
  duration: number | null;
  isActive: boolean;
  moduleId: string;
}

export default function EditLessonPage({ params }: PageProps) {
  const { data: session, status } = useSession();
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLesson();
  }, []);

  const loadLesson = async () => {
    try {
      const resolvedParams = await params;
      const response = await fetch(`/api/admin/lessons/${resolvedParams.id}`);
      
      if (response.ok) {
        const data = await response.json();
        setLesson(data);
      } else {
        setError('Урок не найден');
      }
    } catch (error) {
      console.error('Error loading lesson:', error);
      setError('Ошибка загрузки урока');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session?.user || !['ADMIN', 'TEACHER'].includes(session.user.role)) {
    redirect('/login');
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Ошибка</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Назад
          </button>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return null;
  }

  const initialData = {
    title: lesson.title,
    description: lesson.description || '',
    thumbnail: lesson.thumbnail || '',
    duration: lesson.duration || 0,
    isActive: lesson.isActive,
    blocks: lesson.content ? JSON.parse(lesson.content) : []
  };

  return (
    <LessonBuilderForm 
      mode="edit" 
      moduleId={lesson.moduleId}
      lessonId={lesson.id}
      initialData={initialData}
    />
  );
}
