import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Проверяем аутентификацию
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Файл не найден' }, { status: 400 });
    }

    // Валидация размера файла (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'Файл слишком большой' }, { status: 400 });
    }

    // Валидация типа файла
    const allowedTypes = [
      'image/jpeg', 
      'image/png', 
      'image/gif', 
      'image/webp',
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
      'application/zip', 
      'application/x-rar-compressed',
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo'
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: `Неподдерживаемый тип файла: ${file.type}` }, { status: 400 });
    }

    // Проверяем, настроен ли Cloudinary
    const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY;
    
    if (cloudinaryCloudName && cloudinaryApiKey && cloudinaryCloudName !== 'your-cloud-name') {
      // Используем Cloudinary если настроен
      const cloudinaryFormData = new FormData();
      cloudinaryFormData.append('file', file);
      cloudinaryFormData.append('upload_preset', 'academy_uploads');

      const cloudinaryResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/auto/upload`,
        {
          method: 'POST',
          body: cloudinaryFormData,
        }
      );

      if (!cloudinaryResponse.ok) {
        throw new Error('Ошибка загрузки на Cloudinary');
      }

      const cloudinaryData = await cloudinaryResponse.json();

      return NextResponse.json({
        success: true,
        fileUrl: cloudinaryData.secure_url,
        publicId: cloudinaryData.public_id,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });
    } else {
      // Fallback: сохраняем файл локально
      const fs = await import('fs/promises');
      const path = await import('path');
      const crypto = await import('crypto');
      
      // Создаем уникальное имя файла
      const fileExtension = file.name.split('.').pop() || '';
      const uniqueName = `${crypto.randomUUID()}.${fileExtension}`;
      
      // Путь для сохранения
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'temp');
      const filePath = path.join(uploadDir, uniqueName);
      
      // Создаем директорию если не существует
      await fs.mkdir(uploadDir, { recursive: true });
      
      // Сохраняем файл
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(filePath, buffer);
      
      // Возвращаем URL для доступа к файлу
      const fileUrl = `/uploads/temp/${uniqueName}`;
      
      return NextResponse.json({
        success: true,
        fileUrl: fileUrl,
        publicId: uniqueName,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });
    }

  } catch (error) {
    console.error('Ошибка загрузки файла:', error);
    console.error('Детали ошибки:', {
      message: error instanceof Error ? error.message : 'Неизвестная ошибка',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json(
      { 
        error: 'Ошибка загрузки файла',
        details: error instanceof Error ? error.message : 'Неизвестная ошибка'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Проверяем аутентификацию
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const publicId = searchParams.get('publicId');

    if (!publicId) {
      return NextResponse.json({ error: 'ID файла не указан' }, { status: 400 });
    }

    // Удаляем файл из Cloudinary
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = await generateSignature(publicId, timestamp);

    const deleteResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/destroy`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          public_id: publicId,
          signature: signature,
          api_key: process.env.CLOUDINARY_API_KEY,
          timestamp: timestamp,
        }),
      }
    );

    if (!deleteResponse.ok) {
      throw new Error('Ошибка удаления файла');
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Ошибка удаления файла:', error);
    return NextResponse.json(
      { error: 'Ошибка удаления файла' },
      { status: 500 }
    );
  }
}

// Функция для генерации подписи Cloudinary
async function generateSignature(publicId: string, timestamp: number): Promise<string> {
  const crypto = await import('crypto');
  const params = `public_id=${publicId}&timestamp=${timestamp}${process.env.CLOUDINARY_API_SECRET}`;
  return crypto.createHash('sha1').update(params).digest('hex');
}
