'use client'

import { useState, useEffect } from 'react'
import { 
  MessageCircle, 
  Bot, 
  Settings, 
  TestTube,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Save,
  RefreshCw
} from 'lucide-react'
import { telegramIntegration, TelegramConfig } from '@/lib/telegram-integration'

interface TelegramSettingsProps {
  userRole?: string
}

interface BotInfo {
  id: number
  first_name: string
  username: string
}

export default function TelegramSettings({ userRole }: TelegramSettingsProps) {
  const [config, setConfig] = useState<TelegramConfig>({
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
  })
  
  const [loading, setLoading] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [botInfo, setBotInfo] = useState<BotInfo | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = () => {
    const currentConfig = telegramIntegration.getConfig()
    setConfig(currentConfig)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      telegramIntegration.updateConfig(config)
      setSaving(false)
      alert('Настройки Telegram сохранены!')
    } catch (error) {
      setSaving(false)
      alert('Ошибка при сохранении настроек')
    }
  }

  const handleTestConnection = async () => {
    setLoading(true)
    setTestResult(null)
    
    try {
      const result = await telegramIntegration.testConnection()
      setTestResult(result)
      
      if (result.success) {
        // Обновляем информацию о боте
        const botInfoResult = await telegramIntegration.getBotInfo()
        if (botInfoResult.success && botInfoResult.botInfo) {
          setBotInfo(botInfoResult.botInfo)
        }
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Ошибка при тестировании подключения'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleValidateToken = async () => {
    if (!config.botToken) return
    
    setLoading(true)
    try {
      const isValid = await telegramIntegration.validateBotToken(config.botToken)
      if (isValid) {
        alert('✅ Токен бота валиден!')
      } else {
        alert('❌ Токен бота недействителен')
      }
    } catch (error) {
      alert('Ошибка при проверке токена')
    } finally {
      setLoading(false)
    }
  }

  const handleValidateChatId = async () => {
    if (!config.botToken || !config.chatId) return
    
    setLoading(true)
    try {
      const isValid = await telegramIntegration.validateChatId(config.chatId)
      if (isValid) {
        alert('✅ ID чата валиден!')
      } else {
        alert('❌ ID чата недействителен')
      }
    } catch (error) {
      alert('Ошибка при проверке ID чата')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckBotPermissions = async () => {
    if (!config.botToken || !config.chatId) return
    
    setLoading(true)
    try {
      const result = await telegramIntegration.checkBotPermissions()
      if (result.success) {
        alert('✅ Бот имеет необходимые права!')
      } else {
        alert('❌ Бот не имеет необходимых прав. Пожалуйста, проверьте настройки бота и чата.')
      }
    } catch (error) {
      alert('Ошибка при проверке прав бота')
    } finally {
      setLoading(false)
    }
  }

  const updateNotificationType = (type: keyof typeof config.notificationTypes, value: boolean) => {
    setConfig(prev => ({
      ...prev,
      notificationTypes: {
        ...prev.notificationTypes,
        [type]: value
      }
    }))
  }

  if (userRole !== 'ADMIN') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5" />
          <span>Только администраторы могут настраивать интеграцию с Telegram</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-3 mb-4">
          <MessageCircle className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Настройки Telegram</h2>
            <p className="text-gray-600">
              Настройте интеграцию с Telegram для получения уведомлений о безопасности
            </p>
          </div>
        </div>

        {/* Инструкции */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">Как настроить Telegram бота:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Создайте бота через <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="underline">@BotFather</a></li>
                <li>Получите токен бота и вставьте его в поле &quot;Токен бота&quot;</li>
                <li>Добавьте бота в нужный чат/канал</li>
                <li>Получите ID чата (можно использовать <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="underline">@userinfobot</a>)</li>
                <li>Вставьте ID чата в соответствующее поле</li>
                <li>Нажмите &quot;Тестировать подключение&quot; для проверки</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Основные настройки */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Основные настройки</h3>
        
        <div className="space-y-4">
          {/* Включение интеграции */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="isEnabled"
              checked={config.isEnabled}
              onChange={(e) => setConfig(prev => ({ ...prev, isEnabled: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isEnabled" className="text-sm font-medium text-gray-700">
              Включить интеграцию с Telegram
            </label>
          </div>

          {/* Токен бота */}
          <div>
            <label htmlFor="botToken" className="block text-sm font-medium text-gray-700 mb-2">
              Токен бота
            </label>
            <div className="flex space-x-2">
              <input
                type="password"
                id="botToken"
                value={config.botToken}
                onChange={(e) => setConfig(prev => ({ ...prev, botToken: e.target.value }))}
                placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleValidateToken}
                disabled={!config.botToken || loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Проверить
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Получите токен у @BotFather в Telegram
            </p>
          </div>

          {/* ID чата */}
          <div>
            <label htmlFor="chatId" className="block text-sm font-medium text-gray-700 mb-2">
              ID чата/канала
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                id="chatId"
                value={config.chatId}
                onChange={(e) => setConfig(prev => ({ ...prev, chatId: e.target.value }))}
                placeholder="-1001234567890 или 123456789"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleValidateChatId}
                disabled={!config.botToken || !config.chatId || loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Проверить
              </button>
              <button
                onClick={handleCheckBotPermissions}
                disabled={!config.botToken || !config.chatId || loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Права бота
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              ID чата, группы или канала для отправки уведомлений
            </p>
          </div>

          {/* Тестовый режим */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="testMode"
              checked={config.testMode}
              onChange={(e) => setConfig(prev => ({ ...prev, testMode: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="testMode" className="text-sm font-medium text-gray-700">
              Тестовый режим (уведомления не отправляются, только логируются)
            </label>
          </div>
        </div>
      </div>

      {/* Типы уведомлений */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Типы уведомлений</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="critical"
              checked={config.notificationTypes.critical}
              onChange={(e) => updateNotificationType('critical', e.target.checked)}
              className="rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            <label htmlFor="critical" className="text-sm font-medium text-gray-700">
              🚨 Критические события
            </label>
          </div>
          
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="high"
              checked={config.notificationTypes.high}
              onChange={(e) => updateNotificationType('high', e.target.checked)}
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <label htmlFor="high" className="text-sm font-medium text-gray-700">
              ⚠️ Высокий уровень риска
            </label>
          </div>
          
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="medium"
              checked={config.notificationTypes.medium}
              onChange={(e) => updateNotificationType('medium', e.target.checked)}
              className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
            />
            <label htmlFor="medium" className="text-sm font-medium text-gray-700">
              🔶 Средний уровень риска
            </label>
          </div>
          
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="low"
              checked={config.notificationTypes.low}
              onChange={(e) => updateNotificationType('low', e.target.checked)}
              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <label htmlFor="low" className="text-sm font-medium text-gray-700">
              ℹ️ Низкий уровень риска
            </label>
          </div>
        </div>
      </div>

      {/* Информация о боте */}
      {botInfo && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Информация о боте</h3>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Имя бота</p>
                <p className="text-lg font-semibold text-gray-900">{botInfo.first_name}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700">Username</p>
                <p className="text-lg font-semibold text-gray-900">@{botInfo.username}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700">ID бота</p>
                <p className="text-lg font-semibold text-gray-900">{botInfo.id}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700">Статус</p>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-green-700 font-medium">Активен</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Тестирование подключения */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Тестирование подключения</h3>
        
        <div className="space-y-4">
          <button
            onClick={handleTestConnection}
            disabled={!config.botToken || !config.chatId || loading}
            className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <TestTube className="w-5 h-5" />
            )}
            <span>Тестировать подключение</span>
          </button>

          {testResult && (
            <div className={`p-4 rounded-lg ${
              testResult.success 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <div className="flex items-center space-x-2">
                {testResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span className="font-medium">{testResult.message}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Кнопки действий */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <button
            onClick={loadConfig}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Сбросить изменения</span>
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? 'Сохранение...' : 'Сохранить настройки'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
