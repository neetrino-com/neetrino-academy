'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Circle, XCircle, HelpCircle, ChevronDown, ChevronRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  isRequired: boolean;
  status: 'COMPLETED' | 'NOT_COMPLETED' | 'NOT_NEEDED' | 'HAS_QUESTIONS';
}

interface ChecklistGroup {
  id: string;
  title: string;
  items: ChecklistItem[];
}

interface Checklist {
  id: string;
  title: string;
  description?: string;
  direction: string;
  groups: ChecklistGroup[];
}

interface ChecklistProgress {
  id: string;
  userId: string;
  checklistId: string;
  itemProgress: {
    id: string;
    itemId: string;
    status: 'COMPLETED' | 'NOT_COMPLETED' | 'NOT_NEEDED' | 'HAS_QUESTIONS';
    updatedAt: string;
  }[];
}

const statusConfig = {
  COMPLETED: {
    label: 'Выполнено',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200'
  },
  NOT_COMPLETED: {
    label: 'Не выполнено',
    icon: Circle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200'
  },
  NOT_NEEDED: {
    label: 'Ненужно',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200'
  },
  HAS_QUESTIONS: {
    label: 'Есть вопросы',
    icon: HelpCircle,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200'
  }
};

const directionLabels = {
  WORDPRESS: 'WordPress',
  VIBE_CODING: 'Vibe Coding',
  SHOPIFY: 'Shopify',
  GENERAL: 'Общие'
};

export default function ChecklistPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [progress, setProgress] = useState<ChecklistProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!session?.user) {
      router.push('/login');
      return;
    }

    fetchChecklist();
    fetchProgress();
  }, [session, params.id]);

  const fetchChecklist = async () => {
    try {
      const response = await fetch(`/api/student/checklists/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setChecklist(data);
        // По умолчанию разворачиваем все группы
        setExpandedGroups(new Set(data.groups.map((g: { id: string }) => g.id)));
      } else {
        toast.error('Ошибка загрузки чеклиста');
      }
    } catch (error) {
      toast.error('Ошибка загрузки чеклиста');
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async () => {
    try {
      const response = await fetch(`/api/student/checklists/${params.id}/progress`);
      if (response.ok) {
        const data = await response.json();
        setProgress(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки прогресса:', error);
    }
  };

  const updateItemStatus = async (itemId: string, status: string) => {
    if (!progress) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/student/checklists/${params.id}/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, status })
      });

      if (response.ok) {
        // Обновляем локальное состояние
        setProgress(prev => {
          if (!prev) return prev;
          
          const existingIndex = prev.itemProgress.findIndex(p => p.itemId === itemId);
          if (existingIndex >= 0) {
            const newProgress = { ...prev };
            newProgress.itemProgress[existingIndex] = {
              ...newProgress.itemProgress[existingIndex],
              status: status as 'COMPLETED' | 'NOT_COMPLETED' | 'IN_PROGRESS',
              updatedAt: new Date().toISOString()
            };
            return newProgress;
          } else {
            return {
              ...prev,
              itemProgress: [
                ...prev.itemProgress,
                {
                  id: `temp-${Date.now()}`,
                  itemId,
                  status: status as 'COMPLETED' | 'NOT_COMPLETED' | 'IN_PROGRESS',
                  updatedAt: new Date().toISOString()
                }
              ]
            };
          }
        });

        toast.success('Статус обновлен');
      } else {
        toast.error('Ошибка обновления статуса');
      }
    } catch (error) {
      toast.error('Ошибка обновления статуса');
    } finally {
      setUpdating(false);
    }
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const getItemStatus = (itemId: string) => {
    if (!progress) return 'NOT_COMPLETED';
    const itemProgress = progress.itemProgress.find(p => p.itemId === itemId);
    return itemProgress?.status || 'NOT_COMPLETED';
  };

  const getProgressStats = () => {
    if (!checklist || !progress) return { completed: 0, total: 0, percentage: 0 };

    const total = checklist.groups.reduce((sum, group) => sum + group.items.length, 0);
    const completed = progress.itemProgress.filter(p => p.status === 'COMPLETED').length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percentage };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка чеклиста...</p>
        </div>
      </div>
    );
  }

  if (!checklist) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Чеклист не найден</h1>
          <Button onClick={() => router.back()}>Вернуться назад</Button>
        </div>
      </div>
    );
  }

  const { completed, total, percentage } = getProgressStats();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{checklist.title}</h1>
                {checklist.description && (
                  <p className="text-gray-600 mt-1">{checklist.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary">
                {directionLabels[checklist.direction as keyof typeof directionLabels] || checklist.direction}
              </Badge>
              <div className="text-right">
                <p className="text-sm text-gray-600">Прогресс</p>
                <p className="text-lg font-semibold text-gray-900">
                  {completed} / {total}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Общий прогресс</span>
              <span className="font-medium text-gray-900">{percentage}%</span>
            </div>
            <Progress value={percentage} className="h-3" />
          </div>
        </div>
      </div>

      {/* Checklist Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {checklist.groups.map((group) => (
            <Card key={group.id} className="overflow-hidden">
              <CardHeader 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleGroup(group.id)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-3">
                    {expandedGroups.has(group.id) ? (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-500" />
                    )}
                    <span>{group.title}</span>
                    <Badge variant="outline" className="ml-2">
                      {group.items.length} пунктов
                    </Badge>
                  </CardTitle>
                </div>
              </CardHeader>
              
              {expandedGroups.has(group.id) && (
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {group.items.map((item) => {
                      const currentStatus = getItemStatus(item.id);
                      const statusInfo = statusConfig[currentStatus as keyof typeof statusConfig];
                      const StatusIcon = statusInfo.icon;

                      return (
                        <div
                          key={item.id}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            statusInfo.borderColor
                          } ${statusInfo.bgColor}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
                                <h4 className="font-medium text-gray-900">
                                  {item.title}
                                  {item.isRequired && (
                                    <span className="text-red-500 ml-1">*</span>
                                  )}
                                </h4>
                              </div>
                              {item.description && (
                                <p className="text-gray-600 text-sm ml-8">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Status Buttons */}
                          <div className="flex flex-wrap gap-2 mt-4 ml-8">
                            {Object.entries(statusConfig).map(([status, config]) => {
                              const StatusIcon = config.icon;
                              const isActive = currentStatus === status;
                              
                              return (
                                <Button
                                  key={status}
                                  variant={isActive ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => updateItemStatus(item.id, status)}
                                  disabled={updating}
                                  className={`flex items-center space-x-2 ${
                                    isActive 
                                      ? 'bg-blue-600 hover:bg-blue-700' 
                                      : 'hover:bg-gray-50'
                                  }`}
                                >
                                  <StatusIcon className="h-4 w-4" />
                                  <span>{config.label}</span>
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Статистика выполнения</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(statusConfig).map(([status, config]) => {
                  const StatusIcon = config.icon;
                  const count = progress?.itemProgress.filter(p => p.status === status).length || 0;
                  
                  return (
                    <div key={status} className="text-center">
                      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${config.bgColor} mb-2`}>
                        <StatusIcon className={`h-6 w-6 ${config.color}`} />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{count}</p>
                      <p className="text-sm text-gray-600">{config.label}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
