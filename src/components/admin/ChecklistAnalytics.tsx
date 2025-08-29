'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface ChecklistAnalyticsProps {
  checklistId?: string;
  showOverview?: boolean;
}

interface ChecklistItem {
  id: string;
  title: string;
  groupId: string;
}

interface ChecklistGroup {
  id: string;
  title: string;
  items: ChecklistItem[];
}

interface Checklist {
  id: string;
  title: string;
  direction: string;
  groups: ChecklistGroup[];
}

interface StudentProgress {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  completedItems: number;
  totalItems: number;
  completionPercentage: number;
  lastUpdated: string;
}

interface GroupAnalytics {
  groupId: string;
  groupTitle: string;
  totalItems: number;
  statusCounts: {
    COMPLETED: number;
    NOT_COMPLETED: number;
    NOT_NEEDED: number;
    HAS_QUESTIONS: number;
  };
  completionRate: number;
}

interface OverallStats {
  totalStudents: number;
  averageCompletion: number;
  mostCompletedGroup: {
    groupId: string;
    groupTitle: string;
    completionRate: number;
  };
  leastCompletedGroup: {
    groupId: string;
    groupTitle: string;
    completionRate: number;
  };
}

interface ChecklistAnalyticsData {
  checklist: {
    id: string;
    title: string;
    direction: string;
    totalGroups: number;
    totalItems: number;
  };
  studentProgress: StudentProgress[];
  groupAnalytics: GroupAnalytics[];
  overallStats: OverallStats;
}

interface OverviewAnalyticsData {
  overview: {
    totalChecklists: number;
    totalGroups: number;
    totalItems: number;
    totalStudents: number;
    totalItemProgress: number;
  };
  checklists: Array<{
    id: string;
    title: string;
    direction: string;
    totalGroups: number;
    totalItems: number;
    studentCount: number;
    createdAt: string;
    updatedAt: string;
  }>;
  directions: Array<{
    direction: string;
    checklistCount: number;
    totalGroups: number;
    totalItems: number;
    totalStudents: number;
  }>;
  performance: {
    mostPopularChecklist: any;
    mostComprehensiveChecklist: any;
    averageItemsPerChecklist: number;
    averageGroupsPerChecklist: number;
  };
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function ChecklistAnalytics({ checklistId, showOverview = false }: ChecklistAnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<ChecklistAnalyticsData | null>(null);
  const [overviewData, setOverviewData] = useState<OverviewAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [checklistId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      if (checklistId) {
        // Получаем аналитику конкретного чеклиста
        const response = await fetch(`/api/admin/checklists/${checklistId}/analytics`);
        if (response.ok) {
          const data = await response.json();
          setAnalyticsData(data);
        } else {
          setError('Ошибка загрузки аналитики чеклиста');
        }
      } else if (showOverview) {
        // Получаем общую аналитику
        const response = await fetch('/api/admin/checklists/analytics');
        if (response.ok) {
          const data = await response.json();
          setOverviewData(data);
        } else {
          setError('Ошибка загрузки общей аналитики');
        }
      }
    } catch (error) {
      setError('Ошибка загрузки данных');
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (checklistId && analyticsData) {
    return <ChecklistSpecificAnalytics data={analyticsData} />;
  }

  if (showOverview && overviewData) {
    return <OverviewAnalytics data={overviewData} />;
  }

  return null;
}

function ChecklistSpecificAnalytics({ data }: { data: ChecklistAnalyticsData }) {
  const { checklist, studentProgress, groupAnalytics, overallStats } = data;

  // Подготовка данных для графиков
  const groupChartData = groupAnalytics.map(group => ({
    name: group.groupTitle,
    выполнено: group.statusCounts.COMPLETED,
    'не выполнено': group.statusCounts.NOT_COMPLETED,
    'не нужно': group.statusCounts.NOT_NEEDED,
    'есть вопросы': group.statusCounts.HAS_QUESTIONS,
  }));

  const studentChartData = studentProgress
    .sort((a, b) => b.completionPercentage - a.completionPercentage)
    .slice(0, 10)
    .map(student => ({
      name: student.userName,
      'процент выполнения': student.completionPercentage,
    }));

  const statusPieData = [
    { name: 'Выполнено', value: groupAnalytics.reduce((sum, g) => sum + g.statusCounts.COMPLETED, 0) },
    { name: 'Не выполнено', value: groupAnalytics.reduce((sum, g) => sum + g.statusCounts.NOT_COMPLETED, 0) },
    { name: 'Не нужно', value: groupAnalytics.reduce((sum, g) => sum + g.statusCounts.NOT_NEEDED, 0) },
    { name: 'Есть вопросы', value: groupAnalytics.reduce((sum, g) => sum + g.statusCounts.HAS_QUESTIONS, 0) },
  ];

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{checklist.title}</h2>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <Badge variant="outline">{checklist.direction}</Badge>
          <span>{checklist.totalGroups} групп</span>
          <span>{checklist.totalItems} пунктов</span>
        </div>
      </div>

      {/* Общая статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Всего студентов</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{overallStats.totalStudents}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Средний прогресс</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{overallStats.averageCompletion}%</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Лучшая группа</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium text-gray-900">{overallStats.mostCompletedGroup.groupTitle}</div>
            <div className="text-lg font-bold text-green-600">{overallStats.mostCompletedGroup.completionRate}%</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Сложная группа</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium text-gray-900">{overallStats.leastCompletedGroup.groupTitle}</div>
            <div className="text-lg font-bold text-red-600">{overallStats.leastCompletedGroup.completionRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* График по группам */}
      <Card>
        <CardHeader>
          <CardTitle>Прогресс по группам</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={groupChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="выполнено" fill="#10b981" />
              <Bar dataKey="не выполнено" fill="#f59e0b" />
              <Bar dataKey="не нужно" fill="#ef4444" />
              <Bar dataKey="есть вопросы" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Круговая диаграмма статусов */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Распределение статусов</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Топ студентов */}
        <Card>
          <CardHeader>
            <CardTitle>Топ студентов по прогрессу</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={studentChartData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="процент выполнения" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Детальная таблица по группам */}
      <Card>
        <CardHeader>
          <CardTitle>Детальная статистика по группам</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Группа</th>
                  <th className="text-center p-2">Всего пунктов</th>
                  <th className="text-center p-2">Выполнено</th>
                  <th className="text-center p-2">Не выполнено</th>
                  <th className="text-center p-2">Не нужно</th>
                  <th className="text-center p-2">Есть вопросы</th>
                  <th className="text-center p-2">Процент выполнения</th>
                </tr>
              </thead>
              <tbody>
                {groupAnalytics.map((group) => (
                  <tr key={group.groupId} className="border-b">
                    <td className="p-2 font-medium">{group.groupTitle}</td>
                    <td className="p-2 text-center">{group.totalItems}</td>
                    <td className="p-2 text-center text-green-600">{group.statusCounts.COMPLETED}</td>
                    <td className="p-2 text-center text-yellow-600">{group.statusCounts.NOT_COMPLETED}</td>
                    <td className="p-2 text-center text-red-600">{group.statusCounts.NOT_NEEDED}</td>
                    <td className="p-2 text-center text-purple-600">{group.statusCounts.HAS_QUESTIONS}</td>
                    <td className="p-2 text-center">
                      <div className="flex items-center gap-2">
                        <Progress value={group.completionRate} className="w-20" />
                        <span className="text-sm font-medium">{group.completionRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function OverviewAnalytics({ data }: { data: OverviewAnalyticsData }) {
  const { overview, checklists, directions, performance } = data;

  // Подготовка данных для графиков
  const directionChartData = directions.map(dir => ({
    name: dir.direction,
    чеклисты: dir.checklistCount,
    группы: dir.totalGroups,
    пункты: dir.totalItems,
  }));

  const checklistChartData = checklists.slice(0, 10).map(c => ({
    name: c.title.length > 20 ? c.title.substring(0, 20) + '...' : c.title,
    студентов: c.studentCount,
    групп: c.totalGroups,
    пунктов: c.totalItems,
  }));

  return (
    <div className="space-y-6">
      {/* Общая статистика */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Всего чеклистов</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{overview.totalChecklists}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Всего групп</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{overview.totalGroups}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Всего пунктов</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{overview.totalItems}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Всего студентов</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{overview.totalStudents}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Всего прогрессов</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overview.totalItemProgress}</div>
          </CardContent>
        </Card>
      </div>

      {/* График по направлениям */}
      <Card>
        <CardHeader>
          <CardTitle>Статистика по направлениям</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={directionChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="чеклисты" fill="#3b82f6" />
              <Bar dataKey="группы" fill="#10b981" />
              <Bar dataKey="пункты" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Производительность */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Средние показатели</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Среднее количество пунктов на чеклист</span>
              <span className="font-semibold">{performance.averageItemsPerChecklist}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Среднее количество групп на чеклист</span>
              <span className="font-semibold">{performance.averageGroupsPerChecklist}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Топ чеклисты</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {performance.mostPopularChecklist && (
              <div>
                <div className="text-sm text-gray-600">Самый популярный</div>
                <div className="font-semibold">{performance.mostPopularChecklist.title}</div>
                <div className="text-sm text-blue-600">{performance.mostPopularChecklist._count.progress} студентов</div>
              </div>
            )}
            {performance.mostComprehensiveChecklist && (
              <div>
                <div className="text-sm text-gray-600">Самый объемный</div>
                <div className="font-semibold">{performance.mostComprehensiveChecklist.title}</div>
                <div className="text-sm text-green-600">
                  {performance.mostComprehensiveChecklist.groups.reduce((sum, g) => sum + g.items.length, 0)} пунктов
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* График чеклистов */}
      <Card>
        <CardHeader>
          <CardTitle>Топ чеклисты по количеству студентов</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={checklistChartData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={120} />
              <Tooltip />
              <Bar dataKey="студентов" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
