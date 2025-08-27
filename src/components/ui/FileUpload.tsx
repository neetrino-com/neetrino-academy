'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, X, AlertCircle, CheckCircle } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (fileUrl: string) => void;
  onError?: (error: string) => void;
  acceptedTypes?: string;
  maxSize?: number; // в MB
  className?: string;
}

export default function FileUpload({
  onFileUpload,
  onError,
  acceptedTypes = ".pdf,.doc,.docx,.zip,.rar,.jpg,.jpeg,.png",
  maxSize = 10,
  className = ""
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    // Валидация размера файла
    if (file.size > maxSize * 1024 * 1024) {
      onError?.(`Файл слишком большой. Максимальный размер: ${maxSize}MB`);
      return;
    }

    // Валидация типа файла
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = acceptedTypes.replace(/\./g, '').split(',');
    
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      onError?.(`Неподдерживаемый тип файла. Разрешены: ${acceptedTypes}`);
      return;
    }

    try {
      setIsUploading(true);
      
      // Создаем FormData для загрузки
      const formData = new FormData();
      formData.append('file', file);

      // Загружаем файл через наш API
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка загрузки файла');
      }

      const data = await response.json();
      const fileUrl = data.fileUrl;
      
      setUploadedFile(fileUrl);
      onFileUpload(fileUrl);
    } catch (error) {
      console.error('Ошибка загрузки файла:', error);
      onError?.(error instanceof Error ? error.message : 'Ошибка загрузки файла');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Область загрузки */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : uploadedFile 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileInput}
          className="hidden"
          accept={acceptedTypes}
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
            <span className="text-sm text-gray-600">Загрузка файла...</span>
          </div>
        ) : uploadedFile ? (
          <div className="flex flex-col items-center">
            <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
            <span className="text-sm text-green-600 mb-2">
              Файл успешно загружен!
            </span>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileText className="w-4 h-4" />
              <span>{uploadedFile.split('/').pop()}</span>
            </div>
            <button
              type="button"
              onClick={removeFile}
              className="mt-2 text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Удалить файл
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-sm text-gray-600 mb-1">
              Нажмите для выбора файла или перетащите сюда
            </span>
            <span className="text-xs text-gray-500">
              {acceptedTypes} (до {maxSize}MB)
            </span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Выбрать файл
            </button>
          </div>
        )}
      </div>

      {/* Информация о загруженном файле */}
      {uploadedFile && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-700">
                Файл готов к отправке
              </span>
            </div>
            <a
              href={uploadedFile}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-500 hover:text-blue-700"
            >
              Просмотреть
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
