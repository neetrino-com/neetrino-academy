'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Send, AlertCircle } from 'lucide-react';
import FileUpload from '@/components/ui/FileUpload';

// Схема валидации
const submissionSchema = z.object({
  content: z.string().optional(),
  fileUrl: z.string().optional(),
}).refine(data => data.content || data.fileUrl, {
  message: 'Необходимо предоставить текст или файл'
});

type SubmissionFormData = z.infer<typeof submissionSchema>;

interface SimpleSubmissionFormProps {
  assignmentId: string;
  onSuccess?: () => void;
}

export default function SimpleSubmissionForm({
  assignmentId,
  onSuccess
}: SimpleSubmissionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      content: '',
      fileUrl: ''
    }
  });

  const content = watch('content');

  const handleFormSubmit = async (data: SubmissionFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Если есть загруженный файл, добавляем его URL
      const submissionData = {
        ...data,
        fileUrl: fileUrl || data.fileUrl
      };
      
      const response = await fetch(`/api/assignments/${assignmentId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка отправки решения');
      }

      // Успешная отправка
      reset();
      setFileUrl('');
      alert('Решение успешно отправлено!');
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (fileUrl: string) => {
    setFileUrl(fileUrl);
  };

  const handleFileError = (error: string) => {
    setError(error);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Текстовое решение */}
      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
          Текстовое решение
        </label>
        <textarea
          {...register('content')}
          id="content"
          rows={8}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Опишите ваше решение, подход к задаче, использованные технологии..."
        />
        <p className="mt-1 text-xs text-gray-500">
          Опишите ваше решение подробно. Это поможет преподавателю лучше понять ваш подход.
        </p>
      </div>

      {/* Загрузка файла */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Прикрепить файл
        </label>
        <FileUpload
          onFileUpload={handleFileUpload}
          onError={handleFileError}
          acceptedTypes=".pdf,.doc,.docx,.zip,.rar,.jpg,.jpeg,.png"
          maxSize={10}
        />
      </div>

      {/* Ссылка на файл */}
      <div>
        <label htmlFor="fileUrl" className="block text-sm font-medium text-gray-700 mb-2">
          Или укажите ссылку на файл
        </label>
        <input
          {...register('fileUrl')}
          type="url"
          id="fileUrl"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://drive.google.com/file/..."
        />
        <p className="mt-1 text-xs text-gray-500">
          Если файл уже загружен в облако, укажите прямую ссылку
        </p>
      </div>

      {/* Валидация */}
      {(errors.content || errors.fileUrl) && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-600">
            Необходимо предоставить текст или файл
          </p>
        </div>
      )}

      {/* Ошибка */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

              {/* Кнопка отправки */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || (!content && !fileUrl)}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Отправка...' : 'Отправить решение'}
          </button>
        

      </div>
    </form>
  );
}
