import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { notifyGroupMembersAboutNewMessage } from '@/lib/notifications'

// Получить сообщения группы
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: groupId } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const before = searchParams.get('before') // для пагинации

    // Проверяем доступ к группе
    const groupMember = await prisma.group.findFirst({
      where: {
        id: groupId,
        OR: [
          {
            students: {
              some: {
                userId: user.id,
                status: 'ACTIVE'
              }
            }
          },
          {
            teachers: {
              some: {
                userId: user.id
              }
            }
          }
        ]
      }
    })

    if (!groupMember && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Получаем сообщения
    const whereCondition: {
      groupId: string;
      isDeleted: boolean;
      createdAt?: { lt: Date };
    } = {
      groupId: groupId,
      isDeleted: false
    }

    if (before) {
      whereCondition.createdAt = {
        lt: new Date(before)
      }
    }

    const messages = await prisma.groupMessage.findMany({
      where: whereCondition,
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
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    // Возвращаем в правильном порядке (старые сначала)
    return NextResponse.json(messages.reverse())
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Отправить новое сообщение
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: groupId } = await params
    const body = await request.json()
    const { content, type = 'REGULAR', fileUrl, replyToId } = body

    // Валидация
    if (!content?.trim() && !fileUrl) {
      return NextResponse.json({ error: 'Message content or file is required' }, { status: 400 })
    }

    // Проверяем доступ к группе
    const groupMember = await prisma.group.findFirst({
      where: {
        id: groupId,
        OR: [
          {
            students: {
              some: {
                userId: user.id,
                status: 'ACTIVE'
              }
            }
          },
          {
            teachers: {
              some: {
                userId: user.id
              }
            }
          }
        ]
      },
      include: {
        name: true
      }
    })

    if (!groupMember && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Проверяем права на создание объявлений
    if (type === 'ANNOUNCEMENT' && user.role === 'STUDENT') {
      return NextResponse.json({ error: 'Students cannot create announcements' }, { status: 403 })
    }

    // Создаем сообщение
    const message = await prisma.groupMessage.create({
      data: {
        groupId,
        userId: user.id,
        content: content?.trim() || '',
        type,
        fileUrl,
        replyToId
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

    // Отправляем уведомления остальным участникам группы
    try {
      await notifyGroupMembersAboutNewMessage(
        groupId,
        user.id,
        user.name,
        content?.slice(0, 100) || 'Отправил файл',
        type
      )
    } catch (notificationError) {
      console.error('Error sending message notifications:', notificationError)
    }

    return NextResponse.json(message)
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
