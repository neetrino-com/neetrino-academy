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
  console.log('🚀 [Submit API] ROUTE CALLED!')
  console.log('🚀 [Submit API] Request URL:', request.url)
  console.log('🚀 [Submit API] Request method:', request.method)
  console.log('🚀 [Submit API] Request headers:', Object.fromEntries(request.headers.entries()))
  try {
    console.log('🚀 [Submit API] Starting submission process')
    const session = await auth()
    if (!session?.user) {
      console.log('❌ [Submit API] No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('✅ [Submit API] Session found for user:', session.user.email)

    // Получаем пользователя
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user) {
      console.log('❌ [Submit API] User not found for email:', session.user.email)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    console.log('✅ [Submit API] User found:', user.id, user.name)

    // Проверим схему Prisma
    console.log('🔍 [Submit API] Checking Prisma schema...')
    try {
      const testQuery = await prisma.lesson.findFirst({
        include: {
          module: true
        }
      })
      console.log('✅ [Submit API] Prisma schema test successful:', !!testQuery)
    } catch (schemaError) {
      console.error('❌ [Submit API] Prisma schema test failed:', schemaError)
    }

    const resolvedParams = await params
    const assignmentId = resolvedParams.id
    
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('❌ [Submit API] Error parsing JSON:', parseError)
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }
    
    const { content, fileUrl } = body

    console.log('📝 [Submit API] Assignment ID:', assignmentId)
    console.log('📝 [Submit API] Content length:', content?.length || 0)
    console.log('📝 [Submit API] File URL:', fileUrl || 'none')

    // Сначала проверим, существует ли задание
    console.log('🔍 [Submit API] Checking if assignment exists...')
    const assignmentExists = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        lesson: {
          include: {
            module: {
              include: {
                course: true
              }
            }
          }
        }
      }
    })
    console.log('🔍 [Submit API] Assignment exists:', !!assignmentExists)
    if (assignmentExists) {
      console.log('🔍 [Submit API] Assignment lesson module course:', assignmentExists.lesson?.module?.course?.title)
    }

    // Проверяем доступ к заданию через курсы и группы
    console.log('🔍 [Submit API] Checking course assignment access...')
    let courseAssignment = null
    try {
      // Сначала найдем задание
      const assignment = await prisma.assignment.findUnique({
        where: { id: assignmentId },
        include: {
          lesson: {
            include: {
              module: {
                include: {
                  course: true
                }
              }
            }
          }
        }
      })
      
      if (assignment?.lesson?.module?.course) {
        // Проверим, есть ли у пользователя доступ к курсу
        const enrollment = await prisma.enrollment.findFirst({
          where: {
            userId: user.id,
            courseId: assignment.lesson.module.course.id,
            status: 'ACTIVE'
          }
        })
        
        if (enrollment) {
          courseAssignment = assignment
          console.log('✅ [Submit API] Course assignment access granted')
        } else {
          console.log('❌ [Submit API] No course enrollment found')
        }
      } else {
        console.log('❌ [Submit API] Assignment not linked to course')
      }
    } catch (error) {
      console.error('❌ [Submit API] Error checking course assignment:', error)
    }

    console.log('🔍 [Submit API] Checking group assignment access...')
    let groupAssignment = null
    try {
      groupAssignment = await prisma.groupAssignment.findFirst({
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
      
      if (groupAssignment) {
        console.log('✅ [Submit API] Group assignment access granted')
      } else {
        console.log('❌ [Submit API] No group assignment access found')
      }
    } catch (error) {
      console.error('❌ [Submit API] Error checking group assignment:', error)
    }

    console.log('🔍 [Submit API] Course assignment found:', !!courseAssignment)
    console.log('🔍 [Submit API] Group assignment found:', !!groupAssignment)

    if (!courseAssignment && !groupAssignment) {
      console.log('❌ [Submit API] No access found for assignment')
      return NextResponse.json({ 
        error: 'Assignment not found or access denied' 
      }, { status: 404 })
    }

    // Проверяем дедлайн
    const now = new Date()
    let dueDate: Date | null = null
    
    if (groupAssignment) {
      dueDate = new Date(groupAssignment.dueDate)
    } else if (courseAssignment) {
      dueDate = courseAssignment.dueDate ? new Date(courseAssignment.dueDate) : null
    }
    
    if (dueDate && now > dueDate) {
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
        if (groupAssignment) {
          console.log('🔔 [Submit API] Sending notification for group assignment')
          await notifyGroupTeachersAboutSubmission(
            groupAssignment.group.id,
            groupAssignment.assignment.title,
            user.name,
            assignmentId,
            updatedSubmission.id
          )
          console.log('✅ [Submit API] Notification sent successfully')
        }
        // Для заданий из курсов уведомления пока не реализованы
      } catch (notificationError) {
        console.error('❌ [Submit API] Error sending notifications:', notificationError)
        // Не прерываем выполнение из-за ошибки уведомлений
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
        if (groupAssignment) {
          console.log('🔔 [Submit API] Sending notification for new group assignment')
          await notifyGroupTeachersAboutSubmission(
            groupAssignment.group.id,
            groupAssignment.assignment.title,
            user.name,
            assignmentId,
            newSubmission.id
          )
          console.log('✅ [Submit API] Notification sent successfully')
        }
        // Для заданий из курсов уведомления пока не реализованы
      } catch (notificationError) {
        console.error('❌ [Submit API] Error sending notifications:', notificationError)
        // Не прерываем выполнение из-за ошибки уведомлений
      }

      return NextResponse.json({
        message: 'Assignment submitted successfully',
        submission: newSubmission
      })
    }
  } catch (error) {
    console.error('❌ [Submit API] Error submitting assignment:', error)
    console.error('❌ [Submit API] Error stack:', error instanceof Error ? error.stack : 'No stack')
    console.error('❌ [Submit API] Error name:', error instanceof Error ? error.name : 'Unknown')
    console.error('❌ [Submit API] Error message:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
