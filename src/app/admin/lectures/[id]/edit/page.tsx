'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import LectureForm from '@/components/admin/LectureForm';

interface Lecture {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  content: any[];
  isActive: boolean;
}

export default function EditLecturePage() {
  const params = useParams();
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

  return <LectureForm lecture={lecture} mode="edit" />;
}
