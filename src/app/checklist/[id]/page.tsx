'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle, 
  Circle, 
  XCircle, 
  HelpCircle, 
  ChevronDown, 
  ChevronRight, 
  ArrowLeft,
  Target,
  Award,
  TrendingUp,
  Star,
  CheckSquare,
  AlertCircle,
  BookOpen,
  Users
} from 'lucide-react';
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
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    buttonColor: 'bg-emerald-500 hover:bg-emerald-600 text-white',
    iconColor: 'text-emerald-500',
    gradient: 'from-emerald-500 to-emerald-600'
  },
  NOT_COMPLETED: {
    label: 'Не выполнено',
    icon: Circle,
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    buttonColor: 'bg-slate-100 hover:bg-slate-200 text-slate-700',
    iconColor: 'text-slate-400',
    gradient: 'from-slate-400 to-slate-500'
  },
  NOT_NEEDED: {
    label: 'Ненужно',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    buttonColor: 'bg-red-100 hover:bg-red-200 text-red-700',
    iconColor: 'text-red-400',
    gradient: 'from-red-400 to-red-500'
  },
  HAS_QUESTIONS: {
    label: 'Есть вопросы',
    icon: HelpCircle,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    buttonColor: 'bg-blue-100 hover:bg-blue-200 text-blue-700',
    iconColor: 'text-blue-400',
    gradient: 'from-blue-400 to-blue-500'
  }
};

const directionLabels = {
  WORDPRESS: 'WordPress',
  VIBE_CODING: 'Vibe Coding',
  SHOPIFY: 'Shopify',
  GENERAL: 'Общие'
};

export default function ChecklistPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session } = useSession();
  const router = useRouter();
  const resolvedParams = use(params);
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
  }, [session, resolvedParams.id, router]);

  const fetchChecklist = async () => {
    try {
      const response = await fetch(`/api/student/checklists/${resolvedParams.id}`);
      if (response.ok) {
        const data = await response.json();
        setChecklist(data);
        // По умолчанию разворачиваем все группы
        setExpandedGroups(new Set(data.groups.map((g: { id: string }) => g.id)));
      } else {
        toast.error('Ошибка загрузки чеклиста');
      }
    } catch {
      toast.error('Ошибка загрузки чеклиста');
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async () => {
    try {
      console.log('Загружаем прогресс для чеклиста:', resolvedParams.id);
      const response = await fetch(`/api/student/checklists/${resolvedParams.id}/progress`);
      console.log('Ответ загрузки прогресса:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Данные прогресса:', data);
        setProgress(data);
      } else {
        console.log('Ошибка загрузки прогресса:', response.status);
      }
    } catch (error) {
      console.error('Ошибка загрузки прогресса:', error);
    }
  };

  const updateItemStatus = async (itemId: string, status: string) => {
    if (!progress) return;

    setUpdating(true);
    try {
      console.log('Обновляем статус:', { itemId, status });
      const response = await fetch(`/api/student/checklists/${resolvedParams.id}/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, status })
      });

      console.log('Ответ API:', response.status);
      if (response.ok) {
        const result = await response.json();
        console.log('Результат обновления:', result);
        // Обновляем локальное состояние
        setProgress(prev => {
          if (!prev) return prev;
          
          const itemProgress = prev.itemProgress || [];
          const existingIndex = itemProgress.findIndex(p => p.itemId === itemId);
          if (existingIndex >= 0) {
            const newProgress = { ...prev };
            newProgress.itemProgress = [...itemProgress];
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
                ...itemProgress,
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
    } catch {
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
    if (!progress || !progress.itemProgress) return 'NOT_COMPLETED';
    const itemProgress = progress.itemProgress.find(p => p.itemId === itemId);
    return itemProgress?.status || 'NOT_COMPLETED';
  };

  const getProgressStats = () => {
    if (!checklist || !progress) return { completed: 0, total: 0, percentage: 0 };

    const total = checklist.groups.reduce((sum, group) => sum + group.items.length, 0);
    const completed = (progress.itemProgress || []).filter(p => p.status === 'COMPLETED').length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percentage };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <p className="mt-4 text-slate-600 font-medium">Загрузка чеклиста...</p>
        </div>
      </div>
    );
  }

  if (!checklist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-white rounded-2xl p-8 shadow-xl">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Чеклист не найден</h1>
            <p className="text-slate-600 mb-6">Возможно, чеклист был удален или у вас нет доступа к нему.</p>
            <Button 
              onClick={() => router.back()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              Вернуться назад
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { completed, total, percentage } = getProgressStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Modern Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-slate-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4 lg:space-x-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="p-2 sm:p-3 rounded-xl hover:bg-slate-100 transition-all duration-200"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl">
                  <Target className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 truncate">{checklist.title}</h1>
                  {checklist.description && (
                    <p className="text-slate-600 mt-1 text-sm sm:text-base lg:text-lg line-clamp-2">{checklist.description}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between lg:justify-end space-x-4 lg:space-x-6">
              <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium">
                {directionLabels[checklist.direction as keyof typeof directionLabels] || checklist.direction}
              </Badge>
              <div className="text-right">
                <div className="flex items-center space-x-2 mb-1">
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-500" />
                  <p className="text-xs sm:text-sm text-slate-600 font-medium">Прогресс</p>
                </div>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900">
                  {completed} / {total}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Progress Section */}
      <div className="bg-white/60 backdrop-blur-sm border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <Award className="h-5 w-5 text-blue-600" />
                <span className="text-slate-700 font-medium">Общий прогресс</span>
              </div>
              <span className="text-2xl font-bold text-slate-900">{percentage}%</span>
            </div>
            <div className="relative">
              <Progress 
                value={percentage} 
                className="h-4 bg-slate-200 rounded-full overflow-hidden"
              />
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${percentage}%` }}
              />
            </div>
            {percentage === 100 && (
              <div className="flex items-center justify-center space-x-2 mt-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
                <Star className="h-5 w-5 text-emerald-600" />
                <span className="text-emerald-700 font-medium">Поздравляем! Чеклист завершен!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modern Checklist Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {checklist.groups.map((group) => {
            const groupCompleted = group.items.filter(item => getItemStatus(item.id) === 'COMPLETED').length;
            const groupTotal = group.items.length;
            const groupPercentage = groupTotal > 0 ? Math.round((groupCompleted / groupTotal) * 100) : 0;
            
            return (
              <Card key={group.id} className="overflow-hidden shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader 
                  className="cursor-pointer hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50 transition-all duration-300 p-4 sm:p-6"
                  onClick={() => toggleGroup(group.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                      <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex-shrink-0">
                        {expandedGroups.has(group.id) ? (
                          <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        ) : (
                          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-lg sm:text-xl font-bold text-slate-900 flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                          <span className="truncate">{group.title}</span>
                          <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm w-fit">
                            {groupTotal} пунктов
                          </Badge>
                        </CardTitle>
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mt-2">
                          <div className="flex items-center space-x-2">
                            <CheckSquare className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-500 flex-shrink-0" />
                            <span className="text-xs sm:text-sm text-slate-600">
                              {groupCompleted} из {groupTotal} выполнено
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 sm:w-24 bg-slate-200 rounded-full h-2 flex-shrink-0">
                              <div 
                                className="bg-gradient-to-r from-emerald-500 to-green-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${groupPercentage}%` }}
                              />
                            </div>
                            <span className="text-xs sm:text-sm font-medium text-slate-700">{groupPercentage}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                {expandedGroups.has(group.id) && (
                  <CardContent className="pt-0 p-4 sm:p-6">
                    <div className="space-y-4 sm:space-y-6">
                      {group.items.map((item) => {
                        const currentStatus = getItemStatus(item.id);
                        const statusInfo = statusConfig[currentStatus as keyof typeof statusConfig];
                        const StatusIcon = statusInfo.icon;

                        return (
                          <div
                            key={item.id}
                            className={`group p-4 sm:p-6 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg ${
                              statusInfo.borderColor
                            } ${statusInfo.bgColor} hover:scale-[1.01] sm:hover:scale-[1.02]`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start space-x-3 sm:space-x-4">
                                  <div className={`p-2 rounded-xl ${statusInfo.bgColor} ${statusInfo.borderColor} border-2 flex-shrink-0`}>
                                    <StatusIcon className={`h-5 w-5 sm:h-6 sm:w-6 ${statusInfo.iconColor}`} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-3">
                                      <h4 className="text-base sm:text-lg font-semibold text-slate-900 leading-tight">
                                        {item.title}
                                        {item.isRequired && (
                                          <span className="text-red-500 ml-1 sm:ml-2 text-lg sm:text-xl">*</span>
                                        )}
                                      </h4>
                                      <Badge 
                                        className={`${statusInfo.buttonColor} px-2 sm:px-3 py-1 rounded-full text-xs font-medium w-fit`}
                                      >
                                        {statusInfo.label}
                                      </Badge>
                                    </div>
                                    {item.description && (
                                      <p className="text-slate-600 text-sm leading-relaxed">
                                        {item.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Enhanced Status Buttons */}
                            <div className="flex flex-wrap gap-2 sm:gap-3 mt-4 sm:mt-6">
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
                                    className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 rounded-xl font-medium transition-all duration-200 text-xs sm:text-sm ${
                                      isActive 
                                        ? `${config.buttonColor} shadow-lg transform scale-105` 
                                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                                    }`}
                                  >
                                    <StatusIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                                    <span className="hidden sm:inline">{config.label}</span>
                                    <span className="sm:hidden">{config.label.split(' ')[0]}</span>
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
            );
          })}
        </div>

        {/* Enhanced Summary */}
        <div className="mt-8 sm:mt-12">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4 p-4 sm:p-6">
              <CardTitle className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2 sm:space-x-3">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                <span>Статистика выполнения</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {Object.entries(statusConfig).map(([status, config]) => {
                  const StatusIcon = config.icon;
                  const count = (progress?.itemProgress || []).filter(p => p.status === status).length;
                  
                  return (
                    <div key={status} className="text-center group">
                      <div className={`inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-2xl ${config.bgColor} mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-200`}>
                        <StatusIcon className={`h-6 w-6 sm:h-8 sm:w-8 ${config.iconColor}`} />
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">{count}</p>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium leading-tight">{config.label}</p>
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
