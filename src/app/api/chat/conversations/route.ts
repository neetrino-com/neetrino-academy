import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { serializePrismaData } from '@/lib/utils'

// Получить все чаты пользователя (группы и прямые сообщения)
export async function GET(request: NextRequest) {
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

    // Получаем группы пользователя в зависимости от роли
    let userGroups = []
    
    if (user.role === 'ADMIN') {
      // Админ видит все группы
      userGroups = await prisma.group.findMany({
        where: { isActive: true },
        include: {
          students: {
            include: { user: true }
          },
          teachers: {
            include: { user: true }
          },
          _count: {
            select: {
              students: true,
              teachers: true
            }
          }
        }
      })
    } else if (user.role === 'TEACHER') {
      // Преподаватель видит группы, где он преподает
      const teacherGroups = await prisma.groupTeacher.findMany({
        where: {
          userId: user.id
        },
        include: {
          group: {
            include: {
              students: {
                include: { user: true }
              },
              teachers: {
                include: { user: true }
              },
              _count: {
                select: {
                  students: true,
                  teachers: true
                }
              }
            }
          }
        }
      })
      userGroups = teacherGroups.map(tg => tg.group)
    } else {
      // Студент видит группы, где он учится
      const studentGroups = await prisma.groupStudent.findMany({
        where: {
          userId: user.id,
          status: 'ACTIVE'
        },
        include: {
          group: {
            include: {
              students: {
                include: { user: true }
              },
              teachers: {
                include: { user: true }
              },
              _count: {
                select: {
                  students: true,
                  teachers: true
                }
              }
            }
          }
        }
      })
      userGroups = studentGroups.map(sg => sg.group)
    }

    // Получаем прямые чаты в зависимости от роли
    let directChats = []
    
    if (user.role === 'ADMIN') {
      // Админ видит все прямые чаты
      directChats = await prisma.directMessage.findMany({
        where: {
          OR: [
            { senderId: user.id },
            { recipientId: user.id }
          ]
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          recipient: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    } else if (user.role === 'TEACHER') {
      // Преподаватель видит чаты со студентами из своих групп
      const teacherGroupStudentIds = userGroups.flatMap(group => 
        group.students.map(student => student.userId)
      )
      
      directChats = await prisma.directMessage.findMany({
        where: {
          OR: [
            { senderId: user.id },
            { recipientId: user.id }
          ],
          AND: [
            {
              OR: [
                { senderId: { in: teacherGroupStudentIds } },
                { recipientId: { in: teacherGroupStudentIds } }
              ]
            }
          ]
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          recipient: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    } else {
      // Студент видит чаты с преподавателями из своих групп
      const studentGroupTeacherIds = userGroups.flatMap(group => 
        group.teachers.map(teacher => teacher.userId)
      )
      
      directChats = await prisma.directMessage.findMany({
        where: {
          OR: [
            { senderId: user.id },
            { recipientId: user.id }
          ],
          AND: [
            {
              OR: [
                { senderId: { in: studentGroupTeacherIds } },
                { recipientId: { in: studentGroupTeacherIds } }
              ]
            }
          ]
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          recipient: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    }

    // Группируем прямые сообщения по собеседнику
    const directChatMap = new Map()
    directChats.forEach(message => {
      const otherUser = message.senderId === user.id ? message.recipient : message.sender
      const chatId = `direct_${otherUser.id}`
      
      if (!directChatMap.has(chatId)) {
        directChatMap.set(chatId, {
          id: chatId,
          name: otherUser.name || otherUser.email,
          type: 'direct' as const,
          lastMessage: message.content,
          lastMessageTime: message.createdAt,
          unreadCount: message.recipientId === user.id && !message.readAt ? 1 : 0,
          isOnline: false // TODO: добавить систему онлайн статуса
        })
      } else {
        const existing = directChatMap.get(chatId)
        if (message.createdAt > existing.lastMessageTime) {
          existing.lastMessage = message.content
          existing.lastMessageTime = message.createdAt
        }
        if (message.recipientId === user.id && !message.readAt) {
          existing.unreadCount++
        }
      }
    })

    // Формируем группы чатов
    const groupChats = userGroups.map(group => ({
      id: `group_${group.id}`,
      name: group.name,
      type: 'group' as const,
      lastMessage: '', // TODO: добавить последнее сообщение из группы
      lastMessageTime: group.updatedAt,
      unreadCount: 0, // TODO: добавить подсчет непрочитанных
      isOnline: false
    }))

    // Добавляем прямые чаты с преподавателями/студентами, если их еще нет
    if (user.role === 'STUDENT') {
      // Для студентов добавляем чаты с преподавателями из их групп
      const studentGroupTeacherIds = userGroups.flatMap(group => 
        group.teachers.map(teacher => teacher.userId)
      )
      
      studentGroupTeacherIds.forEach(teacherId => {
        const teacher = userGroups.flatMap(group => 
          group.teachers.find(t => t.userId === teacherId)?.user
        ).find(Boolean)
        
        if (teacher && !directChatMap.has(`direct_${teacherId}`)) {
          directChatMap.set(`direct_${teacherId}`, {
            id: `direct_${teacherId}`,
            name: teacher.name || teacher.email,
            type: 'direct' as const,
            lastMessage: '',
            lastMessageTime: new Date(0),
            unreadCount: 0,
            isOnline: false
          })
        }
      })
    } else if (user.role === 'TEACHER') {
      // Для преподавателей добавляем чаты со студентами из их групп
      const teacherGroupStudentIds = userGroups.flatMap(group => 
        group.students.map(student => student.userId)
      )
      
      teacherGroupStudentIds.forEach(studentId => {
        const student = userGroups.flatMap(group => 
          group.students.find(s => s.userId === studentId)?.user
        ).find(Boolean)
        
        if (student && !directChatMap.has(`direct_${studentId}`)) {
          directChatMap.set(`direct_${studentId}`, {
            id: `direct_${studentId}`,
            name: student.name || student.email,
            type: 'direct' as const,
            lastMessage: '',
            lastMessageTime: new Date(0),
            unreadCount: 0,
            isOnline: false
          })
        }
      })
    }

    // Объединяем все чаты
    const allChats = [
      ...groupChats,
      ...Array.from(directChatMap.values())
    ]

    // Сортируем по времени последнего сообщения
    allChats.sort((a, b) => {
      const timeA = new Date(a.lastMessageTime || 0).getTime()
      const timeB = new Date(b.lastMessageTime || 0).getTime()
      return timeB - timeA
    })

    return NextResponse.json(serializePrismaData(allChats))
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
