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
  // Расширенная информация профиля
  age: z.number().min(13, "Возраст должен быть не менее 13 лет").max(120, "Неверный возраст").optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  phone: z.string().max(20, "Телефон слишком длинный").optional(),
  address: z.string().max(255, "Адрес слишком длинный").optional(),
  city: z.string().max(100, "Название города слишком длинное").optional(),
  country: z.string().max(100, "Название страны слишком длинное").optional(),
  telegram: z.string().max(50, "Telegram слишком длинный").optional(),
  instagram: z.string().max(50, "Instagram слишком длинный").optional(),
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
    const updateData: {
      name: string;
      email: string;
      updatedAt: Date;
      age?: number;
      gender?: 'MALE' | 'FEMALE' | 'OTHER';
      phone?: string | null;
      address?: string | null;
      city?: string | null;
      country?: string | null;
      telegram?: string | null;
      instagram?: string | null;
      password?: string;
    } = {
      name: validatedData.name.trim(),
      email: validatedData.email.trim(),
      updatedAt: new Date()
    }

    // Добавляем расширенную информацию профиля
    if (validatedData.age !== undefined) updateData.age = validatedData.age;
    if (validatedData.gender !== undefined) updateData.gender = validatedData.gender;
    if (validatedData.phone !== undefined) updateData.phone = validatedData.phone?.trim() || null;
    if (validatedData.address !== undefined) updateData.address = validatedData.address?.trim() || null;
    if (validatedData.city !== undefined) updateData.city = validatedData.city?.trim() || null;
    if (validatedData.country !== undefined) updateData.country = validatedData.country?.trim() || null;
    if (validatedData.telegram !== undefined) updateData.telegram = validatedData.telegram?.trim() || null;
    if (validatedData.instagram !== undefined) updateData.instagram = validatedData.instagram?.trim() || null;

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
        age: true,
        gender: true,
        phone: true,
        address: true,
        city: true,
        country: true,
        telegram: true,
        instagram: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            enrollments: true,
            assignments: true,
            submissions: true,
            quizAttempts: true,
            groupStudents: true,
            groupTeachers: true,
            payments: true
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
