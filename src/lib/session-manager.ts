// Профессиональный менеджер сессий для Academy Platform

import { prisma } from '@/lib/db'

export interface SessionToken {
  id: string
  userId: string
  token: string
  isValid: boolean
  createdAt: Date
  expiresAt: Date
  lastUsed: Date
  userAgent?: string
  ipAddress?: string
}

class SessionManager {
  private invalidatedTokens = new Set<string>()
  
  /**
   * Проверяет валидность токена пользователя
   */
  async isTokenValid(userId: string, tokenId: string): Promise<boolean> {
    // Быстрая проверка в памяти
    if (this.invalidatedTokens.has(tokenId)) {
      return false
    }

    try {
      // Проверяем существование пользователя и его активность
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          id: true, 
          isActive: true,
          lastLoginAt: true 
        }
      })

      // Если пользователь удален или деактивирован
      if (!user || !user.isActive) {
        this.invalidatedTokens.add(tokenId)
        return false
      }

      return true
    } catch (error) {
      console.error('[SessionManager] Error checking token validity:', error)
      return false
    }
  }

  /**
   * Инвалидирует все токены пользователя при удалении/деактивации
   */
  async invalidateUserSessions(userId: string): Promise<void> {
    try {
      console.log(`[SessionManager] Invalidating all sessions for user: ${userId}`)
      
      // Помечаем пользователя как неактивного (если еще не помечен)
      await prisma.user.update({
        where: { id: userId },
        data: { isActive: false }
      })

      // В профессиональных системах здесь был бы вызов к Redis
      // для инвалидации всех активных сессий пользователя
      
      console.log(`[SessionManager] All sessions invalidated for user: ${userId}`)
    } catch (error) {
      console.error('[SessionManager] Error invalidating user sessions:', error)
    }
  }

  /**
   * Добавляет токен в blacklist
   */
  invalidateToken(tokenId: string): void {
    this.invalidatedTokens.add(tokenId)
    console.log(`[SessionManager] Token ${tokenId} added to blacklist`)
  }

  /**
   * Очищает устаревшие токены из blacklist (вызывается периодически)
   */
  cleanupInvalidatedTokens(): void {
    // В реальном приложении здесь была бы логика очистки старых токенов
    const size = this.invalidatedTokens.size
    if (size > 1000) {
      this.invalidatedTokens.clear()
      console.log(`[SessionManager] Blacklist cleared, was ${size} tokens`)
    }
  }

  /**
   * Проверяет активность пользователя по расписанию
   */
  async scheduleUserActivityCheck(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          id: true, 
          isActive: true,
          email: true,
          role: true
        }
      })

      if (!user || !user.isActive) {
        console.log(`[SessionManager] User ${userId} is inactive or deleted`)
        return false
      }

      return true
    } catch (error) {
      console.error('[SessionManager] Error in scheduled user check:', error)
      return false
    }
  }
}

export const sessionManager = new SessionManager()

// Периодическая очистка blacklist (каждые 10 минут)
if (typeof window === 'undefined') { // только на сервере
  setInterval(() => {
    sessionManager.cleanupInvalidatedTokens()
  }, 10 * 60 * 1000)
}
