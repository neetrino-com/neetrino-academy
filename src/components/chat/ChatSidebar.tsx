'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { 
  MessageCircle, 
  X, 
  Send, 
  Users, 
  User,
  ChevronDown,
  ChevronUp,
  Search
} from 'lucide-react'
import { useTranslation } from '@/hooks/useLanguage'

interface ChatMessage {
  id: string
  content: string
  senderId: string
  senderName: string
  senderAvatar?: string
  timestamp: string
  type: 'group' | 'direct'
  groupId?: string
  recipientId?: string
}

interface ChatGroup {
  id: string
  name: string
  type: 'group' | 'direct'
  lastMessage?: string
  lastMessageTime?: string
  unreadCount: number
  avatar?: string
  isOnline?: boolean
}

export function ChatSidebar() {
  const { data: session } = useSession()
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [activeChat, setActiveChat] = useState<string | null>(null)
  const [chats, setChats] = useState<ChatGroup[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Загружаем чаты при открытии
  useEffect(() => {
    if (isOpen && session?.user) {
      fetchChats()
    }
  }, [isOpen, session])

  // Загружаем сообщения при смене активного чата
  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat)
    }
  }, [activeChat])

  // Автоскролл к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchChats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/chat/conversations')
      if (response.ok) {
        const data = await response.json()
        setChats(data)
        // Автоматически открываем первый чат
        if (data.length > 0 && !activeChat) {
          setActiveChat(data[0].id)
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки чатов:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chat/messages/${chatId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      }
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeChat) return

    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage,
          chatId: activeChat
        })
      })

      if (response.ok) {
        setNewMessage('')
        // Обновляем сообщения
        fetchMessages(activeChat)
        // Обновляем список чатов
        fetchChats()
      }
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeChatData = chats.find(chat => chat.id === activeChat)

  return (
    <>
      {/* Кнопка открытия чата */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 z-50 flex items-center justify-center"
      >
        <MessageCircle className="w-6 h-6" />
        {chats.some(chat => chat.unreadCount > 0) && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {chats.reduce((sum, chat) => sum + chat.unreadCount, 0)}
          </span>
        )}
      </button>

      {/* Боковая панель чата */}
      {isOpen && (
        <div className="fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col">
          {/* Заголовок */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <h2 className="text-lg font-semibold">{t('chat.title')}</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Поиск чатов */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('chat.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex-1 flex">
            {/* Список чатов */}
            <div className="w-1/2 border-r border-gray-200">
              <div className="p-2">
                {loading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-12 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredChats.map((chat) => (
                      <button
                        key={chat.id}
                        onClick={() => setActiveChat(chat.id)}
                        className={`w-full p-3 rounded-lg text-left transition-colors ${
                          activeChat === chat.id
                            ? 'bg-blue-50 border border-blue-200'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                              {chat.type === 'group' ? (
                                <Users className="w-5 h-5" />
                              ) : (
                                <User className="w-5 h-5" />
                              )}
                            </div>
                            {chat.isOnline && (
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium text-gray-900 truncate">
                                {chat.name}
                              </h3>
                              {chat.unreadCount > 0 && (
                                <span className="ml-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                  {chat.unreadCount}
                                </span>
                              )}
                            </div>
                            {chat.lastMessage && (
                              <p className="text-sm text-gray-500 truncate">
                                {chat.lastMessage}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Область сообщений */}
            <div className="flex-1 flex flex-col">
              {activeChatData ? (
                <>
                  {/* Заголовок чата */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white">
                        {activeChatData.type === 'group' ? (
                          <Users className="w-4 h-4" />
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {activeChatData.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {activeChatData.type === 'group' ? t('chat.group') : t('chat.direct')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Сообщения */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.senderId === session?.user?.id ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.senderId === session?.user?.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-medium">
                              {message.senderName}
                            </span>
                            <span className="text-xs opacity-70">
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm">{message.content}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Поле ввода */}
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={t('chat.messagePlaceholder')}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>{t('chat.selectChat')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
