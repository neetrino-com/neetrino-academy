import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import ChecklistNotifications from '@/components/admin/ChecklistNotifications';

interface ChecklistNotificationsPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: ChecklistNotificationsPageProps): Promise<Metadata> {
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
    title: `Уведомления: ${checklist.title} | Админ панель`,
    description: `Уведомления о завершении чеклиста "${checklist.title}"`,
  };
}

export default async function ChecklistNotificationsPage({ params }: ChecklistNotificationsPageProps) {
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
              Уведомления чеклиста
            </h1>
            <p className="text-gray-600">
              Уведомления о завершении чеклиста студентами
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Направление</div>
            <div className="text-lg font-semibold text-blue-600">{checklist.direction}</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {checklist.title}
          </h2>
          {checklist.description && (
            <p className="text-gray-600">{checklist.description}</p>
          )}
        </div>
      </div>

      <ChecklistNotifications checklistId={checklist.id} />
    </div>
  );
}
