/**
 * Интеграция с Telegram для уведомлений о безопасности
 * Отправляет уведомления в Telegram канал/группу при обнаружении угроз
 */

export interface TelegramConfig {
  botToken: string
  chatId: string
  isEnabled: boolean
  notificationTypes: {
    critical: boolean
    high: boolean
    medium: boolean
    low: boolean
  }
  testMode: boolean
}

interface BotInfo {
  id: number
  is_bot: boolean
  first_name: string
  username: string
  can_join_groups: boolean
  can_read_all_group_messages: boolean
  supports_inline_queries: boolean
}

interface TelegramResponse {
  ok: boolean
  result?: BotInfo
  description?: string
}

class TelegramIntegration {
  private config: TelegramConfig = {
    botToken: '',
    chatId: '',
    isEnabled: false,
    notificationTypes: {
      critical: true,
      high: true,
      medium: false,
      low: false
    },
    testMode: false
  }

  constructor() {
    this.loadConfig()
  }

  /**
   * Загружает конфигурацию из localStorage
   */
  private loadConfig(): void {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('telegram-security-config')
      if (saved) {
        try {
          this.config = { ...this.config, ...JSON.parse(saved) }
        } catch (error) {
          console.error('[TELEGRAM] Error loading config:', error)
        }
      }
    }
  }

  /**
   * Сохраняет конфигурацию в localStorage
   */
  private saveConfig(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('telegram-security-config', JSON.stringify(this.config))
    }
  }

  /**
   * Обновляет конфигурацию
   */
  updateConfig(newConfig: Partial<TelegramConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.saveConfig()
  }

  /**
   * Получает текущую конфигурацию
   */
  getConfig(): TelegramConfig {
    return { ...this.config }
  }

  /**
   * Проверяет, включены ли уведомления для данного уровня риска
   */
  private shouldSendNotification(riskLevel: string): boolean {
    if (!this.config.isEnabled || !this.config.botToken || !this.config.chatId) {
      return false
    }

    switch (riskLevel) {
      case 'CRITICAL':
        return this.config.notificationTypes.critical
      case 'HIGH':
        return this.config.notificationTypes.high
      case 'MEDIUM':
        return this.config.notificationTypes.medium
      case 'LOW':
        return this.config.notificationTypes.low
      default:
        return false
    }
  }

  /**
   * Отправляет уведомление в Telegram
   */
  async sendNotification(
    title: string,
    message: string,
    riskLevel: string,
    metadata?: Record<string, string | number | boolean>
  ): Promise<boolean> {
    if (!this.shouldSendNotification(riskLevel)) {
      return false
    }

    try {
      const formattedMessage = this.formatMessage(title, message, riskLevel, metadata)
      
      if (this.config.testMode) {
        console.log('[TELEGRAM] Test mode - would send:', formattedMessage)
        return true
      }

      const response = await fetch(`https://api.telegram.org/bot${this.config.botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: this.config.chatId,
          text: formattedMessage,
          parse_mode: 'HTML',
          disable_web_page_preview: true
        })
      })

      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.status}`)
      }

      const result: TelegramResponse = await response.json()
      
      if (result.ok) {
        console.log('[TELEGRAM] Notification sent successfully')
        return true
      } else {
        throw new Error(`Telegram API error: ${result.description}`)
      }
    } catch (error) {
      console.error('[TELEGRAM] Error sending notification:', error)
      return false
    }
  }

  /**
   * Форматирует сообщение для Telegram
   */
  private formatMessage(
    title: string,
    message: string,
    riskLevel: string,
    metadata?: Record<string, string | number | boolean>
  ): string {
    const riskEmoji = this.getRiskEmoji(riskLevel)
    const timestamp = new Date().toLocaleString('ru-RU')
    
    let formattedMessage = `${riskEmoji} <b>${title}</b>\n\n`
    formattedMessage += `${message}\n\n`
    formattedMessage += `📊 <b>Уровень риска:</b> ${riskLevel}\n`
    formattedMessage += `⏰ <b>Время:</b> ${timestamp}\n`
    
    if (metadata) {
      if (metadata.userEmail) {
        formattedMessage += `👤 <b>Пользователь:</b> ${metadata.userEmail}\n`
      }
      if (metadata.ipAddress) {
        formattedMessage += `🌐 <b>IP адрес:</b> ${metadata.ipAddress}\n`
      }
      if (metadata.userRole) {
        formattedMessage += `🔑 <b>Роль:</b> ${metadata.userRole}\n`
      }
      if (metadata.eventType) {
        formattedMessage += `📝 <b>Тип события:</b> ${metadata.eventType}\n`
      }
    }
    
    formattedMessage += `\n🔒 <i>Neetrino Academy Security System</i>`
    
    return formattedMessage
  }

  /**
   * Получает эмодзи для уровня риска
   */
  private getRiskEmoji(riskLevel: string): string {
    switch (riskLevel) {
      case 'CRITICAL':
        return '🚨'
      case 'HIGH':
        return '⚠️'
      case 'MEDIUM':
        return '🔶'
      case 'LOW':
        return 'ℹ️'
      default:
        return '🔒'
    }
  }

  /**
   * Тестирует подключение к Telegram
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.config.botToken || !this.config.chatId) {
      return {
        success: false,
        message: 'Не указан токен бота или ID чата'
      }
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${this.config.botToken}/getMe`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const result: TelegramResponse = await response.json()
      
      if (result.ok && result.result) {
        // Отправляем тестовое сообщение
        const testResult = await this.sendNotification(
          '🧪 Тест подключения',
          'Это тестовое уведомление для проверки интеграции с Telegram.',
          'LOW',
          { testMode: true }
        )

        if (testResult) {
          return {
            success: true,
            message: `Бот ${result.result.username} подключен успешно! Тестовое сообщение отправлено.`
          }
        } else {
          return {
            success: false,
            message: 'Бот подключен, но не удалось отправить тестовое сообщение'
          }
        }
      } else {
        throw new Error(result.description || 'Неизвестная ошибка')
      }
    } catch (error) {
      return {
        success: false,
        message: `Ошибка подключения: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      }
    }
  }

  /**
   * Получает информацию о боте
   */
  async getBotInfo(): Promise<{ success: boolean; botInfo?: BotInfo; message: string }> {
    if (!this.config.botToken) {
      return {
        success: false,
        message: 'Токен бота не указан'
      }
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${this.config.botToken}/getMe`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const result: TelegramResponse = await response.json()
      
      if (result.ok && result.result) {
        return {
          success: true,
          botInfo: result.result,
          message: 'Информация о боте получена'
        }
      } else {
        throw new Error(result.description || 'Неизвестная ошибка')
      }
    } catch (error) {
      return {
        success: false,
        message: `Ошибка получения информации о боте: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      }
    }
  }

  /**
   * Проверяет валидность токена бота
   */
  async validateBotToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/getMe`)
      const result: TelegramResponse = await response.json()
      return result.ok === true
    } catch {
      return false
    }
  }

  /**
   * Проверяет валидность ID чата
   */
  async validateChatId(chatId: string): Promise<boolean> {
    if (!this.config.botToken) {
      return false
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${this.config.botToken}/getChat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chat_id: chatId })
      })

      const result: TelegramResponse = await response.json()
      return result.ok === true
    } catch {
      return false
    }
  }

  /**
   * Проверяет права бота в чате
   */
  async checkBotPermissions(): Promise<{ success: boolean; permissions?: any; message: string }> {
    if (!this.config.botToken || !this.config.chatId) {
      return {
        success: false,
        message: 'Не указан токен бота или ID чата'
      }
    }

    try {
      console.log(`[TELEGRAM] Checking bot permissions in chat ${this.config.chatId}`)
      
      // Получаем информацию о чате
      const chatResponse = await fetch(`https://api.telegram.org/bot${this.config.botToken}/getChat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chat_id: this.config.chatId })
      })

      if (!chatResponse.ok) {
        const errorText = await chatResponse.text()
        throw new Error(`Failed to get chat info: ${chatResponse.status} - ${errorText}`)
      }

      const chatResult = await chatResponse.json()
      console.log(`[TELEGRAM] Chat info:`, chatResult)

      if (!chatResult.ok) {
        throw new Error(`Chat info error: ${chatResult.description}`)
      }

      // Получаем информацию о правах бота в чате
      const memberResponse = await fetch(`https://api.telegram.org/bot${this.config.botToken}/getChatMember`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          chat_id: this.config.chatId,
          user_id: (await this.getBotInfo()).botInfo?.id
        })
      })

      if (!memberResponse.ok) {
        const errorText = await memberResponse.text()
        throw new Error(`Failed to get bot member info: ${memberResponse.status} - ${errorText}`)
      }

      const memberResult = await memberResponse.json()
      console.log(`[TELEGRAM] Bot member info:`, memberResult)

      if (!memberResult.ok) {
        throw new Error(`Member info error: ${memberResult.description}`)
      }

      const permissions = memberResult.result
      const canSendMessages = permissions.can_send_messages
      const status = permissions.status

      return {
        success: true,
        permissions: {
          canSendMessages,
          status,
          chatType: chatResult.result.type,
          chatTitle: chatResult.result.title || chatResult.result.first_name
        },
        message: `Права бота проверены. Статус: ${status}, Может отправлять сообщения: ${canSendMessages ? 'Да' : 'Нет'}`
      }

    } catch (error) {
      console.error('[TELEGRAM] Check permissions error:', error)
      return {
        success: false,
        message: `Ошибка проверки прав: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      }
    }
  }
}

// Экспортируем единственный экземпляр
export const telegramIntegration = new TelegramIntegration()
