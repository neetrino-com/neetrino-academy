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
  ShoppingBag,
  Search,
  Filter,
  Copy,
  FolderPlus,
  Edit3,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  BarChart3,
  List,
  Grid,
  CheckCircle
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
  const [searchTerm, setSearchTerm] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [formData, setFormData] = useState<ChecklistFormData>({
    title: '',
    description: '',
    direction: '' as any,
    thumbnail: '',
    isActive: true,
    groups: []
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  // Функции для фильтрации и поиска
  const filteredGroups = formData.groups.filter(group => {
    if (!searchTerm) return true;
    return group.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           group.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           group.items.some(item => 
             item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
             item.description?.toLowerCase().includes(searchTerm.toLowerCase())
           );
  });

  const getTotalItems = () => {
    return formData.groups.reduce((sum, group) => sum + group.items.length, 0);
  };

  const getCompletedGroups = () => {
    return formData.groups.filter(group => 
      group.title.trim() && group.items.length > 0 && 
      group.items.every(item => item.title.trim())
    ).length;
  };

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
    setSelectedGroup(newGroup.id);
  };

  const duplicateGroup = (groupId: string) => {
    const group = formData.groups.find(g => g.id === groupId);
    if (!group) return;

    const newGroup: ChecklistGroup = {
      ...group,
      id: `temp-${Date.now()}`,
      title: `${group.title} (копия)`,
      order: formData.groups.length,
      items: group.items.map(item => ({
        ...item,
        id: `temp-${Date.now()}-${Math.random()}`,
        order: item.order
      }))
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
    <form onSubmit={handleSubmit} className="min-h-screen">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Левая панель - Статистика и кнопка */}
        <div className="xl:col-span-1">
          <div className="sticky top-24 z-20 space-y-6">
            {/* Статистика */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-600" />
                Статистика
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Всего групп:</span>
                  <span className="font-semibold text-amber-600">{formData.groups.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Всего пунктов:</span>
                  <span className="font-semibold text-amber-600">
                    {formData.groups.reduce((total, group) => total + group.items.length, 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Завершенных групп:</span>
                  <span className="font-semibold text-green-600">{getCompletedGroups()}</span>
                </div>
                
                {/* Прогресс */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Прогресс:</span>
                    <span className="font-semibold text-amber-600">
                      {formData.groups.length > 0 ? Math.round((getCompletedGroups() / formData.groups.length) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-amber-500 to-yellow-500 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${formData.groups.length > 0 ? (getCompletedGroups() / formData.groups.length) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Кнопка сохранения */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 p-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Save size={20} />
                )}
                {mode === 'create' ? 'Создать чеклист' : 'Сохранить изменения'}
              </button>
            </div>

            {/* Переключатель активности */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${formData.isActive ? 'bg-green-500' : 'bg-gray-400'} transition-colors`}></div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Статус чеклиста</h4>
                    <p className="text-xs text-gray-600">{formData.isActive ? 'Активен и доступен' : 'Неактивен'}</p>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${
                    formData.isActive ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.isActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Направление */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4 text-amber-600" />
                Направление *
              </h4>
              <select
                value={formData.direction}
                onChange={(e) => setFormData(prev => ({ ...prev, direction: e.target.value as any }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                required
              >
                <option value="">Выберите направление</option>
                {directionOptions.map(option => {
                  const IconComponent = option.icon;
                  return (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>

        {/* Правая панель - Контент чеклиста */}
        <div className="xl:col-span-3">
          {/* Название и описание чеклиста */}
          <div className="mb-6">
            <div className="relative">
              <CheckCircle className="absolute left-0 top-1/2 transform -translate-y-1/2 w-5 h-5 text-amber-600" />
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full pl-8 pr-4 py-3 text-lg font-semibold border-0 border-b-2 border-gray-200 focus:border-amber-500 focus:outline-none bg-transparent placeholder-gray-400 mb-2"
                placeholder="Название чеклиста"
                required
              />
            </div>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={1}
              className="w-full px-4 py-2 text-sm border-0 border-b border-gray-100 focus:border-gray-300 focus:outline-none bg-transparent placeholder-gray-400 resize-none"
              placeholder="Краткое описание"
            />
          </div>

          {/* Панель инструментов */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 p-4 mb-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Поиск групп и пунктов..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                

                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-amber-100 text-amber-600' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-amber-100 text-amber-600' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showPreview ? 'Скрыть превью' : 'Показать превью'}
                </button>
                
                <button
                  type="button"
                  onClick={addGroup}
                  className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-4 h-4" />
                  Добавить группу
                </button>
              </div>
            </div>
          </div>

          {/* Список групп */}
          {filteredGroups.length === 0 ? (
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
              <FolderPlus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                {searchTerm ? 'Ничего не найдено' : 'Начните создавать чеклист'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm 
                  ? 'Попробуйте изменить поисковый запрос'
                  : 'Добавьте первую группу для организации пунктов чеклиста'
                }
              </p>
              {!searchTerm && (
                <button
                  type="button"
                  onClick={addGroup}
                  className="px-6 py-3 border-2 border-dashed border-amber-300 text-amber-600 rounded-lg hover:border-amber-400 hover:bg-amber-50 transition-colors"
                >
                  <Plus className="w-5 h-5 inline mr-2" />
                  Создать первую группу
                </button>
              )}
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'space-y-6'}>
              {filteredGroups.map((group, groupIndex) => (
                <div 
                  key={group.id} 
                  className={`bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 transition-all duration-200 ${selectedGroup === group.id ? 'ring-2 ring-amber-500 border-amber-300' : 'hover:shadow-lg'}`}
                >
                  {/* Заголовок группы */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <button
                          type="button"
                          onClick={() => updateGroup(group.id, { isCollapsed: !group.isCollapsed })}
                          className="text-gray-500 hover:text-gray-700 p-1 rounded transition-colors"
                        >
                          {group.isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            value={group.title}
                            onChange={(e) => updateGroup(group.id, { title: e.target.value })}
                            onFocus={() => setSelectedGroup(group.id)}
                            className="w-full text-lg font-semibold bg-transparent border-none focus:outline-none focus:ring-0 p-0 text-gray-900"
                            placeholder="Название группы"
                            required
                          />
                          <input
                            type="text"
                            value={group.description || ''}
                            onChange={(e) => updateGroup(group.id, { description: e.target.value })}
                            className="w-full text-sm bg-transparent border-none focus:outline-none focus:ring-0 p-0 text-gray-600"
                            placeholder="Описание группы (необязательно)"
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                          {group.items.length} пунктов
                        </span>
                        
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            type="button"
                            onClick={() => addItem(group.id)}
                            className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                            title="Быстро добавить пункт"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => duplicateGroup(group.id)}
                            className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                            title="Дублировать группу"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => moveGroup(group.id, 'up')}
                            disabled={groupIndex === 0}
                            className="p-1 text-gray-500 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Переместить вверх"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => moveGroup(group.id, 'down')}
                            disabled={groupIndex === filteredGroups.length - 1}
                            className="p-1 text-gray-500 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Переместить вниз"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => removeGroup(group.id)}
                            className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                            title="Удалить группу"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Пункты группы */}
                  {!group.isCollapsed && (
                    <div className="p-4">
                      {group.items.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <List className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">Добавьте первый пункт в группу</p>
                          <button
                            type="button"
                            onClick={() => addItem(group.id)}
                            className="mt-3 px-4 py-2 text-sm border border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-amber-400 hover:text-amber-600 transition-colors"
                          >
                            <Plus className="w-4 h-4 inline mr-1" />
                            Добавить пункт
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3 mb-4">
                          {group.items.map((item, itemIndex) => (
                            <div 
                              key={item.id} 
                              className="flex items-start gap-3 p-3 bg-gray-50/50 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center gap-2 mt-2">
                                <GripVertical className="text-gray-400 cursor-move" size={16} />
                                <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                                  {itemIndex + 1}
                                </span>
                              </div>
                              
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-3">
                                  <input
                                    type="text"
                                    value={item.title}
                                    onChange={(e) => updateItem(group.id, item.id, { title: e.target.value })}
                                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                    placeholder="Название пункта"
                                    required
                                  />
                                  
                                  <div className="flex items-center">
                                    <label 
                                      htmlFor={`required-${item.id}`} 
                                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all duration-200 ${
                                        item.isRequired 
                                          ? 'bg-red-100 text-red-700 border border-red-200 shadow-sm' 
                                          : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                                      }`}
                                      title={item.isRequired ? "Обязательный пункт" : "Сделать обязательным"}
                                    >
                                      <input
                                        type="checkbox"
                                        id={`required-${item.id}`}
                                        checked={item.isRequired}
                                        onChange={(e) => updateItem(group.id, item.id, { isRequired: e.target.checked })}
                                        className="sr-only"
                                      />
                                      <svg className={`w-3.5 h-3.5 transition-all duration-200 ${
                                        item.isRequired ? 'text-red-600' : 'text-gray-400'
                                      }`} fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                      </svg>
                                      <span className="hidden sm:inline">Обязательный</span>
                                      <span className="sm:hidden">!</span>
                                    </label>
                                  </div>
                                </div>
                                
                                <input
                                  type="text"
                                  value={item.description || ''}
                                  onChange={(e) => updateItem(group.id, item.id, { description: e.target.value })}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                  placeholder="Описание пункта (необязательно)"
                                />
                              </div>
                              
                              <div className="flex items-center gap-1 mt-2">
                                <button
                                  type="button"
                                  onClick={() => removeItem(group.id, item.id)}
                                  className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                                  title="Удалить пункт"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                          
                          {/* Большая кнопка добавления пункта снизу */}
                          <button
                            type="button"
                            onClick={() => addItem(group.id)}
                            className="w-full py-3 px-4 border-2 border-dashed border-amber-300 text-amber-600 rounded-lg hover:border-amber-400 hover:bg-amber-50 transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium"
                          >
                            <Plus className="w-5 h-5" />
                            Добавить новый пункт
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Превью чеклиста */}
          {showPreview && formData.groups.length > 0 && (
            <div className="mt-6 bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-amber-600" />
                Превью чеклиста
              </h3>
              
              <div className="bg-white rounded-lg border p-4">
                <h4 className="text-xl font-bold text-gray-900 mb-2">{formData.title || 'Название чеклиста'}</h4>
                {formData.description && (
                  <p className="text-gray-600 mb-4">{formData.description}</p>
                )}
                
                <div className="space-y-4">
                  {formData.groups.map((group) => (
                    <div key={group.id} className="border-l-4 border-amber-500 pl-4">
                      <h5 className="font-semibold text-gray-900 mb-2">{group.title || 'Название группы'}</h5>
                      {group.description && (
                        <p className="text-sm text-gray-600 mb-3">{group.description}</p>
                      )}
                      
                      <div className="space-y-2">
                        {group.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-3">
                            <CheckCircle className="w-4 h-4 text-gray-300" />
                            <span className="text-gray-900">{item.title || 'Название пункта'}</span>
                            {item.isRequired && (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                                Обязательный
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}