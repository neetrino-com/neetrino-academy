import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { notifyGroupTeachersAboutSubmission } from '@/lib/notifications'

interface Params {
  id: string
}

// Отправить решение задания
export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Получаем пользователя
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { id: assignmentId } = await params
    const body = await request.json()
    const { content, fileUrl } = body

    // Проверяем, что задание существует и студент имеет к нему доступ
    const groupAssignment = await prisma.groupAssignment.findFirst({
      where: {
        assignment: {
          id: assignmentId
        },
        group: {
          students: {
            some: {
              userId: user.id,
              status: 'ACTIVE'
            }
          }
        }
      },
      include: {
        assignment: true,
        group: true
      }
    })

    if (!groupAssignment) {
      return NextResponse.json({ 
        error: 'Assignment not found or access denied' 
      }, { status: 404 })
    }

    // Проверяем дедлайн
    const now = new Date()
    const dueDate = new Date(groupAssignment.dueDate)
    
    if (now > dueDate) {
      return NextResponse.json({ 
        error: 'Assignment deadline has passed' 
      }, { status: 400 })
    }

    // Проверяем, есть ли уже сдача
    const existingSubmission = await prisma.submission.findFirst({
      where: {
        userId: user.id,
        assignmentId: assignmentId
      }
    })

    if (existingSubmission) {
      // Обновляем существующую сдачу
      const updatedSubmission = await prisma.submission.update({
        where: { id: existingSubmission.id },
        data: {
          content: content || null,
          fileUrl: fileUrl || null,
          submittedAt: now,
          // Сбрасываем оценку при повторной сдаче
          score: null,
          feedback: null,
          gradedAt: null
        }
      })

      // Уведомляем преподавателей о повторной сдаче
      try {
        await notifyGroupTeachersAboutSubmission(
          groupAssignment.group.id,
          groupAssignment.assignment.title,
          user.name,
          assignmentId,
          updatedSubmission.id
        )
      } catch (notificationError) {
        console.error('Error sending notifications:', notificationError)
      }

      return NextResponse.json({
        message: 'Assignment updated successfully',
        submission: updatedSubmission
      })
    } else {
      // Создаем новую сдачу
      const newSubmission = await prisma.submission.create({
        data: {
          userId: user.id,
          assignmentId: assignmentId,
          content: content || null,
          fileUrl: fileUrl || null,
          submittedAt: now
        }
      })

      // Уведомляем преподавателей о новой сдаче
      try {
        await notifyGroupTeachersAboutSubmission(
          groupAssignment.group.id,
          groupAssignment.assignment.title,
          user.name,
          assignmentId,
          newSubmission.id
        )
      } catch (notificationError) {
        console.error('Error sending notifications:', notificationError)
      }

      return NextResponse.json({
        message: 'Assignment submitted successfully',
        submission: newSubmission
      })
    }
  } catch (error) {
    console.error('Error submitting assignment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
