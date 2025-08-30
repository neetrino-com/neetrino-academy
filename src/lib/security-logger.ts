/**
 * Система логирования безопасности
 * Отслеживает все попытки доступа, входы, выходы и подозрительную активность
 */

export interface SecurityEvent {
  id: string
  timestamp: Date
  eventType: SecurityEventType
  userId?: string
  userEmail?: string
  userRole?: string
  ipAddress?: string
  userAgent?: string
  path?: string
  method?: string
  status: 'SUCCESS' | 'FAILED' | 'BLOCKED'
  details: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

export type SecurityEventType = 
  | 'LOGIN_ATTEMPT'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'ACCESS_ATTEMPT'
  | 'ACCESS_DENIED'
  | 'ROLE_ESCALATION_ATTEMPT'
  | 'SUSPICIOUS_ACTIVITY'
  | 'API_ABUSE'
  | 'SESSION_EXPIRED'
  | 'PASSWORD_CHANGE'
  | 'PROFILE_UPDATE'

export interface SecurityMetrics {
  totalEvents: number
  failedLogins: number
  accessDenied: number
  suspiciousActivity: number
  highRiskEvents: number
  last24Hours: {
    logins: number
    failedLogins: number
    accessDenied: number
  }
}

class SecurityLogger {
  private events: SecurityEvent[] = []
  private maxEvents = 1000 // Максимальное количество событий в памяти
  private failedLoginAttempts = new Map<string, { count: number, lastAttempt: Date }>()
  private blockedIPs = new Set<string>()
  
  /**
   * Логирует событие безопасности
   */
  logEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      id: this.generateId(),
      timestamp: new Date()
    }

    this.events.push(securityEvent)
    
    // Ограничиваем количество событий в памяти
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents)
    }

    // Проверяем на подозрительную активность
    this.checkSuspiciousActivity(securityEvent)
    
    // Выводим в консоль для разработки
    console.log(`[SECURITY] ${event.eventType}: ${event.details}`, {
      user: event.userEmail,
      role: event.userRole,
      risk: event.riskLevel,
      timestamp: securityEvent.timestamp.toISOString()
    })
  }

  /**
   * Логирует попытку входа
   */
  logLoginAttempt(email: string, success: boolean, details: string, ipAddress?: string): void {
    const eventType = success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED'
    const status = success ? 'SUCCESS' : 'FAILED'
    const riskLevel = this.calculateLoginRiskLevel(email, success)

    this.logEvent({
      eventType,
      userEmail: email,
      status,
      details,
      ipAddress,
      riskLevel,
      method: 'POST',
      path: '/api/auth/login'
    })

    // Отслеживаем неудачные попытки входа
    if (!success) {
      this.trackFailedLogin(email, ipAddress)
    }
  }

  /**
   * Логирует попытку доступа к защищенному ресурсу
   */
  logAccessAttempt(
    userId: string,
    userRole: string,
    path: string,
    method: string,
    success: boolean,
    details: string
  ): void {
    const eventType = success ? 'ACCESS_ATTEMPT' : 'ACCESS_DENIED'
    const status = success ? 'SUCCESS' : 'FAILED'
    const riskLevel = success ? 'LOW' : 'MEDIUM'

    this.logEvent({
      eventType,
      userId,
      userRole,
      path,
      method,
      status,
      details,
      riskLevel
    })
  }

  /**
   * Логирует подозрительную активность
   */
  logSuspiciousActivity(
    userId: string,
    userEmail: string,
    userRole: string,
    details: string,
    riskLevel: 'MEDIUM' | 'HIGH' | 'CRITICAL'
  ): void {
    this.logEvent({
      eventType: 'SUSPICIOUS_ACTIVITY',
      userId,
      userEmail,
      userRole,
      status: 'BLOCKED',
      details,
      riskLevel
    })
  }

  /**
   * Получает все события безопасности
   */
  getEvents(limit: number = 100): SecurityEvent[] {
    return this.events.slice(-limit).reverse()
  }

  /**
   * Получает события по типу
   */
  getEventsByType(eventType: SecurityEventType): SecurityEvent[] {
    return this.events.filter(event => event.eventType === eventType)
  }

  /**
   * Получает события по пользователю
   */
  getEventsByUser(userId: string): SecurityEvent[] {
    return this.events.filter(event => event.userId === userId)
  }

  /**
   * Получает статистику безопасности
   */
  getMetrics(): SecurityMetrics {
    const now = new Date()
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    
    const last24HoursEvents = this.events.filter(event => event.timestamp > last24Hours)
    
    return {
      totalEvents: this.events.length,
      failedLogins: this.events.filter(e => e.eventType === 'LOGIN_FAILED').length,
      accessDenied: this.events.filter(e => e.eventType === 'ACCESS_DENIED').length,
      suspiciousActivity: this.events.filter(e => e.eventType === 'SUSPICIOUS_ACTIVITY').length,
      highRiskEvents: this.events.filter(e => e.riskLevel === 'HIGH' || e.riskLevel === 'CRITICAL').length,
      last24Hours: {
        logins: last24HoursEvents.filter(e => e.eventType === 'LOGIN_SUCCESS').length,
        failedLogins: last24HoursEvents.filter(e => e.eventType === 'LOGIN_FAILED').length,
        accessDenied: last24HoursEvents.filter(e => e.eventType === 'ACCESS_DENIED').length
      }
    }
  }

  /**
   * Проверяет, заблокирован ли IP
   */
  isIPBlocked(ipAddress: string): boolean {
    return this.blockedIPs.has(ipAddress)
  }

  /**
   * Проверяет, не превышен ли лимит попыток входа
   */
  isLoginBlocked(email: string): boolean {
    const attempts = this.failedLoginAttempts.get(email)
    if (!attempts) return false
    
    const timeSinceLastAttempt = Date.now() - attempts.lastAttempt.getTime()
    const blockDuration = 15 * 60 * 1000 // 15 минут
    
    // Если прошло больше 15 минут, сбрасываем счетчик
    if (timeSinceLastAttempt > blockDuration) {
      this.failedLoginAttempts.delete(email)
      return false
    }
    
    // Блокируем после 5 неудачных попыток
    return attempts.count >= 5
  }

  /**
   * Очищает старые события
   */
  cleanup(): void {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    this.events = this.events.filter(event => event.timestamp > oneWeekAgo)
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }

  private trackFailedLogin(email: string, ipAddress?: string): void {
    const attempts = this.failedLoginAttempts.get(email) || { count: 0, lastAttempt: new Date() }
    attempts.count++
    attempts.lastAttempt = new Date()
    
    this.failedLoginAttempts.set(email, attempts)
    
    // Блокируем IP после 10 неудачных попыток
    if (attempts.count >= 10 && ipAddress) {
      this.blockedIPs.add(ipAddress)
      console.log(`[SECURITY] IP ${ipAddress} заблокирован из-за множественных неудачных попыток входа`)
    }
  }

  private calculateLoginRiskLevel(email: string, success: boolean): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (success) return 'LOW'
    
    const attempts = this.failedLoginAttempts.get(email)
    if (!attempts) return 'MEDIUM'
    
    if (attempts.count >= 5) return 'HIGH'
    if (attempts.count >= 3) return 'MEDIUM'
    
    return 'LOW'
  }

  private checkSuspiciousActivity(event: SecurityEvent): void {
    // Проверяем на множественные неудачные попытки входа
    if (event.eventType === 'LOGIN_FAILED' && event.userEmail) {
      const attempts = this.failedLoginAttempts.get(event.userEmail)
      if (attempts && attempts.count >= 3) {
        this.logSuspiciousActivity(
          event.userId || '',
          event.userEmail,
          event.userRole || '',
          `Множественные неудачные попытки входа: ${attempts.count} попыток`,
          'HIGH'
        )
      }
    }

    // Проверяем на попытки эскалации ролей
    if (event.eventType === 'ACCESS_DENIED' && event.userRole) {
      if (event.path?.includes('/admin') && !['ADMIN', 'TEACHER'].includes(event.userRole)) {
        this.logSuspiciousActivity(
          event.userId || '',
          event.userEmail || '',
          event.userRole,
          `Попытка доступа к админ-панели с ролью ${event.userRole}`,
          'MEDIUM'
        )
      }
    }
  }
}

// Экспортируем единственный экземпляр
export const securityLogger = new SecurityLogger()

// Автоматическая очистка каждые 24 часа
setInterval(() => {
  securityLogger.cleanup()
}, 24 * 60 * 60 * 1000)
