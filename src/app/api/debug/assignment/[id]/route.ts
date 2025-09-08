import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface Params {
  id: string
}

// Debug endpoint для проверки данных задания
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    console.log('🔍 [Debug API] Starting debug request...')
    
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

    const { id: assignmentId } = await params
    console.log('📝 [Debug API] Debugging assignment:', assignmentId)

    // Проверяем, существует ли задание
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
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
    })

    if (!assignment) {
      return NextResponse.json({ 
        error: 'Assignment not found',
        assignmentId 
      }, { status: 404 })
    }

    // Проверяем группы пользователя
    const userGroups = await prisma.groupStudent.findMany({
      where: {
        userId: user.id,
        status: 'ACTIVE'
      },
      include: {
        group: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Проверяем GroupAssignment для этого задания
    const groupAssignments = await prisma.groupAssignment.findMany({
      where: {
        assignmentId
      },
      include: {
        group: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Проверяем, есть ли доступ к заданию
    const hasAccess = groupAssignments.some(ga => 
      userGroups.some(ug => ug.group.id === ga.group.id)
    )

    return NextResponse.json({
      assignment,
      userGroups,
      groupAssignments,
      hasAccess,
      assignmentId,
      userId: user.id
    })
  } catch (error) {
    console.error('❌ [Debug API] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
