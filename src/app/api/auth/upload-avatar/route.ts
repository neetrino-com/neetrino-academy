import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Получаем текущего пользователя
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('avatar') as File

    if (!file) {
      return NextResponse.json({ error: 'Файл не найден' }, { status: 400 })
    }

    // Проверяем тип файла
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Можно загружать только изображения' }, { status: 400 })
    }

    // Проверяем размер файла (макс 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Размер файла не должен превышать 5MB' }, { status: 400 })
    }

    // Создаем уникальное имя файла
    const fileExtension = file.type.split('/')[1]
    const fileName = `${uuidv4()}.${fileExtension}`
    
    // Путь для сохранения в public/uploads/avatars
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'avatars')
    const filePath = join(uploadDir, fileName)

    try {
      // Создаем директорию если она не существует
      await mkdir(uploadDir, { recursive: true })
    } catch (error) {
      // Директория уже существует или не удалось создать
    }

    // Сохраняем файл
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // URL для доступа к файлу
    const avatarUrl = `/uploads/avatars/${fileName}`

    // Обновляем пользователя в базе данных
    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: { 
        avatar: avatarUrl,
        updatedAt: new Date()
      },
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

    // Логируем загрузку аватара
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: 'UPLOAD_AVATAR',
        entity: 'User',
        entityId: currentUser.id,
        details: JSON.stringify({
          fileName,
          fileSize: file.size,
          fileType: file.type,
          avatarUrl
        }),
        ipAddress,
        userAgent
      }
    })

    return NextResponse.json({
      avatarUrl,
      user: updatedUser
    })

  } catch (error) {
    console.error('Error uploading avatar:', error)
    return NextResponse.json(
      { error: 'Ошибка загрузки аватара' },
      { status: 500 }
    )
  }
}
