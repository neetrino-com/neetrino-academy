import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Отправить сообщение
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { content, chatId } = await request.json()
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!content || !chatId) {
      return NextResponse.json({ error: 'Content and chatId are required' }, { status: 400 })
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
          },
          include: {
            group: true
          }
        })
      } else if (user.role === 'TEACHER') {
        membership = await prisma.groupTeacher.findFirst({
          where: {
            groupId,
            userId: user.id
          },
          include: {
            group: true
          }
        })
      } else if (user.role === 'ADMIN') {
        // Админ может писать в любую группу
        const group = await prisma.group.findUnique({
          where: { id: groupId }
        })
        if (group) {
          membership = { group }
        }
      }

      if (!membership) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      // Создаем сообщение в группе
      const message = await prisma.groupMessage.create({
        data: {
          content,
          senderId: user.id,
          groupId,
          type: 'MESSAGE'
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })

      // Создаем уведомления для всех участников группы (кроме отправителя)
      const groupStudents = await prisma.groupStudent.findMany({
        where: {
          groupId,
          userId: { not: user.id },
          status: 'ACTIVE'
        }
      })

      const groupTeachers = await prisma.groupTeacher.findMany({
        where: {
          groupId,
          userId: { not: user.id }
        }
      })

      const allMembers = [...groupStudents, ...groupTeachers]
      
      const notifications = allMembers.map(member => ({
        userId: member.userId,
        type: 'GROUP_MESSAGE',
        title: `Новое сообщение в группе ${membership.group.name}`,
        message: `${user.name || user.email}: ${content}`,
        data: {
          groupId,
          messageId: message.id
        }
      }))

      await prisma.notification.createMany({
        data: notifications
      })

      return NextResponse.json({
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        senderName: message.sender.name || message.sender.email,
        timestamp: message.createdAt,
        type: 'group',
        groupId: message.groupId
      })

    } else if (chatId.startsWith('direct_')) {
      // Прямой чат
      const recipientId = chatId.replace('direct_', '')
      
      // Проверяем, что получатель существует
      const recipient = await prisma.user.findUnique({
        where: { id: recipientId }
      })

      if (!recipient) {
        return NextResponse.json({ error: 'Recipient not found' }, { status: 404 })
      }

      // Создаем прямое сообщение
      const message = await prisma.directMessage.create({
        data: {
          content,
          senderId: user.id,
          recipientId
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          recipient: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })

      // Создаем уведомление для получателя
      await prisma.notification.create({
        data: {
          userId: recipientId,
          type: 'DIRECT_MESSAGE',
          title: `Новое сообщение от ${user.name || user.email}`,
          message: content,
          data: {
            senderId: user.id,
            messageId: message.id
          }
        }
      })

      return NextResponse.json({
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        senderName: message.sender.name || message.sender.email,
        timestamp: message.createdAt,
        type: 'direct',
        recipientId: message.recipientId
      })
    }

    return NextResponse.json({ error: 'Invalid chat ID' }, { status: 400 })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
