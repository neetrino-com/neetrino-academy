'use client';

import { useState, useEffect } from 'react';
import { Search, Check, X, FileText } from 'lucide-react';

interface Lecture {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  isActive: boolean;
}

interface LectureSelectorProps {
  selectedLectureId?: string;
  onLectureSelect: (lectureId: string | null) => void;
}

export default function LectureSelector({ 
  selectedLectureId, 
  onLectureSelect
}: LectureSelectorProps) {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);

  useEffect(() => {
    fetchLectures();
  }, []);

  useEffect(() => {
    if (selectedLectureId && lectures.length > 0) {
      const lecture = lectures.find(c => c.id === selectedLectureId);
      if (lecture) {
        setSelectedLecture(lecture);
      }
    }
  }, [selectedLectureId, lectures]);

  const fetchLectures = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/lectures/list');
      if (response.ok) {
        const data = await response.json();
        setLectures(data);
      }
    } catch (error) {
      console.error('Error fetching lectures:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLectures = lectures.filter(lecture =>
    lecture.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lecture.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLectureSelect = (lecture: Lecture) => {
    setSelectedLecture(lecture);
    onLectureSelect(lecture.id);
    setShowDropdown(false);
    setSearchTerm('');
  };

  const handleClearSelection = () => {
    setSelectedLecture(null);
    onLectureSelect(null);
    setShowDropdown(false);
    setSearchTerm('');
  };

  return (
    <div className="relative">
      {/* Выбранная лекция */}
      {selectedLecture ? (
        <div className="flex items-center justify-between p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="bg-cyan-100 p-2 rounded-lg">
              <FileText className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{selectedLecture.title}</h4>
              {selectedLecture.description && (
                <p className="text-sm text-gray-600 line-clamp-1">{selectedLecture.description}</p>
              )}
            </div>
          </div>
          <button
            onClick={handleClearSelection}
            className="text-gray-400 hover:text-red-500 transition-colors"
            title="Убрать лекцию"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        /* Кнопка выбора лекции */
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-full flex items-center justify-between p-3 border-2 border-dashed border-cyan-300 rounded-lg hover:border-cyan-400 hover:bg-cyan-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="bg-cyan-100 p-2 rounded-lg">
                <FileText className="w-5 h-5 text-cyan-600" />
              </div>
              <div className="text-left">
                <h4 className="font-medium text-gray-900">Выбрать лекцию</h4>
                <p className="text-sm text-gray-600">Прикрепить готовую лекцию к уроку</p>
              </div>
            </div>
            <div className="text-cyan-600">
              {showDropdown ? '▲' : '▼'}
            </div>
          </button>

          {/* Dropdown со списком лекций */}
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-hidden">
              {/* Поиск */}
              <div className="p-3 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Поиск лекций..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Список лекций */}
              <div className="max-h-60 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-600 mx-auto mb-2"></div>
                    Загрузка лекций...
                  </div>
                ) : filteredLectures.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    {searchTerm ? 'Лекции не найдены' : 'Нет доступных лекций'}
                  </div>
                ) : (
                  filteredLectures.map((lecture) => (
                    <button
                      key={lecture.id}
                      onClick={() => handleLectureSelect(lecture)}
                      className="w-full text-left p-3 hover:bg-cyan-50 border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-cyan-100 p-2 rounded-lg flex-shrink-0">
                          <FileText className="w-4 h-4 text-cyan-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">{lecture.title}</h4>
                          {lecture.description && (
                            <p className="text-sm text-gray-600 line-clamp-2 mt-1">{lecture.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              lecture.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {lecture.isActive ? 'Активна' : 'Неактивна'}
                            </span>
                          </div>
                        </div>
                        <Check className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Кнопка создания новой лекции */}
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => {
                    window.open('/admin/lectures/create', '_blank');
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 text-cyan-600 hover:text-cyan-700 font-medium transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Создать новую лекцию
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
