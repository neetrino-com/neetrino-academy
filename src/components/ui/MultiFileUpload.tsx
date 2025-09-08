'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, X, AlertCircle, CheckCircle, Image, File, Trash2 } from 'lucide-react';

interface UploadedFile {
  id: string;
  url: string;
  name: string;
  size: number;
  type: string;
  publicId?: string;
}

interface MultiFileUploadProps {
  onFilesUpload: (files: UploadedFile[]) => void;
  onError?: (error: string) => void;
  acceptedTypes?: string;
  maxSize?: number; // в MB
  maxFiles?: number; // максимальное количество файлов
  className?: string;
  initialFiles?: UploadedFile[];
}

export default function MultiFileUpload({
  onFilesUpload,
  onError,
  acceptedTypes = ".pdf,.doc,.docx,.zip,.rar,.jpg,.jpeg,.png,.gif,.webp",
  maxSize = 10,
  maxFiles = 10,
  className = "",
  initialFiles = []
}: MultiFileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(initialFiles);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (files: FileList) => {
    const filesArray = Array.from(files);
    
    // Проверяем лимит файлов
    if (uploadedFiles.length + filesArray.length > maxFiles) {
      onError?.(`Максимальное количество файлов: ${maxFiles}`);
      return;
    }

    // Валидация каждого файла
    for (const file of filesArray) {
      if (file.size > maxSize * 1024 * 1024) {
        onError?.(`Файл "${file.name}" слишком большой. Максимальный размер: ${maxSize}MB`);
        return;
      }

      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const allowedExtensions = acceptedTypes.replace(/\./g, '').split(',');
      
      if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
        onError?.(`Неподдерживаемый тип файла "${file.name}". Разрешены: ${acceptedTypes}`);
        return;
      }
    }

    try {
      setIsUploading(true);
      
      const newUploadedFiles: UploadedFile[] = [];
      
      // Загружаем файлы последовательно
      for (const file of filesArray) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Ошибка загрузки файла:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(errorData.details || errorData.error || `Ошибка загрузки файла "${file.name}"`);
      }

        const data = await response.json();
        newUploadedFiles.push({
          id: Math.random().toString(36).substr(2, 9),
          url: data.fileUrl,
          name: data.fileName || file.name,
          size: data.fileSize || file.size,
          type: data.fileType || file.type,
          publicId: data.publicId
        });
      }

      const updatedFiles = [...uploadedFiles, ...newUploadedFiles];
      setUploadedFiles(updatedFiles);
      onFilesUpload(updatedFiles);
    } catch (error) {
      console.error('Ошибка загрузки файлов:', error);
      onError?.(error instanceof Error ? error.message : 'Ошибка загрузки файлов');
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
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files);
    }
  };

  const removeFile = (fileId: string) => {
    const updatedFiles = uploadedFiles.filter(file => file.id !== fileId);
    setUploadedFiles(updatedFiles);
    onFilesUpload(updatedFiles);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="w-4 h-4" />;
    }
    return <File className="w-4 h-4" />;
  };

  const isImageFile = (fileType: string) => {
    return fileType.startsWith('image/');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Область загрузки */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : uploadedFiles.length > 0
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
          multiple
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
            <span className="text-sm text-gray-600">Загрузка файлов...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-sm text-gray-600 mb-1">
              Нажмите для выбора файлов или перетащите сюда
            </span>
            <span className="text-xs text-gray-500 mb-2">
              {acceptedTypes} (до {maxSize}MB каждый)
            </span>
            <span className="text-xs text-gray-400 mb-3">
              Максимум {maxFiles} файлов
            </span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Выбрать файлы
            </button>
          </div>
        )}
      </div>

      {/* Список загруженных файлов */}
      {uploadedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Загруженные файлы ({uploadedFiles.length})
            </span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-blue-500 hover:text-blue-700"
              disabled={isUploading}
            >
              + Добавить еще
            </button>
          </div>
          
          <div className="space-y-2">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className={`p-3 bg-gray-50 border border-gray-200 rounded-lg ${
                  isImageFile(file.type) ? 'flex gap-3' : 'flex items-center justify-between'
                }`}
              >
                {isImageFile(file.type) ? (
                  // Превью для изображений
                  <>
                    <div className="flex-shrink-0">
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Image className="w-4 h-4 text-green-600" />
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        {formatFileSize(file.size)}
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700 text-xs flex items-center gap-1"
                          title="Открыть изображение"
                        >
                          <FileText className="w-3 h-3" />
                          Открыть
                        </a>
                        <button
                          type="button"
                          onClick={() => removeFile(file.id)}
                          className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1"
                          title="Удалить файл"
                        >
                          <Trash2 className="w-3 h-3" />
                          Удалить
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  // Обычное отображение для файлов
                  <>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getFileIcon(file.type)}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700 p-1"
                        title="Просмотреть файл"
                      >
                        <FileText className="w-4 h-4" />
                      </a>
                      <button
                        type="button"
                        onClick={() => removeFile(file.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Удалить файл"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
