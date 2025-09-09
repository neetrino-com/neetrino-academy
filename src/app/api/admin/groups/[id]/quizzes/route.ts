import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Назначить тесты группе
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('=== POST /api/admin/groups/[id]/quizzes - Назначение тестов группе ===')
  
  try {
    const session = await auth()
    if (!session?.user) {
      console.log('❌ Unauthorized: No session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Проверяем роль пользователя
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user || (user.role !== 'ADMIN' && user.role !== 'TEACHER')) {
      console.log('❌ Forbidden: User role not allowed', { userId: user?.id, role: user?.role })
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    console.log('✅ User authorized', { userId: user.id, role: user.role })

    const { id: groupId } = await params
    const body = await request.json()
    const { quizIds } = body

    console.log('📝 Assignment data received:', { groupId, quizIds })

    // Валидация
    if (!Array.isArray(quizIds)) {
      console.log('❌ Validation failed: quizIds must be an array')
      return NextResponse.json({ 
        error: 'quizIds must be an array' 
      }, { status: 400 })
    }

    // Проверяем, что группа существует
    const group = await prisma.group.findUnique({
      where: { id: groupId }
    })

    if (!group) {
      console.log('❌ Group not found:', groupId)
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    console.log('✅ Group found:', group.name)

    // Проверяем, что все тесты существуют
    if (quizIds.length > 0) {
      const existingQuizzes = await prisma.quiz.findMany({
        where: {
          id: { in: quizIds }
        },
        select: { id: true }
      })

      const existingQuizIds = existingQuizzes.map(q => q.id)
      const missingQuizIds = quizIds.filter(id => !existingQuizIds.includes(id))

      if (missingQuizIds.length > 0) {
        console.log('❌ Some quizzes not found:', missingQuizIds)
        return NextResponse.json({ 
          error: 'Some quizzes not found',
          missingQuizIds 
        }, { status: 404 })
      }

      console.log('✅ All quizzes exist')
    }

    // Удаляем существующие назначения тестов для группы
    console.log('🗑️ Removing existing quiz assignments...')
    await prisma.groupQuizAssignment.deleteMany({
      where: { groupId }
    })

    // Создаем новые назначения
    if (quizIds.length > 0) {
      console.log('➕ Creating new quiz assignments...')
      const quizAssignments = quizIds.map(quizId => ({
        groupId,
        quizId,
        assignedAt: new Date()
      }))

      await prisma.groupQuizAssignment.createMany({
        data: quizAssignments
      })

      console.log('✅ Quiz assignments created:', quizIds.length)
    }

    // Получаем обновленную группу с тестами
    const updatedGroup = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        quizAssignments: {
          include: {
            quiz: {
              include: {
                creator: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                },
                questions: {
                  select: {
                    id: true,
                    question: true,
                    type: true,
                    points: true
                  },
                  orderBy: {
                    order: 'asc'
                  }
                },
                attempts: {
                  select: {
                    id: true
                  }
                }
              }
            }
          },
          orderBy: {
            assignedAt: 'desc'
          }
        }
      }
    })

    console.log('🎉 Quiz assignment completed successfully')
    return NextResponse.json(updatedGroup)

  } catch (error) {
    console.error('❌ Error assigning quizzes to group:', error)
    
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

// Получить тесты группы
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('=== GET /api/admin/groups/[id]/quizzes - Получение тестов группы ===')
  
  try {
    const session = await auth()
    if (!session?.user) {
      console.log('❌ Unauthorized: No session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: groupId } = await params

    console.log('🔍 Fetching quizzes for group:', groupId)

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        quizAssignments: {
          include: {
            quiz: {
              include: {
                creator: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                },
                questions: {
                  select: {
                    id: true,
                    question: true,
                    type: true,
                    points: true
                  },
                  orderBy: {
                    order: 'asc'
                  }
                },
                attempts: {
                  select: {
                    id: true
                  }
                }
              }
            }
          },
          orderBy: {
            assignedAt: 'desc'
          }
        }
      }
    })

    if (!group) {
      console.log('❌ Group not found:', groupId)
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    console.log('✅ Group quizzes fetched:', group.quizAssignments.length)
    return NextResponse.json(group.quizAssignments.map(qa => qa.quiz))

  } catch (error) {
    console.error('❌ Error fetching group quizzes:', error)
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}
