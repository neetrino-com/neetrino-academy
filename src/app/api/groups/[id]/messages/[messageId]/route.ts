import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Редактировать сообщение
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { id: groupId, messageId } = await params
    const body = await request.json()
    const { content } = body

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    // Проверяем, что сообщение существует и принадлежит пользователю
    const message = await prisma.groupMessage.findFirst({
      where: {
        id: messageId,
        groupId: groupId,
        userId: user.id,
        isDeleted: false
      }
    })

    if (!message) {
      return NextResponse.json({ error: 'Message not found or access denied' }, { status: 404 })
    }

    // Проверяем время - можно редактировать только в течение 15 минут
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)
    if (message.createdAt < fifteenMinutesAgo) {
      return NextResponse.json({ error: 'Message can only be edited within 15 minutes' }, { status: 400 })
    }

    // Обновляем сообщение
    const updatedMessage = await prisma.groupMessage.update({
      where: { id: messageId },
      data: {
        content: content.trim(),
        isEdited: true,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true
          }
        },
        replyTo: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            replies: true
          }
        }
      }
    })

    return NextResponse.json(updatedMessage)
  } catch (error) {
    console.error('Error updating message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Удалить сообщение
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { id: groupId, messageId } = await params

    // Проверяем, что сообщение существует
    const message = await prisma.groupMessage.findFirst({
      where: {
        id: messageId,
        groupId: groupId,
        isDeleted: false
      }
    })

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Проверяем права на удаление
    const canDelete = message.userId === user.id || // автор сообщения
                     user.role === 'ADMIN' || // админ
                     (user.role === 'TEACHER' && await prisma.groupTeacher.findFirst({
                       where: { groupId, userId: user.id }
                     })) // преподаватель группы

    if (!canDelete) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Помечаем сообщение как удаленное (мягкое удаление)
    const deletedMessage = await prisma.groupMessage.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        content: '[Сообщение удалено]',
        fileUrl: null,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true
          }
        },
        _count: {
          select: {
            replies: true
          }
        }
      }
    })

    return NextResponse.json(deletedMessage)
  } catch (error) {
    console.error('Error deleting message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
