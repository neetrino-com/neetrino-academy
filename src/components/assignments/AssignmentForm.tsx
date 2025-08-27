'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, FileText, Save, X } from 'lucide-react';

// Схема валидации
const assignmentSchema = z.object({
  title: z.string().min(1, 'Название обязательно'),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  moduleId: z.string().min(1, 'Выберите модуль'),
});

type AssignmentFormData = z.infer<typeof assignmentSchema>;

interface Module {
  id: string;
  title: string;
  course: {
    id: string;
    title: string;
  };
}

interface AssignmentFormProps {
  modules: Module[];
  initialData?: Partial<AssignmentFormData>;
  onSubmit: (data: AssignmentFormData) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
}

export default function AssignmentForm({
  modules,
  initialData,
  onSubmit,
  onCancel,
  isEditing = false
}: AssignmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: initialData || {
      title: '',
      description: '',
      dueDate: '',
      moduleId: ''
    }
  });

  const selectedModuleId = watch('moduleId');
  const selectedModule = modules.find(m => m.id === selectedModuleId);

  const handleFormSubmit = async (data: AssignmentFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {isEditing ? 'Редактировать задание' : 'Создать новое задание'}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Название */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Название задания *
          </label>
          <input
            {...register('title')}
            type="text"
            id="title"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Введите название задания"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        {/* Модуль */}
        <div>
          <label htmlFor="moduleId" className="block text-sm font-medium text-gray-700 mb-2">
            Модуль *
          </label>
          <select
            {...register('moduleId')}
            id="moduleId"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.moduleId ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Выберите модуль</option>
            {modules.map((module) => (
              <option key={module.id} value={module.id}>
                {module.course.title} - {module.title}
              </option>
            ))}
          </select>
          {errors.moduleId && (
            <p className="mt-1 text-sm text-red-600">{errors.moduleId.message}</p>
          )}
        </div>

        {/* Информация о выбранном модуле */}
        {selectedModule && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex items-center gap-2 text-sm text-blue-800">
              <FileText className="w-4 h-4" />
              <span>
                <strong>Курс:</strong> {selectedModule.course.title} | 
                <strong> Модуль:</strong> {selectedModule.title}
              </span>
            </div>
          </div>
        )}

        {/* Описание */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Описание задания
          </label>
          <textarea
            {...register('description')}
            id="description"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Опишите задание, требования и критерии оценки..."
          />
        </div>

        {/* Дедлайн */}
        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
            Дедлайн сдачи
          </label>
          <div className="relative">
            <input
              {...register('dueDate')}
              type="datetime-local"
              id="dueDate"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Calendar className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Оставьте пустым, если дедлайн не установлен
          </p>
        </div>

        {/* Ошибка */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Кнопки */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium transition-colors"
            disabled={isSubmitting}
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? 'Сохранение...' : (isEditing ? 'Сохранить' : 'Создать')}
          </button>
        </div>
      </form>
    </div>
  );
}
