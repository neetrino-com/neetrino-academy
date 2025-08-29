import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import ChecklistAnalytics from '@/components/admin/ChecklistAnalytics';

interface ChecklistAnalyticsPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: ChecklistAnalyticsPageProps): Promise<Metadata> {
  const checklist = await prisma.checklist.findUnique({
    where: { id: params.id },
    select: { title: true }
  });

  if (!checklist) {
    return {
      title: 'Чеклист не найден',
    };
  }

  return {
    title: `Аналитика: ${checklist.title} | Админ панель`,
    description: `Аналитика и статистика по чеклисту "${checklist.title}"`,
  };
}

export default async function ChecklistAnalyticsPage({ params }: ChecklistAnalyticsPageProps) {
  const checklist = await prisma.checklist.findUnique({
    where: { id: params.id },
    select: { 
      id: true, 
      title: true, 
      direction: true,
      description: true 
    }
  });

  if (!checklist) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Аналитика чеклиста
            </h1>
            <p className="text-gray-600">
              Детальная статистика и аналитика по чеклисту
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Направление</div>
            <div className="text-lg font-semibold text-blue-600">{checklist.direction}</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {checklist.title}
          </h2>
          {checklist.description && (
            <p className="text-gray-600">{checklist.description}</p>
          )}
        </div>
      </div>

      <ChecklistAnalytics checklistId={checklist.id} />
    </div>
  );
}
