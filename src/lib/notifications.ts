import { prisma } from '@/lib/db'

export type NotificationType = 
  | 'NEW_ASSIGNMENT'
  | 'ASSIGNMENT_SUBMITTED'
  | 'ASSIGNMENT_GRADED'
  | 'DEADLINE_REMINDER'
  | 'COURSE_ASSIGNED'
  | 'GROUP_ADDED'

interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  message?: string
  data?: any
}

// Создать уведомление
export async function createNotification({
  userId,
  type,
  title,
  message,
  data
}: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data: data ? JSON.stringify(data) : null
      }
    })
    
    return notification
  } catch (error) {
    console.error('Error creating notification:', error)
    throw error
  }
}

// Создать уведомления для всех студентов группы о новом задании
export async function notifyGroupStudentsAboutNewAssignment(
  groupId: string,
  assignmentTitle: string,
  assignmentId: string,
  dueDate: Date
) {
  try {
    // Получаем всех студентов группы
    const groupStudents = await prisma.groupStudent.findMany({
      where: {
        groupId: groupId,
        status: 'ACTIVE'
      },
      include: {
        user: true
      }
    })

    // Создаем уведомления для каждого студента
    const notifications = await Promise.all(
      groupStudents.map(({ user }) =>
        createNotification({
          userId: user.id,
          type: 'NEW_ASSIGNMENT',
          title: 'Новое задание',
          message: `Получено новое задание: "${assignmentTitle}". Срок выполнения: ${dueDate.toLocaleDateString('ru-RU')}`,
          data: {
            assignmentId,
            groupId,
            dueDate: dueDate.toISOString()
          }
        })
      )
    )

    return notifications
  } catch (error) {
    console.error('Error notifying group students:', error)
    throw error
  }
}

// Уведомить преподавателей группы о новой сдаче задания
export async function notifyGroupTeachersAboutSubmission(
  groupId: string,
  assignmentTitle: string,
  studentName: string,
  assignmentId: string,
  submissionId: string
) {
  try {
    // Получаем всех преподавателей группы
    const groupTeachers = await prisma.groupTeacher.findMany({
      where: {
        groupId: groupId
      },
      include: {
        user: true
      }
    })

    // Создаем уведомления для каждого преподавателя
    const notifications = await Promise.all(
      groupTeachers.map(({ user }) =>
        createNotification({
          userId: user.id,
          type: 'ASSIGNMENT_SUBMITTED',
          title: 'Новая сдача задания',
          message: `${studentName} сдал задание "${assignmentTitle}"`,
          data: {
            assignmentId,
            submissionId,
            groupId,
            studentName
          }
        })
      )
    )

    return notifications
  } catch (error) {
    console.error('Error notifying group teachers:', error)
    throw error
  }
}

// Уведомить студента о выставленной оценке
export async function notifyStudentAboutGrade(
  studentId: string,
  assignmentTitle: string,
  score: number,
  assignmentId: string,
  submissionId: string
) {
  try {
    const notification = await createNotification({
      userId: studentId,
      type: 'ASSIGNMENT_GRADED',
      title: 'Задание проверено',
      message: `Ваше задание "${assignmentTitle}" проверено. Оценка: ${score}/5`,
      data: {
        assignmentId,
        submissionId,
        score
      }
    })

    return notification
  } catch (error) {
    console.error('Error notifying student about grade:', error)
    throw error
  }
}

// Уведомить студентов о приближающемся дедлайне (за 24 часа)
export async function notifyStudentsAboutDeadline(
  assignmentId: string,
  assignmentTitle: string,
  dueDate: Date
) {
  try {
    // Получаем всех студентов, которые имеют доступ к этому заданию через группы
    const groupAssignments = await prisma.groupAssignment.findMany({
      where: {
        assignmentId: assignmentId
      },
      include: {
        group: {
          include: {
            students: {
              where: {
                status: 'ACTIVE'
              },
              include: {
                user: true
              }
            }
          }
        }
      }
    })

    // Получаем уникальных студентов
    const uniqueStudents = new Map()
    groupAssignments.forEach(ga => {
      ga.group.students.forEach(student => {
        uniqueStudents.set(student.user.id, student.user)
      })
    })

    // Проверяем, кто еще не сдал задание
    const submissions = await prisma.submission.findMany({
      where: {
        assignmentId: assignmentId,
        userId: {
          in: Array.from(uniqueStudents.keys())
        }
      }
    })

    const submittedUserIds = new Set(submissions.map(s => s.userId))
    const studentsWithoutSubmissions = Array.from(uniqueStudents.values())
      .filter(student => !submittedUserIds.has(student.id))

    // Создаем уведомления для студентов без сдач
    const notifications = await Promise.all(
      studentsWithoutSubmissions.map(student =>
        createNotification({
          userId: student.id,
          type: 'DEADLINE_REMINDER',
          title: 'Приближается дедлайн',
          message: `До сдачи задания "${assignmentTitle}" остается менее 24 часов!`,
          data: {
            assignmentId,
            dueDate: dueDate.toISOString()
          }
        })
      )
    )

    return notifications
  } catch (error) {
    console.error('Error notifying about deadline:', error)
    throw error
  }
}

// Уведомить участников группы о новом сообщении
export async function notifyGroupMembersAboutNewMessage(
  groupId: string,
  senderId: string,
  senderName: string,
  messagePreview: string,
  messageType: 'REGULAR' | 'ANNOUNCEMENT' | 'SYSTEM' | 'ASSIGNMENT_DISCUSSION'
) {
  try {
    // Получаем всех участников группы кроме отправителя
    const [groupStudents, groupTeachers] = await Promise.all([
      prisma.groupStudent.findMany({
        where: {
          groupId: groupId,
          status: 'ACTIVE',
          userId: { not: senderId }
        },
        include: {
          user: true
        }
      }),
      prisma.groupTeacher.findMany({
        where: {
          groupId: groupId,
          userId: { not: senderId }
        },
        include: {
          user: true
        }
      })
    ])

    // Объединяем всех участников
    const allMembers = [
      ...groupStudents.map(s => s.user),
      ...groupTeachers.map(t => t.user)
    ]

    // Создаем уведомления для каждого участника
    const notifications = await Promise.all(
      allMembers.map(member =>
        createNotification({
          userId: member.id,
          type: 'NEW_MESSAGE',
          title: messageType === 'ANNOUNCEMENT' 
            ? 'Новое объявление' 
            : 'Новое сообщение в группе',
          message: `${senderName}: ${messagePreview}${messagePreview.length >= 100 ? '...' : ''}`,
          data: {
            groupId,
            senderId,
            senderName,
            messageType
          }
        })
      )
    )

    return notifications
  } catch (error) {
    console.error('Error notifying group members about new message:', error)
    throw error
  }
}

// Уведомить участников о событии
export async function notifyEventParticipants(
  eventId: string,
  notificationType: 'EVENT_REMINDER' | 'EVENT_CANCELLED' | 'EVENT_UPDATED',
  eventTitle: string,
  eventDate: Date,
  groupId?: string | null
) {
  try {
    // Получаем всех участников события
    const eventAttendees = await prisma.eventAttendee.findMany({
      where: {
        eventId: eventId
      },
      include: {
        user: true
      }
    })

    // Если событие связано с группой, добавляем всех участников группы
    let allParticipants = eventAttendees.map(attendee => attendee.user)

    if (groupId) {
      const [groupStudents, groupTeachers] = await Promise.all([
        prisma.groupStudent.findMany({
          where: {
            groupId: groupId,
            status: 'ACTIVE'
          },
          include: {
            user: true
          }
        }),
        prisma.groupTeacher.findMany({
          where: {
            groupId: groupId
          },
          include: {
            user: true
          }
        })
      ])

      // Объединяем всех участников и убираем дубликаты
      const groupMembers = [
        ...groupStudents.map(s => s.user),
        ...groupTeachers.map(t => t.user)
      ]

      const existingUserIds = new Set(allParticipants.map(p => p.id))
      const newParticipants = groupMembers.filter(member => !existingUserIds.has(member.id))
      
      allParticipants = [...allParticipants, ...newParticipants]
    }

    // Формируем заголовок и сообщение в зависимости от типа уведомления
    let title: string
    let message: string

    switch (notificationType) {
      case 'EVENT_REMINDER':
        title = 'Новое событие'
        message = `Создано событие "${eventTitle}" на ${eventDate.toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'long',
          hour: '2-digit',
          minute: '2-digit'
        })}`
        break
      case 'EVENT_UPDATED':
        title = 'Событие изменено'
        message = `Событие "${eventTitle}" было изменено. Новая дата: ${eventDate.toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'long',
          hour: '2-digit',
          minute: '2-digit'
        })}`
        break
      case 'EVENT_CANCELLED':
        title = 'Событие отменено'
        message = `Событие "${eventTitle}" было отменено`
        break
      default:
        title = 'Уведомление о событии'
        message = `Обновление по событию "${eventTitle}"`
    }

    // Создаем уведомления для всех участников
    const notifications = await Promise.all(
      allParticipants.map(participant =>
        createNotification({
          userId: participant.id,
          type: notificationType,
          title,
          message,
          data: {
            eventId,
            eventTitle,
            eventDate: eventDate.toISOString(),
            groupId
          }
        })
      )
    )

    return notifications
  } catch (error) {
    console.error('Error notifying event participants:', error)
    throw error
  }
}

// Уведомления о приближающихся дедлайнах
export async function notifyUpcomingDeadlines() {
  try {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(23, 59, 59, 999)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Находим все дедлайны заданий, которые заканчиваются завтра
    const upcomingAssignments = await prisma.assignment.findMany({
      where: {
        dueDate: {
          gte: today,
          lte: tomorrow
        }
      },
      include: {
        groupAssignments: {
          include: {
            group: {
              include: {
                students: {
                  where: {
                    status: 'ACTIVE'
                  },
                  include: {
                    user: true
                  }
                }
              }
            }
          }
        }
      }
    })

    // Находим все события, которые начинаются завтра
    const upcomingEvents = await prisma.event.findMany({
      where: {
        startDate: {
          gte: today,
          lte: tomorrow
        },
        isActive: true
      },
      include: {
        attendees: {
          include: {
            user: true
          }
        },
        group: {
          include: {
            students: {
              where: {
                status: 'ACTIVE'
              },
              include: {
                user: true
              }
            },
            teachers: {
              include: {
                user: true
              }
            }
          }
        }
      }
    })

    const notifications: any[] = []

    // Создаем уведомления о дедлайнах заданий
    for (const assignment of upcomingAssignments) {
      for (const groupAssignment of assignment.groupAssignments) {
        for (const student of groupAssignment.group.students) {
          notifications.push(
            await createNotification({
              userId: student.user.id,
              type: 'DEADLINE_REMINDER',
              title: 'Дедлайн завтра!',
              message: `Завтра истекает срок сдачи задания "${assignment.title}"`,
              data: {
                assignmentId: assignment.id,
                assignmentTitle: assignment.title,
                dueDate: assignment.dueDate?.toISOString(),
                groupId: groupAssignment.group.id
              }
            })
          )
        }
      }
    }

    // Создаем уведомления о предстоящих событиях
    for (const event of upcomingEvents) {
      // Уведомляем прямых участников
      for (const attendee of event.attendees) {
        notifications.push(
          await createNotification({
            userId: attendee.user.id,
            type: 'EVENT_REMINDER',
            title: 'Событие завтра',
            message: `Завтра запланировано событие "${event.title}" в ${event.startDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`,
            data: {
              eventId: event.id,
              eventTitle: event.title,
              eventDate: event.startDate.toISOString(),
              groupId: event.groupId
            }
          })
        )
      }

      // Уведомляем участников группы (если они не являются прямыми участниками)
      if (event.group) {
        const directAttendeeIds = new Set(event.attendees.map(a => a.userId))
        
        for (const student of event.group.students) {
          if (!directAttendeeIds.has(student.user.id)) {
            notifications.push(
              await createNotification({
                userId: student.user.id,
                type: 'EVENT_REMINDER',
                title: 'Событие завтра',
                message: `Завтра запланировано событие "${event.title}" для вашей группы в ${event.startDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`,
                data: {
                  eventId: event.id,
                  eventTitle: event.title,
                  eventDate: event.startDate.toISOString(),
                  groupId: event.groupId
                }
              })
            )
          }
        }

        for (const teacher of event.group.teachers) {
          if (!directAttendeeIds.has(teacher.user.id)) {
            notifications.push(
              await createNotification({
                userId: teacher.user.id,
                type: 'EVENT_REMINDER',
                title: 'Событие завтра',
                message: `Завтра запланировано событие "${event.title}" для группы ${event.group.name} в ${event.startDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`,
                data: {
                  eventId: event.id,
                  eventTitle: event.title,
                  eventDate: event.startDate.toISOString(),
                  groupId: event.groupId
                }
              })
            )
          }
        }
      }
    }

    return notifications
  } catch (error) {
    console.error('Error notifying about upcoming deadlines:', error)
    throw error
  }
}
