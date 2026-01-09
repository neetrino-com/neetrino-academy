import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { serializePrismaData } from '@/lib/utils'

// Получить сообщения для конкретного чата
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { chatId } = await params
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Определяем тип чата
    if (chatId.startsWith('group_')) {
      // Групповой чат
      const groupId = chatId.replace('group_', '')
      
      // Проверяем, что пользователь состоит в группе
      let membership = null
      
      if (user.role === 'STUDENT') {
        membership = await prisma.groupStudent.findFirst({
          where: {
            groupId,
            userId: user.id,
            status: 'ACTIVE'
          }
        })
      } else if (user.role === 'TEACHER') {
        membership = await prisma.groupTeacher.findFirst({
          where: {
            groupId,
            userId: user.id
          }
        })
      } else if (user.role === 'ADMIN') {
        // Админ может читать любую группу
        membership = { id: 'admin' }
      }

      if (!membership) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      // Получаем сообщения группы
      const messages = await prisma.groupMessage.findMany({
        where: {
          groupId
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        },
        take: 50 // Последние 50 сообщений
      })

      // TODO: Добавить систему отметки сообщений как прочитанных
      // Пока просто получаем сообщения без отметки прочтения

      const formattedMessages = messages.map(message => ({
        id: message.id,
        content: message.content,
        senderId: message.userId,
        senderName: message.user.name || message.user.email,
        timestamp: message.createdAt,
        type: 'group' as const,
        groupId: message.groupId
      }))

      return NextResponse.json(serializePrismaData(formattedMessages))

    } else if (chatId.startsWith('direct_')) {
      // Прямой чат - функциональность временно отключена, так как модель DirectMessage не определена в схеме
      return NextResponse.json(serializePrismaData([]))
    }

    return NextResponse.json({ error: 'Invalid chat ID' }, { status: 400 })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
