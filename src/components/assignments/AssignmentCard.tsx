'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, FileText, Users, Clock, CheckCircle, XCircle } from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  createdAt: string;
  module: {
    id: string;
    title: string;
    course: {
      id: string;
      title: string;
      slug: string;
    };
  };
  creator: {
    name: string;
    email: string;
  };
  _count: {
    submissions: number;
  };
  submissions?: Array<{
    id: string;
    submittedAt: string;
    score?: number;
  }>;
}

interface AssignmentCardProps {
  assignment: Assignment;
  userRole?: 'STUDENT' | 'TEACHER' | 'ADMIN';
  userSubmission?: {
    id: string;
    submittedAt: string;
    score?: number;
  };
}

export default function AssignmentCard({ 
  assignment, 
  userRole = 'STUDENT',
  userSubmission 
}: AssignmentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOverdue = assignment.dueDate && new Date() > new Date(assignment.dueDate);
  const isSubmitted = !!userSubmission;
  const isGraded = userSubmission?.score !== undefined;

  const getStatusColor = () => {
    if (isGraded) {
      return userSubmission.score! >= 70 ? 'text-green-600' : 'text-red-600';
    }
    if (isSubmitted) return 'text-blue-600';
    if (isOverdue) return 'text-red-600';
    return 'text-gray-600';
  };

  const getStatusText = () => {
    if (isGraded) {
      return `Оценено: ${userSubmission.score}/100`;
    }
    if (isSubmitted) return 'Отправлено';
    if (isOverdue) return 'Просрочено';
    return 'Не отправлено';
  };

  const getStatusIcon = () => {
    if (isGraded) {
      return userSubmission.score! >= 70 ? 
        <CheckCircle className="w-4 h-4" /> : 
        <XCircle className="w-4 h-4" />;
    }
    if (isSubmitted) return <CheckCircle className="w-4 h-4" />;
    if (isOverdue) return <XCircle className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="p-6">
        {/* Заголовок и статус */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {assignment.title}
            </h3>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                <span>{assignment.module.course.title} - {assignment.module.title}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{assignment._count.submissions} сдач</span>
              </div>
            </div>
          </div>
          <div className={`flex items-center gap-2 ${getStatusColor()}`}>
            {getStatusIcon()}
            <span className="text-sm font-medium">{getStatusText()}</span>
          </div>
        </div>

        {/* Описание */}
        {assignment.description && (
          <div className="mb-4">
            <p className="text-gray-700 text-sm">
              {isExpanded 
                ? assignment.description 
                : `${assignment.description.slice(0, 150)}${assignment.description.length > 150 ? '...' : ''}`
              }
            </p>
            {assignment.description.length > 150 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-blue-600 hover:text-blue-800 text-sm mt-1"
              >
                {isExpanded ? 'Свернуть' : 'Читать далее'}
              </button>
            )}
          </div>
        )}

        {/* Метаданные */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Создано: {formatDate(assignment.createdAt)}</span>
            </div>
            {assignment.dueDate && (
              <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : ''}`}>
                <Clock className="w-4 h-4" />
                <span>Дедлайн: {formatDate(assignment.dueDate)}</span>
              </div>
            )}
          </div>
          <div className="text-xs">
            Автор: {assignment.creator.name}
          </div>
        </div>

        {/* Действия */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <Link
            href={`/assignments/${assignment.id}`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            {userRole === 'STUDENT' ? 'Открыть задание' : 'Просмотреть'}
          </Link>
          
          {userRole === 'STUDENT' && !isSubmitted && !isOverdue && (
            <Link
              href={`/assignments/${assignment.id}/submit`}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Отправить решение
            </Link>
          )}

          {userRole === 'TEACHER' && (
            <Link
              href={`/assignments/${assignment.id}/submissions`}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Просмотреть сдачи ({assignment._count.submissions})
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
