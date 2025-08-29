'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronRight, 
  GripVertical, 
  Save, 
  X,
  Globe,
  Monitor,
  ShoppingBag
} from 'lucide-react';

interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  order: number;
  isRequired: boolean;
}

interface ChecklistGroup {
  id: string;
  title: string;
  description?: string;
  order: number;
  isCollapsed: boolean;
  items: ChecklistItem[];
}

interface ChecklistFormData {
  title: string;
  description: string;
  direction: 'WORDPRESS' | 'VIBE_CODING' | 'SHOPIFY';
  thumbnail: string;
  isActive: boolean;
  groups: ChecklistGroup[];
}

interface ChecklistFormProps {
  mode: 'create' | 'edit';
  initialData?: ChecklistFormData;
  checklistId?: string;
}

const directionOptions = [
  { value: 'WORDPRESS', label: 'WordPress', icon: Globe, color: 'text-blue-600' },
  { value: 'VIBE_CODING', label: 'Vibe Coding', icon: Monitor, color: 'text-purple-600' },
  { value: 'SHOPIFY', label: 'Shopify', icon: ShoppingBag, color: 'text-green-600' }
];

export default function ChecklistForm({ mode, initialData, checklistId }: ChecklistFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ChecklistFormData>({
    title: '',
    description: '',
    direction: 'WORDPRESS',
    thumbnail: '',
    isActive: true,
    groups: []
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const addGroup = () => {
    const newGroup: ChecklistGroup = {
      id: `temp-${Date.now()}`,
      title: '',
      description: '',
      order: formData.groups.length,
      isCollapsed: false,
      items: []
    };
    setFormData(prev => ({
      ...prev,
      groups: [...prev.groups, newGroup]
    }));
  };

  const removeGroup = (groupId: string) => {
    setFormData(prev => ({
      ...prev,
      groups: prev.groups.filter(g => g.id !== groupId)
    }));
  };

  const updateGroup = (groupId: string, updates: Partial<ChecklistGroup>) => {
    setFormData(prev => ({
      ...prev,
      groups: prev.groups.map(g => 
        g.id === groupId ? { ...g, ...updates } : g
      )
    }));
  };

  const addItem = (groupId: string) => {
    const group = formData.groups.find(g => g.id === groupId);
    if (!group) return;

    const newItem: ChecklistItem = {
      id: `temp-${Date.now()}`,
      title: '',
      description: '',
      order: group.items.length,
      isRequired: true
    };

    setFormData(prev => ({
      ...prev,
      groups: prev.groups.map(g => 
        g.id === groupId 
          ? { ...g, items: [...g.items, newItem] }
          : g
      )
    }));
  };

  const removeItem = (groupId: string, itemId: string) => {
    setFormData(prev => ({
      ...prev,
      groups: prev.groups.map(g => 
        g.id === groupId 
          ? { ...g, items: g.items.filter(i => i.id !== itemId) }
          : g
      )
    }));
  };

  const updateItem = (groupId: string, itemId: string, updates: Partial<ChecklistItem>) => {
    setFormData(prev => ({
      ...prev,
      groups: prev.groups.map(g => 
        g.id === groupId 
          ? { 
              ...g, 
              items: g.items.map(i => 
                i.id === itemId ? { ...i, ...updates } : i
              )
            }
          : g
      )
    }));
  };

  const moveGroup = (groupId: string, direction: 'up' | 'down') => {
    setFormData(prev => {
      const groups = [...prev.groups];
      const index = groups.findIndex(g => g.id === groupId);
      
      if (direction === 'up' && index > 0) {
        [groups[index], groups[index - 1]] = [groups[index - 1], groups[index]];
        groups[index].order = index;
        groups[index - 1].order = index - 1;
      } else if (direction === 'down' && index < groups.length - 1) {
        [groups[index], groups[index + 1]] = [groups[index + 1], groups[index]];
        groups[index].order = index;
        groups[index + 1].order = index + 1;
      }
      
      return { ...prev, groups };
    });
  };

  const moveItem = (groupId: string, itemId: string, direction: 'up' | 'down') => {
    setFormData(prev => {
      const groups = prev.groups.map(g => {
        if (g.id !== groupId) return g;
        
        const items = [...g.items];
        const index = items.findIndex(i => i.id === itemId);
        
        if (direction === 'up' && index > 0) {
          [items[index], items[index - 1]] = [items[index - 1], items[index]];
          items[index].order = index;
          items[index - 1].order = index - 1;
        } else if (direction === 'down' && index < items.length - 1) {
          [items[index], items[index + 1]] = [items[index + 1], items[index]];
          items[index].order = index;
          items[index + 1].order = index + 1;
        }
        
        return { ...g, items };
      });
      
      return { ...prev, groups };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Название чеклиста обязательно');
      return;
    }

    if (formData.groups.length === 0) {
      alert('Добавьте хотя бы одну группу');
      return;
    }

    // Проверяем, что все группы и пункты имеют названия
    for (const group of formData.groups) {
      if (!group.title.trim()) {
        alert('Все группы должны иметь названия');
        return;
      }
      
      for (const item of group.items) {
        if (!item.title.trim()) {
          alert('Все пункты должны иметь названия');
          return;
        }
      }
    }

    setLoading(true);

    try {
      const url = mode === 'create' 
        ? '/api/admin/checklists'
        : `/api/admin/checklists/${checklistId}`;
      
      const method = mode === 'create' ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        alert(mode === 'create' ? 'Чеклист создан!' : 'Чеклист обновлен!');
        router.push('/admin/checklists');
      } else {
        const error = await response.json();
        alert(error.error || 'Произошла ошибка');
      }
    } catch (error) {
      console.error('Error saving checklist:', error);
      alert('Ошибка при сохранении');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Основная информация */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Основная информация</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Название чеклиста *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Введите название чеклиста"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Направление *
            </label>
            <select
              value={formData.direction}
              onChange={(e) => setFormData(prev => ({ ...prev, direction: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              {directionOptions.map(option => {
                const Icon = option.icon;
                return (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Описание
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Опишите назначение чеклиста"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL изображения
            </label>
            <input
              type="url"
              value={formData.thumbnail}
              onChange={(e) => setFormData(prev => ({ ...prev, thumbnail: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
              Активен
            </label>
          </div>
        </div>
      </div>

      {/* Группы и пункты */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Группы и пункты</h3>
          <button
            type="button"
            onClick={addGroup}
            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={16} />
            Добавить группу
          </button>
        </div>

        {formData.groups.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>Добавьте первую группу для начала работы</p>
          </div>
        ) : (
          <div className="space-y-4">
            {formData.groups.map((group, groupIndex) => (
              <div key={group.id} className="border border-gray-200 rounded-lg">
                {/* Заголовок группы */}
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <button
                        type="button"
                        onClick={() => updateGroup(group.id, { isCollapsed: !group.isCollapsed })}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        {group.isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                      </button>
                      
                      <input
                        type="text"
                        value={group.title}
                        onChange={(e) => updateGroup(group.id, { title: e.target.value })}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        placeholder="Название группы"
                        required
                      />
                      
                      <button
                        type="button"
                        onClick={() => addItem(group.id)}
                        className="text-green-600 hover:text-green-700 p-1"
                        title="Добавить пункт"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => moveGroup(group.id, 'up')}
                        disabled={groupIndex === 0}
                        className="text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed p-1"
                        title="Переместить вверх"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveGroup(group.id, 'down')}
                        disabled={groupIndex === formData.groups.length - 1}
                        className="text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed p-1"
                        title="Переместить вниз"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeGroup(group.id)}
                        className="text-red-600 hover:text-red-700 p-1"
                        title="Удалить группу"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <input
                      type="text"
                      value={group.description}
                      onChange={(e) => updateGroup(group.id, { description: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="Описание группы (необязательно)"
                    />
                  </div>
                </div>

                {/* Пункты группы */}
                {!group.isCollapsed && (
                  <div className="p-4">
                    {group.items.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        <p>Добавьте первый пункт в группу</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {group.items.map((item, itemIndex) => (
                          <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <GripVertical className="text-gray-400" size={16} />
                            
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-3">
                                <input
                                  type="text"
                                  value={item.title}
                                  onChange={(e) => updateItem(group.id, item.id, { title: e.target.value })}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                  placeholder="Название пункта"
                                  required
                                />
                                
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    id={`required-${item.id}`}
                                    checked={item.isRequired}
                                    onChange={(e) => updateItem(group.id, item.id, { isRequired: e.target.checked })}
                                    className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                                  />
                                  <label htmlFor={`required-${item.id}`} className="text-sm text-gray-700">
                                    Обязательный
                                  </label>
                                </div>
                              </div>
                              
                              <input
                                type="text"
                                value={item.description || ''}
                                onChange={(e) => updateItem(group.id, item.id, { description: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                placeholder="Описание пункта (необязательно)"
                              />
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => moveItem(group.id, item.id, 'up')}
                                disabled={itemIndex === 0}
                                className="text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed p-1"
                                title="Переместить вверх"
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                onClick={() => moveItem(group.id, item.id, 'down')}
                                disabled={itemIndex === group.items.length - 1}
                                className="text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed p-1"
                                title="Переместить вниз"
                              >
                                ↓
                              </button>
                              <button
                                type="button"
                                onClick={() => removeItem(group.id, item.id)}
                                className="text-red-600 hover:text-red-700 p-1"
                                title="Удалить пункт"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Кнопки действий */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Отмена
        </button>
        
        <button
          type="submit"
          disabled={loading}
          className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white px-8 py-3 rounded-lg flex items-center gap-2 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <Save size={20} />
          )}
          {mode === 'create' ? 'Создать чеклист' : 'Сохранить изменения'}
        </button>
      </div>
    </form>
  );
}
