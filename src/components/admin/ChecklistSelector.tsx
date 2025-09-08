'use client';

import { useState, useEffect } from 'react';
import { Search, Check, X, ClipboardList } from 'lucide-react';

interface Checklist {
  id: string;
  title: string;
  description?: string;
  direction: 'WORDPRESS' | 'VIBE_CODING' | 'SHOPIFY';
  thumbnail?: string;
  isActive: boolean;
  _count?: {
    groups: number;
    items: number;
  };
}

interface ChecklistSelectorProps {
  selectedChecklistId?: string;
  onChecklistSelect: (checklistId: string | null) => void;
  direction?: 'WORDPRESS' | 'VIBE_CODING' | 'SHOPIFY';
}

const directionIcons = {
  WORDPRESS: '🌐',
  VIBE_CODING: '💻',
  SHOPIFY: '🛍️'
};

const directionColors = {
  WORDPRESS: 'text-blue-600',
  VIBE_CODING: 'text-purple-600',
  SHOPIFY: 'text-green-600'
};

export default function ChecklistSelector({ 
  selectedChecklistId, 
  onChecklistSelect,
  direction 
}: ChecklistSelectorProps) {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChecklists();
  }, []);

  useEffect(() => {
    if (selectedChecklistId && checklists.length > 0) {
      const checklist = checklists.find(c => c.id === selectedChecklistId);
      if (checklist) {
        setSelectedChecklist(checklist);
      }
    }
  }, [selectedChecklistId, checklists]);

  const fetchChecklists = async () => {
    try {
      setLoading(true);
      console.log('🔍 Загружаем чеклисты...');
      
      const response = await fetch('/api/admin/checklists?limit=1000');
      console.log('📡 Ответ API:', response.status, response.statusText);
      
      const data = await response.json();
      console.log('📊 Данные API:', data);
      
      if (response.ok) {
        // Фильтруем по направлению, если указано
        let filteredChecklists = data.checklists || [];
        console.log('📋 Всего чеклистов:', filteredChecklists.length);
        
        if (direction) {
          filteredChecklists = filteredChecklists.filter((c: Checklist) => c.direction === direction);
          console.log(`🎯 Отфильтровано по направлению ${direction}:`, filteredChecklists.length);
        }
        
        setChecklists(filteredChecklists);
        console.log('✅ Чеклисты загружены:', filteredChecklists);
      } else {
        console.error('❌ Ошибка API:', data.error);
        setError(data.error || 'Ошибка загрузки чеклистов');
        setChecklists([]);
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки чеклистов:', error);
      setError('Ошибка соединения с сервером');
      setChecklists([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredChecklists = checklists.filter(checklist =>
    checklist.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    checklist.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleChecklistSelect = (checklist: Checklist) => {
    setSelectedChecklist(checklist);
    onChecklistSelect(checklist.id);
    setShowDropdown(false);
    setSearchTerm('');
  };

  const handleClearSelection = () => {
    setSelectedChecklist(null);
    onChecklistSelect(null);
    setShowDropdown(false);
    setSearchTerm('');
  };

  return (
    <div className="relative">
      {/* Выбранный чеклист */}
      {selectedChecklist ? (
        <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 p-2 rounded-lg">
              <ClipboardList className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{selectedChecklist.title}</h4>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className={directionColors[selectedChecklist.direction]}>
                  {directionIcons[selectedChecklist.direction]} {selectedChecklist.direction}
                </span>
                {selectedChecklist._count && (
                  <span>• {selectedChecklist._count.groups} групп, {selectedChecklist._count.items} пунктов</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handleClearSelection}
            className="text-gray-400 hover:text-red-500 transition-colors"
            title="Убрать чеклист"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        /* Кнопка выбора чеклиста */
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="w-full p-3 border-2 border-dashed border-amber-300 rounded-lg text-amber-600 hover:border-amber-400 hover:bg-amber-50 transition-colors flex items-center justify-center gap-2"
        >
          <ClipboardList size={20} />
          <span>Выбрать чеклист</span>
        </button>
      )}

      {/* Выпадающий список */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-hidden">
          {/* Поиск */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Поиск чеклистов..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Список чеклистов */}
          <div className="max-h-60 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600 mx-auto mb-2"></div>
                Загрузка чеклистов...
              </div>
            ) : error ? (
              <div className="p-4 text-center text-red-500">
                <div className="mb-2">❌ {error}</div>
                <button 
                  onClick={() => {
                    setError(null);
                    fetchChecklists();
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Попробовать снова
                </button>
              </div>
            ) : filteredChecklists.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {searchTerm ? 'Чеклисты не найдены' : 'Нет доступных чеклистов'}
              </div>
            ) : (
              filteredChecklists.map((checklist) => (
                <button
                  key={checklist.id}
                  onClick={() => handleChecklistSelect(checklist)}
                  className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{checklist.title}</h4>
                      {checklist.description && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {checklist.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className={directionColors[checklist.direction]}>
                          {directionIcons[checklist.direction]} {checklist.direction}
                        </span>
                        {checklist._count && (
                          <span>• {checklist._count.groups} групп, {checklist._count.items} пунктов</span>
                        )}
                      </div>
                    </div>
                    {selectedChecklistId === checklist.id && (
                      <Check className="text-amber-600" size={20} />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Создать новый чеклист */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => {
                setShowDropdown(false);
                window.open('/admin/checklists/create', '_blank');
              }}
              className="w-full p-2 text-center text-amber-600 hover:text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
            >
              + Создать новый чеклист
            </button>
          </div>
        </div>
      )}

      {/* Затемнение фона при открытом dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}
