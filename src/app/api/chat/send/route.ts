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
          userId: user.id,
          groupId,
          type: 'REGULAR'
        },
        include: {
          user: {
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
        type: 'NEW_MESSAGE' as const,
        title: `Новое сообщение в группе ${membership.group.name}`,
        message: `${user.name || user.email}: ${content}`,
        data: JSON.stringify({
          groupId,
          messageId: message.id
        })
      }))

      await prisma.notification.createMany({
        data: notifications
      })

      return NextResponse.json({
        id: message.id,
        content: message.content,
        senderId: message.userId,
        senderName: message.user.name || message.user.email,
        timestamp: message.createdAt,
        type: 'group',
        groupId: message.groupId
      })

    } else if (chatId.startsWith('direct_')) {
      // Прямой чат - функциональность временно отключена, так как модель DirectMessage не определена в схеме
      return NextResponse.json({ error: 'Direct messages are not available' }, { status: 501 })
    }

    return NextResponse.json({ error: 'Invalid chat ID' }, { status: 400 })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
