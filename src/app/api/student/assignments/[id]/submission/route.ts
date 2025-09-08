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

    // Проверяем доступ к заданию
    console.log('🔍 [Assignment API] Searching for groupAssignment...')
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
    console.log('🔍 [Assignment API] GroupAssignment query completed')

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
    console.error('❌ [Assignment API] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
