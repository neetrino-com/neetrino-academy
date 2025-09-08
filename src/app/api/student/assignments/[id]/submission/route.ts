import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface Params {
  id: string
}

// Получить сдачу задания студента
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    console.log('🔍 [Assignment API] Starting request...')
    
    const session = await auth()
    if (!session?.user) {
      console.log('❌ [Assignment API] No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('👤 [Assignment API] Session found for user:', session.user.email)

    // Получаем пользователя
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user) {
      console.log('❌ [Assignment API] User not found in database')
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('✅ [Assignment API] User found:', user.id)

    const { id: assignmentId } = await params
    console.log('📝 [Assignment API] Looking for assignment:', assignmentId)

    // Проверяем доступ к заданию
    const groupAssignment = await prisma.groupAssignment.findFirst({
      where: {
        assignmentId,
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
                        title: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        group: {
          select: {
            name: true
          }
        }
      }
    })

    if (!groupAssignment) {
      console.log('❌ [Assignment API] GroupAssignment not found for assignment:', assignmentId)
      return NextResponse.json({ 
        error: 'Assignment not found or access denied' 
      }, { status: 404 })
    }

    console.log('✅ [Assignment API] GroupAssignment found:', groupAssignment.id)

    // Получаем сдачу студента
    const submission = await prisma.submission.findFirst({
      where: {
        userId: user.id,
        assignmentId: assignmentId
      }
    })

    console.log('📄 [Assignment API] Submission found:', submission ? 'Yes' : 'No')

    const result = {
      assignment: groupAssignment,
      submission: submission
    }

    console.log('✅ [Assignment API] Returning data successfully')
    return NextResponse.json(result)
  } catch (error) {
    console.error('❌ [Assignment API] Error fetching submission:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
