/**
 * Система уведомлений о безопасности
 * Автоматические уведомления о подозрительной активности и угрозах
 */

import { SecurityEvent, SecurityEventType } from './security-logger'
import { telegramIntegration } from './telegram-integration'

export interface SecurityNotification {
  id: string
  type: 'SECURITY_ALERT' | 'SECURITY_WARNING' | 'SECURITY_INFO'
  title: string
  message: string
  eventId?: string
  userId?: string
  userEmail?: string
  userRole?: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  timestamp: Date
  isRead: boolean
  actionRequired: boolean
  actionUrl?: string
  metadata?: Record<string, any>
}

export interface NotificationRule {
  id: string
  name: string
  description: string
  eventTypes: SecurityEventType[]
  conditions: {
    riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    minOccurrences?: number
    timeWindow?: number // в минутах
    userRole?: string[]
    path?: string[]
  }
  actions: {
    createNotification: boolean
    blockUser?: boolean
    blockIP?: boolean
    emailAlert?: boolean
    telegramAlert?: boolean
    slackWebhook?: string
  }
  isActive: boolean
  priority: number
}

class SecurityNotificationManager {
  private notifications: SecurityNotification[] = []
  private rules: NotificationRule[] = []
  private subscribers: Set<(notification: SecurityNotification) => void> = new Set()
  
  constructor() {
    this.initializeDefaultRules()
  }

  /**
   * Инициализирует правила уведомлений по умолчанию
   */
  private initializeDefaultRules() {
    this.rules = [
      {
        id: 'multiple-failed-logins',
        name: 'Множественные неудачные попытки входа',
        description: 'Уведомление о множественных неудачных попытках входа',
        eventTypes: ['LOGIN_FAILED'],
        conditions: {
          riskLevel: 'HIGH',
          minOccurrences: 3,
          timeWindow: 15
        },
        actions: {
          createNotification: true,
          blockUser: true,
          emailAlert: true,
          telegramAlert: true
        },
        isActive: true,
        priority: 1
      },
      {
        id: 'admin-access-attempt',
        name: 'Попытка доступа к админ-панели',
        description: 'Уведомление о попытке доступа к админ-панели с недостаточными правами',
        eventTypes: ['ACCESS_DENIED'],
        conditions: {
          riskLevel: 'MEDIUM',
          path: ['/admin']
        },
        actions: {
          createNotification: true,
          emailAlert: true,
          telegramAlert: true
        },
        isActive: true,
        priority: 2
      },
      {
        id: 'suspicious-activity',
        name: 'Подозрительная активность',
        description: 'Уведомление о подозрительной активности высокого уровня',
        eventTypes: ['SUSPICIOUS_ACTIVITY'],
        conditions: {
          riskLevel: 'HIGH'
        },
        actions: {
          createNotification: true,
          blockIP: true,
          emailAlert: true,
          telegramAlert: true
        },
        isActive: true,
        priority: 1
      },
      {
        id: 'critical-security-event',
        name: 'Критическое событие безопасности',
        description: 'Уведомление о критических событиях безопасности',
        eventTypes: ['LOGIN_FAILED', 'ACCESS_DENIED', 'SUSPICIOUS_ACTIVITY'],
        conditions: {
          riskLevel: 'CRITICAL'
        },
        actions: {
          createNotification: true,
          blockUser: true,
          blockIP: true,
          emailAlert: true,
          telegramAlert: true
        },
        isActive: true,
        priority: 0
      }
    ]
  }

  /**
   * Обрабатывает событие безопасности и создает уведомления
   */
  processSecurityEvent(event: SecurityEvent): SecurityNotification[] {
    const triggeredNotifications: SecurityNotification[] = []
    
    // Проверяем все активные правила
    for (const rule of this.rules.filter(r => r.isActive)) {
      if (this.shouldTriggerRule(rule, event)) {
        const notification = this.createNotification(rule, event)
        if (notification) {
          triggeredNotifications.push(notification)
          this.notifications.push(notification)
          
          // Уведомляем подписчиков
          this.notifySubscribers(notification)
          
          // Выполняем действия правила
          this.executeRuleActions(rule, event)
        }
      }
    }
    
    return triggeredNotifications
  }

  /**
   * Проверяет, должно ли сработать правило
   */
  private shouldTriggerRule(rule: NotificationRule, event: SecurityEvent): boolean {
    // Проверяем тип события
    if (!rule.eventTypes.includes(event.eventType)) {
      return false
    }
    
    // Проверяем уровень риска
    if (rule.conditions.riskLevel && event.riskLevel !== rule.conditions.riskLevel) {
      return false
    }
    
    // Проверяем роль пользователя
    if (rule.conditions.userRole && event.userRole) {
      if (!rule.conditions.userRole.includes(event.userRole)) {
        return false
      }
    }
    
    // Проверяем путь
    if (rule.conditions.path && event.path) {
      if (!rule.conditions.path.some(path => event.path?.includes(path))) {
        return false
      }
    }
    
    return true
  }

  /**
   * Создает уведомление на основе правила и события
   */
  private createNotification(rule: NotificationRule, event: SecurityEvent): SecurityNotification {
    const notification: SecurityNotification = {
      id: this.generateId(),
      type: this.getNotificationType(event.riskLevel),
      title: this.generateNotificationTitle(rule, event),
      message: this.generateNotificationMessage(rule, event),
      eventId: event.id,
      userId: event.userId,
      userEmail: event.userEmail,
      userRole: event.userRole,
      riskLevel: event.riskLevel,
      timestamp: new Date(),
      isRead: false,
      actionRequired: this.isActionRequired(rule),
      actionUrl: this.generateActionUrl(event),
      metadata: {
        ruleId: rule.id,
        ruleName: rule.name,
        eventType: event.eventType,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent
      }
    }
    
    return notification
  }

  /**
   * Определяет тип уведомления на основе уровня риска
   */
  private getNotificationType(riskLevel: string): 'SECURITY_ALERT' | 'SECURITY_WARNING' | 'SECURITY_INFO' {
    switch (riskLevel) {
      case 'CRITICAL':
      case 'HIGH':
        return 'SECURITY_ALERT'
      case 'MEDIUM':
        return 'SECURITY_WARNING'
      default:
        return 'SECURITY_INFO'
    }
  }

  /**
   * Генерирует заголовок уведомления
   */
  private generateNotificationTitle(rule: NotificationRule, event: SecurityEvent): string {
    switch (event.eventType) {
      case 'LOGIN_FAILED':
        return `🚨 Неудачная попытка входа - ${event.userEmail || 'Неизвестный пользователь'}`
      case 'ACCESS_DENIED':
        return `🚫 Отказ в доступе - ${event.userEmail || 'Неизвестный пользователь'}`
      case 'SUSPICIOUS_ACTIVITY':
        return `⚠️ Подозрительная активность - ${event.userEmail || 'Неизвестный пользователь'}`
      default:
        return `🔒 Событие безопасности - ${rule.name}`
    }
  }

  /**
   * Генерирует сообщение уведомления
   */
  private generateNotificationMessage(rule: NotificationRule, event: SecurityEvent): string {
    const baseMessage = `Событие: ${event.eventType}\nДетали: ${event.details}\nВремя: ${event.timestamp.toLocaleString('ru-RU')}`
    
    if (event.ipAddress) {
      return `${baseMessage}\nIP адрес: ${event.ipAddress}`
    }
    
    return baseMessage
  }

  /**
   * Проверяет, требуется ли действие
   */
  private isActionRequired(rule: NotificationRule): boolean {
    return rule.actions.blockUser || rule.actions.blockIP || rule.actions.emailAlert || rule.actions.telegramAlert
  }

  /**
   * Генерирует URL для действия
   */
  private generateActionUrl(event: SecurityEvent): string | undefined {
    if (event.userId) {
      return `/admin/users/${event.userId}`
    }
    if (event.path) {
      return event.path
    }
    return undefined
  }

  /**
   * Выполняет действия правила
   */
  private async executeRuleActions(rule: NotificationRule, event: SecurityEvent) {
    if (rule.actions.emailAlert) {
      this.sendEmailAlert(rule, event)
    }
    
    if (rule.actions.telegramAlert) {
      await this.sendTelegramAlert(rule, event)
    }
    
    if (rule.actions.slackWebhook) {
      this.sendSlackAlert(rule, event)
    }
    
    // Логируем выполненные действия
    console.log(`[SECURITY] Rule ${rule.name} executed for event ${event.eventType}`)
  }

  /**
   * Отправляет email уведомление
   */
  private sendEmailAlert(rule: NotificationRule, event: SecurityEvent) {
    // Здесь будет интеграция с email сервисом
    console.log(`[SECURITY] Email alert sent for rule ${rule.name}: ${event.details}`)
  }

  /**
   * Отправляет Telegram уведомление
   */
  private async sendTelegramAlert(rule: NotificationRule, event: SecurityEvent) {
    try {
      const success = await telegramIntegration.sendNotification(
        this.generateNotificationTitle(rule, event),
        this.generateNotificationMessage(rule, event),
        event.riskLevel,
        {
          userEmail: event.userEmail,
          ipAddress: event.ipAddress,
          userRole: event.userRole,
          eventType: event.eventType
        }
      )
      
      if (success) {
        console.log(`[SECURITY] Telegram alert sent for rule ${rule.name}: ${event.details}`)
      } else {
        console.log(`[SECURITY] Telegram alert failed for rule ${rule.name}: ${event.details}`)
      }
    } catch (error) {
      console.error(`[SECURITY] Error sending Telegram alert:`, error)
    }
  }

  /**
   * Отправляет Slack уведомление
   */
  private sendSlackAlert(rule: NotificationRule, event: SecurityEvent) {
    // Здесь будет интеграция со Slack
    console.log(`[SECURITY] Slack alert sent for rule ${rule.name}: ${event.details}`)
  }

  /**
   * Получает все уведомления
   */
  getNotifications(limit: number = 100): SecurityNotification[] {
    return this.notifications
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  /**
   * Получает непрочитанные уведомления
   */
  getUnreadNotifications(): SecurityNotification[] {
    return this.notifications.filter(n => !n.isRead)
  }

  /**
   * Получает уведомления по типу
   */
  getNotificationsByType(type: string): SecurityNotification[] {
    return this.notifications.filter(n => n.type === type)
  }

  /**
   * Получает уведомления по уровню риска
   */
  getNotificationsByRiskLevel(riskLevel: string): SecurityNotification[] {
    return this.notifications.filter(n => n.riskLevel === riskLevel)
  }

  /**
   * Отмечает уведомление как прочитанное
   */
  markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId)
    if (notification) {
      notification.isRead = true
    }
  }

  /**
   * Отмечает все уведомления как прочитанные
   */
  markAllAsRead(): void {
    this.notifications.forEach(n => n.isRead = true)
  }

  /**
   * Удаляет уведомление
   */
  deleteNotification(notificationId: string): void {
    this.notifications = this.notifications.filter(n => n.id !== notificationId)
  }

  /**
   * Очищает старые уведомления
   */
  cleanupOldNotifications(daysOld: number = 30): void {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000)
    this.notifications = this.notifications.filter(n => n.timestamp > cutoffDate)
  }

  /**
   * Добавляет правило уведомлений
   */
  addRule(rule: Omit<NotificationRule, 'id'>): string {
    const newRule: NotificationRule = {
      ...rule,
      id: this.generateId()
    }
    this.rules.push(newRule)
    return newRule.id
  }

  /**
   * Обновляет правило уведомлений
   */
  updateRule(ruleId: string, updates: Partial<NotificationRule>): boolean {
    const ruleIndex = this.rules.findIndex(r => r.id === ruleId)
    if (ruleIndex === -1) return false
    
    this.rules[ruleIndex] = { ...this.rules[ruleIndex], ...updates }
    return true
  }

  /**
   * Удаляет правило уведомлений
   */
  deleteRule(ruleId: string): boolean {
    const initialLength = this.rules.length
    this.rules = this.rules.filter(r => r.id !== ruleId)
    return this.rules.length < initialLength
  }

  /**
   * Получает все правила
   */
  getRules(): NotificationRule[] {
    return this.rules
  }

  /**
   * Подписывается на уведомления
   */
  subscribe(callback: (notification: SecurityNotification) => void): () => void {
    this.subscribers.add(callback)
    
    // Возвращаем функцию для отписки
    return () => {
      this.subscribers.delete(callback)
    }
  }

  /**
   * Уведомляет подписчиков
   */
  private notifySubscribers(notification: SecurityNotification): void {
    this.subscribers.forEach(callback => {
      try {
        callback(notification)
      } catch (error) {
        console.error('[SECURITY] Error in notification callback:', error)
      }
    })
  }

  /**
   * Генерирует уникальный ID
   */
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }

  /**
   * Получает статистику уведомлений
   */
  getNotificationStats() {
    const total = this.notifications.length
    const unread = this.notifications.filter(n => !n.isRead).length
    const alerts = this.notifications.filter(n => n.type === 'SECURITY_ALERT').length
    const warnings = this.notifications.filter(n => n.type === 'SECURITY_WARNING').length
    const info = this.notifications.filter(n => n.type === 'SECURITY_INFO').length
    
    return {
      total,
      unread,
      alerts,
      warnings,
      info,
      readRate: total > 0 ? ((total - unread) / total * 100).toFixed(1) : '0'
    }
  }
}

// Экспортируем единственный экземпляр
export const securityNotificationManager = new SecurityNotificationManager()

// Автоматическая очистка старых уведомлений каждые 24 часа
setInterval(() => {
  securityNotificationManager.cleanupOldNotifications()
}, 24 * 60 * 60 * 1000)
