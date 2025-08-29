import { Metadata } from 'next';
import ChecklistAnalytics from '@/components/admin/ChecklistAnalytics';

export const metadata: Metadata = {
  title: 'Аналитика чеклистов | Админ панель',
  description: 'Аналитика и статистика по чеклистам',
};

export default function ChecklistsAnalyticsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Аналитика чеклистов
        </h1>
        <p className="text-gray-600">
          Общая статистика и аналитика по всем чеклистам в системе
        </p>
      </div>

      <ChecklistAnalytics showOverview={true} />
    </div>
  );
}
