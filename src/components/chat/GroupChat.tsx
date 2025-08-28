'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { 
  Send, 
  Paperclip, 
  Smile, 
  MoreVertical,
  Edit,
  Trash2,
  Reply,
  AlertCircle,
  Megaphone,
  MessageCircle,
  FileText,
  Check,
  CheckCheck,
  Clock
} from 'lucide-react'

interface GroupMessage {
  id: string
  groupId: string
  userId: string
  type: 'REGULAR' | 'ANNOUNCEMENT' | 'SYSTEM' | 'ASSIGNMENT_DISCUSSION'
  content: string
  fileUrl?: string
  isEdited: boolean
  isDeleted: boolean
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    email: string
    role: 'STUDENT' | 'TEACHER' | 'ADMIN'
    avatar?: string
  }
  replyTo?: {
    id: string
    content: string
    user: {
      id: string
      name: string
    }
  }
  _count: {
    replies: number
  }
}

interface GroupChatProps {
  groupId: string
  groupName: string
}

export default function GroupChat({ groupId, groupName }: GroupChatProps) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<GroupMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [messageType, setMessageType] = useState<'REGULAR' | 'ANNOUNCEMENT'>('REGULAR')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [replyTo, setReplyTo] = useState<GroupMessage | null>(null)
  const [editingMessage, setEditingMessage] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageInputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetchMessages()
    
    // Обновляем сообщения каждые 3 секунды
    const interval = setInterval(fetchMessages, 3000)
    return () => clearInterval(interval)
  }, [groupId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}/messages`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      const response = await fetch(`/api/groups/${groupId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newMessage.trim(),
          type: messageType,
          replyToId: replyTo?.id
        })
      })

      if (response.ok) {
        const newMsg = await response.json()
        setMessages(prev => [...prev, newMsg])
        setNewMessage('')
        setReplyTo(null)
        setMessageType('REGULAR')
        scrollToBottom()
      } else {
        const error = await response.json()
        alert(`Ошибка: ${error.error}`)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Ошибка отправки сообщения')
    } finally {
      setSending(false)
    }
  }

  const editMessage = async (messageId: string, content: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/messages/${messageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      })

      if (response.ok) {
        const updatedMsg = await response.json()
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? updatedMsg : msg
        ))
        setEditingMessage(null)
        setEditContent('')
      } else {
        const error = await response.json()
        alert(`Ошибка: ${error.error}`)
      }
    } catch (error) {
      console.error('Error editing message:', error)
      alert('Ошибка редактирования сообщения')
    }
  }

  const deleteMessage = async (messageId: string) => {
    if (!confirm('Вы уверены, что хотите удалить это сообщение?')) return

    try {
      const response = await fetch(`/api/groups/${groupId}/messages/${messageId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const deletedMsg = await response.json()
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? deletedMsg : msg
        ))
      } else {
        const error = await response.json()
        alert(`Ошибка: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting message:', error)
      alert('Ошибка удаления сообщения')
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 3600)

    if (diffInHours < 24) {
      return date.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } else {
      return date.toLocaleDateString('ru-RU', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const getMessageTypeIcon = (type: GroupMessage['type']) => {
    switch (type) {
      case 'ANNOUNCEMENT':
        return <Megaphone className="w-4 h-4 text-orange-600" />
      case 'ASSIGNMENT_DISCUSSION':
        return <FileText className="w-4 h-4 text-blue-600" />
      case 'SYSTEM':
        return <AlertCircle className="w-4 h-4 text-gray-600" />
      default:
        return <MessageCircle className="w-4 h-4 text-gray-600" />
    }
  }

  const getMessageTypeColor = (type: GroupMessage['type']) => {
    switch (type) {
      case 'ANNOUNCEMENT':
        return 'border-l-orange-500 bg-orange-50'
      case 'ASSIGNMENT_DISCUSSION':
        return 'border-l-blue-500 bg-blue-50'
      case 'SYSTEM':
        return 'border-l-gray-500 bg-gray-50'
      default:
        return 'border-l-gray-300 bg-white'
    }
  }

  const canEditMessage = (message: GroupMessage) => {
    if (!session?.user || message.userId !== session.user.id) return false
    
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)
    return new Date(message.createdAt) > fifteenMinutesAgo && !message.isDeleted
  }

  const canDeleteMessage = (message: GroupMessage) => {
    if (!session?.user) return false
    
    return message.userId === session.user.id || 
           session.user.role === 'ADMIN' || 
           session.user.role === 'TEACHER'
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border">
      {/* Заголовок чата */}
      <div className="p-4 border-b bg-gray-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Чат группы</h3>
            <p className="text-sm text-gray-600">{groupName}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {messages.length} сообщений
            </span>
          </div>
        </div>
      </div>

      {/* Область сообщений */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">Пока нет сообщений</p>
            <p className="text-sm text-gray-400">Начните общение с группой!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`border-l-4 pl-4 py-2 ${getMessageTypeColor(message.type)}`}>
              {/* Заголовок сообщения */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getMessageTypeIcon(message.type)}
                  <span className="font-medium text-gray-900">{message.user.name}</span>
                  {message.user.role === 'TEACHER' && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Преподаватель
                    </span>
                  )}
                  {message.user.role === 'ADMIN' && (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                      Админ
                    </span>
                  )}
                  <span className="text-xs text-gray-500">{formatTime(message.createdAt)}</span>
                  {message.isEdited && (
                    <span className="text-xs text-gray-400">(изменено)</span>
                  )}
                </div>
                
                {/* Действия с сообщением */}
                {(canEditMessage(message) || canDeleteMessage(message)) && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {canEditMessage(message) && (
                      <button
                        onClick={() => {
                          setEditingMessage(message.id)
                          setEditContent(message.content)
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                        title="Редактировать"
                      >
                        <Edit className="w-4 h-4 text-gray-600" />
                      </button>
                    )}
                    {canDeleteMessage(message) && (
                      <button
                        onClick={() => deleteMessage(message.id)}
                        className="p-1 hover:bg-gray-200 rounded"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    )}
                    <button
                      onClick={() => setReplyTo(message)}
                      className="p-1 hover:bg-gray-200 rounded"
                      title="Ответить"
                    >
                      <Reply className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                )}
              </div>

              {/* Ответ на сообщение */}
              {message.replyTo && (
                <div className="bg-gray-100 p-2 rounded mb-2 border-l-2 border-gray-300">
                  <p className="text-xs text-gray-600">↳ Ответ на {message.replyTo.user.name}:</p>
                  <p className="text-sm text-gray-700 truncate">{message.replyTo.content}</p>
                </div>
              )}

              {/* Содержимое сообщения */}
              {editingMessage === message.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full p-2 border rounded resize-none"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => editMessage(message.id, editContent)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      Сохранить
                    </button>
                    <button
                      onClick={() => {
                        setEditingMessage(null)
                        setEditContent('')
                      }}
                      className="px-3 py-1 border text-gray-700 text-sm rounded hover:bg-gray-50"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <div className="group">
                  <p className="text-gray-800 whitespace-pre-wrap">{message.content}</p>
                  {message.fileUrl && (
                    <a
                      href={message.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-2 text-blue-600 hover:text-blue-800"
                    >
                      <Paperclip className="w-4 h-4" />
                      Прикрепленный файл
                    </a>
                  )}
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Ответ на сообщение */}
      {replyTo && (
        <div className="px-4 py-2 bg-blue-50 border-t border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-800">↳ Ответ на {replyTo.user.name}:</p>
              <p className="text-sm text-gray-700 truncate">{replyTo.content}</p>
            </div>
            <button
              onClick={() => setReplyTo(null)}
              className="text-blue-600 hover:text-blue-800"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Поле ввода */}
      <div className="p-4 border-t bg-gray-50">
        {/* Тип сообщения */}
        {session?.user?.role !== 'STUDENT' && (
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setMessageType('REGULAR')}
              className={`px-3 py-1 text-sm rounded ${
                messageType === 'REGULAR' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Обычное
            </button>
            <button
              onClick={() => setMessageType('ANNOUNCEMENT')}
              className={`px-3 py-1 text-sm rounded ${
                messageType === 'ANNOUNCEMENT' 
                  ? 'bg-orange-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Объявление
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <textarea
            ref={messageInputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Напишите сообщение..."
            className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
            disabled={sending}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-500">
            Нажмите Enter для отправки, Shift+Enter для новой строки
          </p>
          {messageType === 'ANNOUNCEMENT' && (
            <span className="text-xs text-orange-600 flex items-center gap-1">
              <Megaphone className="w-3 h-3" />
              Объявление
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
