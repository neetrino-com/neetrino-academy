import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const updateProfileSchema = z.object({
  name: z.string().min(1, "Имя не может быть пустым").max(100, "Имя слишком длинное"),
  email: z.string().email("Неверный формат email"),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, "Пароль должен содержать минимум 6 символов").optional(),
})

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateProfileSchema.parse(body)

    // Получаем текущего пользователя
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    // Проверяем, не занят ли новый email другим пользователем
    if (validatedData.email !== currentUser.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.email }
      })

      if (existingUser) {
        return NextResponse.json({ 
          error: 'Этот email уже используется другим пользователем' 
        }, { status: 400 })
      }
    }

    // Подготавливаем данные для обновления
    const updateData: any = {
      name: validatedData.name.trim(),
      email: validatedData.email.trim(),
      updatedAt: new Date()
    }

    // Если нужно изменить пароль
    if (validatedData.newPassword && validatedData.currentPassword) {
      // Проверяем текущий пароль
      const isCurrentPasswordValid = await bcrypt.compare(
        validatedData.currentPassword,
        currentUser.password
      )

      if (!isCurrentPasswordValid) {
        return NextResponse.json({ 
          error: 'Неверный текущий пароль' 
        }, { status: 400 })
      }

      // Хешируем новый пароль
      const hashedNewPassword = await bcrypt.hash(validatedData.newPassword, 12)
      updateData.password = hashedNewPassword
    } else if (validatedData.newPassword && !validatedData.currentPassword) {
      return NextResponse.json({ 
        error: 'Для изменения пароля необходимо указать текущий пароль' 
      }, { status: 400 })
    }

    // Обновляем пользователя
    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            enrollments: true,
            assignments: true,
            submissions: true,
            quizAttempts: true,
            groupStudents: true,
            groupTeachers: true
          }
        }
      }
    })

    // Логируем изменение профиля
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: 'UPDATE_PROFILE',
        entity: 'User',
        entityId: currentUser.id,
        details: JSON.stringify({
          changes: Object.keys(updateData).filter(key => key !== 'password'),
          emailChanged: validatedData.email !== currentUser.email,
          passwordChanged: !!validatedData.newPassword
        }),
        ipAddress,
        userAgent
      }
    })

    return NextResponse.json(updatedUser)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
