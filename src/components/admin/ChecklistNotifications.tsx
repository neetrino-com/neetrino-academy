'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  CheckCircle, 
  Clock, 
  User, 
  Calendar,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';

interface ChecklistNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  metadata: {
    checklistId: string;
    checklistTitle: string;
    direction: string;
    completionPercentage?: number;
    completedAt?: string;
  };
}

interface ChecklistNotificationsProps {
  checklistId: string;
}

export default function ChecklistNotifications({ checklistId }: ChecklistNotificationsProps) {
  const [notifications, setNotifications] = useState<ChecklistNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRead, setShowRead] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [checklistId]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/checklists/${checklistId}/notifications`);
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      } else {
        setError('Ошибка загрузки уведомлений');
      }
    } catch (error) {
      setError('Ошибка загрузки данных');
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true })
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const filteredNotifications = showRead 
    ? notifications 
    : notifications.filter(n => !n.isRead);

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

  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Уведомлений пока нет
          </h3>
          <p className="text-gray-600">
            Когда студенты будут завершать этот чеклист, здесь появятся уведомления
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Заголовок и фильтры */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Уведомления о завершении
          </h3>
          <Badge variant="secondary">
            {notifications.length}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={showRead ? "default" : "outline"}
            size="sm"
            onClick={() => setShowRead(!showRead)}
          >
            {showRead ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
            {showRead ? 'Показать все' : 'Только непрочитанные'}
          </Button>
        </div>
      </div>

      {/* Список уведомлений */}
      <div className="space-y-3">
        {filteredNotifications.map((notification) => (
          <Card key={notification.id} className={notification.isRead ? 'opacity-75' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      {notification.isRead ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <Bell className="w-5 h-5 text-blue-600" />
                      )}
                      <h4 className="font-medium text-gray-900">
                        {notification.title}
                      </h4>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {notification.metadata.direction}
                    </Badge>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3">
                    {notification.message}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>{notification.user.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {new Date(notification.createdAt).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                    {notification.metadata.completionPercentage && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                        <span className="text-green-600">
                          {notification.metadata.completionPercentage}% выполнено
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  {!notification.isRead && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => markAsRead(notification.id)}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Прочитано
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteNotification(notification.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Статистика */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {notifications.length}
              </div>
              <div className="text-sm text-gray-600">Всего уведомлений</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {notifications.filter(n => n.isRead).length}
              </div>
              <div className="text-sm text-gray-600">Прочитано</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {notifications.filter(n => !n.isRead).length}
              </div>
              <div className="text-sm text-gray-600">Непрочитано</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
