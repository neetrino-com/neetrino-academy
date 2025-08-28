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
        },
        group: {
          select: {
            name: true
          }
        }
      }
    })

    if (!groupAssignment) {
      return NextResponse.json({ 
        error: 'Assignment not found or access denied' 
      }, { status: 404 })
    }

    // Получаем сдачу студента
    const submission = await prisma.submission.findFirst({
      where: {
        userId: user.id,
        assignmentId: assignmentId
      }
    })

    return NextResponse.json({
      assignment: groupAssignment,
      submission: submission
    })
  } catch (error) {
    console.error('Error fetching submission:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
