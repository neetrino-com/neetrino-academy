'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import LessonBuilderForm from '@/components/admin/LessonBuilderForm';

interface PageProps {
  params: Promise<{ id: string }>
}

export default function CreateLessonPage({ params }: PageProps) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session?.user || !['ADMIN', 'TEACHER'].includes(session.user.role)) {
    redirect('/login');
  }

  return (
    <LessonBuilderWrapper params={params} />
  );
}

function LessonBuilderWrapper({ params }: { params: Promise<{ id: string }> }) {
  const [moduleId, setModuleId] = useState<string>('');

  useEffect(() => {
    params.then(resolvedParams => {
      setModuleId(resolvedParams.id);
    });
  }, [params]);

  if (!moduleId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <LessonBuilderForm 
      mode="create" 
      moduleId={moduleId}
    />
  );
}
