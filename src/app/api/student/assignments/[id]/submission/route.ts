import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Получить сдачу задания студента
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔍 [Assignment API] Starting request...')
    console.log('🔍 [Assignment API] Request URL:', request.url)
    console.log('🔍 [Assignment API] Request method:', request.method)
    
    const session = await auth()
    console.log('🔍 [Assignment API] Session check result:', !!session)
    if (!session?.user) {
      console.log('❌ [Assignment API] No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('👤 [Assignment API] Session found for user:', session.user.email)

    // Получаем пользователя
    console.log('🔍 [Assignment API] Looking for user with email:', session.user.email)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user) {
      console.log('❌ [Assignment API] User not found in database')
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('✅ [Assignment API] User found:', user.id, 'Role:', user.role)

    const resolvedParams = await params
    const assignmentId = resolvedParams.id
    console.log('📝 [Assignment API] Looking for assignment:', assignmentId)
    console.log('📝 [Assignment API] Resolved params:', resolvedParams)
    
    if (!assignmentId) {
      console.log('❌ [Assignment API] No assignment ID provided')
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 })
    }

    // Проверяем доступ к заданию (из курсов или групп)
    console.log('🔍 [Assignment API] Searching for assignment access...')
    
    // 1. Проверяем доступ через курсы
    const courseAssignment = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        lesson: {
          module: {
            course: {
              enrollments: {
                some: {
                  userId: user.id,
                  status: 'ACTIVE'
                }
              }
            }
          }
        }
      },
      include: {
        lesson: {
          include: {
            module: {
              include: {
                course: {
                  select: {
                    id: true,
                    title: true,
                    direction: true
                  }
                }
              }
            }
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // 2. Проверяем доступ через группы
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
        assignment: {
          include: {
            lesson: {
              include: {
                module: {
                  include: {
                    course: {
                      select: {
                        id: true,
                        title: true,
                        direction: true
                      }
                    }
                  }
                }
              }
            },
            creator: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        group: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    console.log('🔍 [Assignment API] Course assignment found:', !!courseAssignment)
    console.log('🔍 [Assignment API] Group assignment found:', !!groupAssignment)

    if (!courseAssignment && !groupAssignment) {
      console.log('❌ [Assignment API] No access found for assignment:', assignmentId)
      return NextResponse.json({ 
        error: 'Assignment not found or access denied' 
      }, { status: 404 })
    }

    // Определяем источник задания и формируем результат
    let assignmentData
    if (groupAssignment) {
      // Приоритет у группового задания
      assignmentData = {
        id: groupAssignment.assignment.id,
        title: groupAssignment.assignment.title,
        description: groupAssignment.assignment.description,
        dueDate: groupAssignment.dueDate, // Используем дату из GroupAssignment
        type: groupAssignment.assignment.type,
        status: groupAssignment.assignment.status,
        maxScore: groupAssignment.assignment.maxScore,
        source: 'group',
        course: groupAssignment.assignment.lesson?.module?.course || null,
        lesson: groupAssignment.assignment.lesson,
        creator: groupAssignment.assignment.creator,
        group: groupAssignment.group
      }
    } else {
      // Задание из курса
      assignmentData = {
        id: courseAssignment!.id,
        title: courseAssignment!.title,
        description: courseAssignment!.description,
        dueDate: courseAssignment!.dueDate,
        type: courseAssignment!.type,
        status: courseAssignment!.status,
        maxScore: courseAssignment!.maxScore,
        source: 'course',
        course: courseAssignment!.lesson?.module?.course || null,
        lesson: courseAssignment!.lesson,
        creator: courseAssignment!.creator,
        group: null
      }
    }

    console.log('✅ [Assignment API] Assignment data prepared')

    // Получаем сдачу студента
    const submission = await prisma.submission.findFirst({
      where: {
        userId: user.id,
        assignmentId: assignmentId
      }
    })

    console.log('📄 [Assignment API] Submission found:', submission ? 'Yes' : 'No')

    const result = {
      assignment: assignmentData,
      submission: submission
    }

    console.log('✅ [Assignment API] Returning data successfully')
    return NextResponse.json(result)
  } catch (error) {
    console.error('❌ [Assignment API] Error fetching submission:', error)
    console.error('❌ [Assignment API] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
