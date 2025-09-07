/**
 * Константы для типов событий и их визуального представления
 */

export const EVENT_TYPES = {
  LESSON: 'LESSON',
  EXAM: 'EXAM', 
  DEADLINE: 'DEADLINE',
  MEETING: 'MEETING',
  WORKSHOP: 'WORKSHOP',
  SEMINAR: 'SEMINAR',
  CONSULTATION: 'CONSULTATION',
  ANNOUNCEMENT: 'ANNOUNCEMENT',
  OTHER: 'OTHER'
} as const

export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES]

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  [EVENT_TYPES.LESSON]: 'Занятие',
  [EVENT_TYPES.EXAM]: 'Экзамен',
  [EVENT_TYPES.DEADLINE]: 'Дедлайн',
  [EVENT_TYPES.MEETING]: 'Встреча',
  [EVENT_TYPES.WORKSHOP]: 'Мастер-класс',
  [EVENT_TYPES.SEMINAR]: 'Семинар',
  [EVENT_TYPES.CONSULTATION]: 'Консультация',
  [EVENT_TYPES.ANNOUNCEMENT]: 'Объявление',
  [EVENT_TYPES.OTHER]: 'Другое'
}

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  [EVENT_TYPES.LESSON]: '#3B82F6',      // Синий
  [EVENT_TYPES.EXAM]: '#EF4444',        // Красный
  [EVENT_TYPES.DEADLINE]: '#F59E0B',    // Оранжевый
  [EVENT_TYPES.MEETING]: '#10B981',     // Зеленый
  [EVENT_TYPES.WORKSHOP]: '#8B5CF6',    // Фиолетовый
  [EVENT_TYPES.SEMINAR]: '#06B6D4',     // Голубой
  [EVENT_TYPES.CONSULTATION]: '#F59E0B', // Оранжевый
  [EVENT_TYPES.ANNOUNCEMENT]: '#6B7280', // Серый
  [EVENT_TYPES.OTHER]: '#9CA3AF'        // Светло-серый
}

export const EVENT_TYPE_GRADIENT_CLASSES: Record<EventType, string> = {
  [EVENT_TYPES.LESSON]: 'bg-gradient-to-r from-blue-500 to-blue-600',
  [EVENT_TYPES.EXAM]: 'bg-gradient-to-r from-red-500 to-red-600',
  [EVENT_TYPES.DEADLINE]: 'bg-gradient-to-r from-orange-500 to-orange-600',
  [EVENT_TYPES.MEETING]: 'bg-gradient-to-r from-green-500 to-green-600',
  [EVENT_TYPES.WORKSHOP]: 'bg-gradient-to-r from-purple-500 to-purple-600',
  [EVENT_TYPES.SEMINAR]: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
  [EVENT_TYPES.CONSULTATION]: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
  [EVENT_TYPES.ANNOUNCEMENT]: 'bg-gradient-to-r from-pink-500 to-pink-600',
  [EVENT_TYPES.OTHER]: 'bg-gradient-to-r from-gray-500 to-gray-600'
}

/**
 * Получить цвет события по типу
 */
export function getEventColor(type: EventType): string {
  return EVENT_TYPE_COLORS[type] || EVENT_TYPE_COLORS[EVENT_TYPES.OTHER]
}

/**
 * Получить метку события по типу
 */
export function getEventTypeLabel(type: EventType): string {
  return EVENT_TYPE_LABELS[type] || EVENT_TYPE_LABELS[EVENT_TYPES.OTHER]
}

/**
 * Получить CSS класс градиента для типа события
 */
export function getEventTypeGradientClass(type: EventType): string {
  return EVENT_TYPE_GRADIENT_CLASSES[type] || EVENT_TYPE_GRADIENT_CLASSES[EVENT_TYPES.OTHER]
}

/**
 * Получить все доступные типы событий для селекта
 */
export function getEventTypeOptions() {
  return Object.values(EVENT_TYPES).map(type => ({
    value: type,
    label: EVENT_TYPE_LABELS[type],
    color: EVENT_TYPE_COLORS[type]
  }))
}
